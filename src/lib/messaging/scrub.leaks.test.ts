import { describe, it, expect } from "vitest";
import { PDFDocument, PDFName, PDFString } from "pdf-lib";
import sharp from "sharp";
import { strToU8, strFromU8, unzipSync, zipSync } from "fflate";
import { scrubFile, ScrubRefused } from "./scrub";

// Fuites trouvées en relecture : chaque test place un nom (« Kofi ») là où les
// logiciels l'écrivent réellement, et vérifie qu'il ne survit pas.

const latin1 = (b: Uint8Array) => Buffer.from(b).toString("latin1");
const leaks = (b: Uint8Array, s = "kofi") => {
  const raw = latin1(b).toLowerCase();
  const hex = [...s].map((c) => c.charCodeAt(0).toString(16).padStart(4, "0")).join("");
  return raw.includes(s) || raw.includes(hex);
};

async function jpegWithExif(): Promise<Uint8Array<ArrayBuffer>> {
  return new Uint8Array(
    await sharp({ create: { width: 16, height: 16, channels: 3, background: "#808080" } })
      .jpeg()
      .withExif({ IFD0: { Artist: "Kofi Archa" } })
      .toBuffer(),
  );
}

describe("PDF — leftovers the in-place edit kept", () => {
  it("drops orphans, annotation authors, page XMP, attachments and image EXIF", async () => {
    const d = await PDFDocument.create({ updateMetadata: false });
    const page = d.addPage([200, 200]);
    d.context.register(d.context.obj({ Author: PDFString.of("KofiOrphan") }));
    const annot = d.context.register(
      d.context.obj({ Type: "Annot", Subtype: "Text", Rect: [0, 0, 10, 10], T: PDFString.of("KofiAnnot"), Contents: PDFString.of("ok") }),
    );
    page.node.set(PDFName.of("Annots"), d.context.obj([annot]));
    const pm = d.context.register(d.context.flateStream("<x:xmpmeta>KofiPageXMP</x:xmpmeta>", { Type: "Metadata", Subtype: "XML" }));
    page.node.set(PDFName.of("Metadata"), pm);
    await d.attach(strToU8("KofiAttachmentBody"), "kofi.txt", { description: "KofiDesc" });
    const img = await d.embedJpg(await jpegWithExif());
    page.drawImage(img, { x: 10, y: 10, width: 50, height: 50 });
    const original = await d.save({ useObjectStreams: false });
    expect(leaks(original)).toBe(true);

    const out = await scrubFile(original, "pdf");
    expect(leaks(out.bytes)).toBe(false);
    const back = await PDFDocument.load(out.bytes);
    expect(back.getPageCount()).toBe(1);
  });

  it("does not balloon a PDF that used object streams", async () => {
    const d = await PDFDocument.create();
    for (let i = 0; i < 40; i++) d.addPage([200, 200]).drawText(`Page ${i}`);
    const original = await d.save({ useObjectStreams: true });
    const out = await scrubFile(original, "pdf");
    expect(out.bytes.byteLength).toBeLessThan(original.byteLength * 1.3);
  });
});

