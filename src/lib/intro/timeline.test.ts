import { describe, it, expect } from "vitest";
import { INTRO_ACTS, INTRO_DURATION, VIDEO_DURATION, actAt, videoTimeAt } from "./timeline";

describe("minutage de la séquence d'ouverture", () => {
  it("les bornes des actes suivent la spec", () => {
    expect(INTRO_ACTS.map((a) => [a.key, a.start, a.end])).toEqual([
      ["mains", 0, 2.0],
      ["assemblage", 2.0, 3.2],
      ["eliote", 3.2, 4.4],
      ["construction", 4.4, 6.6],
      ["hero", 6.6, 8.15],
    ]);
    expect(INTRO_DURATION).toBe(8.15);
  });

  it("actAt situe un instant dans le bon acte", () => {
    expect(actAt(0)).toBe("mains");
    expect(actAt(1.99)).toBe("mains");
    expect(actAt(2.0)).toBe("assemblage");
    expect(actAt(6.6)).toBe("hero");
    expect(actAt(99)).toBe("hero");
  });

  // Épinglé sur la mesure du fichier produit par scripts/encode-intro-video.mjs :
  // sans ça, la constante dérive silencieusement de l'asset.
  it("VIDEO_DURATION correspond au fichier réellement encodé", () => {
    expect(VIDEO_DURATION).toBe(2.8);
  });

  it("la vidéo démarre à l'acte 4 et se borne à sa durée", () => {
    expect(videoTimeAt(0)).toBe(0);
    expect(videoTimeAt(4.4)).toBe(0);
    expect(videoTimeAt(5.4)).toBeCloseTo(1.0, 3);
    expect(videoTimeAt(99)).toBe(VIDEO_DURATION);
  });
});
