// Décide si la séquence d'ouverture doit jouer. Logique pure : les sondes du
// navigateur (sessionStorage, matchMedia, contexte WebGL) sont faites par
// l'appelant et arrivent ici sous forme de booléens.

/** Drapeau « cet onglet a déjà vu l'intro ». Par onglet, donc sessionStorage. */
export const INTRO_SESSION_KEY = "reliote:intro-seen";

export type IntroGateInput = {
  /** NEXT_PUBLIC_INTRO !== "0" — l'interrupteur de production. */
  enabled: boolean;
  /** Valeur du paramètre `?intro=`, ou null s'il est absent. */
  queryIntro: string | null;
  seenThisTab: boolean;
  reducedMotion: boolean;
  webglOk: boolean;
};

export function shouldPlayIntro(i: IntroGateInput): boolean {
  // Accessibilité et capacité d'abord : rien ne les force, pas même ?intro=1.
  if (i.reducedMotion || !i.webglOk) return false;
  if (i.queryIntro === "0") return false;
  if (!i.enabled) return false;
  // ?intro=1 rejoue dans un onglet qui a déjà vu la séquence — c'est ce qui
  // permet de la retester sans ouvrir un onglet neuf.
  if (i.queryIntro === "1") return true;
  return !i.seenThisTab;
}

/** Le seul accès au stockage jette en navigation privée ou cookies bloqués :
 *  dans ce cas on considère que l'onglet n'a pas vu l'intro. */
export function hasSeenThisTab(s: Storage | null): boolean {
  if (!s) return false;
  try {
    return s.getItem(INTRO_SESSION_KEY) !== null;
  } catch {
    return false;
  }
}

/** Échec d'écriture silencieux : l'intro se rejouera, c'est tout. */
export function markSeenThisTab(s: Storage | null): void {
  if (!s) return;
  try {
    s.setItem(INTRO_SESSION_KEY, "1");
  } catch {
    // stockage refusé — rien à faire
  }
}
