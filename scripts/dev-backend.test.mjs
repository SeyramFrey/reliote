import { describe, it, expect } from "vitest";
import {
  parseEnvFile,
  resolveBackend,
  localOverrides,
  LOCAL_API_URL,
} from "./dev-backend.mjs";

describe("parseEnvFile", () => {
  it("reads KEY=value pairs", () => {
    expect(parseEnvFile("A=1\nB=two\n")).toEqual({ A: "1", B: "two" });
  });

  it("ignores comments and blank lines", () => {
    expect(parseEnvFile("# note\n\nA=1\n  \n# A=2\n")).toEqual({ A: "1" });
  });

  it("keeps '=' appearing inside the value", () => {
    // JWTs are base64 and routinely end with padding.
    expect(parseEnvFile("KEY=eyJhbG==\n")).toEqual({ KEY: "eyJhbG==" });
  });

  it("strips surrounding quotes and CRLF carriage returns", () => {
    expect(parseEnvFile('A="quoted"\r\nB=bare\r\n')).toEqual({
      A: "quoted",
      B: "bare",
    });
  });

  it("returns an empty object for empty input", () => {
    expect(parseEnvFile("")).toEqual({});
  });
});

describe("resolveBackend", () => {
  it("stays on cloud when the cloud answers", () => {
    expect(resolveBackend({ cloudUp: true, localUp: true })).toEqual({
      target: "cloud",
      reason: "cloud-reachable",
    });
  });

  it("falls back to local when the cloud is unreachable", () => {
    expect(resolveBackend({ cloudUp: false, localUp: true })).toEqual({
      target: "local",
      reason: "cloud-unreachable",
    });
  });

  it("stays on cloud when neither backend answers", () => {
    // Falling back to a dead local stack would swap a known failure for a
    // confusing one. Keep the familiar error.
    expect(resolveBackend({ cloudUp: false, localUp: false })).toEqual({
      target: "cloud",
      reason: "both-unreachable",
    });
  });

  it("honours a forced target without consulting the probes", () => {
    expect(
      resolveBackend({ cloudUp: true, localUp: false, force: "local" })
    ).toEqual({ target: "local", reason: "forced" });
    expect(
      resolveBackend({ cloudUp: false, localUp: true, force: "cloud" })
    ).toEqual({ target: "cloud", reason: "forced" });
  });
});

describe("localOverrides", () => {
  const env = { ANON_KEY: "anon", SERVICE_ROLE_KEY: "service" };

  it("maps supabase/.env names onto the app's variable names", () => {
    expect(localOverrides(env)).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: LOCAL_API_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service",
    });
  });

  it("honours KONG_HTTP_PORT so a remapped gateway still resolves", () => {
    expect(
      localOverrides({ ...env, KONG_HTTP_PORT: "54331" })
    ).toMatchObject({ NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54331" });
  });

  it("names the missing key when supabase/.env is incomplete", () => {
    expect(() => localOverrides({ ANON_KEY: "anon" })).toThrow(
      /SERVICE_ROLE_KEY/
    );
    expect(() => localOverrides({ SERVICE_ROLE_KEY: "service" })).toThrow(
      /ANON_KEY/
    );
  });
});
