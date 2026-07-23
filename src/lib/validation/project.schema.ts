import { z } from "zod";
import { SPECIALTIES, PROJECT_TYPES } from "./architect.schema";
import { AFRICAN_COUNTRIES } from "@/lib/countries/africa";

const AFRICAN_COUNTRY_NAMES = AFRICAN_COUNTRIES.map((c) => c.name);

export const projectSchema = z.object({
  project_type: z.enum(PROJECT_TYPES),
  project_description: z.string().min(100, "≥ 100 caractères"),
  required_specialties: z.array(z.enum(SPECIALTIES)).min(1),
  notes: z.string().optional(),
  project_country: z
    .string()
    .refine((v) => AFRICAN_COUNTRY_NAMES.includes(v), "Pays du chantier requis"),
  project_location: z.string().min(2),
  budget_range: z.string().optional(),
  timeline: z.string().optional(),
  client_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
});

export type ProjectInput = z.infer<typeof projectSchema>;
