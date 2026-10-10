import { describe, it, expect } from "vitest";
import { projectSchemaFor } from "./project.schema";

const project = {
  project_type: "residential" as const,
  project_description: "x".repeat(100),
  required_specialties: ["Résidentiel" as const],
  project_country: "Côte d'Ivoire",
  project_location: "Bingerville",
};

const guest = {
  ...project,
  first_name: "Awa",
  last_name: "Koné",
  email: "awa@example.com",
  password: "a-long-pass",
};

describe("projectSchemaFor('member')", () => {
  const schema = projectSchemaFor("member");

  it("accepts a valid project without account fields", () => {
    expect(schema.safeParse(project).success).toBe(true);
  });

  it("rejects short descriptions", () => {
    expect(schema.safeParse({ ...project, project_description: "short" }).success).toBe(false);
  });

  it("rejects an unselected country with a clear message", () => {
    const r = schema.safeParse({ ...project, project_country: "" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toBe("countryRequired");
  });

  it("rejects a non-African country", () => {
    expect(schema.safeParse({ ...project, project_country: "France" }).success).toBe(false);
  });
});

describe("projectSchemaFor('guest')", () => {
  const schema = projectSchemaFor("guest");

  it("accepts a project with the account to create", () => {
    expect(schema.safeParse(guest).success).toBe(true);
  });

  it("requires a password of at least 8 characters", () => {
    const r = schema.safeParse({ ...guest, password: "1234567" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path).toEqual(["password"]);
    expect(r.error?.issues[0]?.message).toBe("passwordMin");
  });

  it("uses translation codes, never library default messages", () => {
    const r = schema.safeParse({ ...guest, first_name: "", email: "nope", project_description: "x", required_specialties: [] });
    const messages = r.error?.issues.map((i) => i.message) ?? [];
    expect(messages).toEqual(expect.arrayContaining(["firstNameRequired", "emailInvalid", "descriptionMin", "specialtiesMin"]));
    for (const m of messages) expect(m).toMatch(/^[a-z][A-Za-z]+$/);
  });

  it("requires first and last name and a valid email", () => {
    expect(schema.safeParse({ ...guest, first_name: "" }).success).toBe(false);
    expect(schema.safeParse({ ...guest, last_name: " " }).success).toBe(false);
    expect(schema.safeParse({ ...guest, email: "nope" }).success).toBe(false);
  });
});
