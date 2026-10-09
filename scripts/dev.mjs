#!/usr/bin/env node
// Starts `next dev` against a Supabase backend chosen at startup.
//
// The cloud project pauses after ~7 days of inactivity, which takes its API
// hostname out of DNS — every request then stalls in auth-js's retry loop.
// When that happens we point the dev server at the local Docker stack
// instead, provided it is actually up.
//
// The choice is made ONCE per process. The two stacks are signed with
// different JWT secrets, so a mid-session switch would invalidate every
// session cookie; and writes would silently split across two databases.
//
// Variables we set here land in `process.env`, which Next resolves ahead of
// `.env.local` (next/dist/docs/01-app/02-guides/environment-variables.md).
// That matters for the browser too: `NEXT_PUBLIC_*` is inlined at compile
// time from `process.env`, so client and server agree on one backend.

import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseEnvFile,
  resolveBackend,
  localOverrides,
  LOCAL_API_URL,
} from "./dev-backend.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLOUD_TIMEOUT_MS = 2000;
const LOCAL_TIMEOUT_MS = 1000;

async function readEnv(relPath) {
  try {
    return parseEnvFile(await readFile(path.join(ROOT, relPath), "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return {};
    throw err;
  }
}

/** True when the Supabase API gateway at `baseUrl` answers its health check. */
async function isUp(baseUrl, timeoutMs) {
  if (!baseUrl) return false;
  try {
    const res = await fetch(`${baseUrl}/auth/v1/health`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    return res.ok;
  } catch {
    // DNS failure (paused project), connection refused, or timeout.
    return false;
  }
}

function parseForce(argv) {
  if (argv.includes("--local")) return "local";
  if (argv.includes("--cloud")) return "cloud";
  return undefined;
}

function banner(target, reason, url) {
  const messages = {
    "cloud-reachable": "cloud joignable",
    "cloud-unreachable": "cloud injoignable (projet en pause ?)",
    "both-unreachable":
      "cloud ET stack local injoignables — démarrage sur le cloud, les requêtes vont échouer",
    forced: "forcé en ligne de commande",
  };
  const label = target === "local" ? "LOCAL" : "CLOUD";
  console.log(`\n▲ Supabase: ${label} — ${messages[reason]}\n  ${url}\n`);
}

const forwarded = process.argv.slice(2).filter((a) => a !== "--local" && a !== "--cloud");
const force = parseForce(process.argv.slice(2));

const appEnv = await readEnv(".env.local");
const localEnv = await readEnv("supabase/.env");
const cloudUrl = appEnv.NEXT_PUBLIC_SUPABASE_URL;

// Skip the probes entirely when the target is forced — no reason to wait on a
// backend whose answer cannot change the outcome.
const [cloudUp, localUp] = force
  ? [false, false]
  : await Promise.all([
      isUp(cloudUrl, CLOUD_TIMEOUT_MS),
      isUp(LOCAL_API_URL, LOCAL_TIMEOUT_MS),
    ]);

const { target, reason } = resolveBackend({ cloudUp, localUp, force });

const childEnv = { ...process.env };
let activeUrl = cloudUrl ?? "(NEXT_PUBLIC_SUPABASE_URL absent de .env.local)";

if (target === "local") {
  let overrides;
  try {
    overrides = localOverrides(localEnv);
  } catch (err) {
    console.error(`\n✖ ${err.message}\n`);
    process.exit(1);
  }
  Object.assign(childEnv, overrides);
  activeUrl = overrides.NEXT_PUBLIC_SUPABASE_URL;
}

banner(target, reason, activeUrl);

const child = spawn(
  process.execPath,
  [path.join(ROOT, "node_modules", "next", "dist", "bin", "next"), "dev", ...forwarded],
  { stdio: "inherit", env: childEnv, cwd: ROOT }
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code, signal) => {
  process.exit(signal ? 1 : (code ?? 0));
});
