import { describe, it, expect } from "vitest";
import { architectSchema } from "./architect.schema";

describe("architectSchema", () => {
  it("accepts a valid input", () => {
    const r = architectSchema.safeParse({
      full_name: "Aïssata N'Guessan",
      email: "a@a.com",
      city: "Cocody",
      specialties: ["Résidentiel"],
      languages: ["FR"],
      project_types: ["residential"],
      years_experience: 12,
      description: "x".repeat(80),
      availability: "available",
      terms: true,
    });
    expect(r.success).toBe(true);
  });

  it("rejects when terms not accepted", () => {
    const r = architectSchema.safeParse({
      full_name: "X Y",
      email: "a@a.com",
      city: "Ab",
      specialties: ["Résidentiel"],
      languages: ["FR"],
      project_types: ["residential"],
      years_experience: 1,
      description: "x".repeat(80),
      availability: "available",
      terms: false,
    });
    expect(r.success).toBe(false);
  });
});
