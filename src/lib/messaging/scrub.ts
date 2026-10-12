import "server-only";
import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFObject,
  PDFRawStream,
  PDFRef,
  PDFStream,
} from "pdf-lib";
import sharp from "sharp";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { isScrubbable } from "./files";

// Nettoyage des métadonnées d'un document transmis d'un côté à l'autre avant
// le RDV confirmé. Un nom (auteur, utilisateur Windows, auteur de commentaire,
// EXIF d'une photo…) peut se cacher à de nombreux endroits invisibles à
// l'écran ; on reconstruit ou on réécrit ce qui peut l'être et on REFUSE ce
// qui ne peut pas être nettoyé de façon sûre (objets intégrés, archive
// démesurée, PDF chiffré). DWG/DXF et HEIC ne sont pas traités : l'interface
// le signale.

export type ScrubResult = { bytes: Uint8Array; scrubbed: boolean };
export type ScrubOptions = { maxUnzippedBytes?: number };

/** Document qu'on ne sait pas nettoyer sans risque : il n'est pas transmis. */
export class ScrubRefused extends Error {
  constructor(public reason: "embedded" | "tooLarge" | "encrypted") {
    super(`scrub refused: ${reason}`);
  }
}

const IMAGE = new Set(["jpg", "jpeg", "png", "webp"]);
const OFFICE = new Set(["docx", "xlsx"]);
const DEFAULT_MAX_UNZIPPED = 200 * 1024 * 1024;

export { isScrubbable };

export async function scrubFile(bytes: Uint8Array, ext: string, opts: ScrubOptions = {}): Promise<ScrubResult> {
  const e = ext.toLowerCase();
  if (e === "pdf") return { bytes: await scrubPdf(bytes), scrubbed: true };
  if (IMAGE.has(e)) return { bytes: await scrubImage(bytes, e), scrubbed: true };
  if (OFFICE.has(e)) {
    return { bytes: await scrubOffice(bytes, opts.maxUnzippedBytes ?? DEFAULT_MAX_UNZIPPED), scrubbed: true };
  }
  return { bytes, scrubbed: false };
}

// ── PDF ───────────────────────────────────────────────────────────────────
// On recopie les pages dans un document neuf : seul ce que les pages
// référencent passe (pas l'Info, ni le XMP du catalogue, ni les pièces
// jointes, ni le JavaScript du document, ni les restes d'anciennes
// sauvegardes). Puis on retire ce que les pages elles-mêmes transportent.
const DROP_KEYS = ["Metadata", "PieceInfo", "AA", "JS", "LastModified"];

async function scrubPdf(bytes: Uint8Array): Promise<Uint8Array> {
  const src = await PDFDocument.load(bytes, { updateMetadata: false });
  if (src.isEncrypted) throw new ScrubRefused("encrypted");
  const out = await PDFDocument.create({ updateMetadata: false });
  const pages = await out.copyPages(src, src.getPageIndices());
  for (const p of pages) out.addPage(p);

  for (const [ref, obj] of out.context.enumerateIndirectObjects()) {
    const dict = obj instanceof PDFDict ? obj : obj instanceof PDFStream ? obj.dict : null;
    if (!dict) continue;
    for (const k of DROP_KEYS) dict.delete(PDFName.of(k));
    const type = dict.get(PDFName.of("Type"));
    const subtype = dict.get(PDFName.of("Subtype"));
    // Auteur d'une annotation (/T), hors champs de formulaire où /T est le nom
    // technique du champ.
    if (type === PDFName.of("Annot") && subtype !== PDFName.of("Widget")) dict.delete(PDFName.of("T"));
    // Photo JPEG intégrée : on retire ses segments EXIF/XMP/IPTC/commentaire.
    if (obj instanceof PDFRawStream && subtype === PDFName.of("Image") && dict.get(PDFName.of("Filter")) === PDFName.of("DCTDecode")) {
      const cleaned = stripJpegMetadata(obj.getContents());
      dict.set(PDFName.of("Length"), PDFNumber.of(cleaned.byteLength));
      out.context.assign(ref, PDFRawStream.of(dict, cleaned));
    }
  }

  // Pièces jointes au niveau des pages (annotations FileAttachment).
  for (const page of out.getPages()) {
    const annots = page.node.lookup(PDFName.of("Annots"));
    if (!(annots instanceof PDFArray)) continue;
    const keep = annots.asArray().filter((a) => {
      const d = out.context.lookup(a);
      return !(d instanceof PDFDict && d.get(PDFName.of("Subtype")) === PDFName.of("FileAttachment"));
    });
    page.node.set(PDFName.of("Annots"), out.context.obj(keep));
  }

  dropUnreachable(out);
  return out.save({ useObjectStreams: true });
}

