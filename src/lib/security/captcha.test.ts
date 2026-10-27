import { describe, it, expect } from "vitest";
import { authCaptchaMode, captchaEnabled } from "./captcha";

describe("captchaEnabled", () => {
  it("needs both keys", () => {
    expect(captchaEnabled({})).toBe(false);
    expect(captchaEnabled({ siteKey: "s" })).toBe(false);
    expect(captchaEnabled({ secret: "x" })).toBe(false);
    expect(captchaEnabled({ siteKey: "s", secret: "x" })).toBe(true);
  });
});

describe("authCaptchaMode", () => {
  it("is off without keys, even if Supabase is said to verify", () => {
    expect(authCaptchaMode({ supabaseVerifies: "true" })).toBe("off");
  });

  it("lets Supabase Auth verify the token once it is switched on there", () => {
    expect(authCaptchaMode({ siteKey: "s", secret: "x", supabaseVerifies: "true" })).toBe("supabase");
  });

  it("verifies in the app otherwise", () => {
    expect(authCaptchaMode({ siteKey: "s", secret: "x" })).toBe("app");
    expect(authCaptchaMode({ siteKey: "s", secret: "x", supabaseVerifies: "1" })).toBe("app");
  });
});
