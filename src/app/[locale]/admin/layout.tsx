import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Nav } from "@/components/shared/Nav";
import { AdminShell } from "@/components/admin/AdminShell";

type Profile = { role: string };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const locale = await getLocale();
  if (!user) redirect(`/${locale}/auth/login?next=/${locale}/admin`);
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() as { data: Profile | null };
  if (prof?.role !== "admin") notFound();
  return (
    <>
      <Nav />
      <main className="pt-24">
        <AdminShell>{children}</AdminShell>
      </main>
    </>
  );
}