// Supprime tout objet que plus rien ne référence (flux XMP détachés,
// pièces jointes retirées…) : pdf-lib écrit sinon tous les objets connus.
function dropUnreachable(doc: PDFDocument) {
  const seen = new Set<string>();
  const visit = (o: PDFObject | undefined) => {
    if (!o) return;
    if (o instanceof PDFRef) {
      const key = o.toString();
      if (seen.has(key)) return;
      seen.add(key);
      visit(doc.context.lookup(o));
    } else if (o instanceof PDFDict) {
      for (const [, v] of o.entries()) visit(v);
    } else if (o instanceof PDFArray) {
      for (const v of o.asArray()) visit(v);
    } else if (o instanceof PDFStream) {
      visit(o.dict);
    }
  };
  visit(doc.context.trailerInfo.Root);
  for (const [ref] of doc.context.enumerateIndirectObjects()) {
    if (!seen.has(ref.toString())) doc.context.delete(ref);
  }
}

// JPEG : garde les segments d'image, retire APP1 (EXIF/XMP), APP2–APP13
// (dont IPTC) et les commentaires ; garde APP0 (JFIF) et APP14 (Adobe,
// nécessaire aux images CMJN).
function stripJpegMetadata(b: Uint8Array): Uint8Array {
  if (b[0] !== 0xff || b[1] !== 0xd8) return b;
  const parts: Uint8Array[] = [b.subarray(0, 2)];
  let i = 2;
  while (i + 4 <= b.length) {
    if (b[i] !== 0xff) return b; // structure inattendue : on ne touche à rien
    const marker = b[i + 1];
    if (marker === 0xda) {
      parts.push(b.subarray(i)); // début des données d'image : tout le reste
      break;
    }
    const len = (b[i + 2] << 8) | b[i + 3];
    const seg = b.subarray(i, i + 2 + len);
    const isApp = marker >= 0xe1 && marker <= 0xed;
    if (!isApp && marker !== 0xfe) parts.push(seg);
    i += 2 + len;
  }
  const total = parts.reduce((n, p) => n + p.byteLength, 0);
  const res = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    res.set(p, o);
    o += p.byteLength;
  }
  return res;
}

// ── Images ────────────────────────────────────────────────────────────────
async function scrubImage(bytes: Uint8Array, ext: string): Promise<Uint8Array<ArrayBuffer>> {
  // sharp ne recopie aucune métadonnée (EXIF, XMP, IPTC, ICC, textes PNG) sauf
  // demande explicite ; rotate() applique d'abord l'orientation EXIF.
  const img = sharp(bytes).rotate();
  if (ext === "png") {
    const meta = await sharp(bytes).metadata();
    return new Uint8Array(await img.png({ palette: !!meta.isPalette, compressionLevel: 9 }).toBuffer());
  }
  const out = ext === "webp" ? img.webp({ quality: 92 }) : img.jpeg({ quality: 92, mozjpeg: true });
  return new Uint8Array(await out.toBuffer());
}

// ── Word / Excel ──────────────────────────────────────────────────────────
// Parties supprimées entièrement (propriétés personnalisées, XML client).
const DROP_PART = /^(docProps\/custom\.xml|customXml\/.*)$/;
// Objets intégrés (classeurs, OLE, ActiveX, macros) : ils ont leurs propres
// auteurs et métadonnées → refus.
const EMBEDDED = /(^|\/)(embeddings|activeX)\/|vbaProject\.bin$/i;
const MEDIA = /^(word|xl|ppt)\/media\/[^/]+\.(jpe?g|png|webp)$/i;
// Attributs portant un nom de personne, quel que soit le préfixe (w:, w15:…).
const PERSON_ATTR =
  /\b((?:[A-Za-z][\w]*:)?(?:author|userId|userName|displayName|initials|lastModifiedBy|creator))\s*=\s*("[^"]*"|'[^']*')/g;
