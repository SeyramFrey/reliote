import { AFRICAN_COUNTRIES } from "@/lib/countries/africa";

// Bandeau de chiffres sous le hero. Uniquement des valeurs vraies : les comptes
// viennent de la base (architectes vérifiés, pays couverts), « 54 » est le
// nombre de pays éligibles. Sans architecte vérifié, on affiche des preuves
// qualitatives plutôt qu'un « 0 » qui desservirait la marque.
// Une cellule sans `num` tire sa valeur de la traduction (`stats.<key>.num`).

export type StatCell = { key: string; num?: string };

export function buildStatCells(p: { totalArchitects: number; totalCountries: number }): StatCell[] {
  const live: StatCell[] =
    p.totalArchitects > 0
      ? [
          { key: "architects", num: String(p.totalArchitects) },
          { key: "countries", num: String(p.totalCountries) },
        ]
      : [{ key: "vetting" }, { key: "identity" }];
  return [...live, { key: "eligible", num: String(AFRICAN_COUNTRIES.length) }, { key: "response" }];
}
