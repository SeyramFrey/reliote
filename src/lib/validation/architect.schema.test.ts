import { describe, it, expect } from "vitest";
import { architectSchema, missingCompanyFields } from "./architect.schema";

const valid = {
  first_name: "Aïssata",
  last_name: "N'Guessan",
  email: "a@a.com",
  country: "Côte d'Ivoire",
  city: "Cocody",
  ordre_number: "2014/418/132",
  specialties: ["Résidentiel"] as const,
  languages: ["FR"],
  project_types: ["residential"] as const,
  years_experience: 12,
  description: "x".repeat(80),
  availability: "available" as const,
  terms: true as const,
};

describe("architectSchema", () => {
  it("accepts a valid input", () => {
    const r = architectSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it("rejects when terms not accepted", () => {
    const r = architectSchema.safeParse({ ...valid, terms: false });
    expect(r.success).toBe(false);
  });

  it("requires ordre_number when country is Côte d'Ivoire", () => {
    const r = architectSchema.safeParse({ ...valid, ordre_number: "" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === "ordre_number")).toBe(true);
    }
  });

  it("does not require the CNOA format for other countries", () => {
    const r = architectSchema.safeParse({
      ...valid,
      country: "Sénégal",
      ordre_number: "SN-2020-001",
    });
    expect(r.success).toBe(true);
  });

  it("rejects malformed ordre_number for CI", () => {
    const r = architectSchema.safeParse({ ...valid, ordre_number: "ABCDEF" });
    expect(r.success).toBe(false);
  });

  it("requires fee_currency and fee_amount together", () => {
    const r = architectSchema.safeParse({ ...valid, fee_amount: 48000 });
    expect(r.success).toBe(false);
  });

  it("accepts both fee fields filled", () => {
    const r = architectSchema.safeParse({
      ...valid,
      fee_currency: "EUR",
      fee_amount: 48000,
    });
    expect(r.success).toBe(true);
  });

  it("accepts neither fee field (entirely optional)", () => {
    const r = architectSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });
});

const validNonCI = {
  first_name: "Kofi",
  last_name: "Mensah",
  email: "kofi@example.com",
  country: "Ghana",
  city: "Accra",
  ordre_number: "GH-2021-0042",
  specialties: ["Résidentiel" as const],
  languages: ["FR"],
  project_types: ["residential" as const],
  years_experience: 8,
  description: "x".repeat(80),
  availability: "available" as const,
  terms: true as const,
};

describe("architectSchema — ordre_number required for all", () => {
  it("accepts a free-form ordre number outside Côte d'Ivoire", () => {
    expect(architectSchema.safeParse(validNonCI).success).toBe(true);
  });

  it("rejects an empty ordre number outside Côte d'Ivoire", () => {
    expect(architectSchema.safeParse({ ...validNonCI, ordre_number: "" }).success).toBe(false);
  });

  it("still enforces the CNOA format for Côte d'Ivoire", () => {
    const ci = { ...validNonCI, country: "Côte d'Ivoire" };
    expect(architectSchema.safeParse({ ...ci, ordre_number: "GH-2021-0042" }).success).toBe(false);
    expect(architectSchema.safeParse({ ...ci, ordre_number: "2014/418/132" }).success).toBe(true);
  });
});

// Ce que le formulaire envoie réellement quand les honoraires restent vides :
// des chaînes vides, pas undefined.
describe("architectSchema — fees as sent by the form", () => {
  const base = { ...validNonCI };

  it("accepts empty amount and empty currency (fees are optional)", () => {
    expect(architectSchema.safeParse({ ...base, fee_amount: "", fee_currency: "" }).success).toBe(true);
  });

  it("asks for the currency when only an amount is typed", () => {
    const r = architectSchema.safeParse({ ...base, fee_amount: "48000", fee_currency: "" });
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.path.join("."))).toContain("fee_currency");
  });

  it("accepts an amount typed as text with a currency", () => {
    const r = architectSchema.safeParse({ ...base, fee_amount: "48000", fee_currency: "XOF" });
    expect(r.success).toBe(true);
    expect(r.success && r.data.fee_amount).toBe(48000);
  });

  it("rejects an empty country", () => {
    const r = architectSchema.safeParse({ ...base, country: "" });
    expect(r.success).toBe(false);
    expect(r.error?.issues.find((i) => i.path[0] === "country")?.message).toBe("Pays requis");
  });
});

describe("architectSchema — personne morale", () => {
  const company = {
    legal_status: "company",
    company_name: "Atelier Lagune SARL",
    legal_form: "SARL",
    registration_number: "CI-ABJ-2019-B-12345",
    legal_representative: "Awa Koné",
  };

  it("treats a missing legal status as an independent architect", () => {
    const r = architectSchema.safeParse(valid);
    expect(r.success && r.data.legal_status).toBe("individual");
  });

  it("accepts an agency with its four company fields", () => {
    expect(architectSchema.safeParse({ ...valid, ...company }).success).toBe(true);
  });

  it("requires every company field for an agency", () => {
    const r = architectSchema.safeParse({ ...valid, ...company, registration_number: " ", legal_representative: "" });
    expect(r.success).toBe(false);
    const paths = r.success ? [] : r.error.issues.map((i) => i.path.join("."));
    expect(paths).toEqual(expect.arrayContaining(["registration_number", "legal_representative"]));
  });

  it("ignores company fields for an independent architect", () => {
    expect(missingCompanyFields({ legal_status: "individual" })).toEqual([]);
  });
});
