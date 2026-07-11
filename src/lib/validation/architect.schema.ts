import { z } from "zod";

export const SPECIALTIES = [
  "Résidentiel",
  "Hospitalité",
  "Commercial",
  "Urbain",
  "Culturel",
] as const;

export const PROJECT_TYPES = [
  "residential",
  "hospitality",
  "commercial",
  "urban",
  "cultural",
  "other",
] as const;

export const FEE_CURRENCIES = ["EUR", "XOF"] as const;

// Common CNOA diplomas observed in the official registry; "Autre" lets architects
// type a free-text value if their qualification isn't in the canonical list.
export const DIPLOMAS = [
  "DPLG",
  "DESA",
  "DEIAU",
  "DAR",
  "MASTER",
  "DE",
  "DPL-ING",
  "DUM",
  "DUL",
  "ADE",
  "DIAL",
  "BAE",
  "BA-BS",
  "DENA",
  "Autre",
] as const;

// Format: AAAA/NNN/NNN (year/dossier/individual) — matches official CNOA matricules.
// e.g. "2014/418/132" or "1971/07/08" (older entries are shorter).
const ORDRE_NUMBER_RE = /^\d{4}\/\d{1,4}\/\d{1,4}$/;

export const architectSchema = z
  .object({
    first_name: z.string().min(1, "Prénom requis"),
    last_name: z.string().min(1, "Nom requis"),
    email: z.string().email(),
    phone: z.string().optional(),
    phone_country: z.string().optional(),
    photo_url: z.string().url().optional().or(z.literal("")),
    country: z.string().min(1, "Pays requis"),
    city: z.string().min(2, "Ville requise"),
    ordre_number: z.string().optional().or(z.literal("")),
    diploma: z.string().optional(),
    structure: z.string().optional().or(z.literal("")),
    specialties: z.array(z.enum(SPECIALTIES)).min(1, "Au moins 1 spécialité"),
    languages: z.array(z.string()).min(1, "Au moins 1 langue"),
    project_types: z.array(z.enum(PROJECT_TYPES)).min(1, "Au moins 1 type"),
    years_experience: z.coerce.number().min(0).max(70),
    description: z.string().min(80, "≥ 80 caractères"),
    portfolio_url: z.string().url().optional().or(z.literal("")),
    availability: z.enum(["available", "busy", "unavailable"]),
    fee_currency: z.enum(FEE_CURRENCIES).optional(),
    fee_amount: z.coerce.number().int().positive().optional(),
    terms: z.literal(true).refine((v) => v === true, {
      message: "Vous devez accepter les conditions.",
    }),
  })
  // CNOA registration number is required when the architect declares Côte d'Ivoire.
  .refine(
    (d) =>
      d.country !== "Côte d'Ivoire" ||
      (d.ordre_number !== undefined &&
        d.ordre_number !== "" &&
        ORDRE_NUMBER_RE.test(d.ordre_number)),
    {
      path: ["ordre_number"],
      message: "N° d'agrément requis (format AAAA/NNN/NNN)",
    }
  )
  // Fee currency + amount must be set together (both or neither — neither is fine since
  // the field is overall optional, but a half-filled fee is invalid).
  .refine(
    (d) =>
      (d.fee_currency === undefined && d.fee_amount === undefined) ||
      (d.fee_currency !== undefined && d.fee_amount !== undefined),
    { path: ["fee_amount"], message: "Devise et montant requis ensemble" }
  );

export type ArchitectInput = z.infer<typeof architectSchema>;
