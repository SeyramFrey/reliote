import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

type ArchProfile = {
  first_name: string;
  last_name: string;
  status: string;
  city: string;
  specialties: string[];
  rating: number | null;
};

type Profile = { role: string };

// Asymétrie : l'architecte voit l'identité complète du client (nom + prénom +
// brief). C'est l'inverse de ce que le client voit — il n'a accès qu'au handle
// anonyme de l'architecte tant qu'il n'a pas signé la charte d'engagement.
// Justification : l'architecte assume sa réputation (il sait pour qui il bosse) ;
// le client achète la rigueur de la sélection, pas une identité avant temps.
type IncomingMatch = {
  score: number;
  reasons: { kind: string; weight: number }[];
  client_projects: {
    id: string;
    user_id: string;
    project_type: string;
    project_location: string;
    project_description: string;
    created_at: string;
  };
  // Statut d'engagement côté client : indique si le client a accepté la charte
  // et débloqué la communication directe via les canaux Reliote.
  engagement_status?: "proposed" | "engaged" | "declined" | "cancelled" | "expired" | null;
  client_profile?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
};

export default async function ArchitectDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = (await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()) as { data: Profile | null };
  if (profile?.role !== "architect") notFound();
  const t = await getTranslations("dashboardArchitect");

  // L'architecte a accès à sa propre ligne via "architects owner read" — pas de
  // service client nécessaire ici.
  const { data: archProfile } = (await supabase
    .from("architect_profiles")
    .select("id, first_name, last_name, status, city, specialties, rating")
    .eq("user_id", user.id)
    .single()) as { data: (ArchProfile & { id: string }) | null };

  // Pour les matches + identité client, on passe par le service client : on doit
  // joindre les profils, les engagements, et toutes les lignes que la RLS
  // architecte ne laisserait pas voir sans bypass.
  const service = createServiceClient();
  const { data: matches } = (await service
    .from("match_results")
    .select(
      "score, reasons, client_projects!inner(id, user_id, project_type, project_location, project_description, created_at)"
    )
    .eq("architect_id", archProfile?.id ?? "")
    .order("score", { ascending: false })) as { data: IncomingMatch[] | null };

  // Enrichir avec l'identité client + le statut d'engagement
  let enriched: IncomingMatch[] = matches ?? [];
  if (enriched.length > 0 && archProfile?.id) {
    const userIds = [...new Set(enriched.map((m) => m.client_projects.user_id).filter(Boolean))];
    const projectIds = enriched.map((m) => m.client_projects.id);

    const [profilesRes, engagementsRes] = await Promise.all([
      service
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", userIds),
      service
        .from("client_engagements")
        .select("project_id, status")
        .eq("architect_id", archProfile.id)
        .in("project_id", projectIds),
    ]);

    const profMap = new Map(
      ((profilesRes.data ?? []) as { id: string; first_name: string | null; last_name: string | null }[]).map(
        (p) => [p.id, p]
      )
    );
    const engagementMap = new Map(
      ((engagementsRes.data ?? []) as { project_id: string; status: IncomingMatch["engagement_status"] }[]).map(
        (e) => [e.project_id, e.status]
      )
    );

    enriched = enriched.map((m) => ({
      ...m,
      client_profile: profMap.get(m.client_projects.user_id) ?? null,
      engagement_status: engagementMap.get(m.client_projects.id) ?? "proposed",
    }));
  }

  return (
    <section className="page-edge py-16">
      <p className="eyebrow">{t("eyebrow")}</p>
      <h1 className="font-light text-[clamp(40px,5vw,72px)] leading-[1.05] mt-4">
        {archProfile ? `${archProfile.first_name} ${archProfile.last_name}` : t("welcome")}
      </h1>
      <p className="text-concrete-1 mt-2">
        {t("status")} :{" "}
        <span className="mono uppercase text-[11px] tracking-[0.18em]">
          {archProfile?.status ?? "—"}
        </span>
        {archProfile?.city && <> · {archProfile.city}</>}
        {archProfile?.rating != null && <> · {archProfile.rating.toFixed(1)}★</>}
      </p>

      <h2 className="font-light text-[clamp(28px,3vw,40px)] mt-16">
        {t("incoming")}
      </h2>
      {enriched.length === 0 ? (
        <p className="text-concrete-1 mt-6 max-w-[60ch]">{t("empty")}</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-[var(--gutter)]">
          {enriched.map((m) => {
            const clientName = m.client_profile
              ? `${m.client_profile.first_name ?? ""} ${m.client_profile.last_name ?? ""}`.trim() || "—"
              : "—";
            const engaged = m.engagement_status === "engaged";
            return (
              <article
                key={m.client_projects.id}
                className="border border-[var(--hairline)] p-6 flex flex-col gap-3"
              >
                <div className="flex justify-between items-baseline gap-2">
                  <span className="eyebrow capitalize">
                    {m.client_projects.project_type}
                  </span>
                  <span className="mono text-green text-[13px]">
                    {Math.round((m.score / 90) * 100)}%
                  </span>
                </div>

                {/* Identité client en clair (asymétrie). */}
                <div>
                  <h3 className="font-medium text-lg">{clientName}</h3>
                  <p className="eyebrow mt-1">{m.client_projects.project_location}</p>
                </div>

                <p className="text-sm">{m.client_projects.project_description}</p>

                {/* Statut d'engagement client : avant 'engaged', l'architecte ne peut
                    pas communiquer encore — le client n'a pas signé la charte. */}
                <div
                  className="mono text-[10.5px] tracking-[0.18em] uppercase mt-2 pt-3 border-t"
                  style={{
                    color: engaged ? "var(--green)" : "var(--concrete-2)",
                    borderColor: "var(--hairline-soft)",
                  }}
                >
                  {engaged ? (
                    <>{t("engaged")} · {t("channelReady")}</>
                  ) : (
                    <>{t("awaitingClient")}</>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
