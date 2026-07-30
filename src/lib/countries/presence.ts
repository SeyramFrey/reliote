import { AFRICAN_COUNTRIES } from "./africa";

// Aggregates verified-architect counts by country into a map-ready payload.
// Pure and side-effect free so it can be unit-tested without a DB. The server
// component (MapTerritoire) feeds it the `country` column of verified rows and
// forwards the result to the map views — only COUNTS ever leave the server,
// never an individual architect row (progressive-disclosure model, cf. 0007/0008).

export type PresenceRow = { country: string | null };
export type LitCountry = { iso2: string; name: string; count: number };
export type Presence = {
  lit: LitCountry[];
  totalCountries: number;
  totalArchitects: number;
};

// architect_profiles.country stores the French display name (e.g. "Côte d'Ivoire").
// Normalize (strip accents, unify apostrophes, casefold) so lookups are robust.
const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’`]/g, "'")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const NAME_TO_ISO = new Map(AFRICAN_COUNTRIES.map((c) => [norm(c.name), c.iso2]));
const ISO_TO_NAME = new Map(AFRICAN_COUNTRIES.map((c) => [c.iso2, c.name]));

export function aggregatePresence(rows: PresenceRow[]): Presence {
  const counts = new Map<string, number>(); // iso2 → count
  for (const { country } of rows) {
    if (!country) continue;
    const iso2 = NAME_TO_ISO.get(norm(country));
    if (!iso2) continue; // unmapped / non-African country → excluded from the map
    counts.set(iso2, (counts.get(iso2) ?? 0) + 1);
  }

  const lit: LitCountry[] = [...counts.entries()]
    .map(([iso2, count]) => ({ iso2, name: ISO_TO_NAME.get(iso2)!, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "fr"));

  return {
    lit,
    totalCountries: lit.length,
    totalArchitects: lit.reduce((sum, c) => sum + c.count, 0),
  };
}
