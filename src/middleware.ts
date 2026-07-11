import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { locales, defaultLocale } from "@/lib/i18n/config";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: "always",
});

export async function middleware(request: NextRequest) {
  // 1) Locale routing. The returned response carries next-intl's URL rewrite
  //    into the [locale] segment AND the `x-next-intl-locale` request-header
  //    override that `getRequestConfig` reads. We must return THIS response
  //    so those internal middleware headers reach the RSC layer — anything
  //    else (e.g. a fresh `NextResponse.next({ request })`) drops them and
  //    falls back to `defaultLocale`.
  const response = intlMiddleware(request);

  // 2) Locale redirect (e.g. `/` → `/fr`) — return as-is.
  if (response.headers.get("location")) {
    return response;
  }

  // 3) Refresh the Supabase session, mutating the intl response's cookies.
  const { user } = await updateSession(request, response);

  // 4) Route guards for protected sections.
  const pathname = request.nextUrl.pathname;
  const isAdmin = /^\/(fr|en)\/admin(?:\/|$)/.test(pathname);
  const isDashClient = /^\/(fr|en)\/dashboard\/client(?:\/|$)/.test(pathname);
  const isDashArch = /^\/(fr|en)\/dashboard\/architecte(?:\/|$)/.test(pathname);

  if (!user && (isAdmin || isDashClient || isDashArch)) {
    const locale = pathname.split("/")[1] || defaultLocale;
    const redirectUrl = new URL(
      `/${locale}/auth/login?next=${encodeURIComponent(pathname)}`,
      request.url
    );
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|assets|.*\\..*).*)"],
};
