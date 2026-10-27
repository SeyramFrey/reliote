// Content-Security-Policy du site.
//
// Deux couches, appliquées ensemble (le navigateur exige que les deux passent) :
// - `baseCsp()` dans next.config.ts, sur toutes les réponses (pages, API,
//   fichiers) : origines autorisées, plugins, <base>, formulaires, cadres ;
//   scripts inline tolérés, faute de nonce hors du proxy.
// - `pageCsp(nonce)` posée par le proxy sur chaque page : seuls les scripts
//   portant le nonce de la requête s'exécutent ('strict-dynamic' laisse passer
//   les morceaux qu'ils chargent). Next ajoute le nonce à ses propres scripts
//   quand il le trouve dans l'en-tête de requête. Toutes les pages sont déjà
//   rendues à la demande : le nonce ne coûte aucun rendu statique.
//
// Styles : 'unsafe-inline' reste nécessaire (attributs style de React, de
// framer-motion et de CKEditor) ; ils n'exécutent pas de code.

type Env = { supabaseUrl?: string; dev?: boolean };

function supabaseOrigins(supabaseUrl?: string): { http: string; ws: string } {
  try {
    const url = new URL(supabaseUrl ?? "");
    return { http: url.origin, ws: `${url.protocol === "https:" ? "wss:" : "ws:"}//${url.host}` };
  } catch {
    return { http: "https://*.supabase.co", ws: "wss://*.supabase.co" };
  }
}

// Captcha Turnstile : script, iframe du défi et appels.
const TURNSTILE = "https://challenges.cloudflare.com";

function directives(scriptSrc: string, { supabaseUrl, dev }: Env): string {
  const sb = supabaseOrigins(supabaseUrl);
  return [
    "default-src 'self'",
    `script-src ${scriptSrc} ${TURNSTILE}${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://use.typekit.net https://p.typekit.net",
    // https: — logos et visuels saisis par l'admin peuvent être hébergés ailleurs.
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://use.typekit.net",
    `connect-src 'self' ${sb.http} ${sb.ws} ${TURNSTILE}${dev ? " ws: http://localhost:*" : ""}`,
    `media-src 'self' blob: ${sb.http}`,
    "worker-src 'self' blob:",
    `frame-src ${TURNSTILE}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "manifest-src 'self'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

export function baseCsp(env: Env): string {
  return directives("'self' 'unsafe-inline'", env);
}

export function pageCsp(nonce: string, env: Env): string {
  return directives(`'self' 'nonce-${nonce}' 'strict-dynamic'`, env);
}

export function cspEnv(): Env {
  return { supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL, dev: process.env.NODE_ENV === "development" };
}
