import { describe, it, expect } from "vitest";
import {
  shouldPlayIntro,
  hasSeenThisTab,
  markSeenThisTab,
  INTRO_SESSION_KEY,
  type IntroGateInput,
} from "./gate";

const base: IntroGateInput = {
  enabled: true,
  queryIntro: null,
  seenThisTab: false,
  reducedMotion: false,
  webglOk: true,
};

describe("shouldPlayIntro", () => {
  it("joue sur une première visite d'onglet", () => {
    expect(shouldPlayIntro(base)).toBe(true);
  });

  it("ne joue pas si l'onglet l'a déjà vue", () => {
    expect(shouldPlayIntro({ ...base, seenThisTab: true })).toBe(false);
  });

  it("?intro=0 coupe même une première visite", () => {
    expect(shouldPlayIntro({ ...base, queryIntro: "0" })).toBe(false);
  });

  it("?intro=1 rejoue malgré le drapeau d'onglet", () => {
    expect(shouldPlayIntro({ ...base, seenThisTab: true, queryIntro: "1" })).toBe(true);
  });

  it("?intro=1 ne force rien contre reduced-motion ni sans WebGL", () => {
    expect(shouldPlayIntro({ ...base, queryIntro: "1", reducedMotion: true })).toBe(false);
    expect(shouldPlayIntro({ ...base, queryIntro: "1", webglOk: false })).toBe(false);
  });

  it("NEXT_PUBLIC_INTRO=0 coupe tout", () => {
    expect(shouldPlayIntro({ ...base, enabled: false })).toBe(false);
  });

  it("reduced-motion et absence de WebGL coupent", () => {
    expect(shouldPlayIntro({ ...base, reducedMotion: true })).toBe(false);
    expect(shouldPlayIntro({ ...base, webglOk: false })).toBe(false);
  });
});

// Navigation privée, cookies bloqués, iframe cloisonnée : le simple accès à
// sessionStorage peut jeter. La porte doit décider quand même.
describe("accès au sessionStorage", () => {
  it("hasSeenThisTab renvoie false quand sessionStorage jette", () => {
    const boom = {
      getItem() {
        throw new DOMException("denied");
      },
    } as unknown as Storage;
    expect(hasSeenThisTab(boom)).toBe(false);
  });

  it("hasSeenThisTab lit le drapeau", () => {
    const store = new Map<string, string>([[INTRO_SESSION_KEY, "1"]]);
    const fake = { getItem: (k: string) => store.get(k) ?? null } as unknown as Storage;
    expect(hasSeenThisTab(fake)).toBe(true);
  });

  it("markSeenThisTab n'explose pas quand l'écriture est refusée", () => {
    const boom = {
      setItem() {
        throw new DOMException("denied");
      },
    } as unknown as Storage;
    expect(() => markSeenThisTab(boom)).not.toThrow();
  });
});
