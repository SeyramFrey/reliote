import { describe, it, expect } from "vitest";
import { mfaStep, mfaRequired, hasVerifiedFactor, mfaPath } from "./mfa";

const verified = [{ status: "verified", factor_type: "totp" }];
const pending = [{ status: "unverified", factor_type: "totp" }];

describe("mfaRequired", () => {
  it("requires it for admins and project owners, not architects", () => {
    expect(mfaRequired("admin")).toBe(true);
    expect(mfaRequired("client")).toBe(true);
    expect(mfaRequired("architect")).toBe(false);
  });

  it("treats a missing role as a project owner", () => {
    expect(mfaRequired(null)).toBe(true);
  });
});

describe("hasVerifiedFactor", () => {
  it("ignores factors whose enrolment was never confirmed", () => {
    expect(hasVerifiedFactor(pending)).toBe(false);
    expect(hasVerifiedFactor(verified)).toBe(true);
    expect(hasVerifiedFactor(undefined)).toBe(false);
  });
});

describe("mfaStep", () => {
  it("lets an aal2 session through whatever the role", () => {
    expect(mfaStep({ role: "admin", aal: "aal2", factors: verified })).toBe("ok");
  });

  it("asks for the code when a factor exists but the session is aal1", () => {
    expect(mfaStep({ role: "client", aal: "aal1", factors: verified })).toBe("challenge");
    // Facultatif pour l'architecte, mais une fois activé il s'impose.
    expect(mfaStep({ role: "architect", aal: "aal1", factors: verified })).toBe("challenge");
  });

  it("sends required roles without a factor to enrolment", () => {
    expect(mfaStep({ role: "admin", aal: "aal1", factors: [] })).toBe("enroll");
    expect(mfaStep({ role: "client", aal: "aal1", factors: pending })).toBe("enroll");
  });

  it("lets an architect without a factor through", () => {
    expect(mfaStep({ role: "architect", aal: "aal1", factors: [] })).toBe("ok");
  });
});

describe("mfaPath", () => {
  it("keeps the destination", () => {
    expect(mfaPath("challenge", "fr", "/fr/admin")).toBe("/fr/auth/2fa?next=%2Ffr%2Fadmin");
    expect(mfaPath("enroll", "en", "/en/dashboard/client")).toBe(
      "/en/compte/securite?next=%2Fen%2Fdashboard%2Fclient",
    );
  });
});
