import { vi, describe, it, expect, beforeEach } from "vitest";

const getUser = vi.fn();
const single = vi.fn();
const getAuthenticatorAssuranceLevel = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser, mfa: { getAuthenticatorAssuranceLevel } },
    from: () => ({ select: () => ({ eq: () => ({ single }) }) }),
  }),
}));

import { requireAdmin } from "./requireAdmin";

beforeEach(() => {
  getUser.mockReset();
  single.mockReset();
  getAuthenticatorAssuranceLevel.mockReset();
});

const verified = [{ status: "verified", factor_type: "totp" }];

describe("requireAdmin", () => {
  it("throws Unauthorized when there is no session", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    await expect(requireAdmin()).rejects.toThrow("Unauthorized");
  });

  it("throws Forbidden for a non-admin", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    single.mockResolvedValue({ data: { role: "client" } });
    await expect(requireAdmin()).rejects.toThrow("Forbidden");
  });

  it("throws when the admin session has not passed two-factor authentication", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1", factors: verified } } });
    single.mockResolvedValue({ data: { role: "admin" } });
    getAuthenticatorAssuranceLevel.mockResolvedValue({ data: { currentLevel: "aal1" } });
    await expect(requireAdmin()).rejects.toThrow("MFA required");
  });

  it("throws when the admin has no second factor yet", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1", factors: [] } } });
    single.mockResolvedValue({ data: { role: "admin" } });
    getAuthenticatorAssuranceLevel.mockResolvedValue({ data: { currentLevel: "aal1" } });
    await expect(requireAdmin()).rejects.toThrow("MFA required");
  });

  it("resolves with the admin's user id", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1", factors: verified } } });
    single.mockResolvedValue({ data: { role: "admin" } });
    getAuthenticatorAssuranceLevel.mockResolvedValue({ data: { currentLevel: "aal2" } });
    await expect(requireAdmin()).resolves.toEqual({ userId: "u1" });
  });
});
