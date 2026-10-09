import { describe, it, expect } from "vitest";
import { dashboardPathFor } from "./roles";

describe("dashboardPathFor", () => {
  it("routes each role", () => {
    expect(dashboardPathFor("admin", "fr")).toBe("/fr/admin");
    expect(dashboardPathFor("architect", "en")).toBe("/en/dashboard/architecte");
    expect(dashboardPathFor("client", "fr")).toBe("/fr/dashboard/client");
    expect(dashboardPathFor(null, "fr")).toBe("/fr/dashboard/client");
  });
});
