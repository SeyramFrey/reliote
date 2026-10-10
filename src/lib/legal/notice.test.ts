import { describe, it, expect } from "vitest";
import { legalNoticeVariant } from "./notice";

describe("legalNoticeVariant", () => {
  it("links both documents when both are published", () => {
    expect(legalNoticeVariant(["cgu", "confidentialite", "cookies"])).toBe("both");
  });
  it("mentions only what is published", () => {
    expect(legalNoticeVariant(["cgu"])).toBe("cguOnly");
    expect(legalNoticeVariant(["confidentialite", "mentions"])).toBe("privacyOnly");
  });
  it("renders nothing before the legal pages are published", () => {
    expect(legalNoticeVariant([])).toBeNull();
    expect(legalNoticeVariant(["cookies", "mentions"])).toBeNull();
  });
});
