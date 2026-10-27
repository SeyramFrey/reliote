// Captcha Cloudflare Turnstile : règles partagées serveur / tests.
//
// Inactif tant que les deux clés ne sont pas définies (dev, avant provisioning) :
// le widget ne s'affiche pas et le serveur laisse passer.

export const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Champ que le widget ajoute au formulaire qui le contient. */
export const CAPTCHA_FIELD = "cf-turnstile-response";

type Env = { siteKey?: string; secret?: string; supabaseVerifies?: string };

export function captchaEnabled(env: Env): boolean {
  return !!env.siteKey && !!env.secret;
}

/**
 * Qui vérifie le jeton d'un formulaire d'authentification. Un jeton ne sert
 * qu'une fois : si Supabase Auth le vérifie (captcha activé côté Supabase,
 * SUPABASE_AUTH_CAPTCHA=true), l'app le lui transmet sans le consommer ;
 * sinon l'app le vérifie elle-même avant d'appeler Supabase.
 */
export function authCaptchaMode(env: Env): "off" | "supabase" | "app" {
  if (!captchaEnabled(env)) return "off";
  return env.supabaseVerifies === "true" ? "supabase" : "app";
}
