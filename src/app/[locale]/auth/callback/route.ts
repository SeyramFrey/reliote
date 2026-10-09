import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { safeLocale, safeRedirectPath } from "@/lib/auth/safeRedirect";
import { dashboardPathFor } from "@/lib/auth/roles";
import { callbackFailurePath } from "@/lib/auth/authError";

// Arrivée depuis un lien e-mail (confirmation d'inscription, mot de passe oublié).
export async function GET(request: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  const locale = safeLocale((await params).locale);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const go = (path: string) => NextResponse.redirect(new URL(path, request.url));

  const type = url.searchParams.get("type");
  if (!code) return go(callbackFailurePath(locale, type));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return go(callbackFailurePath(locale, type));

  if (type === "recovery") return go(`/${locale}/auth/reset`);

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single<{ role: string }>();
  return go(safeRedirectPath(url.searchParams.get("next"), dashboardPathFor(prof?.role, locale)));
}
