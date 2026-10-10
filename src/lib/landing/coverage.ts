// Couverture affichée sur la landing (diplômes, spécialités, villes). Avec peu
// d'architectes vérifiés, la liste brute redonnerait le profil d'une personne
// (ville + diplôme + spécialités ≈ sa ligne, sans le nom) — à recouper avec
// les registres de l'Ordre. On ne montre donc qu'une valeur partagée par au
// moins k architectes.

export const COVERAGE_MIN_SHARED = 3;

export function sharedValues(perArchitect: readonly (readonly string[])[], k: number): string[] {
  const counts = new Map<string, number>();
  for (const values of perArchitect) {
    for (const v of new Set(values)) {
      if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= k)
    .map(([v]) => v)
    .sort((a, b) => a.localeCompare(b, "fr"));
}
