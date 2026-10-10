import { describe, it, expect } from "vitest";
import { buildStatCells } from "./stats";

describe("buildStatCells", () => {
  it("shows the real verified-architect and country counts", () => {
    expect(buildStatCells({ totalArchitects: 8, totalCountries: 1 })).toEqual([
      { key: "architects", num: "8", count: 8 },
      { key: "countries", num: "1", count: 1 },
      { key: "eligible", num: "54" },
      { key: "response" },
    ]);
  });

  it("falls back to qualitative cells instead of printing zeros", () => {
    expect(buildStatCells({ totalArchitects: 0, totalCountries: 0 })).toEqual([
      { key: "vetting" },
      { key: "identity" },
      { key: "eligible", num: "54" },
      { key: "response" },
    ]);
  });

  it("always yields four cells for the four-column strip", () => {
    for (const totalArchitects of [0, 1, 37]) {
      expect(buildStatCells({ totalArchitects, totalCountries: totalArchitects ? 1 : 0 })).toHaveLength(4);
    }
  });
});
