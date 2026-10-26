import { z } from "zod";
import { SPECIALTIES, PROJECT_TYPES } from "./architect.schema";
import { AFRICAN_COUNTRIES } from "@/lib/countries/africa";

const AFRICAN_COUNTRY_NAMES = AFRICAN_COUNTRIES.map((c) => c.name);

// Les messages sont des codes, traduits à l'affichage (messages validation.*).
// Le projet lui-même. L'e-mail et le nom du porteur viennent de son compte.
const projectFields = z.object({
  project_type: z.enum(PROJECT_TYPES),
  project_description: z.string().min(100, "descriptionMin"),
  required_specialties: z.array(z.enum(SPECIALTIES)).min(1, "specialtiesMin"),
  notes: z.string().optional(),
  project_country: z
    .string()
    .refine((v) => AFRICAN_COUNTRY_NAMES.includes(v), "countryRequired"),
  project_location: z.string().min(2, "locationMin"),
  budget_range: z.string().optional(),
  timeline: z.string().optional(),
  phone: z.string().optional(),
});

// Invité : le compte porteur est créé avec le projet.
const accountFields = z.object({
  first_name: z.string().trim().min(1, "firstNameRequired"),
  last_name: z.string().trim().min(1, "lastNameRequired"),
  email: z.string().email("emailInvalid"),
  password: z.string().min(8, "passwordMin"),
  // Case décochée par défaut : inscription à la newsletter (double opt-in).
  newsletter: z.boolean().optional(),
});

export type ProjectMode = "guest" | "member";

export function projectSchemaFor(mode: ProjectMode) {
  return mode === "guest" ? projectFields.merge(accountFields) : projectFields;
}

export type ProjectInput = z.infer<typeof projectFields> & Partial<z.infer<typeof accountFields>>;