describe("Office — names outside the property fields", () => {
  const xlsx = () =>
    zipSync({
      "[Content_Types].xml": strToU8(
        '<?xml version="1.0"?><Types><Override PartName="/docProps/custom.xml" ContentType="x"/><Override PartName="/xl/workbook.xml" ContentType="y"/></Types>',
      ),
      "_rels/.rels": strToU8(
        '<?xml version="1.0"?><Relationships><Relationship Id="r1" Type="t" Target="xl/workbook.xml"/><Relationship Id="r9" Type="c" Target="docProps/custom.xml"/></Relationships>',
      ),
      "xl/workbook.xml": strToU8(
        '<workbook><fileSharing userName="Kofi Archa"/><mc:AlternateContent><mc:Choice Requires="x15"><x15ac:absPath url="C:\\Users\\kofi\\Atelier\\" xmlns:x15ac="z"/></mc:Choice></mc:AlternateContent><sheets><sheet name="Devis"/></sheets></workbook>',
      ),
      "xl/persons/person.xml": strToU8('<personList><person displayName="Kofi Archa" id="{1}" userId="kofi@atelier.test" providerId="AD"/></personList>'),
      "xl/comments1.xml": strToU8(
        '<comments><authors><author>Kofi Archa</author></authors><commentList><comment ref="A1" authorId="0"><text><r><rPr><b/></rPr><t>Kofi Archa:</t></r><r><t xml:space="preserve">\nVérifier ce poste</t></r></text></comment></commentList></comments>',
      ),
      "xl/media/image1.jpeg": new Uint8Array(0),
      "docProps/app.xml": strToU8('<Properties><TitlesOfParts><vt:vector><vt:lpwstr>Devis Kofi</vt:lpwstr></vt:vector></TitlesOfParts><Company>Atelier Kofi</Company></Properties>'),
      "docProps/custom.xml": strToU8('<Properties><property name="Owner"><vt:lpwstr>Kofi</vt:lpwstr></property></Properties>'),
    });

  it("cleans an Excel workbook: path, sharing name, persons, note authors, titles, custom props", async () => {
    const files0 = unzipSync(xlsx());
    files0["xl/media/image1.jpeg"] = await jpegWithExif();
    const out = await scrubFile(zipSync(files0), "xlsx");
    const files = unzipSync(out.bytes);
    for (const [name, data] of Object.entries(files)) {
      expect(leaks(data), `${name} still names Kofi`).toBe(false);
    }
    expect(files["docProps/custom.xml"]).toBeUndefined();
    expect(strFromU8(files["[Content_Types].xml"])).not.toContain("custom.xml");
    expect(strFromU8(files["_rels/.rels"])).not.toContain("custom.xml");
    expect(strFromU8(files["xl/comments1.xml"])).toContain("Vérifier ce poste");
    expect(strFromU8(files["xl/workbook.xml"])).toContain('<sheet name="Devis"/>');
  });

  it("cleans a Word document: people part, external template path, embedded photos", async () => {
    const docx = zipSync({
      "[Content_Types].xml": strToU8("<Types/>"),
      "word/document.xml": strToU8('<w:document><w:ins w:author="Kofi Archa" w:id="1"><w:t>Bonjour</w:t></w:ins></w:document>'),
      "word/people.xml": strToU8('<w15:people><w15:person w15:author="Kofi Archa"><w15:presenceInfo w15:providerId="AD" w15:userId="kofi@atelier.test"/></w15:person></w15:people>'),
      "word/_rels/settings.xml.rels": strToU8(
        '<Relationships><Relationship Id="rId1" Type="attachedTemplate" Target="file:///C:\\Users\\kofi\\Modeles\\Atelier.dotx" TargetMode="External"/></Relationships>',
      ),
      "word/media/image1.jpg": await jpegWithExif(),
    });
    const out = await scrubFile(docx, "docx");
    const files = unzipSync(out.bytes);
    for (const [name, data] of Object.entries(files)) {
      expect(leaks(data), `${name} still names Kofi`).toBe(false);
    }
    expect(strFromU8(files["word/document.xml"])).toContain("Bonjour");
  });

  it("refuses documents carrying embedded objects (they have their own authors)", async () => {
    const docx = zipSync({
      "[Content_Types].xml": strToU8("<Types/>"),
      "word/document.xml": strToU8("<w:document/>"),
      "word/embeddings/oleObject1.bin": strToU8("Kofi"),
    });
    await expect(scrubFile(docx, "docx")).rejects.toBeInstanceOf(ScrubRefused);
  });

  it("refuses an archive that inflates past the limit instead of exhausting memory", async () => {
    const bomb = zipSync({ "[Content_Types].xml": strToU8("<Types/>"), "word/document.xml": new Uint8Array(2_000_000) });
    await expect(scrubFile(bomb, "docx", { maxUnzippedBytes: 1_000_000 })).rejects.toBeInstanceOf(ScrubRefused);
  });
});