const CORE_FIELDS = "dc:creator|cp:lastModifiedBy|dc:title|dc:subject|cp:keywords|dc:description|cp:category|cp:contentStatus";
const APP_FIELDS = "Company|Manager|Template|HyperlinkBase";

const blank = (xml: string, tags: string) =>
  xml.replace(new RegExp(`<(${tags})(\\s[^>]*)?>[\\s\\S]*?</\\1>`, "g"), (_m, t: string, a = "") => `<${t}${a}></${t}>`);

function cleanXml(path: string, xml: string): string {
  let x = xml.replace(PERSON_ATTR, '$1="Reliote"');
  if (path === "docProps/core.xml") x = blank(x, CORE_FIELDS);
  if (path === "docProps/app.xml") {
    x = blank(x, APP_FIELDS);
    // Titres des parties (reprennent le titre du document et des feuilles).
    x = x.replace(/<vt:lpwstr>[^<]*<\/vt:lpwstr>/g, "<vt:lpwstr></vt:lpwstr>");
  }
  // Chemin local du classeur (C:\Users\<nom>\…) et partage de fichier.
  x = x.replace(/<x15ac:absPath\b[^>]*?(\/>|>[\s\S]*?<\/x15ac:absPath>)/g, "");
  if (/^xl\/comments\d*\.xml$/.test(path)) {
    x = x.replace(/<author>[\s\S]*?<\/author>/g, "<author>Reliote</author>");
    // Excel commence chaque note par un passage en gras « Prénom Nom: ».
    x = x.replace(/(<text>\s*)<r>(?:(?!<\/r>)[\s\S])*?<b\/>(?:(?!<\/r>)[\s\S])*?<t[^>]*>[^<]*:<\/t>\s*<\/r>/g, "$1");
  }
  return x;
}

function cleanRels(xml: string, dropped: Set<string>, relsPath: string): string {
  // Dossier de la partie source : « word/_rels/document.xml.rels » → « word/ ».
  const baseDir = relsPath.replace(/_rels\/[^/]+$/, "");
  return xml
    .replace(/<Relationship\b[^>]*\/>/g, (rel) => {
      const target = /Target="([^"]*)"/.exec(rel)?.[1] ?? "";
      const resolved = resolvePart(baseDir, target);
      return resolved && dropped.has(resolved) ? "" : rel;
    })
    // Cibles externes vers le poste de l'auteur (modèle, liens locaux).
    .replace(/Target="(file:[^"]*|[A-Za-z]:\\[^"]*|\\\\[^"]*)"/g, 'Target=""');
}

function resolvePart(baseDir: string, target: string): string | null {
  if (!target || /^[a-z]+:/i.test(target)) return null;
  const parts = (target.startsWith("/") ? target.slice(1) : baseDir + target).split("/");
  const out: string[] = [];
  for (const p of parts) {
    if (p === "..") out.pop();
    else if (p && p !== ".") out.push(p);
  }
  return out.join("/");
}

async function scrubOffice(bytes: Uint8Array, maxUnzipped: number): Promise<Uint8Array> {
  let total = 0;
  const files = unzipSync(bytes, {
    filter: (f) => {
      total += f.originalSize;
      if (total > maxUnzipped) throw new ScrubRefused("tooLarge");
      return true;
    },
  });
  if (Object.keys(files).some((p) => EMBEDDED.test(p))) throw new ScrubRefused("embedded");

  const dropped = new Set(Object.keys(files).filter((p) => DROP_PART.test(p)));
  for (const p of dropped) delete files[p];

  for (const [path, data] of Object.entries(files)) {
    if (MEDIA.test(path)) {
      if (data.byteLength > 0) files[path] = await scrubImage(data, path.slice(path.lastIndexOf(".") + 1).toLowerCase());
      continue;
    }
    if (path === "[Content_Types].xml") {
      let x = strFromU8(data);
      for (const p of dropped) x = x.replace(new RegExp(`<Override\\b[^>]*PartName="/${escapeRe(p)}"[^>]*/>`, "g"), "");
      files[path] = strToU8(x);
      continue;
    }
    if (path.endsWith(".rels")) {
      files[path] = strToU8(cleanRels(cleanXml(path, strFromU8(data)), dropped, path));
      continue;
    }
    if (path.endsWith(".xml")) files[path] = strToU8(cleanXml(path, strFromU8(data)));
  }
  return zipSync(files);
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
