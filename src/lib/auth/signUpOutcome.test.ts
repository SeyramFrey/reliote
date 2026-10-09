import { describe, it, expect } from "vitest";
import { signUpOutcome } from "./signUpOutcome";

const user = (identities: unknown[] | null = [{}]) => ({ id: "u1", identities });

describe("signUpOutcome", () => {
  it("signed in when a session comes back", () => {
    expect(signUpOutcome({ data: { user: user(), session: {} }, error: null })).toEqual({
      kind: "signed_in",
      userId: "u1",
    });
  });
  it("needs confirmation when no session", () => {
    expect(signUpOutcome({ data: { user: user(), session: null }, error: null })).toEqual({
      kind: "needs_confirmation",
      userId: "u1",
    });
  });
  it("already registered when identities is empty", () => {
    expect(signUpOutcome({ data: { user: user([]), session: null }, error: null })).toEqual({
      kind: "already_registered",
    });
  });
  it("already registered on explicit error code", () => {
    expect(
      signUpOutcome({
        data: { user: null, session: null },
        error: { message: "x", code: "user_already_exists" },
      }),
    ).toEqual({ kind: "already_registered" });
  });
  it("passes other errors through", () => {
    expect(
      signUpOutcome({ data: { user: null, session: null }, error: { message: "weak password" } }),
    ).toEqual({ kind: "error", message: "weak password" });
  });
});
