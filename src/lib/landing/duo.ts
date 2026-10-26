// Logique de survol des deux cartes « Deux côtés du même cadre », relevée dans
// le code de hollywoodexhibit2026.com (menu des galeries) :
//
// - survoler une carte depuis le repos l'active tout de suite ;
// - passer DIRECTEMENT d'une carte à l'autre ne bascule pas : on repasse par le
//   repos, et la seconde ne s'active qu'au bout de DUO_SETTLE_MS — le temps que
//   le premier mouvement se défasse. Pendant cette attente, tout autre survol
//   est ignoré ;
// - quitter la zone ramène au repos et annule l'attente ;
// - le premier plan (z-index) reste à la dernière carte survolée tant qu'une
//   autre ne l'a pas prise : au retour, la carte qui recule repasse DESSUS
//   l'autre, au lieu de plonger dessous à mi-course.

/** Durée d'un mouvement de carte, et de l'attente entre deux cartes. */
export const DUO_SETTLE_MS = 800;

export type DuoState = {
  /** Carte active, ou null au repos. */
  hovered: number | null;
  /** Carte au premier plan. */
  zOwner: number | null;
  /** Carte qui s'activera à l'échéance de l'attente. */
  pending: number | null;
};

export type DuoEvent =
  | { type: "enter"; index: number }
  | { type: "leave" }
  | { type: "settle" };

export const DUO_IDLE: DuoState = { hovered: null, zOwner: null, pending: null };

export function duoReduce(s: DuoState, e: DuoEvent): DuoState {
  switch (e.type) {
    case "enter":
      if (s.pending !== null || s.hovered === e.index) return s;
      if (s.hovered !== null) return { hovered: null, zOwner: s.zOwner, pending: e.index };
      return { hovered: e.index, zOwner: e.index, pending: null };
    case "settle":
      if (s.pending === null) return s;
      return { hovered: s.pending, zOwner: s.pending, pending: null };
    case "leave":
      return { hovered: null, zOwner: s.zOwner, pending: null };
  }
}

/** Pose d'une carte : à plat, devant (survolée) ou en retrait (l'autre). */
export type DuoPose = "rest" | "front" | "back";

export function duoPose(index: number, hovered: number | null): DuoPose {
  if (hovered === null) return "rest";
  return hovered === index ? "front" : "back";
}
