import { describe, it, expect } from "vitest";
import {
  MAX_FILE_BYTES,
  checkAttachment,
  sanitizeFileName,
  storagePathFor,
  attachmentPathBelongs,
  mimeForExtension,
} from "./files";

describe("checkAttachment", () => {
  it("accepts the working formats, whatever the case of the extension", () => {
    expect(checkAttachment({ name: "plan.pdf", size: 1000 })).toEqual({ ok: true, ext: "pdf", name: "plan.pdf" });
    expect(checkAttachment({ name: "PLAN.DWG", size: 1000 })).toMatchObject({ ok: true, ext: "dwg" });
    expect(checkAttachment({ name: "photo.HEIC", size: 1000 })).toMatchObject({ ok: true, ext: "heic" });
    expect(checkAttachment({ name: "devis.xlsx", size: 1000 })).toMatchObject({ ok: true, ext: "xlsx" });
  });

  it("refuses archives, executables, markup and files without extension", () => {
    for (const name of ["a.zip", "a.exe", "a.svg", "a.html", "noext", "a.pdf.exe"]) {
      expect(checkAttachment({ name, size: 1000 })).toEqual({ ok: false, error: "type" });
    }
  });

  it("refuses empty files and files over 25 MB, accepts exactly 25 MB", () => {
    expect(checkAttachment({ name: "a.pdf", size: 0 })).toEqual({ ok: false, error: "empty" });
    expect(checkAttachment({ name: "a.pdf", size: MAX_FILE_BYTES + 1 })).toEqual({ ok: false, error: "size" });
    expect(checkAttachment({ name: "a.pdf", size: MAX_FILE_BYTES })).toMatchObject({ ok: true });
  });

  it("refuses a name that is nothing but an extension once cleaned", () => {
    expect(checkAttachment({ name: "../.pdf", size: 10 })).toEqual({ ok: false, error: "name" });
  });
});

describe("sanitizeFileName", () => {
  it("keeps only the base name", () => {
    expect(sanitizeFileName("../../etc/passwd.pdf")).toBe("passwd.pdf");
    expect(sanitizeFileName("C:\\Users\\x\\plan.dwg")).toBe("plan.dwg");
  });

  it("removes control characters", () => {
    expect(sanitizeFileName("pl\u0000an\n.pdf")).toBe("plan.pdf");
  });

  it("truncates long names but keeps the extension", () => {
    const out = sanitizeFileName(`${"a".repeat(300)}.pdf`);
    expect(out.length).toBeLessThanOrEqual(120);
    expect(out.endsWith(".pdf")).toBe(true);
  });
});

describe("storage paths", () => {
  it("builds a path inside the thread folder", () => {
    expect(storagePathFor("t1", "f1", "pdf")).toBe("t1/f1.pdf");
  });

  it("only accepts a direct child of the thread folder", () => {
    expect(attachmentPathBelongs("t1/x.pdf", "t1")).toBe(true);
    expect(attachmentPathBelongs("t2/x.pdf", "t1")).toBe(false);
    expect(attachmentPathBelongs("t1/../t2/x.pdf", "t1")).toBe(false);
    expect(attachmentPathBelongs("t1/sub/x.pdf", "t1")).toBe(false);
    expect(attachmentPathBelongs("t1/", "t1")).toBe(false);
  });
});

describe("mimeForExtension", () => {
  it("maps known extensions and falls back to octet-stream", () => {
    expect(mimeForExtension("pdf")).toBe("application/pdf");
    expect(mimeForExtension("dwg")).toBe("application/acad");
    expect(mimeForExtension("bin")).toBe("application/octet-stream");
  });
});
