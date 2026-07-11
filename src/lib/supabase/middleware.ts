import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

// Mutates `response.cookies` with any session-refresh cookies Supabase sets.
// Pass the response produced by next-intl's middleware so its URL rewrite and
// `x-next-intl-locale` request-header override are preserved.
export async function updateSession(
  request: NextRequest,
  response: NextResponse
) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(toSet) {
          toSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user, supabase };
}
