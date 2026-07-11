import { describe, it, expect } from "vitest";
import { architectSchema } from "./architect.schema";

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

  it("does not require ordre_number for other countries", () => {
    const r = architectSchema.safeParse({
      ...valid,
      country: "Sénégal",
      ordre_number: "",
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
