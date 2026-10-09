import { describe, it, expect } from "vitest";
import fr from "./fr.json";
import en from "./en.json";

function keys(o: unknown, p = ""): string[] {
  if (o && typeof o === "object" && !Array.isArray(o)) {
    return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) =>
      keys(v, p ? `${p}.${k}` : k),
    );
  }
  return [p];
}

describe("messages", () => {
  it("fr and en expose the same keys", () => {
    expect(keys(en).sort()).toEqual(keys(fr).sort());
  });
});
