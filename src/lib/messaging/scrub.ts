import "server-only";
import { PDFDocument, PDFName, PDFRef } from "pdf-lib";
import sharp from "sharp";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { isScrubbable } from "./files";

// Nettoyage des métadonnées d'un document transmis d'un côté à l'autre avant
// le RDV confirmé : le champ « Auteur » d'un PDF ou d'un DOCX, l'EXIF d'une
// photo révèlent souvent un nom ou une localisation, invisibles à l'écran.
// DWG/DXF et HEIC ne sont pas nettoyables ici : l'interface le signale.

export type ScrubResult = { bytes: Uint8Array; scrubbed: boolean };

const IMAGE = new Set(["jpg", "jpeg", "png", "webp"]);
const OFFICE = new Set(["docx", "xlsx"]);

export { isScrubbable };

export async function scrubFile(bytes: Uint8Array, ext: string): Promise<ScrubResult> {
  const e = ext.toLowerCase();
  if (e === "pdf") return { bytes: await scrubPdf(bytes), scrubbed: true };
  if (IMAGE.has(e)) return { bytes: await scrubImage(bytes, e), scrubbed: true };
  if (OFFICE.has(e)) return { bytes: scrubOffice(bytes), scrubbed: true };
  return { bytes, scrubbed: false };
}

async function scrubPdf(bytes: Uint8Array): Promise<Uint8Array> {
  // updateMetadata: false — pdf-lib n'ajoute ni producteur ni dates.
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  // Dictionnaire Info : on retire toutes les entrées (auteur, créateur, titre…).
  const infoRef = doc.context.trailerInfo.Info;
  if (infoRef instanceof PDFRef) doc.context.delete(infoRef);
  doc.context.trailerInfo.Info = undefined;
  // Métadonnées XMP du catalogue (copie XML des mêmes champs) : l'objet est
  // supprimé du fichier, pas seulement déréférencé.
  const meta = doc.catalog.get(PDFName.of("Metadata"));
  if (meta instanceof PDFRef) doc.context.delete(meta);
  doc.catalog.delete(PDFName.of("Metadata"));
  return doc.save({ useObjectStreams: false });
}

async function scrubImage(bytes: Uint8Array, ext: string): Promise<Uint8Array> {
  // sharp ne recopie aucune métadonnée (EXIF, XMP, IPTC) sauf demande
  // explicite ; rotate() applique d'abord l'orientation EXIF pour que l'image
  // ne pivote pas une fois l'EXIF retiré.
  const img = sharp(bytes).rotate();
  const out =
    ext === "png" ? img.png() : ext === "webp" ? img.webp({ quality: 92 }) : img.jpeg({ quality: 92, mozjpeg: true });
  return new Uint8Array(await out.toBuffer());
}

const CORE_TAGS = "dc:creator|cp:lastModifiedBy|dc:title|dc:subject|cp:keywords|dc:description|cp:category|cp:contentStatus";
const APP_TAGS = "Company|Manager|Template|HyperlinkBase";

function blankTags(xml: string, tags: string): string {
  const re = new RegExp(`<(${tags})(\\s[^>]*)?>[\\s\\S]*?</\\1>`, "g");
  return xml.replace(re, (_m, tag: string, attrs = "") => `<${tag}${attrs}></${tag}>`);
}

function scrubOffice(bytes: Uint8Array): Uint8Array {
  const files = unzipSync(bytes);
  for (const [path, data] of Object.entries(files)) {
    if (!path.endsWith(".xml")) continue;
    let xml = strFromU8(data);
    const before = xml;
    if (path === "docProps/core.xml") xml = blankTags(xml, CORE_TAGS);
    else if (path === "docProps/app.xml") xml = blankTags(xml, APP_TAGS);
    else if (path === "docProps/custom.xml") xml = xml.replace(/<(vt:[a-zA-Z0-9]+)>[\s\S]*?<\/\1>/g, "<$1></$1>");
    // Auteurs des commentaires et des modifications suivies.
    else if (path.startsWith("word/")) xml = xml.replace(/\bw:(author|initials)="[^"]*"/g, 'w:$1="Reliote"');
    else if (path.startsWith("xl/") && /comments\d*\.xml$/.test(path)) xml = xml.replace(/<author>[\s\S]*?<\/author>/g, "<author>Reliote</author>");
    if (xml !== before) files[path] = strToU8(xml);
  }
  return zipSync(files);
}
