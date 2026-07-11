import { Nav } from "@/components/shared/Nav";
import { Footer } from "@/components/landing/Footer";
import { EngagementGrid } from "@/components/landing/EngagementGrid";
import type { ArchitectRow } from "@/components/landing/ArchitectIndex";
import type { ArchitectAnonRow, ClientEngagement } from "@/types/anon";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import Link from "next/link";

type ProfileRole = { role: "client" | "architect" | "admin" };
type LatestProject = { id: string; project_type: string; project_description: string };

// Espace privé Sélection.
// État 1 (anon)          : redirect /auth/login?next=...
// État 2 (architect/admin): panneau "section pour porteurs de projet" + redirect
// État 3 (client sans projet): empty state pédagogique avec CTA
// État 4 (client avec matches): cartes Niveau 2 par défaut, Niveau 3 après acceptation de la charte
export default async function ArchitectesPrivees() {
  const locale = await getLocale();
  const t = await getTranslations("landing.privateArchitects");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/auth/login?next=${encodeURIComponent(`/${locale}/architectes`)}`);
  }

  const { data: profile } = (await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()) as { data: ProfileRole | null };
  const role = profile?.role ?? "client";

  return (
    <>
      <Nav />
      <main className="pt-24 page-edge py-16 max-w-[1180px] mx-auto">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="font-light text-[clamp(36px,4.4vw,64px)] leading-[1.04] mt-4 max-w-[22ch]">
          {t("titlePre")}
          <em className="serif-i">{t("titleItalic")}</em>
          {t("titleRest")}
        </h1>
        <p className="text-concrete-1 mt-6 max-w-[60ch]">{t("kicker")}</p>

        <div className="mt-12">
          {role === "client" ? (
            <ClientView userId={user.id} />
          ) : (
            <NotForYouState role={role} />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

async function ClientView({ userId }: { userId: string }) {
  const t = await getTranslations("landing.privateArchitects");
  const locale = await getLocale();
  const service = createServiceClient();

  const { data: latestProject } = (await service
    .from("client_projects")
    .select("id, project_type, project_description")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()) as { data: LatestProject | null };

  if (!latestProject) {
    return (
      <div
        className="border border-[var(--hairline)] p-10 md:p-14"
        style={{ background: "var(--paper-2)" }}
      >
        <p className="eyebrow">{t("empty.eyebrow")}</p>
        <h2 className="font-light text-3xl md:text-4xl mt-4 leading-tight max-w-[26ch]">
          {t("empty.title")}
        </h2>
        <p className="text-concrete-1 mt-5 max-w-[56ch]">{t("empty.body")}</p>
        <Link href={`/${locale}/projets/initier`} className="btn btn-primary mt-8">
          {t("empty.cta")} <span className="btn-arrow" />
        </Link>
      </div>
    );
  }

  // Niveau 2 — fetched via service client (la vue est filtrée elle-même sur
  // auth.uid() pour les requêtes user-side ; via service client elle renvoie
  // toutes les lignes, donc on filtre ici manuellement sur les matches du projet).
  const { data: matchRows } = (await service
    .from("match_results")
    .select("architect_id")
    .eq("project_id", latestProject.id)) as {
    data: { architect_id: string }[] | null;
  };
  const matchedIds = (matchRows ?? []).map((m) => m.architect_id);

  if (matchedIds.length === 0) {
    return (
      <div className="border border-[var(--hairline)] p-10 md:p-14">
        <p className="eyebrow">{t("pending.eyebrow")}</p>
        <h2 className="font-light text-3xl md:text-4xl mt-4 leading-tight max-w-[26ch]">
          {t("pending.title")}
        </h2>
        <p className="text-concrete-1 mt-5 max-w-[56ch]">{t("pending.body")}</p>
        <p className="mono mt-8 text-[11px] tracking-[0.18em] uppercase text-concrete-2">
          {t("pending.ref")} #{latestProject.id.slice(0, 8)}
        </p>
      </div>
    );
  }

  // 1. La vue Niveau 2 (toutes les colonnes anonymisables pour ce projet)
  const { data: anonRows } = (await service
    .from("architect_profiles")
    .select(
      "id, anon_handle, years_experience, country, city, specialties, project_types, languages, diploma, rating, availability, status"
    )
    .in("id", matchedIds)
    .eq("status", "verified")) as {
    data:
      | {
          id: string;
          anon_handle: string | null;
          years_experience: number;
          country: string;
          city: string;
          specialties: string[];
          project_types: string[];
          languages: string[];
          diploma: string | null;
          rating: number | null;
          availability: "available" | "busy" | "unavailable";
          status: "pending" | "verified" | "rejected" | "paused";
        }[]
      | null;
  };
  const anonArchitects: ArchitectAnonRow[] = (anonRows ?? []).map((r) => ({
    id: r.id,
    anon_handle: r.anon_handle ?? "—",
    years_bracket:
      r.years_experience < 5
        ? "< 5 ans"
        : r.years_experience < 10
          ? "5 — 10 ans"
          : r.years_experience < 15
            ? "10 — 15 ans"
            : "15 ans et +",
    region:
      /abidjan/i.test(r.city) ||
      /^(cocody|plateau|marcory|riviera|bingerville|yopougon)/i.test(r.city)
        ? "Grand Abidjan"
        : r.country,
    specialties: r.specialties,
    project_types: r.project_types,
    languages: r.languages,
    diploma: r.diploma,
    rating: r.rating,
    availability: r.availability,
    status: r.status,
  }));

  // 2. Les engagements existants pour ce projet
  const { data: engagementsRaw } = (await service
    .from("client_engagements")
    .select(
      "id, project_id, architect_id, status, charter_version, charter_accepted, proposed_at, engaged_at"
    )
    .eq("project_id", latestProject.id)) as {
    data: ClientEngagement[] | null;
  };
  const engagements: ClientEngagement[] = engagementsRaw ?? [];
  const engagedIds = engagements
    .filter((e) => e.status === "engaged")
    .map((e) => e.architect_id);

  // 3. Pour les engagés, on fetche la ligne complète (Niveau 3)
  let fullArchitects: ArchitectRow[] = [];
  if (engagedIds.length > 0) {
    const { data: fullRows } = (await service
      .from("architect_profiles")
      .select(
        "id, first_name, last_name, structure, city, specialties, project_types, years_experience, photo_url, rating, availability, fee_currency, fee_amount, ordre_number, diploma, languages, description"
      )
      .in("id", engagedIds)) as { data: ArchitectRow[] | null };
    fullArchitects = fullRows ?? [];
  }

  return (
    <>
      <p className="mono text-[11px] tracking-[0.18em] uppercase text-concrete-2 mb-6">
        {t("forProject")} · #{latestProject.id.slice(0, 8)}
      </p>
      <EngagementGrid
        projectId={latestProject.id}
        anonArchitects={anonArchitects}
        fullArchitects={fullArchitects}
        engagements={engagements}
      />
    </>
  );
}

async function NotForYouState({ role }: { role: "client" | "architect" | "admin" }) {
  const t = await getTranslations("landing.privateArchitects");
  const locale = await getLocale();
  const target =
    role === "admin"
      ? `/${locale}/admin/architectes`
      : `/${locale}/dashboard/architecte`;
  return (
    <div className="border border-[var(--hairline)] p-10 md:p-14">
      <p className="eyebrow">{t(`wrongRole.${role}.eyebrow`)}</p>
      <h2 className="font-light text-3xl md:text-4xl mt-4 leading-tight max-w-[26ch]">
        {t(`wrongRole.${role}.title`)}
      </h2>
      <Link href={target} className="btn btn-primary mt-8">
        {t(`wrongRole.${role}.cta`)} <span className="btn-arrow" />
      </Link>
    </div>
  );
}
