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
  it("uses the request host elsewhere (dev, previews)", () => {
    expect(resolveOrigin({ host: "localhost:3000" })).toBe("http://localhost:3000");
    expect(resolveOrigin({ vercelEnv: "preview", host: "reliote-git-x.vercel.app", proto: "https" })).toBe(
      "https://reliote-git-x.vercel.app",
    );
  });
});
