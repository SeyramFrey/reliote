import { describe, it, expect } from "vitest";
import { introLayout, BASE_CAMERA_Z } from "./layout";

describe("introLayout", () => {
  it("le 16:9 est la référence : caméra au repos, lockup en ligne", () => {
    const l = introLayout(16 / 9);
    expect(l.cameraZ).toBe(BASE_CAMERA_Z);
    expect(l.lockup).toBe("ligne");
  });

  it("plus large que 16:9 : la hauteur reste la contrainte, caméra inchangée", () => {
    expect(introLayout(2.4).cameraZ).toBe(BASE_CAMERA_Z);
  });

  it("plus étroit : la caméra recule proportionnellement", () => {
    expect(introLayout(16 / 9 / 2).cameraZ).toBeCloseTo(BASE_CAMERA_Z * 2, 3);
  });

  it("le portrait empile le lockup", () => {
    expect(introLayout(0.46).lockup).toBe("empile");
    expect(introLayout(1.2).lockup).toBe("ligne");
  });

  it("le recul est plafonné pour que le logo reste lisible", () => {
    expect(introLayout(0.2).cameraZ).toBeLessThanOrEqual(1800);
  });

  // Une rotation de téléphone peut faire passer un ratio transitoire à 0.
  it("un ratio absurde ne produit jamais NaN ni zéro", () => {
    for (const a of [0, -1, NaN, Infinity]) {
      const l = introLayout(a);
      expect(Number.isFinite(l.cameraZ)).toBe(true);
      expect(l.cameraZ).toBeGreaterThan(0);
    }
  });
});
