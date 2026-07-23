import { describe, it, expect } from "vitest";
import { AFRICAN_COUNTRIES, ACTIVE_COUNTRIES } from "./africa";

describe("africa countries", () => {
  it("lists the 54 sovereign African states", () => {
    expect(AFRICAN_COUNTRIES).toHaveLength(54);
  });

  it("has every country available (pan-African rollout)", () => {
    expect(AFRICAN_COUNTRIES.every((c) => c.available)).toBe(true);
    expect(ACTIVE_COUNTRIES).toHaveLength(54);
  });
});
