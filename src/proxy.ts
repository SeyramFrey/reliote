import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale } from "@/lib/i18n/config";
import { updateSession } from "@/lib/supabase/middleware";
import { safeLocale } from "@/lib/auth/safeRedirect";
import { dashboardPathFor } from "@/lib/auth/roles";
import { cspEnv, pageCsp } from "@/lib/security/csp";
import { mfaPath, mfaStep } from "@/lib/auth/mfa";

const intlMiddleware = createIntlMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: "always",
  // Les balises hreflang sont posées par page (lib/seo) ; l'en-tête Link du
  // middleware en déclarerait d'autres (x-default « / », pages privées).
  alternateLinks: false,
});

// Espace protégé → rôle attendu (null = tout utilisateur connecté, renvoyé
// vers son propre espace ; "any" = tout utilisateur connecté, sur place).
const PROTECTED: { pattern: RegExp; role: "admin" | "architect" | "client" | null | "any" }[] = [
  { pattern: /^\/(fr|en)\/admin(?:\/|$)/, role: "admin" },
  { pattern: /^\/(fr|en)\/dashboard\/architecte(?:\/|$)/, role: "architect" },
  { pattern: /^\/(fr|en)\/dashboard\/client(?:\/|$)/, role: "client" },
  { pattern: /^\/(fr|en)\/dashboard\/?$/, role: null },
  // Réglages de la double authentification : avant elle, par définition.
  { pattern: /^\/(fr|en)\/compte\/securite(?:\/|$)/, role: "any" },
];

export async function proxy(request: NextRequest) {
  // 0) CSP à nonce : un nonce neuf par requête, posé dans l'en-tête de
  //    REQUÊTE (Next y lit le nonce pour l'apposer à ses scripts ; next-intl
  //    recopie les en-têtes de la requête qu'on lui passe) et dans la réponse.
  const nonce = btoa(crypto.randomUUID());
  const csp = pageCsp(nonce, cspEnv());
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  // 1) Locale routing. The returned response carries next-intl's URL rewrite
  //    into the [locale] segment AND the `x-next-intl-locale` request-header
  //    override that `getRequestConfig` reads. We must return THIS response
  //    so those internal headers reach the RSC layer — anything else (e.g. a
  //    fresh `NextResponse.next({ request })`) drops them and falls back to
  //    `defaultLocale`.
  const response = intlMiddleware(new NextRequest(request, { headers: requestHeaders }));
  response.headers.set("Content-Security-Policy", csp);

  // 2) Locale redirect (e.g. `/` → `/fr`) — return as-is.
  if (response.headers.get("location")) {
    return response;
  }

  // 3) Refresh the Supabase session, mutating the intl response's cookies.
  const { user, supabase } = await updateSession(request, response);

  // 4) Route guards. Pages and server actions re-check on their own; this is
  //    the first line, so a wrong role never renders another role's space.
  const pathname = request.nextUrl.pathname;
  const guard = PROTECTED.find((g) => g.pattern.test(pathname));
  if (!guard) return response;

  const locale = safeLocale(pathname.split("/")[1]);
  if (!user) {
    return NextResponse.redirect(
      new URL(`/${locale}/auth/login?next=${encodeURIComponent(pathname)}`, request.url),
    );
  }
  if (guard.role === "any") return response;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();
  // Sans profil lisible, on traite l'utilisateur comme un porteur — même
  // défaut que dashboardPathFor, sinon /dashboard/client se redirigerait sur
  // lui-même.
  const role = profile?.role === "admin" || profile?.role === "architect" ? profile.role : "client";
  if (guard.role === null || role !== guard.role) {
    return NextResponse.redirect(new URL(dashboardPathFor(role, locale), request.url));
  }

  // 5) Double authentification : l'espace ne s'ouvre qu'une fois l'étape
  //    franchie (facteurs lus sur l'utilisateur validé par getUser()).
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const step = mfaStep({ role, aal: aal?.currentLevel, factors: user.factors });
  if (step !== "ok") {
    return NextResponse.redirect(new URL(mfaPath(step, locale, pathname + request.nextUrl.search), request.url));
  }

  return response;
}

export const config = {
  // apple-icon : route d'image générée, sans extension — à exclure sinon
  // next-intl la redirige vers /fr/apple-icon (404).
  matcher: ["/((?!_next|api|apple-icon|assets|.*\\..*).*)"],
};
