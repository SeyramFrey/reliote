import { describe, it, expect } from "vitest";
import { bytesMatchExtension, imageKindFromBytes } from "./magicBytes";

const bytes = (...parts: (number[] | string)[]) =>
  new Uint8Array(parts.flatMap((p) => (typeof p === "string" ? [...p].map((c) => c.charCodeAt(0)) : p)));
const pad = (b: Uint8Array) => new Uint8Array([...b, ...new Array(Math.max(0, 16 - b.length)).fill(0x20)]);

describe("imageKindFromBytes", () => {
  it("recognises JPEG, PNG and WebP", () => {
    expect(imageKindFromBytes(pad(bytes([0xff, 0xd8, 0xff, 0xe0])))).toBe("jpeg");
    expect(imageKindFromBytes(pad(bytes([0x89], "PNG", [0x0d, 0x0a, 0x1a, 0x0a])))).toBe("png");
    expect(imageKindFromBytes(pad(bytes("RIFF", [1, 2, 3, 4], "WEBP")))).toBe("webp");
  });
  it("rejects SVG, AVIF or HTML posing as an image", () => {
    expect(imageKindFromBytes(pad(bytes("<svg xmlns")))).toBeNull();
    expect(imageKindFromBytes(pad(bytes([0, 0, 0, 0x1c], "ftypavif")))).toBeNull();
    expect(imageKindFromBytes(pad(bytes("<!doctype html>")))).toBeNull();
  });
});

describe("bytesMatchExtension", () => {
  it("accepts genuine files", () => {
    expect(bytesMatchExtension("pdf", pad(bytes("%PDF-1.7")))).toBe(true);
    expect(bytesMatchExtension("docx", pad(bytes([0x50, 0x4b, 0x03, 0x04])))).toBe(true);
    expect(bytesMatchExtension("HEIC", pad(bytes([0, 0, 0, 0x18], "ftypheic")))).toBe(true);
    expect(bytesMatchExtension("dxf", pad(bytes("  0\r\nSECTION\r\n")))).toBe(true);
    expect(bytesMatchExtension("dwg", pad(bytes("AC1032")))).toBe(true);
  });
  it("rejects a renamed executable or page", () => {
    expect(bytesMatchExtension("pdf", pad(bytes("MZ", [0x90, 0])))).toBe(false);
    expect(bytesMatchExtension("jpg", pad(bytes("<html>")))).toBe(false);
    expect(bytesMatchExtension("dxf", pad(bytes([0x7f], "ELF", [2, 1, 1, 0])))).toBe(false);
    expect(bytesMatchExtension("exe", pad(bytes("MZ")))).toBe(false);
  });
});
