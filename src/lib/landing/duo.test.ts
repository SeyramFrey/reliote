import { describe, it, expect } from "vitest";
import { duoReduce, duoPose, DUO_IDLE, type DuoState } from "./duo";

describe("duoReduce", () => {
  it("survoler une carte depuis le repos l'active et lui donne le premier plan", () => {
    expect(duoReduce(DUO_IDLE, { type: "enter", index: 0 })).toEqual({
      hovered: 0,
      zOwner: 0,
      pending: null,
    });
  });

  it("passer directement à l'autre carte repasse par le repos et met la suivante en attente", () => {
    const s: DuoState = { hovered: 0, zOwner: 0, pending: null };
    expect(duoReduce(s, { type: "enter", index: 1 })).toEqual({
      hovered: null,
      zOwner: 0,
      pending: 1,
    });
  });

  it("à l'échéance de l'attente, la carte en attente s'active", () => {
    const s: DuoState = { hovered: null, zOwner: 0, pending: 1 };
    expect(duoReduce(s, { type: "settle" })).toEqual({ hovered: 1, zOwner: 1, pending: null });
  });

  it("pendant l'attente, les autres survols sont ignorés", () => {
    const s: DuoState = { hovered: null, zOwner: 0, pending: 1 };
    expect(duoReduce(s, { type: "enter", index: 0 })).toBe(s);
  });

  it("resurvoler la carte active ne change rien", () => {
    const s: DuoState = { hovered: 1, zOwner: 1, pending: null };
    expect(duoReduce(s, { type: "enter", index: 1 })).toBe(s);
  });

  it("quitter annule l'attente mais garde le premier plan, le temps du retour", () => {
    const s: DuoState = { hovered: null, zOwner: 0, pending: 1 };
    expect(duoReduce(s, { type: "leave" })).toEqual({ hovered: null, zOwner: 0, pending: null });
  });

  it("une échéance sans attente ne fait rien", () => {
    const s: DuoState = { hovered: 0, zOwner: 0, pending: null };
    expect(duoReduce(s, { type: "settle" })).toBe(s);
  });
});

describe("duoPose", () => {
  it("au repos, les deux cartes sont à plat", () => {
    expect(duoPose(0, null)).toBe("rest");
    expect(duoPose(1, null)).toBe("rest");
  });

  it("la carte survolée passe devant, l'autre recule", () => {
    expect(duoPose(0, 0)).toBe("front");
    expect(duoPose(1, 0)).toBe("back");
    expect(duoPose(1, 1)).toBe("front");
    expect(duoPose(0, 1)).toBe("back");
  });
});
