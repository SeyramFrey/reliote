import { createServiceClient } from "@/lib/supabase/service";
import { getLocale, getTranslations } from "next-intl/server";
import { Nav } from "@/components/shared/Nav";
import { Footer } from "@/components/landing/Footer";
import Link from "next/link";
import { notFound } from "next/navigation";

type Project = {
  id: string;
  client_name: string;
  project_type: string;
  project_location: string;
  project_description: string;
};

// Page de confirmation post-dépôt de brief.
// Avant la pivot N2/N3, cette page affichait directement les architectes matchés
// avec nom + photo — ce qui contournait toute la mécanique de révélation
// progressive. On la simplifie en page d'accusé de réception qui redirige
// vers /architectes (où l'engagement charter gère la révélation).
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const t = await getTranslations("wizardClient");

  const service = createServiceClient();
  const { data: project } = (await service
    .from("client_projects")
    .select("id, client_name, project_type, project_location, project_description")
    .eq("id", id)
    .single()) as { data: Project | null };
  if (!project) notFound();

  // Compte les matches pour annoncer le nombre, sans révéler quoi que ce soit
  // sur les architectes — la révélation se fait sur /architectes via l'engagement.
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
              <dd className="capitalize">{project.project_type}</dd>
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
              href={`/${locale}/architectes`}
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
