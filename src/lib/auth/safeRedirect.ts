import { locales, defaultLocale, type Locale } from "@/lib/i18n/config";

// La locale envoyée par un formulaire sert à construire des chemins de
// redirection : "/evil.com" donnerait "//evil.com". Liste blanche stricte.
export function safeLocale(value: unknown): Locale {
  return (locales as readonly string[]).includes(String(value)) ? (value as Locale) : defaultLocale;
}

// Garde contre la redirection ouverte : `next` vient de l'URL (?next=...), donc
// de n'importe qui. On n'accepte qu'un chemin relatif au site.
//
// Refusés : "//evil.com" et "/\evil.com" (les navigateurs les lisent comme une
// URL absolue vers un autre domaine), les schémas ("https:", "javascript:"),
// et tout caractère de contrôle (un \t ou \n peut être retiré par le navigateur
// et reformer "//").
export function safeRedirectPath(next: string | null | undefined, fallback: string): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(next)) return fallback;
  return next;
}

// Retour après une action admin : uniquement un chemin interne de l'admin
// (lettres, chiffres, tirets, barres — pas de « .. » ni d'autre espace).
export function safeAdminReturn(back: string | null | undefined, fallback: string): string {
  return back && /^\/(fr|en)\/admin(\/[\w-]+)*\/?$/.test(back) ? back : fallback;
}
