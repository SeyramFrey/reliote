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

export const architectSchema = z.object({
  full_name: z.string().min(2, "Nom requis"),
  email: z.string().email(),
  phone: z.string().optional(),
  photo_url: z.string().url().optional().or(z.literal("")),
  country: z.string().default("Côte d'Ivoire"),
  city: z.string().min(2),
  specialties: z.array(z.enum(SPECIALTIES)).min(1, "Au moins 1 spécialité"),
  languages: z.array(z.string()).min(1),
  project_types: z.array(z.enum(PROJECT_TYPES)).min(1),
  years_experience: z.coerce.number().min(0).max(70),
  description: z.string().min(80, "≥ 80 caractères"),
  portfolio_url: z.string().url().optional().or(z.literal("")),
  availability: z.enum(["available", "busy", "unavailable"]),
  fee_from: z.string().optional(),
  terms: z.literal(true).refine((v) => v === true, {
    message: "Vous devez accepter les conditions.",
  }),
});

export type ArchitectInput = z.infer<typeof architectSchema>;
