// Fin de la boucle de l'acte 1 et sort de l'acte vidéo.
//
// L'acte 1 tourne tant que les assets ne sont pas prêts : sur connexion rapide
// la spirale fait son tour et demi, sur connexion lente elle continue. Deux
// garde-fous : un plafond, pour ne pas transformer l'attente en purgatoire, et
// l'exclusion de la vidéo du signal « prêt », parce qu'elle pèse plus que tout
// le reste et qu'on sait s'en passer.

/** Au-delà, on enchaîne quoi qu'il arrive. */
export const LOOP_CAP = 5;

export type ReadyInput = {
  /** Module 3D chargé, environnement compilé, fontes prêtes, landing peinte. */
  coreReady: boolean;
  /** `canplaythrough` sur la source retenue. N'entre pas dans le signal « prêt ». */
  videoReady: boolean;
  /** Secondes écoulées depuis le début de la boucle. */
  elapsed: number;
};

export type ReadyVerdict = {
  leaveLoop: boolean;
  includeVideoAct: boolean;
};

export function readyVerdict(i: ReadyInput): ReadyVerdict {
  return {
    leaveLoop: i.coreReady || i.elapsed >= LOOP_CAP,
    includeVideoAct: i.videoReady,
  };
}
