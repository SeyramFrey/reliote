import { describe, it, expect } from "vitest";
import { parseRecoveryHash } from "./recoveryHash";

describe("parseRecoveryHash", () => {
  it("reads the session from a recovery or invite link", () => {
    expect(parseRecoveryHash("#access_token=a.b.c&expires_in=3600&refresh_token=r1&token_type=bearer&type=recovery")).toEqual({
      kind: "session",
      accessToken: "a.b.c",
      refreshToken: "r1",
    });
    expect(parseRecoveryHash("#access_token=x&refresh_token=y&type=invite")).toMatchObject({ kind: "session" });
  });

  it("reports an expired or already used link", () => {
    expect(parseRecoveryHash("#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid")).toEqual({
      kind: "error",
    });
  });

  it("ignores ordinary anchors and other link types", () => {
    expect(parseRecoveryHash("")).toBeNull();
    expect(parseRecoveryHash("#methode")).toBeNull();
    expect(parseRecoveryHash("#access_token=x&refresh_token=y&type=magiclink")).toBeNull();
  });

  it("treats a recovery link without tokens as expired", () => {
    expect(parseRecoveryHash("#type=recovery")).toEqual({ kind: "error" });
  });
});
