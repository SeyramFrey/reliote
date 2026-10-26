// Photos d'architectes : le bucket `architect-photos` est privé (0023) — la
// photo est l'identité que la révélation protège jusqu'au RDV confirmé. On
// stocke donc le chemin de l'objet, jamais une URL publique, et l'affichage
// passe par une URL signée de courte durée.
//
// Convention de chemin : {user_id}/{uuid}.{ext} (la policy Storage s'appuie
// sur le premier dossier).

export const ARCHITECT_PHOTO_BUCKET = "architect-photos";

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const PATH_RE = new RegExp(`^(${UUID})/${UUID}\\.(?:jpe?g|png|webp)$`, "i");
// Anciennes lignes : URL publique du bucket, avant qu'il passe en privé.
const LEGACY_PUBLIC_RE = /\/storage\/v1\/object\/public\/architect-photos\/(.+)$/;

export function isArchitectPhotoPath(value: string): boolean {
  return PATH_RE.test(value);
}

/** Dossier propriétaire d'un chemin valide, sinon null. */
export function architectPhotoOwner(path: string): string | null {
  return PATH_RE.exec(path)?.[1]?.toLowerCase() ?? null;
}

/** Chemin de l'objet pour une valeur de `photo_url` (chemin ou ancienne URL publique). */
export function architectPhotoPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (isArchitectPhotoPath(value)) return value;
  const legacy = LEGACY_PUBLIC_RE.exec(value)?.[1];
  return legacy && isArchitectPhotoPath(decodeURIComponent(legacy)) ? decodeURIComponent(legacy) : null;
}
