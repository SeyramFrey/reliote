import { z } from "zod";
import { SPECIALTIES, PROJECT_TYPES } from "./architect.schema";

export const projectSchema = z.object({
  project_type: z.enum(PROJECT_TYPES),
  project_description: z.string().min(100, "≥ 100 caractères"),
  required_specialties: z.array(z.enum(SPECIALTIES)).min(1),
  notes: z.string().optional(),
  project_location: z.string().min(2),
  budget_range: z.string().optional(),
  timeline: z.string().optional(),
  client_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
});

export type ProjectInput = z.infer<typeof projectSchema>;
