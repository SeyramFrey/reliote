import "server-only";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";

// Limitation de débit des formulaires publics (compteur à fenêtre fixe en base,
// migration 0023). En cas de panne de la base on laisse passer : mieux vaut un
// formulaire sans frein quelques minutes qu'un site où plus personne ne se
// connecte.

/** true si l'appel est accepté, false si `key` a dépassé `max` appels sur la fenêtre. */
export async function rateLimit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  const service = createServiceClient();
  // Ménage des fenêtres échues, environ un appel sur cent : pas de tâche planifiée à tenir.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (Math.random() < 0.01) void (service.rpc as any)("rate_limit_prune");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (service.rpc as any)("rate_limit_hit", {
    p_key: key,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("[rate-limit] compteur indisponible :", error.message);
    return true;
  }
  return data !== false;
}

/** Toutes les limites doivent accepter ; chacune compte l'appel. */
export async function rateLimitAll(limits: [key: string, max: number, windowSeconds: number][]): Promise<boolean> {
  const results = await Promise.all(limits.map(([k, m, w]) => rateLimit(k, m, w)));
  return results.every(Boolean);
}

/**
 * Adresse IP du visiteur. Vercel et Caddy (sans proxy de confiance déclaré)
 * réécrivent X-Forwarded-For : le premier élément est l'IP vue par le proxy.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || "unknown";
}
