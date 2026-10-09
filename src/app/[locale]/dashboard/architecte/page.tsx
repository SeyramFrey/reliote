import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MAX_SCORE } from "@/lib/matching/score";
import { countryTimeZone, formatMeetingTime } from "@/lib/time/meetingTime";
import { safeLocale } from "@/lib/auth/safeRedirect";

type ArchProfile = {
  id: string;
  first_name: string;
  last_name: string;
  status: "pending" | "verified" | "rejected" | "paused";
  city: string;
  country: string;
};

// Ce que l'architecte voit d'un projet AVANT le rendez-vous confirmé : le
// projet, jamais le porteur (décision du 2026-10-10 — symétrique de ce que le
// porteur voit de l'architecte).
type IncomingMatch = {
  score: number;
  client_projects: {
    id: string;
    project_type: string;
    project_country: string;
    project_location: string;
    project_description: string;
    budget_range: string | null;
    timeline: string | null;
    created_at: string;
  };
};

type Engagement = { id: string; project_id: string; status: string };
type ClientContact = { id: string; client_name: string; email: string; phone: string | null };
type Meeting = {
  id: string;
  project_id: string;
  scheduled_at: string;
  video_url: string | null;
  status: string;
  client_projects: { project_type: string; project_country: string; project_location: string } | null;
};

const OPEN_MEETINGS = new Set(["proposed", "rescheduled", "confirmed"]);

