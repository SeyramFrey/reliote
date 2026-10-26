import { describe, it, expect } from "vitest";
import { orbitSlots, type OrbitLogo } from "./PartnersOrbit";

const logo = (id: string): OrbitLogo => ({ id, name: id, logo_url: `/${id}.png`, url: null });

describe("orbitSlots", () => {
  it("keeps every empty pastille next to the logos", () => {
    const slots = orbitSlots([logo("a")], 14);
    expect(slots).toHaveLength(15);
    expect(slots.filter((s) => s.logo)).toHaveLength(1);
  });

  it("spreads logos evenly around the ring", () => {
    const slots = orbitSlots([logo("a"), logo("b"), logo("c")], 9);
    expect(slots.map((s, i) => (s.logo ? i : -1)).filter((i) => i >= 0)).toEqual([0, 4, 8]);
  });

  it("gives every slot a unique key", () => {
    const keys = orbitSlots([logo("a"), logo("b")], 5).map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("handles no logos and no placeholders", () => {
    expect(orbitSlots([], 3).every((s) => s.logo === null)).toBe(true);
    expect(orbitSlots([], 0)).toEqual([]);
    expect(orbitSlots([logo("a")], 0).map((s) => s.logo?.id)).toEqual(["a"]);
  });
});
