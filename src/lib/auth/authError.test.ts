import { describe, it, expect } from "vitest";
import { authErrorCodeFrom, isAuthErrorCode } from "./authError";

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
