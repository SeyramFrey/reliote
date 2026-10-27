import { ArchitectWizard } from "@/components/forms/ArchitectWizard";
import { createClient } from "@/lib/supabase/server";
import { getPublishedLegalSlugs } from "@/lib/legal/published";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { Nav } from "@/components/shared/Nav";
import { Footer } from "@/components/landing/Footer";
import { pageMetadata } from "@/lib/seo/metadata";
import { dashboardPathFor } from "@/lib/auth/roles";
import { safeLocale } from "@/lib/auth/safeRedirect";
import { signOutToRegister } from "./actions";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return pageMetadata({ locale: (await params).locale, page: "join" });
}

type Profile = { role: string | null; first_name: string | null; last_name: string | null };

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const locale = safeLocale(await getLocale());
  if (!user) redirect(`/${locale}/auth/register?role=architect`);

  const { data: profile } = (await supabase
    .from("profiles")
    .select("role, first_name, last_name")
    .eq("id", user.id)
    .single()) as { data: Profile | null };

  // Un e-mail = un rôle : seul un compte architecte peut déposer un dossier
  // (submitArchitect le refuse sinon). On le dit avant le formulaire, pas après.
  if (profile?.role !== "architect") {
    return <WrongAccount locale={locale} role={profile?.role ?? null} />;
  }

  // Dossier déjà déposé : un seul par compte, on renvoie vers l'espace architecte.
  const { data: existing } = await supabase
    .from("architect_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) redirect(dashboardPathFor("architect", locale));

  // Full-page layout — no Nav/Footer chrome (the wizard owns the viewport via its sidebar).
  return (
    <ArchitectWizard
      userId={user.id}
      defaultEmail={user.email ?? ""}
      defaultFirstName={profile?.first_name ?? ""}
      defaultLastName={profile?.last_name ?? ""}
      legalSlugs={await getPublishedLegalSlugs()}
    />
  );
}

async function WrongAccount({ locale, role }: { locale: ReturnType<typeof safeLocale>; role: string | null }) {
  const t = await getTranslations("wizardArchitect.wrongRole");
  return (
    <>
      <Nav />
      <section className="page-edge py-32 max-w-[640px] mx-auto">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="font-light text-[clamp(40px,5vw,72px)] leading-[1.05] mt-6">{t("title")}</h1>
        <p className="text-concrete-1 mt-6">{role === "admin" ? t("bodyAdmin") : t("bodyClient")}</p>
        <div className="mt-10 flex flex-wrap items-center gap-6">
          <form action={signOutToRegister.bind(null, locale)}>
            <button className="inline-flex items-center gap-2 px-5 py-3 bg-green text-paper text-sm">
              {t("signOut")}
              <span className="inline-block w-[9px] h-[9px] border-r border-t border-current rotate-45" />
            </button>
          </form>
          <Link
            href={dashboardPathFor(role, locale)}
            className="text-sm underline underline-offset-4 text-concrete-1 hover:text-ink"
          >
            {t("back")}
          </Link>
        </div>
      </section>
      <Footer />
    </>
  );
}
