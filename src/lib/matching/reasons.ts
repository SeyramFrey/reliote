import type { MatchReason } from "./score";

// Libellés français des types de projet (les valeurs stockées sont les enums DB).
const PROJECT_TYPE_FR: Record<string, string> = {
  residential: "Résidentiel",
  hospitality: "Hospitalité",
  commercial: "Commercial",
  urban: "Urbain",
  cultural: "Culturel",
  other: "Autre",
};

// Traduit une raison de matching en phrase lisible (FR) pour la fiche projet admin.
// Remplace l'affichage brut « kind (+30) » par une justification compréhensible.
export function describeReason(r: MatchReason): string {
  switch (r.kind) {
    case "specialty":
      return `Spécialités en commun : ${r.items.join(", ")}`;
    case "country":
      return `Exerce dans le pays du chantier — ${r.country}`;
    case "project_type":
      return `Type de projet maîtrisé — ${PROJECT_TYPE_FR[r.item] ?? r.item}`;
    case "availability":
      return "Disponible pour de nouvelles missions";
    case "experience":
      return `Expérience confirmée — ${r.years} ans d'exercice`;
    case "location":
      return `Présent dans la localité du chantier — ${r.city}`;
    case "rating":
      return `Excellente note client — ${r.value.toFixed(1)} / 5`;
  }
}

// `match_results.reasons` est stocké en Json. On revalide la forme au runtime
// avant de décrire, pour tolérer d'éventuelles lignes historiques mal formées.
export function describeReasons(reasons: unknown): { text: string; weight: number }[] {
  if (!Array.isArray(reasons)) return [];
  return reasons
    .filter(
      (r): r is MatchReason =>
        !!r && typeof r === "object" && typeof (r as { kind?: unknown }).kind === "string",
    )
    .map((r) => ({ text: describeReason(r), weight: (r as { weight: number }).weight }));
}
