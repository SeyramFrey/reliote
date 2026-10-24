import { describe, it, expect } from "vitest";
import { introFrame, holdTime, HOLD_AT, SKIP_AT } from "./frame";

const at = (time: number, includeVideoAct = true) => introFrame({ time, includeVideoAct });

describe("introFrame", () => {
  it("au départ, le mot et la grille sont là, rien d'autre", () => {
    const f = at(0);
    expect(f.wordOpacity).toBe(1);
    expect(f.gridOpacity).toBeCloseTo(0.5, 5);
    expect(f.videoOpacity).toBe(0);
    expect(f.overlayOpacity).toBe(1);
    expect(f.zoom).toBe(0);
    expect(f.skipShown).toBe(false);
  });

  it("la porte de sortie apparaît à 1,2 s et disparaît quand la hero monte", () => {
    expect(at(1.19).skipShown).toBe(false);
    expect(at(1.2).skipShown).toBe(true);
    expect(at(6.0).skipShown).toBe(true);
    expect(at(6.6).skipShown).toBe(false);
  });

  it("le plan entre en fondu et le mot s'efface — il ne doit pas rester posé dessus", () => {
    expect(at(4.4).videoOpacity).toBe(0);
    expect(at(5.2).videoOpacity).toBeCloseTo(1, 5);
    expect(at(5.2).wordOpacity).toBe(0);
    expect(at(5.2).gridOpacity).toBe(0);
  });

  it("sans vidéo, l'acte 4 ne montre rien et la séquence continue", () => {
    expect(at(5.2, false).videoOpacity).toBe(0);
    expect(at(5.2, false).playVideo).toBe(false);
  });

  it("la vidéo n'est lancée qu'une fois son acte atteint", () => {
    expect(at(4.39).playVideo).toBe(false);
    expect(at(4.4).playVideo).toBe(true);
  });

  it("à la fin, la page est en place et le calque a disparu", () => {
    const f = at(8.15);
    expect(f.zoom).toBe(1);
    expect(f.overlayOpacity).toBe(0);
    expect(f.videoOpacity).toBe(0);
  });

  it("le zoom part de zéro au début de l'acte 5 et croît", () => {
    expect(at(6.6).zoom).toBe(0);
    expect(at(7.4).zoom).toBeGreaterThan(0);
    expect(at(7.4).zoom).toBeLessThan(1);
  });

  // L'attente bouclait sur [0, 2 s) : à 1,99 s les crochets étaient presque
  // verrouillés, puis repartaient d'un coup au rayon de départ. Et le bouton
  // « passer » clignotait à chaque tour — pour le visiteur sur connexion lente,
  // justement celui qui veut sortir.
  it("le temps d'attente ne revient jamais en arrière", () => {
    let last = -1;
    for (let e = 0; e <= 6; e += 0.05) {
      const t = holdTime(e);
      expect(t).toBeGreaterThanOrEqual(last);
      expect(t).toBeLessThanOrEqual(HOLD_AT);
      last = t;
    }
  });

  it("le bouton « passer » reste visible une fois apparu, même en attente longue", () => {
    expect(HOLD_AT).toBeGreaterThanOrEqual(SKIP_AT);
    for (let e = SKIP_AT; e <= 5; e += 0.05) {
      expect(introFrame({ time: holdTime(e), includeVideoAct: true }).skipShown).toBe(true);
    }
  });

  it("aucune valeur ne sort de [0,1], même hors séquence", () => {
    for (const t of [-5, 0, 3, 6, 9, 99]) {
      const f = at(t);
      for (const v of [f.wordOpacity, f.videoOpacity, f.overlayOpacity, f.zoom]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });
});
