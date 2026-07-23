import { describe, it, expect } from "vitest";
import { projectSchema } from "./project.schema";

describe("projectSchema", () => {
  it("accepts a valid project", () => {
    const r = projectSchema.safeParse({
      project_type: "residential",
      project_description: "x".repeat(100),
      required_specialties: ["Résidentiel"],
      project_country: "Côte d'Ivoire",
      project_location: "Bingerville",
      client_name: "Marie L.",
      email: "m@m.com",
    });
    expect(r.success).toBe(true);
  });

  it("rejects short descriptions", () => {
    const r = projectSchema.safeParse({
      project_type: "residential",
      project_description: "short",
      required_specialties: ["Résidentiel"],
      project_country: "Sénégal",
      project_location: "Abidjan",
      client_name: "X Y",
      email: "a@a.com",
    });
    expect(r.success).toBe(false);
  });
});

const validBase = {
  project_type: "residential" as const,
  project_description: "x".repeat(100),
  required_specialties: ["Résidentiel" as const],
  project_country: "Côte d'Ivoire",
  project_location: "Bingerville",
  client_name: "Awa Koné",
  email: "awa@example.com",
};

describe("projectSchema — project_country", () => {
  it("accepts a valid African country", () => {
    expect(projectSchema.safeParse(validBase).success).toBe(true);
  });

  it("rejects a missing country", () => {
    const { project_country, ...noCountry } = validBase;
    void project_country;
    expect(projectSchema.safeParse(noCountry).success).toBe(false);
  });

  it("rejects a non-African country", () => {
    expect(projectSchema.safeParse({ ...validBase, project_country: "France" }).success).toBe(false);
  });
});
