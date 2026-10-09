import { describe, it, expect } from "vitest";
import { authErrorCodeFrom, isAuthErrorCode, displayAuthError, callbackFailurePath } from "./authError";

describe("authErrorCodeFrom", () => {
  it("maps known Supabase codes to translated codes", () => {
    expect(authErrorCodeFrom({ code: "same_password", message: "x" })).toBe("samePassword");
    expect(authErrorCodeFrom({ code: "weak_password", message: "x" })).toBe("weak");
    expect(authErrorCodeFrom({ code: "invalid_credentials", message: "x" })).toBe("invalid");
  });
  it("keeps the raw message for unknown codes", () => {
    expect(authErrorCodeFrom({ code: "over_request_rate_limit", message: "Too many" })).toBe("Too many");
  });
  it("every mapped code is a translated code", () => {
    for (const code of ["same_password", "weak_password", "user_already_exists", "email_not_confirmed", "invalid_credentials"]) {
      expect(isAuthErrorCode(authErrorCodeFrom({ code, message: "x" }))).toBe(true);
    }
  });
});

describe("displayAuthError", () => {
  it("keeps known codes", () => {
    expect(displayAuthError("invalid")).toBe("invalid");
    expect(displayAuthError("linkUsed")).toBe("linkUsed");
  });
  it("never echoes arbitrary text from the URL", () => {
    expect(displayAuthError("Compte suspendu, appelez le +225 07 00 00 00")).toBe("generic");
    expect(displayAuthError("New password should be different")).toBe("generic");
  });
  it("shows nothing when there is no error", () => {
    expect(displayAuthError(undefined)).toBeNull();
    expect(displayAuthError("")).toBeNull();
  });
});

describe("callbackFailurePath", () => {
  it("sends a failed recovery link back to forgot-password", () => {
    expect(callbackFailurePath("fr", "recovery")).toBe("/fr/auth/forgot?error=expired");
  });
  it("sends a failed sign-up link to sign-in, since the email may already be confirmed", () => {
    expect(callbackFailurePath("en", null)).toBe("/en/auth/login?error=linkUsed");
  });
});
