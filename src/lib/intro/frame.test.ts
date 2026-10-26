import { describe, it, expect } from "vitest";
import { introFrame, SKIP_AT } from "./frame";

const at = (time: number, includeVideoAct = true) => introFrame({ time, includeVideoAct });

describe("introFrame", () => {
  it("au départ, le mot et la grille sont là, rien d'autre", () => {
    const f = at(0);
    expect(f.wordOpacity).toBe(1);
    expect(f.gridOpacity).toBeCloseTo(0.5, 5);
    expect(f.videoOpacity).toBe(0);
    // Le calque n'est pas encore posé : il arrive en fondu (voir plus bas).
    expect(f.overlayOpacity).toBe(0);
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

  // Pendant l'attente, la séquence n'a pas commencé (time = 0) : les crochets
  // doivent partir du début de leur spirale, pas de son milieu. La porte de
  // sortie, elle, suit le temps réel — sinon elle n'apparaîtrait jamais.
  it("la séquence reste à zéro pendant l'attente", () => {
    for (let e = 0; e <= 5; e += 0.25) {
      const f = introFrame({ time: 0, elapsed: e, includeVideoAct: true });
      expect(f.zoom).toBe(0);
      expect(f.videoOpacity).toBe(0);
      expect(f.wordOpacity).toBe(1);
    }
  });

  it("le bouton « passer » s'offre pendant l'attente et ne clignote pas", () => {
    let eteintApresAllumage = 0;
    let allume = false;
    for (let e = 0; e <= 5; e += 0.05) {
      const s = introFrame({ time: 0, elapsed: e, includeVideoAct: true }).skipShown;
      if (s) allume = true;
      else if (allume) eteintApresAllumage++;
      expect(s).toBe(e >= SKIP_AT);
    }
    expect(eteintApresAllumage).toBe(0);
  });

  // Le calque arrive par-dessus une page déjà peinte : surgir d'un coup se lit
  // comme un à-coup.
  it("le calque se pose en fondu plutôt que d'apparaître d'un coup", () => {
    const op = (e: number) => introFrame({ time: 0, elapsed: e, includeVideoAct: true }).overlayOpacity;
    expect(op(0)).toBe(0);
    expect(op(0.175)).toBeCloseTo(0.5, 2);
    expect(op(0.35)).toBe(1);
    expect(op(1)).toBe(1);
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
