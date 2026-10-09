"use client";
import { createContext, useContext } from "react";

// Ce que les étapes du formulaire projet doivent savoir du visiteur.
export type ProjectWizardAccount =
  | { mode: "guest" }
  | { mode: "member"; email: string; role: string };

export const ProjectWizardContext = createContext<ProjectWizardAccount>({ mode: "guest" });

export function useProjectWizardAccount(): ProjectWizardAccount {
  return useContext(ProjectWizardContext);
}
