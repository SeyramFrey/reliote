// Pure decision logic behind `scripts/dev.mjs`. No I/O here so it stays
// testable — the probing and process spawning live in the caller.

/** Kong's default host port, per supabase/docker-compose.yml. */
export const LOCAL_API_PORT = "54321";
export const LOCAL_API_URL = `http://127.0.0.1:${LOCAL_API_PORT}`;

/**
 * Minimal `.env` reader. Deliberately not dotenv: this runs before any
 * dependency is loaded, and the files it reads are ours.
 */
export function parseEnvFile(text) {
  const out = {};
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    // Only the FIRST '=' splits — JWT values carry base64 padding.
    const value = line.slice(eq + 1).trim();
    out[key] = value.replace(/^["'](.*)["']$/, "$1");
  }
  return out;
}

/**
 * Picks the backend for this dev session. Decided once, at startup: the two
 * stacks are signed with different JWT secrets, so switching mid-session
 * would invalidate every live session cookie.
 */
export function resolveBackend({ cloudUp, localUp, force } = {}) {
  if (force === "local" || force === "cloud") {
    return { target: force, reason: "forced" };
  }
  if (cloudUp) return { target: "cloud", reason: "cloud-reachable" };
  if (localUp) return { target: "local", reason: "cloud-unreachable" };
  // Neither answers. Prefer the cloud's familiar failure over pointing the
  // app at a local stack that is equally dead.
  return { target: "cloud", reason: "both-unreachable" };
}

/**
 * Translates supabase/.env onto the variable names the app reads.
 * These land in `process.env`, which Next resolves ahead of `.env.local`
 * (see next/dist/docs/01-app/02-guides/environment-variables.md).
 */
export function localOverrides(env) {
  const missing = ["ANON_KEY", "SERVICE_ROLE_KEY"].filter((k) => !env[k]);
  if (missing.length) {
    throw new Error(
      `supabase/.env is missing ${missing.join(", ")} — run \`cp supabase/.env.example supabase/.env\``
    );
  }
  const port = env.KONG_HTTP_PORT || LOCAL_API_PORT;
  return {
    NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${port}`,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: env.ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: env.SERVICE_ROLE_KEY,
  };
}
