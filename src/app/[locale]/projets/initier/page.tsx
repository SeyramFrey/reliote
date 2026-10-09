import { Nav } from "@/components/shared/Nav";
import { Footer } from "@/components/landing/Footer";
import { ProjectWizard } from "@/components/forms/ProjectWizard";
import type { ProjectWizardAccount } from "@/components/forms/projectWizardContext";
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let account: ProjectWizardAccount = { mode: "guest" };
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single<{ role: string }>();
    account = { mode: "member", email: user.email ?? "", role: profile?.role ?? "client" };
  }

  return (
    <>
      <Nav />
      <ProjectWizard account={account} />
      <Footer />
    </>
  );
}
