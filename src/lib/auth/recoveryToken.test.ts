import { describe, it, expect } from "vitest";
import { recoveryTokenFrom } from "./recoveryToken";

const HASH = "9132086965f0cd030ff6caec0851db4378845c380802f34293bc0ede";

describe("recoveryTokenFrom", () => {
  it("accepts a recovery token hash", () => {
    expect(recoveryTokenFrom(HASH, "recovery")).toBe(HASH);
  });

  it("refuses any other link type", () => {
    expect(recoveryTokenFrom(HASH, "signup")).toBeNull();
    expect(recoveryTokenFrom(HASH, "magiclink")).toBeNull();
    expect(recoveryTokenFrom(HASH, null)).toBeNull();
  });

  it("refuses a missing or malformed hash", () => {
    expect(recoveryTokenFrom(null, "recovery")).toBeNull();
    expect(recoveryTokenFrom("", "recovery")).toBeNull();
    expect(recoveryTokenFrom("pkce_abc", "recovery")).toBeNull();
    expect(recoveryTokenFrom(`${HASH}&x=1`, "recovery")).toBeNull();
    expect(recoveryTokenFrom("a".repeat(500), "recovery")).toBeNull();
  });
});
