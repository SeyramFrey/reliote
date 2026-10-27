import "server-only";
import { authCaptchaMode, captchaEnabled, CAPTCHA_FIELD, TURNSTILE_VERIFY_URL } from "./captcha";
import { clientIp } from "./rateLimit";

const env = () => ({
  siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  secret: process.env.TURNSTILE_SECRET_KEY,
  supabaseVerifies: process.env.SUPABASE_AUTH_CAPTCHA,
});

export function captchaToken(formData: FormData): string | null {
  const v = formData.get(CAPTCHA_FIELD);
  return typeof v === "string" && v ? v : null;
}

/**
 * Vérifie un jeton Turnstile auprès de Cloudflare. Sans jeton : refus. Si
 * Cloudflare ne répond pas, on laisse passer (journalisé) — même arbitrage que
 * la limitation de débit : une panne tierce ne doit pas fermer le site.
 */
export async function verifyCaptcha(token: string | null | undefined): Promise<boolean> {
  const e = env();
  if (!captchaEnabled(e)) return true;
  if (!token) return false;
  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: e.secret, response: token, remoteip: await clientIp() }),
      signal: AbortSignal.timeout(5000),
    });
    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (!data.success) console.warn("[captcha] refusé :", data["error-codes"]?.join(", "));
    return data.success === true;
  } catch (err) {
    console.error("[captcha] vérification indisponible :", err);
    return true;
  }
}

/**
 * Formulaires d'authentification. `ok` : on peut appeler Supabase ;
 * `captchaToken` : à passer dans les options de l'appel Supabase quand c'est
 * Supabase Auth qui vérifie (voir authCaptchaMode).
 */
export async function authCaptcha(token: string | null | undefined): Promise<{ ok: boolean; captchaToken?: string }> {
  switch (authCaptchaMode(env())) {
    case "off":
      return { ok: true };
    case "supabase":
      return { ok: !!token, captchaToken: token ?? undefined };
    case "app":
      return { ok: await verifyCaptcha(token) };
  }
}
