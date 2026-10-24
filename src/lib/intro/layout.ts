// Loi de composition : le ratio du viewport décide du recul de la caméra et de
// la mise en page du lockup R + ELIOTE. La séquence remplit l'écran dans tous
// les formats — pas de bandes, pas de recadrage (spec §2).

export type LockupMode = "ligne" | "empile";

export type IntroLayout = {
  cameraZ: number;
  lockup: LockupMode;
  monogramScale: number;
};

/** Distance caméra au ratio de référence, celui sur lequel la séquence a été validée. */
export const BASE_CAMERA_Z = 620;

const REFERENCE_ASPECT = 16 / 9;
/** Au-delà, le monogramme devient trop petit pour se lire. */
const MAX_CAMERA_Z = 1800;
/** En dessous, le mot ne tient plus à côté du monogramme. */
const STACK_BELOW = 0.9;

export function introLayout(aspect: number): IntroLayout {
  // Une rotation de téléphone peut produire un ratio transitoire nul ou NaN.
  const a = Number.isFinite(aspect) && aspect > 0 ? aspect : REFERENCE_ASPECT;

  // Plus large que la référence : la hauteur reste la contrainte, la caméra ne
  // bouge pas. Plus étroit : la largeur devient la contrainte, il faut reculer.
  const cameraZ = Math.min(MAX_CAMERA_Z, BASE_CAMERA_Z * Math.max(1, REFERENCE_ASPECT / a));
  const lockup: LockupMode = a < STACK_BELOW ? "empile" : "ligne";

  return { cameraZ, lockup, monogramScale: lockup === "empile" ? 0.78 : 0.62 };
}
