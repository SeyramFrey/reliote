import { describe, it, expect } from "vitest";
import { safeRedirectPath, safeLocale } from "./safeRedirect";

describe("safeLocale", () => {
  it("accepts supported locales", () => {
    expect(safeLocale("fr")).toBe("fr");
    expect(safeLocale("en")).toBe("en");
  });

  it("falls back to the default for anything else", () => {
    expect(safeLocale("/evil.com")).toBe("fr");
    expect(safeLocale("de")).toBe("fr");
    expect(safeLocale(null)).toBe("fr");
  });
});

const FALLBACK = "/fr";

describe("safeRedirectPath", () => {
  it("keeps a same-site path", () => {
    expect(safeRedirectPath("/fr/dashboard/client", FALLBACK)).toBe("/fr/dashboard/client");
    expect(safeRedirectPath("/en/architectes?x=1", FALLBACK)).toBe("/en/architectes?x=1");
  });

  it("falls back when empty", () => {
    expect(safeRedirectPath(null, FALLBACK)).toBe(FALLBACK);
    expect(safeRedirectPath(undefined, FALLBACK)).toBe(FALLBACK);
    expect(safeRedirectPath("", FALLBACK)).toBe(FALLBACK);
  });

  it("rejects protocol-relative and backslash tricks", () => {
    expect(safeRedirectPath("//evil.com", FALLBACK)).toBe(FALLBACK);
    expect(safeRedirectPath("//evil.com/fr", FALLBACK)).toBe(FALLBACK);
    expect(safeRedirectPath("/\\evil.com", FALLBACK)).toBe(FALLBACK);
  });

  it("rejects absolute URLs and schemes", () => {
    expect(safeRedirectPath("https://evil.com", FALLBACK)).toBe(FALLBACK);
    expect(safeRedirectPath("javascript:alert(1)", FALLBACK)).toBe(FALLBACK);
  });

  it("rejects control characters that browsers strip", () => {
    expect(safeRedirectPath("/\t/evil.com", FALLBACK)).toBe(FALLBACK);
    expect(safeRedirectPath("/\n/evil.com", FALLBACK)).toBe(FALLBACK);
  });
});
