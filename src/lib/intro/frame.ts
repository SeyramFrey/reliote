// État visuel du calque d'intro à un instant donné.
//
// Cette logique vivait dans la boucle de rendu du composant, donc nulle part
// où un test puisse l'atteindre : ce dépôt n'a pas de tests de composants, et
// `requestAnimationFrame` ne tourne pas dans une page en arrière-plan. Mise ici,
// elle est du calcul pur, vérifiable, et le composant ne fait plus que l'appliquer.

import { INTRO_DURATION } from "./timeline";

const VIDEO_START = 4.4;
const HERO_START = 6.6;
const SKIP_AT = 1.2;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOut2 = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

export type FrameInput = {
  /** Temps courant dans la séquence, en secondes. */
  time: number;
  /** Faux quand la vidéo n'a pas pu être chargée : l'acte 4 est alors vide. */
  includeVideoAct: boolean;
};

export type FrameState = {
  wordOpacity: number;
  gridOpacity: number;
  videoOpacity: number;
  overlayOpacity: number;
  /** 0 : la page est un petit carré au fond. 1 : elle est en place. */
  zoom: number;
  skipShown: boolean;
  playVideo: boolean;
};

export function introFrame({ time, includeVideoAct }: FrameInput): FrameState {
  // Le mot et la grille sortent quand le plan entre, sinon ELIOTE reste posé
  // par-dessus la construction.
  const fade = 1 - clamp01((time - (VIDEO_START + 0.1)) / 0.62);

  const videoIn = clamp01((time - VIDEO_START) / 0.66);
  const videoOut = clamp01((time - HERO_START) / 0.7);
  const videoOpacity = includeVideoAct ? videoIn * (1 - videoOut) : 0;

  return {
    wordOpacity: fade,
    gridOpacity: 0.5 * fade,
    videoOpacity,
    overlayOpacity: 1 - clamp01((time - HERO_START) / 0.7),
    zoom: easeInOut2(clamp01((time - HERO_START) / (INTRO_DURATION - HERO_START))),
    skipShown: time >= SKIP_AT && time < HERO_START,
    playVideo: includeVideoAct && time >= VIDEO_START,
  };
}
