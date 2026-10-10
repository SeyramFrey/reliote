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

describe("signUpOutcome — existing unconfirmed account", () => {
  const now = new Date("2026-10-10T12:00:00Z");
  it("treats a user created long before this sign-up as already registered", () => {
    const res = { data: { user: { id: "u1", identities: [{}], created_at: "2026-10-01T09:00:00Z" }, session: null }, error: null };
    expect(signUpOutcome(res, now)).toEqual({ kind: "already_registered" });
  });
  it("keeps a user created just now as needing confirmation", () => {
    const res = { data: { user: { id: "u1", identities: [{}], created_at: "2026-10-10T11:59:58Z" }, session: null }, error: null };
    expect(signUpOutcome(res, now)).toEqual({ kind: "needs_confirmation", userId: "u1" });
  });
});
