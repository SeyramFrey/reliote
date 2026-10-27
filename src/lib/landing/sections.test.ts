import { describe, it, expect } from "vitest";
import { numberSections } from "./sections";

describe("numberSections", () => {
  it("numbers sections in display order, two digits, starting at 01", () => {
    expect(numberSections(["pillars", "territoire", "process"])).toEqual({
      pillars: "01",
      territoire: "02",
      process: "03",
    });
  });

  it("leaves no gap when an optional section is hidden", () => {
    const n = numberSections(["process", "territoire", "journal", "cta"]);
    expect(n).toEqual({ process: "01", territoire: "02", journal: "03", cta: "04" });
    expect(n.featured).toBeUndefined();
  });

  it("follows the order it is given, not a fixed catalogue order", () => {
    expect(numberSections(["cta", "pillars"])).toEqual({ cta: "01", pillars: "02" });
  });
});