export default async function ArchitectDashboard() {
  const supabase = await createClient();
  const locale = safeLocale(await getLocale());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = (await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()) as { data: { role: string } | null };
  if (profile?.role !== "architect") notFound();
  const t = await getTranslations("dashboardArchitect");
  const tt = await getTranslations("projectTypes");

  // Sa propre fiche, sous sa session (« architects owner read »).
  const { data: arch } = (await supabase
    .from("architect_profiles")
    .select("id, first_name, last_name, status, city, country")
    .eq("user_id", user.id)
    .maybeSingle()) as { data: ArchProfile | null };

  if (!arch) {
    return (
      <section className="page-edge py-16">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="font-light text-[clamp(40px,5vw,72px)] leading-[1.05] mt-4">{t("welcome")}</h1>
        <p className="text-concrete-1 mt-6">{t("noProfile")}</p>
        <Link href={`/${locale}/architectes/rejoindre`} className="btn btn-primary mt-8">
          {t("completeProfile")} <span className="btn-arrow" />
        </Link>
      </section>
    );
  }

  // Correspondances, engagements et RDV : clé service, toujours filtrés sur
  // SON identifiant d'architecte, et sans colonne identifiant le porteur.
  const service = createServiceClient();
  const [{ data: matchData }, { data: engData }, { data: meetingData }] = await Promise.all([
    service
      .from("match_results")
      .select(
        "score, client_projects!inner(id, project_type, project_country, project_location, project_description, budget_range, timeline, created_at)",
      )
      .eq("architect_id", arch.id)
      .order("score", { ascending: false }) as unknown as Promise<{ data: IncomingMatch[] | null }>,
    service
      .from("client_engagements")
      .select("id, project_id, status")
      .eq("architect_id", arch.id) as unknown as Promise<{ data: Engagement[] | null }>,
    service
      .from("meetings")
      .select("id, project_id, scheduled_at, video_url, status, client_projects(project_type, project_country, project_location)")
      .eq("architect_id", arch.id)
      .order("scheduled_at", { ascending: true }) as unknown as Promise<{ data: Meeting[] | null }>,
  ]);
  const matches = matchData ?? [];
  const engagementByProject = new Map((engData ?? []).map((e) => [e.project_id, e]));
  const meetings = [...(meetingData ?? [])].sort(
    (a, b) => Number(OPEN_MEETINGS.has(b.status)) - Number(OPEN_MEETINGS.has(a.status)),
  );

  // Identité du porteur : seulement pour les engagements actifs (RDV confirmé).
  const engaged = (engData ?? []).filter((e) => e.status === "engaged");
  const contactByProject = new Map<string, ClientContact>();
  const relayByEngagement = new Map<string, string>();
  if (engaged.length) {
    const [{ data: contacts }, { data: relays }] = await Promise.all([
      service
        .from("client_projects")
        .select("id, client_name, email, phone")
        .in("id", engaged.map((e) => e.project_id)) as unknown as Promise<{ data: ClientContact[] | null }>,
      service
        .from("engagement_relays")
        .select("engagement_id, architect_relay")
        .in("engagement_id", engaged.map((e) => e.id)) as unknown as Promise<{
        data: { engagement_id: string; architect_relay: string }[] | null;
      }>,
    ]);
    (contacts ?? []).forEach((c) => contactByProject.set(c.id, c));
    (relays ?? []).forEach((r) => relayByEngagement.set(r.engagement_id, r.architect_relay));
  }

  return (
    <section className="page-edge py-16">
      <p className="eyebrow">{t("eyebrow")}</p>
      <h1 className="font-light text-[clamp(40px,5vw,72px)] leading-[1.05] mt-4">
        {arch.first_name} {arch.last_name}
      </h1>
      <p className="text-concrete-1 mt-3 max-w-[64ch]">
        <span className="eyebrow mr-2">{t("status")}</span>
        {t(`statusText.${arch.status}`)}
      </p>

      {/* ── Rendez-vous ──────────────────────────────────────────────── */}
      {meetings.length > 0 && (
        <div className="mt-14">
          <h2 className="font-light text-[clamp(28px,3vw,40px)]">{t("meetings")}</h2>
          <div className="mt-6 space-y-4">
            {meetings.map((m) => (
              <article key={m.id} className="border border-[var(--hairline)] p-5">
                <div className="flex flex-wrap justify-between items-baseline gap-2">
                  <p className="font-medium">
                    {formatMeetingTime(m.scheduled_at, {
                      locale,
                      projectTimeZone: countryTimeZone(m.client_projects?.project_country ?? ""),
                    })}
                    <span className="ml-3 mono uppercase text-[10px] tracking-[0.16em] text-green">
                      {t(`meetingStatus.${m.status}` as "meetingStatus.proposed")}
                    </span>
                  </p>
                  {m.client_projects ? (
                    <span className="eyebrow">
                      {tt(m.client_projects.project_type as "other")} · {m.client_projects.project_location},{" "}
                      {m.client_projects.project_country}
                    </span>
                  ) : null}
                </div>
                {m.video_url && OPEN_MEETINGS.has(m.status) ? (
                  <p className="mt-2 text-sm">
                    <a href={m.video_url} target="_blank" rel="noopener noreferrer" className="underline">
                      {t("video")} →
                    </a>
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      )}

      {/* ── Projets ──────────────────────────────────────────────────── */}
      <h2 className="font-light text-[clamp(28px,3vw,40px)] mt-16">{t("incoming")}</h2>
      {matches.length === 0 ? (
        <p className="text-concrete-1 mt-6 max-w-[60ch]">{t("empty")}</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-[var(--gutter)]">
          {matches.map((m) => {
            const p = m.client_projects;
            const eng = engagementByProject.get(p.id);
            const contact = eng?.status === "engaged" ? contactByProject.get(p.id) : undefined;
            const relay = eng ? relayByEngagement.get(eng.id) : undefined;
            return (
              <article key={p.id} className="border border-[var(--hairline)] p-6 flex flex-col gap-3">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="eyebrow">{tt(p.project_type as "other")}</span>
                  <span className="mono text-green text-[13px]">
                    {t("match")} {Math.round((m.score / MAX_SCORE) * 100)}%
                  </span>
                </div>
                <p className="font-medium">
                  {p.project_location}, {p.project_country}
                </p>
                <p className="text-sm">{p.project_description}</p>
                <dl className="text-[13px] text-concrete-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                  {p.budget_range ? (
                    <>
                      <dt className="eyebrow">{t("budget")}</dt>
                      <dd>{p.budget_range}</dd>
                    </>
                  ) : null}
                  {p.timeline ? (
                    <>
                      <dt className="eyebrow">{t("timeline")}</dt>
                      <dd>{p.timeline}</dd>
                    </>
                  ) : null}
                </dl>

                <div className="mt-2 pt-3 border-t border-[var(--hairline-soft)]">
                  <p
                    className="mono text-[10.5px] tracking-[0.18em] uppercase"
                    style={{ color: eng?.status === "engaged" ? "var(--green)" : "var(--concrete-2)" }}
                  >
                    {t(`engagement.${eng?.status ?? "none"}` as "engagement.none")}
                  </p>
                  {contact ? (
                    <dl className="mt-3 text-sm grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                      <dt className="eyebrow">{t("client")}</dt>
                      <dd>{contact.client_name}</dd>
                      <dt className="eyebrow">{t("email")}</dt>
                      <dd>
                        <a href={`mailto:${contact.email}`} className="underline">
                          {contact.email}
                        </a>
                      </dd>
                      {contact.phone ? (
                        <>
                          <dt className="eyebrow">{t("phone")}</dt>
                          <dd>{contact.phone}</dd>
                        </>
                      ) : null}
                      {relay ? (
                        <>
                          <dt className="eyebrow">{t("relay")}</dt>
                          <dd className="mono text-[13px]">{relay}</dd>
                        </>
                      ) : null}
                    </dl>
                  ) : (
                    <p className="text-[13px] text-concrete-1 mt-2">{t("identityHidden")}</p>
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
