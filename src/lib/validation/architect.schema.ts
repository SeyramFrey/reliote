import { z } from "zod";
import { isArchitectPhotoPath } from "@/lib/storage/architectPhotoPath";

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

// Personne physique (architecte indépendant) ou morale (agence, société).
export const LEGAL_STATUSES = ["individual", "company"] as const;

// Formes juridiques courantes en zone OHADA et en France ; « Autre » reste libre.
export const LEGAL_FORMS = ["SARL", "SARLU", "SA", "SAS", "SASU", "EURL", "SCP", "GIE", "Autre"] as const;

export const COMPANY_FIELDS = [
  "company_name",
  "legal_form",
  "registration_number",
  "legal_representative",
] as const;

const COMPANY_FIELD_MESSAGES: Record<(typeof COMPANY_FIELDS)[number], string> = {
  company_name: "Raison sociale requise",
  legal_form: "Forme juridique requise",
  registration_number: "Numéro d'immatriculation requis",
  legal_representative: "Représentant légal requis",
};

/** Champs société manquants pour une personne morale (vide pour une personne physique). */
export function missingCompanyFields(d: {
  legal_status?: string;
  company_name?: string;
  legal_form?: string;
  registration_number?: string;
  legal_representative?: string;
}): { field: (typeof COMPANY_FIELDS)[number]; message: string }[] {
  if (d.legal_status !== "company") return [];
  return COMPANY_FIELDS.filter((f) => !d[f]?.trim()).map((field) => ({
    field,
    message: COMPANY_FIELD_MESSAGES[field],
  }));
}

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

// Un champ laissé vide arrive en chaîne vide : on le traite comme absent.
const emptyToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

export const architectSchema = z
  .object({
    first_name: z.string().min(1, "Prénom requis").max(80),
    last_name: z.string().min(1, "Nom requis").max(80),
    email: z.string().email().max(254),
    phone: z.string().max(32).optional(),
    phone_country: z.string().max(4).optional(),
    // Chemin de l'objet dans le bucket privé (cf. lib/storage/architectPhotoPath).
    photo_url: z.string().refine(isArchitectPhotoPath, "Photo invalide").optional().or(z.literal("")),
    country: z.string().min(1, "Pays requis").max(80),
    city: z.string().min(2, "Ville requise").max(120),
    ordre_number: z.string().min(1, "Numéro d'ordre requis").max(60),
    diploma: z.string().max(200).optional(),
    structure: z.string().max(160).optional().or(z.literal("")),
    legal_status: z.enum(LEGAL_STATUSES).default("individual"),
    company_name: z.string().max(160).optional(),
    legal_form: z.string().max(80).optional(),
    registration_number: z.string().max(80).optional(),
    legal_representative: z.string().max(160).optional(),
    specialties: z.array(z.enum(SPECIALTIES)).min(1, "Au moins 1 spécialité").max(SPECIALTIES.length),
    languages: z.array(z.string().max(40)).min(1, "Au moins 1 langue").max(12),
    project_types: z.array(z.enum(PROJECT_TYPES)).min(1, "Au moins 1 type").max(PROJECT_TYPES.length),
    years_experience: z.coerce.number().min(0).max(70),
    description: z.string().min(80, "≥ 80 caractères").max(5000),
    // https uniquement : un « javascript: » passerait z.url().
    portfolio_url: z.string().url().max(500).regex(/^https?:\/\//i).optional().or(z.literal("")),
    availability: z.enum(["available", "busy", "unavailable"]),
    fee_currency: z.preprocess(emptyToUndefined, z.enum(FEE_CURRENCIES).optional()),
    fee_amount: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
    terms: z.literal(true).refine((v) => v === true, {
      message: "Vous devez accepter les conditions.",
    }),
  })
  // Le numéro d'ordre est requis pour tous (voir champ). Le format strict AAAA/NNN/NNN
  // (matricule CNOA) n'est exigé que pour la Côte d'Ivoire ; les autres pays sont libres.
  .refine(
    (d) => d.country !== "Côte d'Ivoire" || ORDRE_NUMBER_RE.test(d.ordre_number),
    { path: ["ordre_number"], message: "N° d'agrément CNOA requis (format AAAA/NNN/NNN)" }
  )
  // Personne morale : les quatre champs société sont obligatoires.
  .superRefine((d, ctx) => {
    for (const { field, message } of missingCompanyFields(d)) {
      ctx.addIssue({ code: "custom", path: [field], message });
    }
  })
  // Fee currency + amount must be set together (both or neither — neither is fine since
  // the field is overall optional, but a half-filled fee is invalid).
  .refine((d) => d.fee_amount === undefined || d.fee_currency !== undefined, {
    path: ["fee_currency"],
    message: "Choisissez la devise des honoraires",
  })
  .refine((d) => d.fee_currency === undefined || d.fee_amount !== undefined, {
    path: ["fee_amount"],
    message: "Indiquez le montant ou retirez la devise",
  });

export type ArchitectInput = z.infer<typeof architectSchema>;
