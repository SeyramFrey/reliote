import { describe, it, expect } from "vitest";
import { aggregatePresence } from "./presence";

describe("aggregatePresence", () => {
  it("aggregates verified architects by country (current data: CI ×8)", () => {
    const rows = Array.from({ length: 8 }, () => ({ country: "Côte d'Ivoire" }));
    const p = aggregatePresence(rows);
    expect(p.lit).toEqual([{ iso2: "CI", name: "Côte d'Ivoire", count: 8 }]);
    expect(p.totalCountries).toBe(1);
    expect(p.totalArchitects).toBe(8);
  });

  it("sorts by count desc, then name; maps names to iso2", () => {
    const rows = [
      { country: "Sénégal" },
      { country: "Côte d'Ivoire" },
      { country: "Côte d'Ivoire" },
      { country: "Ghana" },
      { country: "Sénégal" },
      { country: "Sénégal" },
    ];
    const p = aggregatePresence(rows);
    expect(p.lit).toEqual([
      { iso2: "SN", name: "Sénégal", count: 3 },
      { iso2: "CI", name: "Côte d'Ivoire", count: 2 },
      { iso2: "GH", name: "Ghana", count: 1 },
    ]);
    expect(p.totalCountries).toBe(3);
    expect(p.totalArchitects).toBe(6);
  });

  it("matches despite accents, apostrophe variants and casing", () => {
    const p = aggregatePresence([
      { country: "cote d'ivoire" },
      { country: "CÔTE D’IVOIRE" },
    ]);
    expect(p.lit).toEqual([{ iso2: "CI", name: "Côte d'Ivoire", count: 2 }]);
  });

  it("skips unknown / non-African countries and null values", () => {
    const p = aggregatePresence([
      { country: "France" },
      { country: "Narnia" },
      { country: null },
      { country: "Ghana" },
    ]);
    expect(p.lit).toEqual([{ iso2: "GH", name: "Ghana", count: 1 }]);
    expect(p.totalArchitects).toBe(1);
  });

  it("returns zeroed totals for an empty input", () => {
    expect(aggregatePresence([])).toEqual({
      lit: [],
      totalCountries: 0,
      totalArchitects: 0,
    });
  });
});
