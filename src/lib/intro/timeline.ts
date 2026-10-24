// Minutage du montage court de la séquence d'ouverture (spec §2).
// Les bornes sont écrites en dur plutôt que cumulées : additionner des durées
// en virgule flottante ferait dériver les fins d'acte.

export type ActKey = "mains" | "assemblage" | "eliote" | "construction" | "hero";

export const INTRO_ACTS: ReadonlyArray<{ key: ActKey; start: number; end: number }> = [
  { key: "mains", start: 0, end: 2.0 },
  { key: "assemblage", start: 2.0, end: 3.2 },
  { key: "eliote", start: 3.2, end: 4.4 },
  { key: "construction", start: 4.4, end: 6.6 },
  { key: "hero", start: 6.6, end: 8.15 },
];

export const INTRO_DURATION = 8.15;

/** Début de l'acte 4, où la vidéo de construction entre. */
const CONSTRUCTION_START = 4.4;

/** Durée de la vidéo telle qu'elle est livrée : la source de 6,083 s est
 *  ré-encodée à ×2,2 (tâche 5). Aucun `playbackRate` à la lecture, qui est
 *  coûteux et saccadé sur mobile. */
export const VIDEO_DURATION = 2.77;

export function actAt(t: number): ActKey {
  let current: ActKey = INTRO_ACTS[0].key;
  for (const act of INTRO_ACTS) {
    if (t >= act.start) current = act.key;
  }
  return current;
}

export function videoTimeAt(t: number): number {
  return Math.min(VIDEO_DURATION, Math.max(0, t - CONSTRUCTION_START));
}
