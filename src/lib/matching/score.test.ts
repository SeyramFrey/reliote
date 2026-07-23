import { describe, it, expect } from "vitest";
import { scoreArchitect, MAX_SCORE } from "./score";

const project = {
  id: "p1",
  project_type: "residential" as const,
  required_specialties: ["Résidentiel", "Hospitalité"],
  project_country: "Côte d'Ivoire",
  project_location: "Bingerville",
  budget_range: "€500k–€800k",
};

const baseArchitect = {
  id: "a1",
  country: "Sénégal", // ne matche pas le pays du chantier
  city: "Cocody",
  specialties: ["Commercial"],
  project_types: ["commercial"] as const,
  years_experience: 2,
  availability: "available" as const,
  rating: 4.0,
  status: "verified" as const,
};

describe("scoreArchitect", () => {
  it("returns +15 for availability only when nothing else matches", () => {
    const r = scoreArchitect(project, baseArchitect);
    expect(r.score).toBe(15);
    expect(r.reasons.map((x) => x.kind)).toEqual(["availability"]);
  });

  it("awards +30 for specialty overlap", () => {
    const r = scoreArchitect(project, { ...baseArchitect, specialties: ["Résidentiel"] });
    expect(r.score).toBe(45);
    expect(r.reasons.some((x) => x.kind === "specialty")).toBe(true);
  });

  it("awards +25 when architect country matches the construction country", () => {
    const r = scoreArchitect(project, { ...baseArchitect, country: "Côte d'Ivoire" });
    expect(r.score).toBe(40);
    expect(r.reasons.some((x) => x.kind === "country")).toBe(true);
  });

  it("awards +20 for project_type match", () => {
    const r = scoreArchitect(project, { ...baseArchitect, project_types: ["residential"] });
    expect(r.score).toBe(35);
  });

  it("awards +10 for experience threshold (large budget)", () => {
    const r = scoreArchitect(project, { ...baseArchitect, years_experience: 12 });
    expect(r.score).toBe(25);
  });

  it("awards +5 for location (city) signal", () => {
    const r = scoreArchitect(project, { ...baseArchitect, city: "Bingerville" });
    expect(r.score).toBe(20);
  });

  it("awards +5 for high rating", () => {
    const r = scoreArchitect(project, { ...baseArchitect, rating: 4.8 });
    expect(r.score).toBe(20);
  });

  it("returns max possible score", () => {
    const r = scoreArchitect(project, {
      ...baseArchitect,
      country: "Côte d'Ivoire",
      specialties: ["Résidentiel", "Hospitalité"],
      project_types: ["residential"],
      years_experience: 15,
      city: "Bingerville",
      rating: 4.9,
    });
    expect(r.score).toBe(MAX_SCORE);
  });
});
