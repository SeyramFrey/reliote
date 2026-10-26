import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { getLocale, getTranslations } from "next-intl/server";
import { Nav } from "@/components/shared/Nav";
import { Footer } from "@/components/landing/Footer";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return pageMetadata({ locale: (await params).locale, page: "confirmation" });
}

type Project = {
  id: string;
  user_id: string | null;
  created_at: string;
  project_type: string;
  project_location: string;
};

// Page de confirmation post-dépôt de brief.
// Avant la pivot N2/N3, cette page affichait directement les architectes matchés
// avec nom + photo — ce qui contournait toute la mécanique de révélation
// progressive. On la simplifie en page d'accusé de réception qui redirige
// vers l'espace porteur (propositions, RDV et révélation au RDV confirmé).
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("wizardClient");
  const tt = await getTranslations("projectTypes");

  const service = createServiceClient();
  const { data: project } = (await service
    .from("client_projects")
    .select("id, user_id, created_at, project_type, project_location")
    .eq("id", id)
    .single()) as { data: Project | null };
  if (!project) notFound();

  // La page est lue avec la clé service (RLS contournée) : on vérifie nous-mêmes
  // que le visiteur a le droit de voir ce projet.
  // Tout projet a un propriétaire : sans compte correspondant, rien à voir.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!project.user_id || user?.id !== project.user_id) notFound();

  // Compte les matches pour annoncer le nombre, sans révéler quoi que ce soit
  // sur les architectes — la révélation se fait au rendez-vous confirmé.
  const { count: matchCount } = await service
    .from("match_results")
    .select("project_id", { count: "exact", head: true })
    .eq("project_id", id);

  return (
    <>
      <Nav />
      <section className="page-edge py-32 max-w-[820px] mx-auto">
        <p className="eyebrow">{t("thanks.eyebrow")}</p>
        <h1 className="font-light text-[clamp(40px,5vw,72px)] leading-[1.05] mt-6">
          {t("thanks.title")}
        </h1>
        <p className="text-concrete-1 mt-6 max-w-[60ch]">{t("thanks.body")}</p>

        {/* Recap du brief — donne au client la trace de ce qu'il a déposé */}
        <div
          className="border border-[var(--hairline)] mt-10 p-6"
          style={{ background: "var(--paper-2)" }}
        >
          <p className="eyebrow">
            {t("thanks.eyebrow")} · #{project.id.slice(0, 8)}
          </p>
          <dl className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="eyebrow">{t("fields.project_type")}</dt>
              <dd>{tt(project.project_type as "other")}</dd>
            </div>
            <div>
              <dt className="eyebrow">{t("fields.project_location")}</dt>
              <dd>{project.project_location}</dd>
            </div>
            <div>
              <dt className="eyebrow">{t("thanks.matches")}</dt>
              <dd>
                {matchCount ?? 0} {t("match").toLowerCase()}
                {(matchCount ?? 0) > 1 ? "s" : ""}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          {(matchCount ?? 0) > 0 ? (
            <Link
              href={`/${locale}/dashboard/client`}
              className="btn btn-primary"
            >
              {t("thanks.viewMatches")} <span className="btn-arrow" />
            </Link>
          ) : (
            <p className="text-concrete-1 max-w-[56ch]">
              {t("thanks.matchesPending")}
            </p>
          )}
          <Link
            href={`/${locale}`}
            className="btn btn-ghost"
            style={{ borderColor: "var(--hairline)" }}
          >
            {t("thanks.cta")}
          </Link>
        </div>
      </section>
      <Footer />
    </>
  );
}
