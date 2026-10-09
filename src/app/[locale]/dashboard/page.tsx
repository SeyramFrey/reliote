import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { dashboardPathFor } from "@/lib/auth/roles";
import { safeLocale } from "@/lib/auth/safeRedirect";

// « Mon espace » : aiguille chaque rôle vers son espace.
export default async function DashboardHome() {
  const locale = safeLocale(await getLocale());
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth/login?next=/${locale}/dashboard`);
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();
  redirect(dashboardPathFor(profile?.role, locale));
}
