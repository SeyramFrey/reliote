import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Nav } from "@/components/shared/Nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const locale = await getLocale();
  if (!user) redirect(`/${locale}/auth/login?next=/${locale}/dashboard/client`);
  return (
    <>
      <Nav />
      <main className="pt-24">{children}</main>
    </>
  );
}
