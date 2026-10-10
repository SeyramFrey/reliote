import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { locales, defaultLocale } from "@/lib/i18n/config";
import { updateSession } from "@/lib/supabase/middleware";
import { safeLocale } from "@/lib/auth/safeRedirect";
import { dashboardPathFor } from "@/lib/auth/roles";

const intlMiddleware = createIntlMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: "always",
  // Les balises hreflang sont posées par page (lib/seo) ; l'en-tête Link du
  // middleware en déclarerait d'autres (x-default « / », pages privées).
  alternateLinks: false,
});

// Espace protégé → rôle attendu (null = tout utilisateur connecté, renvoyé
// vers son propre espace).
const PROTECTED: { pattern: RegExp; role: "admin" | "architect" | "client" | null }[] = [
  { pattern: /^\/(fr|en)\/admin(?:\/|$)/, role: "admin" },
  { pattern: /^\/(fr|en)\/dashboard\/architecte(?:\/|$)/, role: "architect" },
  { pattern: /^\/(fr|en)\/dashboard\/client(?:\/|$)/, role: "client" },
  { pattern: /^\/(fr|en)\/dashboard\/?$/, role: null },
];

export async function proxy(request: NextRequest) {
  // 1) Locale routing. The returned response carries next-intl's URL rewrite
  //    into the [locale] segment AND the `x-next-intl-locale` request-header
  //    override that `getRequestConfig` reads. We must return THIS response
  //    so those internal headers reach the RSC layer — anything else (e.g. a
  //    fresh `NextResponse.next({ request })`) drops them and falls back to
  //    `defaultLocale`.
  const response = intlMiddleware(request);

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

  return response;
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|assets|.*\\..*).*)"],
};
