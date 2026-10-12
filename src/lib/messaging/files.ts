// Pièces jointes de la messagerie : formats acceptés, noms et chemins de
// stockage. Pur, utilisé côté navigateur (retour immédiat) et côté serveur
// (seule vérification qui compte).

export const MESSAGE_BUCKET = "message-files";
export const MAX_FILE_BYTES = 26_214_400; // 25 Mo, = file_size_limit du bucket
export const MAX_FILES = 5;

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  dwg: "application/acad",
  dxf: "application/dxf",
};

// Pas d'archive (contenu invisible), pas d'exécutable, pas de SVG/HTML
// (script possible à l'ouverture).
export const ALLOWED_EXTENSIONS: readonly string[] = Object.keys(MIME);

const MAX_NAME = 120;

export type FileCheck =
  | { ok: true; ext: string; name: string }
  | { ok: false; error: "type" | "size" | "empty" | "name" };

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const clean = base.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  if (clean.length <= MAX_NAME) return clean;
  const ext = extensionOf(clean);
  const stem = clean.slice(0, clean.length - (ext ? ext.length + 1 : 0));
  return ext ? `${stem.slice(0, MAX_NAME - ext.length - 1)}.${ext}` : clean.slice(0, MAX_NAME);
}

export function checkAttachment(f: { name: string; size: number }): FileCheck {
  const name = sanitizeFileName(f.name);
  const ext = extensionOf(name);
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) return { ok: false, error: "type" };
  if (name.length <= ext.length + 1) return { ok: false, error: "name" };
  if (!(f.size > 0)) return { ok: false, error: "empty" };
  if (f.size > MAX_FILE_BYTES) return { ok: false, error: "size" };
  return { ok: true, ext, name };
}

export function storagePathFor(threadId: string, id: string, ext: string): string {
  return `${threadId}/${id}.${ext}`;
}

// Un chemin fourni par le navigateur doit être un fichier direct du dossier du
// fil : ni « .. », ni sous-dossier, ni le dossier d'un autre fil.
export function attachmentPathBelongs(path: string, threadId: string): boolean {
  const prefix = `${threadId}/`;
  if (!path.startsWith(prefix)) return false;
  const rest = path.slice(prefix.length);
  return rest.length > 0 && !rest.includes("/") && !rest.includes("\\") && !rest.startsWith(".");
}

export function mimeForExtension(ext: string): string {
  return MIME[ext.toLowerCase()] ?? "application/octet-stream";
}
