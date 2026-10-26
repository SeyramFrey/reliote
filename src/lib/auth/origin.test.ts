import { describe, it, expect } from "vitest";
import { resolveOrigin } from "./resolveOrigin";

describe("resolveOrigin", () => {
  it("prefers SITE_URL, without trailing slash", () => {
    expect(resolveOrigin({ siteUrl: "https://reliote.com/", host: "evil.test" })).toBe("https://reliote.com");
  });
  it("never trusts the Host header in Vercel production", () => {
    expect(
      resolveOrigin({ vercelEnv: "production", vercelProdUrl: "reliote.vercel.app", host: "evil.test", proto: "https" }),
    ).toBe("https://reliote.vercel.app");
  });
  it("uses the deployment URL on Vercel previews, not the Host header", () => {
    expect(
      resolveOrigin({ vercelEnv: "preview", vercelUrl: "reliote-abc.vercel.app", host: "evil.test", proto: "https" }),
    ).toBe("https://reliote-abc.vercel.app");
  });
  it("refuses to guess in production outside Vercel", () => {
    expect(() => resolveOrigin({ production: true, host: "evil.test" })).toThrow(/SITE_URL/);
  });
  it("uses the request host in local dev only", () => {
    expect(resolveOrigin({ host: "localhost:3000" })).toBe("http://localhost:3000");
  });
});
