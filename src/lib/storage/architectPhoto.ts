import "server-only";
import type { createServiceClient } from "@/lib/supabase/service";
import { ARCHITECT_PHOTO_BUCKET, architectPhotoOwner, architectPhotoPath } from "./architectPhotoPath";
import { imageKindFromBytes } from "./magicBytes";

type Service = ReturnType<typeof createServiceClient>;

const SIGNED_TTL_SECONDS = 60 * 60;

/**
 * URL affichable pour une valeur de `photo_url` : URL signée 1 h pour un objet
 * du bucket privé ; une URL https étrangère au bucket (profils de démo) est
 * rendue telle quelle ; tout le reste donne null.
 */
export async function architectPhotoSrc(service: Service, value: string | null | undefined): Promise<string | null> {
  if (!value) return null;
  const path = architectPhotoPath(value);
  if (path) {
    const { data } = await service.storage.from(ARCHITECT_PHOTO_BUCKET).createSignedUrl(path, SIGNED_TTL_SECONDS);
    return data?.signedUrl ?? null;
  }
  if (/^https:\/\//i.test(value) && !value.includes("/storage/v1/object/")) return value;
  return null;
}

/**
 * Contrôle serveur d'une photo envoyée par le navigateur : le chemin doit être
 * dans le dossier de l'utilisateur et les octets doivent être une vraie image
 * JPEG/PNG/WebP (le type MIME déclaré par le navigateur ne prouve rien). Un
 * fichier refusé est supprimé.
 */
export async function verifyArchitectPhoto(service: Service, path: string, userId: string): Promise<boolean> {
  if (architectPhotoOwner(path) !== userId.toLowerCase()) return false;
  const bucket = service.storage.from(ARCHITECT_PHOTO_BUCKET);
  const { data } = await bucket.download(path);
  if (!data) return false;
  const head = new Uint8Array(await data.slice(0, 16).arrayBuffer());
  if (imageKindFromBytes(head)) return true;
  await bucket.remove([path]);
  return false;
}
