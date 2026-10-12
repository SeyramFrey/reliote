import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { strToU8, strFromU8, unzipSync, zipSync } from "fflate";
import { scrubFile, isScrubbable } from "./scrub";

const has = (bytes: Uint8Array, s: string) => Buffer.from(bytes).includes(Buffer.from(s));
// Les chaînes PDF écrites par pdf-lib sont en hexadécimal UTF-16 (<FEFF004B…>).
const hasPdfText = (bytes: Uint8Array, s: string) => {
  const hex = [...s].map((c) => c.charCodeAt(0).toString(16).padStart(4, "0")).join("");
  const raw = Buffer.from(bytes).toString("latin1").toLowerCase();
  return raw.includes(s.toLowerCase()) || raw.includes(hex);
};

describe("isScrubbable", () => {
  it("covers PDF, Office and common images, not CAD or HEIC", () => {
    for (const ext of ["pdf", "docx", "xlsx", "jpg", "jpeg", "png", "webp"]) expect(isScrubbable(ext)).toBe(true);
    for (const ext of ["dwg", "dxf", "heic", "heif"]) expect(isScrubbable(ext)).toBe(false);
  });
});

describe("scrubFile — PDF", () => {
  it("removes author, creator, title and keywords but keeps the pages", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([200, 200]);
    doc.addPage([200, 200]);
    doc.setAuthor("Kofi Archa");
    doc.setCreator("AutoCAD — Kofi Archa");
    doc.setTitle("Villa Kofi");
    doc.setSubject("Kofi");
    doc.setKeywords(["Kofi"]);
    doc.setProducer("Kofi Producer");
    const original = await doc.save({ useObjectStreams: false });
    expect(hasPdfText(original, "Kofi")).toBe(true);

    const out = await scrubFile(original, "pdf");
    expect(out.scrubbed).toBe(true);
    expect(hasPdfText(out.bytes, "Kofi")).toBe(false);
    const back = await PDFDocument.load(out.bytes);
    expect(back.getPageCount()).toBe(2);
    expect(back.getAuthor() ?? "").toBe("");
  });
});

describe("scrubFile — images", () => {
  it("drops EXIF (author, copyright) from a JPEG and keeps it a JPEG", async () => {
    const original = new Uint8Array(
      await sharp({ create: { width: 8, height: 8, channels: 3, background: "#808080" } })
        .jpeg()
        .withExif({ IFD0: { Artist: "Kofi Archa", Copyright: "Kofi" } })
        .toBuffer(),
    );
    expect(has(original, "Kofi")).toBe(true);

    const out = await scrubFile(original, "jpg");
    expect(out.scrubbed).toBe(true);
    expect(has(out.bytes, "Kofi")).toBe(false);
    const meta = await sharp(out.bytes).metadata();
    expect(meta.format).toBe("jpeg");
    expect(meta.exif).toBeUndefined();
  });
});

describe("scrubFile — Office", () => {
  it("blanks the author fields of a DOCX and leaves the content alone", async () => {
    const original = zipSync({
      "[Content_Types].xml": strToU8('<?xml version="1.0"?><Types/>'),
      "word/document.xml": strToU8("<w:document><w:t>Bonjour</w:t></w:document>"),
      "docProps/core.xml": strToU8(
        '<?xml version="1.0"?><cp:coreProperties xmlns:cp="c" xmlns:dc="d"><dc:creator>Kofi Archa</dc:creator><cp:lastModifiedBy>Kofi</cp:lastModifiedBy><dc:title>Villa</dc:title></cp:coreProperties>',
      ),
      "docProps/app.xml": strToU8(
        '<?xml version="1.0"?><Properties><Company>Atelier Kofi</Company><Manager>Kofi</Manager><Pages>1</Pages></Properties>',
      ),
    });
    const out = await scrubFile(original, "docx");
    expect(out.scrubbed).toBe(true);
    const files = unzipSync(out.bytes);
    expect(strFromU8(files["docProps/core.xml"])).not.toContain("Kofi");
    expect(strFromU8(files["docProps/app.xml"])).not.toContain("Kofi");
    expect(strFromU8(files["docProps/app.xml"])).toContain("<Pages>1</Pages>");
    expect(strFromU8(files["word/document.xml"])).toContain("Bonjour");
  });
});

describe("scrubFile — formats that cannot be cleaned", () => {
  it("returns DWG bytes untouched and says so", async () => {
    const original = strToU8("AC1032 Kofi");
    const out = await scrubFile(original, "dwg");
    expect(out.scrubbed).toBe(false);
    expect(out.bytes).toBe(original);
  });
});
