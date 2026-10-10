// Numérotation des sections de la landing (« 01 — », « 02 — »…). Calculée à
// partir des sections réellement affichées : l'étude de cas et le Journal
// disparaissent tant que rien n'est publié, et la suite ne doit pas sauter de
// numéro pour autant.

export type LandingSection =
  | "pillars"
  | "audiences"
  | "method"
  | "process"
  | "territoire"
  | "featured"
  | "journal"
  | "cta";

export function numberSections(
  shown: readonly LandingSection[],
): Partial<Record<LandingSection, string>> {
  return Object.fromEntries(shown.map((s, i) => [s, String(i + 1).padStart(2, "0")]));
}
