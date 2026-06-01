import { Nav } from "@/components/shared/Nav";
import { Footer } from "@/components/landing/Footer";
import { ArchitectWizard } from "@/components/forms/ArchitectWizard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

type Profile = { full_name: string | null };

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const locale = await getLocale();
  if (!user) redirect(`/${locale}/auth/register?role=architect`);
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single() as { data: Profile | null };
  return (
    <>
      <Nav />
      <ArchitectWizard defaultEmail={user.email ?? ""} defaultName={profile?.full_name ?? ""} />
      <Footer />
    </>
  );
}
