import { describe, it, expect } from "vitest";
import {
  LEGAL_SLUGS,
  isLegalSlug,
  pickLocalized,
  sanitizeLegalHtml,
  type LegalRow,
} from "./page";

const row: LegalRow = {
  slug: "cgu",
  title_fr: "Conditions générales d'utilisation",
  title_en: "Terms of Service",
  body_fr: "<p>Bonjour</p>",
  body_en: "<p>Hello</p>",
  seo_description_fr: "Les CGU de Reliote.",
  seo_description_en: "Reliote's terms.",
  updated_at: "2026-08-21T10:00:00Z",
};

describe("isLegalSlug", () => {
  it("accepts the four slugs the footer links to", () => {
    expect(LEGAL_SLUGS).toEqual(["cgu", "confidentialite", "cookies", "mentions"]);
    for (const slug of LEGAL_SLUGS) expect(isLegalSlug(slug)).toBe(true);
  });

  it("rejects anything else", () => {
    // The public route builds its static params from this list, so an unknown
    // slug must not be treated as a known page before the DB is even queried.
    expect(isLegalSlug("../admin")).toBe(false);
    expect(isLegalSlug("CGU")).toBe(false);
    expect(isLegalSlug("")).toBe(false);
  });
});

describe("pickLocalized", () => {
  it("returns the French side for fr", () => {
    expect(pickLocalized(row, "fr")).toMatchObject({
      title: "Conditions générales d'utilisation",
      body: "<p>Bonjour</p>",
      description: "Les CGU de Reliote.",
    });
  });

  it("returns the English side for en", () => {
    expect(pickLocalized(row, "en")).toMatchObject({
      title: "Terms of Service",
      body: "<p>Hello</p>",
      description: "Reliote's terms.",
    });
  });

  it("falls back to French when the English body is still empty", () => {
    // A page can be published with only the French text revised by counsel.
    // Serving an empty legal document is worse than serving the other language.
    const partial = { ...row, body_en: "", title_en: "Terms of Service" };
    expect(pickLocalized(partial, "en")).toMatchObject({
      title: "Terms of Service",
      body: "<p>Bonjour</p>",
    });
  });

  it("leaves the description null when neither locale has one", () => {
    const bare = { ...row, seo_description_fr: null, seo_description_en: null };
    expect(pickLocalized(bare, "en").description).toBeNull();
  });
});

describe("sanitizeLegalHtml", () => {
  it("keeps the formatting CKEditor produces", () => {
    const html =
      '<h2>Article 1</h2><p><strong>Gras</strong> et <em>italique</em></p>' +
      '<ul><li>Un</li></ul><table><tbody><tr><td>Cellule</td></tr></tbody></table>';
    const out = sanitizeLegalHtml(html);
    expect(out).toContain("<h2>Article 1</h2>");
    expect(out).toContain("<strong>Gras</strong>");
    expect(out).toContain("<li>Un</li>");
    expect(out).toContain("<td>Cellule</td>");
  });

  it("strips scripts and event handlers", () => {
    const out = sanitizeLegalHtml(
      '<p onclick="steal()">Texte</p><script>alert(1)</script>'
    );
    expect(out).not.toContain("script");
    expect(out).not.toContain("onclick");
    expect(out).toContain("Texte");
  });

  it("drops javascript: URLs but keeps real links", () => {
    expect(sanitizeLegalHtml('<a href="javascript:alert(1)">x</a>')).not.toContain(
      "javascript:"
    );
    const ok = sanitizeLegalHtml('<a href="https://reliote.com">Reliote</a>');
    expect(ok).toContain('href="https://reliote.com"');
  });

  it("adds rel and target to outbound links", () => {
    const out = sanitizeLegalHtml('<a href="https://exemple.com">x</a>');
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).toContain('target="_blank"');
  });

  it("returns an empty string for empty input", () => {
    expect(sanitizeLegalHtml("")).toBe("");
  });
});
