import { describe, it, expect } from "vitest";
import { describeReason, describeReasons } from "./reasons";
import type { MatchReason } from "./score";

describe("describeReason", () => {
  it("lists shared specialties", () => {
    const r: MatchReason = { kind: "specialty", items: ["Résidentiel", "Hospitalité"], weight: 30 };
    expect(describeReason(r)).toBe("Spécialités en commun : Résidentiel, Hospitalité");
  });

  it("names the construction country", () => {
    const r: MatchReason = { kind: "country", country: "Côte d'Ivoire", weight: 25 };
    expect(describeReason(r)).toBe("Exerce dans le pays du chantier — Côte d'Ivoire");
  });

  it("translates project type to French", () => {
    const r: MatchReason = { kind: "project_type", item: "residential", weight: 20 };
    expect(describeReason(r)).toBe("Type de projet maîtrisé — Résidentiel");
  });

  it("describes availability, experience, location, rating", () => {
    expect(describeReason({ kind: "availability", weight: 15 })).toMatch(/Disponible/);
    expect(describeReason({ kind: "experience", years: 12, weight: 10 })).toBe(
      "Expérience confirmée — 12 ans d'exercice",
    );
    expect(describeReason({ kind: "location", city: "Bingerville", weight: 5 })).toBe(
      "Présent dans la localité du chantier — Bingerville",
    );
    expect(describeReason({ kind: "rating", value: 4.8, weight: 5 })).toBe(
      "Excellente note client — 4.8 / 5",
    );
  });
});

describe("describeReasons", () => {
  it("maps a reasons array (as stored in Json) to text + weight", () => {
    const stored = [
      { kind: "specialty", items: ["Résidentiel"], weight: 30 },
      { kind: "country", country: "Sénégal", weight: 25 },
    ];
    expect(describeReasons(stored)).toEqual([
      { text: "Spécialités en commun : Résidentiel", weight: 30 },
      { text: "Exerce dans le pays du chantier — Sénégal", weight: 25 },
    ]);
  });

  it("tolerates non-array / malformed input", () => {
    expect(describeReasons(null)).toEqual([]);
    expect(describeReasons("nope")).toEqual([]);
    expect(describeReasons([{ nope: true }, null])).toEqual([]);
  });
});
