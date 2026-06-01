import { Nav } from "@/components/shared/Nav";
import { Footer } from "@/components/landing/Footer";
import { ProjectWizard } from "@/components/forms/ProjectWizard";
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <>
      <Nav />
      <ProjectWizard defaultEmail={user?.email ?? ""} />
      <Footer />
    </>
  );
}
