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
  // 1) Locale routing — if intl returns a redirect/rewrite, honor it.
  const intlRes = intlMiddleware(request);
  if (intlRes && intlRes.headers.get("location")) {
    return intlRes;
  }

  // 2) Refresh Supabase session (also gives us the current user).
  const { response, user } = await updateSession(request);

  // 3) Route guards for protected sections.
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

  // 4) Merge cookies/headers from the intl response into the Supabase response.
  if (intlRes) {
    intlRes.cookies.getAll().forEach((c) => {
      response.cookies.set(c.name, c.value, c);
    });
    intlRes.headers.forEach((value, key) => {
      // Don't clobber Set-Cookie (already merged above) or content headers.
      if (key.toLowerCase().startsWith("x-") && !response.headers.has(key)) {
        response.headers.set(key, value);
      }
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|assets|.*\\..*).*)"],
};
