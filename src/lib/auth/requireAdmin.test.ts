import { vi, describe, it, expect, beforeEach } from "vitest";

const getUser = vi.fn();
const single = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser },
    from: () => ({ select: () => ({ eq: () => ({ single }) }) }),
  }),
}));

import { requireAdmin } from "./requireAdmin";

beforeEach(() => {
  getUser.mockReset();
  single.mockReset();
});

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

  it("resolves for an admin", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    single.mockResolvedValue({ data: { role: "admin" } });
    await expect(requireAdmin()).resolves.toBeUndefined();
  });
});
