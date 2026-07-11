import { ArchitectWizard } from "@/components/forms/ArchitectWizard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

type Profile = { first_name: string | null; last_name: string | null };

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const locale = await getLocale();
  if (!user) redirect(`/${locale}/auth/register?role=architect`);

  const { data: profile } = (await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single()) as { data: Profile | null };

  // Full-page layout — no Nav/Footer chrome (the wizard owns the viewport via its sidebar).
  return (
    <ArchitectWizard
      userId={user.id}
      defaultEmail={user.email ?? ""}
      defaultFirstName={profile?.first_name ?? ""}
      defaultLastName={profile?.last_name ?? ""}
    />
  );
}
