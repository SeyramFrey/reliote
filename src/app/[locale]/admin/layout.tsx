import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Nav } from "@/components/shared/Nav";
import { AdminShell } from "@/components/admin/AdminShell";
import { pageMetadata } from "@/lib/seo/metadata";
import { unreadTotal } from "@/lib/messaging/data";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return pageMetadata({ locale: (await params).locale, page: "admin" });
}

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
  const unread = await unreadTotal({ userId: user.id, role: "admin", architectId: null });
  return (
    <>
      <Nav />
      <main className="pt-24">
        <AdminShell unread={unread}>{children}</AdminShell>
      </main>
    </>
  );
}
