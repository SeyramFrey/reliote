import { AFRICAN_COUNTRIES } from "@/lib/countries/africa";

// Heures de rendez-vous : l'admin saisit une heure « murale » dans un fuseau
// qu'il choisit ; on stocke l'instant UTC ; on affiche ensuite l'heure du pays
// du chantier ET l'heure de Paris, fuseaux toujours nommés. Sans dépendance :
// tout passe par Intl, qui connaît les changements d'heure.

export const PARIS_TIME_ZONE = "Europe/Paris";
const FALLBACK_TIME_ZONE = "Africa/Abidjan";

const WALL_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

export function countryTimeZone(countryName: string): string {
  return AFRICAN_COUNTRIES.find((c) => c.name === countryName)?.tz ?? FALLBACK_TIME_ZONE;
}

/** "Africa/Dar_es_Salaam" → "Dar es Salaam" */
export function timeZoneCity(timeZone: string): string {
  return (timeZone.split("/").pop() ?? timeZone).replace(/_/g, " ");
}

// Décalage (ms) du fuseau à l'instant `t` : heure murale lue dans le fuseau,
// relue comme si elle était UTC, moins l'instant réel.
function offsetAt(t: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(t));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(t / 1000) * 1000;
}

/** "2026-10-26T10:00" lu dans `timeZone` → instant UTC. */
export function zonedWallTimeToUtc(local: string, timeZone: string): Date {
  const m = WALL_TIME.exec(local);
  if (!m) throw new Error(`Invalid wall time: ${local}`);
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  // Une première correction, puis une seconde au cas où l'offset change entre
  // l'estimation et le résultat (instant proche d'un changement d'heure).
  let result = guess - offsetAt(guess, timeZone);
  const second = offsetAt(result, timeZone);
  if (guess - second !== result) result = guess - second;
  return new Date(result);
}

function datePart(d: Date, locale: "fr" | "en", timeZone: string): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    timeZone,
    dateStyle: "full",
  }).format(d);
}

function timePart(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(d);
}

/**
 * FR : « lundi 26 octobre 2026, 09:00 (heure de Dakar) · 10:00 heure de Paris »
 * Même heure : « mercredi 1 juillet 2026, 10:00 (heure de Johannesburg et de Paris) »
 */
export function formatMeetingTime(
  iso: string,
  opts: { locale: "fr" | "en"; projectTimeZone: string },
): string {
  const d = new Date(iso);
  const { locale, projectTimeZone } = opts;
  const city = timeZoneCity(projectTimeZone);
  const localDate = datePart(d, locale, projectTimeZone);
  const localTime = timePart(d, projectTimeZone);
  const parisDate = datePart(d, locale, PARIS_TIME_ZONE);
  const parisTime = timePart(d, PARIS_TIME_ZONE);

  if (localDate === parisDate && localTime === parisTime) {
    return locale === "en"
      ? `${localDate}, ${localTime} (${city} and Paris time)`
      : `${localDate}, ${localTime} (heure de ${city} et de Paris)`;
  }
  const paris = parisDate === localDate ? parisTime : `${parisDate}, ${parisTime}`;
  return locale === "en"
    ? `${localDate}, ${localTime} (${city} time) · ${paris} Paris time`
    : `${localDate}, ${localTime} (heure de ${city}) · ${paris} heure de Paris`;
}

/** Fuseaux proposés à l'admin : Paris d'abord, puis un par pays (A→Z). */
export const TIMEZONE_CHOICES: { value: string; label: string }[] = [
  { value: PARIS_TIME_ZONE, label: "Paris — France" },
  ...[...AFRICAN_COUNTRIES]
    .sort((a, b) => a.name.localeCompare(b.name, "fr"))
    .map((c) => ({ value: c.tz, label: `${timeZoneCity(c.tz)} — ${c.name}` })),
];
