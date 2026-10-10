import { describe, it, expect } from "vitest";
import { resolveSiteUrl, buildSitemap, buildRobots, localizedAlternates } from "./site";

describe("resolveSiteUrl", () => {
  it("prefers SITE_URL, without trailing slash", () => {
    expect(resolveSiteUrl({ siteUrl: "https://reliote.com/", vercelProdUrl: "reliote.vercel.app" })).toBe(
      "https://reliote.com",
    );
  });
  it("falls back to the Vercel production domain", () => {
    expect(resolveSiteUrl({ vercelProdUrl: "reliote.vercel.app" })).toBe("https://reliote.vercel.app");
  });
  it("falls back to localhost when nothing is configured", () => {
    expect(resolveSiteUrl({})).toBe("http://localhost:3000");
  });
});

describe("buildSitemap", () => {
  const base = "https://reliote.com";
  const now = new Date("2026-10-10T00:00:00Z");

  it("lists every public page in both locales with hreflang alternates", () => {
    const urls = buildSitemap(base, [], now).map((e) => e.url);
    expect(urls).toEqual([
      "https://reliote.com/fr",
      "https://reliote.com/en",
      "https://reliote.com/fr/projets/initier",
      "https://reliote.com/en/projets/initier",
    ]);
    const home = buildSitemap(base, [], now)[0];
    expect(home.alternates?.languages).toEqual({
      fr: "https://reliote.com/fr",
      en: "https://reliote.com/en",
    });
  });

  it("adds published legal pages with their own last-modified date", () => {
    const entries = buildSitemap(base, [{ slug: "cgu", updated_at: "2026-09-01T10:00:00Z" }], now);
    const cgu = entries.filter((e) => e.url.endsWith("/legal/cgu"));
    expect(cgu.map((e) => e.url)).toEqual([
      "https://reliote.com/fr/legal/cgu",
      "https://reliote.com/en/legal/cgu",
    ]);
    expect(cgu[0].lastModified).toEqual(new Date("2026-09-01T10:00:00Z"));
  });

  it("ignores rows whose slug is not a known legal page", () => {
    const entries = buildSitemap(base, [{ slug: "brouillon-x", updated_at: "2026-09-01T10:00:00Z" }], now);
    expect(entries.some((e) => e.url.includes("brouillon"))).toBe(false);
  });
});

describe("localizedAlternates", () => {
  it("gives the canonical path and every language, French as x-default", () => {
    expect(localizedAlternates("en", "/projets/initier")).toEqual({
      canonical: "/en/projets/initier",
      languages: { fr: "/fr/projets/initier", en: "/en/projets/initier", "x-default": "/fr/projets/initier" },
    });
  });
  it("handles the home page", () => {
    expect(localizedAlternates("fr", "").canonical).toBe("/fr");
  });
});

describe("buildRobots", () => {
  it("keeps private areas out of the index and points to the sitemap", () => {
    const r = buildRobots("https://reliote.com", true);
    expect(r.sitemap).toBe("https://reliote.com/sitemap.xml");
    const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(rule.allow).toBe("/");
    for (const p of ["/fr/admin", "/en/admin", "/fr/dashboard", "/en/auth", "/api/"]) {
      expect(rule.disallow).toContain(p);
    }
  });
  it("blocks everything on non-production deployments", () => {
    const r = buildRobots("https://reliote.com", false);
    const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(rule.disallow).toBe("/");
    expect(r.sitemap).toBeUndefined();
  });
});
