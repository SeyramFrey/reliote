// Numérotation des sections de la landing (« 01 — », « 02 — »…). Calculée à
// partir des sections réellement affichées : l'étude de cas disparaît tant que
// rien n'est publié, et la suite ne doit pas sauter de numéro pour autant.

export type LandingSection =
  | "pillars"
  | "audiences"
  | "process"
  | "territoire"
  | "faq"
  | "featured"
  | "journal"
  | "avis"
  | "cta";

export function numberSections(
  shown: readonly LandingSection[],
): Partial<Record<LandingSection, string>> {
  return Object.fromEntries(shown.map((s, i) => [s, String(i + 1).padStart(2, "0")]));
}
