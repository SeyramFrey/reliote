import { describe, it, expect } from "vitest";
import { projectSchema } from "./project.schema";

describe("projectSchema", () => {
  it("accepts a valid project", () => {
    const r = projectSchema.safeParse({
      project_type: "residential",
      project_description: "x".repeat(100),
      required_specialties: ["Résidentiel"],
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
      project_location: "Abidjan",
      client_name: "X Y",
      email: "a@a.com",
    });
    expect(r.success).toBe(false);
  });
});
