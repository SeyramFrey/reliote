import { z } from "zod";
import { SPECIALTIES, PROJECT_TYPES } from "./architect.schema";
import { AFRICAN_COUNTRIES } from "@/lib/countries/africa";

const AFRICAN_COUNTRY_NAMES = AFRICAN_COUNTRIES.map((c) => c.name);

// Les messages sont des codes, traduits à l'affichage (messages validation.*).
// Le projet lui-même. L'e-mail et le nom du porteur viennent de son compte.
const projectFields = z.object({
  project_type: z.enum(PROJECT_TYPES),
  project_description: z.string().min(100, "descriptionMin").max(5000),
  required_specialties: z.array(z.enum(SPECIALTIES)).min(1, "specialtiesMin").max(SPECIALTIES.length),
  notes: z.string().max(2000).optional(),
  project_country: z
    .string()
    .refine((v) => AFRICAN_COUNTRY_NAMES.includes(v), "countryRequired"),
  project_location: z.string().min(2, "locationMin").max(160),
  budget_range: z.string().max(80).optional(),
  timeline: z.string().max(80).optional(),
  phone: z.string().max(32).optional(),
});

// Invité : le compte porteur est créé avec le projet.
const accountFields = z.object({
  first_name: z.string().trim().min(1, "firstNameRequired").max(80),
  last_name: z.string().trim().min(1, "lastNameRequired").max(80),
  email: z.string().email("emailInvalid").max(254),
  password: z.string().min(8, "passwordMin").max(72),
  // Case décochée par défaut : inscription à la newsletter (double opt-in).
  newsletter: z.boolean().optional(),
});

export type ProjectMode = "guest" | "member";

export function projectSchemaFor(mode: ProjectMode) {
  return mode === "guest" ? projectFields.merge(accountFields) : projectFields;
}

export type ProjectInput = z.infer<typeof projectFields> & Partial<z.infer<typeof accountFields>>;
