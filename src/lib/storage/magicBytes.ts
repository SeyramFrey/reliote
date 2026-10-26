// Signatures de fichiers : on juge un fichier sur ses premiers octets, pas sur
// le type MIME ou l'extension annoncés par le navigateur.

export type ImageKind = "jpeg" | "png" | "webp";

const startsWith = (bytes: Uint8Array, sig: number[], offset = 0) =>
  bytes.length >= offset + sig.length && sig.every((b, i) => bytes[offset + i] === b);

export function imageKindFromBytes(bytes: Uint8Array): ImageKind | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  // RIFF....WEBP
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return "webp";
  return null;
}

const ascii = (bytes: Uint8Array, from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));

/**
 * Les premiers octets d'un fichier correspondent-ils à son extension ? Sert à
 * refuser un exécutable ou une page HTML renommés en « .pdf » ou « .jpg ».
 * Lire au moins 16 octets.
 */
export function bytesMatchExtension(ext: string, bytes: Uint8Array): boolean {
  switch (ext.toLowerCase()) {
    case "pdf":
      return ascii(bytes, 0, 5) === "%PDF-";
    case "jpg":
    case "jpeg":
      return imageKindFromBytes(bytes) === "jpeg";
    case "png":
      return imageKindFromBytes(bytes) === "png";
    case "webp":
      return imageKindFromBytes(bytes) === "webp";
    case "heic":
    case "heif":
      // Boîte ISO-BMFF : taille sur 4 octets puis « ftyp ».
      return ascii(bytes, 4, 8) === "ftyp";
    case "docx":
    case "xlsx":
      return startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]);
    case "dwg":
      return ascii(bytes, 0, 2) === "AC";
    case "dxf":
      // DXF binaire, ou DXF texte (aucun octet de contrôle hors espaces).
      return (
        ascii(bytes, 0, 18) === "AutoCAD Binary DXF" ||
        bytes.every((b) => b === 0x09 || b === 0x0a || b === 0x0d || (b >= 0x20 && b < 0x7f))
      );
    default:
      return false;
  }
}
