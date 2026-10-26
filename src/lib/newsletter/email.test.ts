import { describe, it, expect } from "vitest";
import { nextSubscription, normalizeEmail } from "./email";

describe("normalizeEmail", () => {
  it("trims and lowercases a valid address", () => {
    expect(normalizeEmail("  Awa.K@Exemple.CI ")).toBe("awa.k@exemple.ci");
  });

  it("rejects what is not an address", () => {
    expect(normalizeEmail("")).toBeNull();
    expect(normalizeEmail("awa@")).toBeNull();
    expect(normalizeEmail("awa k@exemple.ci")).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
  });
});

describe("nextSubscription", () => {
  it("leaves an active subscriber untouched, without a new e-mail", () => {
    expect(nextSubscription("subscribed", false)).toEqual({ status: "subscribed", sendConfirmation: false });
  });

  it("subscribes a verified account owner directly", () => {
    expect(nextSubscription(null, true)).toEqual({ status: "subscribed", sendConfirmation: false });
    expect(nextSubscription("unsubscribed", true)).toEqual({ status: "subscribed", sendConfirmation: false });
  });

  it("asks anyone else to confirm, even after unsubscribing", () => {
    expect(nextSubscription(null, false)).toEqual({ status: "pending", sendConfirmation: true });
    expect(nextSubscription("pending", false)).toEqual({ status: "pending", sendConfirmation: true });
    expect(nextSubscription("unsubscribed", false)).toEqual({ status: "pending", sendConfirmation: true });
  });
});
