import { describe, it, expect } from "vitest";
import { sharedValues } from "./coverage";

describe("sharedValues", () => {
  it("keeps only values held by at least k architects, sorted", () => {
    const perArchitect = [["Abidjan"], ["Abidjan"], ["Abidjan"], ["Dakar"], ["Dakar"]];
    expect(sharedValues(perArchitect, 3)).toEqual(["Abidjan"]);
    expect(sharedValues(perArchitect, 2)).toEqual(["Abidjan", "Dakar"]);
  });

  it("counts an architect once per value, even if listed twice", () => {
    expect(sharedValues([["Résidentiel", "Résidentiel"], ["Hospitalité"]], 2)).toEqual([]);
  });

  it("shows nothing for a lone architect (their row would be identifiable)", () => {
    expect(sharedValues([["Bamako", "DPLG", "Résidentiel"]], 3)).toEqual([]);
  });

  it("ignores empty values", () => {
    expect(sharedValues([[""], [""], [""]], 3)).toEqual([]);
  });
});
