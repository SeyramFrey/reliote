import { createClient } from "@/lib/supabase/server";
import { NewsletterToggle } from "@/components/shared/NewsletterToggle";
import { createServiceClient } from "@/lib/supabase/service";
import { architectPhotoSrc } from "@/lib/storage/architectPhoto";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { MessagesLink } from "@/components/messaging/MessagesLink";
import { notFound } from "next/navigation";
import { chooseProposal, declineProposal, declineMeeting } from "./actions";
import { ConfirmMeetingButton } from "@/components/dashboard/ConfirmMeetingButton";
import { countryTimeZone, formatMeetingTime } from "@/lib/time/meetingTime";
import { safeLocale } from "@/lib/auth/safeRedirect";
import { shortlistVisible } from "@/lib/workflow/guards";

type Project = {
  id: string;
  project_type: string;
  project_country: string;
  project_location: string;
  status: string;
  created_at: string;
  choice_requested_at: string | null;
};

type Engagement = { id: string; project_id: string; architect_id: string; status: string };

type Meeting = {
  id: string;
  project_id: string;
  architect_id: string;
  scheduled_at: string;
  video_url: string | null;
  status: string;
};

type AnonProfile = {
  id: string;
  anon_handle: string | null;
  years_experience: number;
  country: string;
  specialties: string[];
  languages: string[];
  diploma: string | null;
};

type Revealed = {
  id: string;
  first_name: string;
  last_name: string;
  structure: string | null;
  city: string;
  country: string;
  email: string;
  phone: string | null;
  photo_url: string | null;
};

const OPEN_MEETINGS = new Set(["proposed", "rescheduled", "confirmed"]);

function yearsBracket(y: number): string {
  if (y < 5) return "< 5";
  if (y < 10) return "5–10";
  if (y < 15) return "10–15";
  return "15+";
}

export default async function ClientDashboard({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const locale = safeLocale(await getLocale());
  const t = await getTranslations("dashboardClient");
  const tt = await getTranslations("projectTypes");
  const { notice, error } = await searchParams;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // le proxy a déjà redirigé — garde pour le typage
  const { data: profile } = (await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()) as { data: { role: string } | null };
  if (profile?.role !== "client") notFound();

  // Lecture sous la session du porteur : la RLS ne renvoie que SES lignes.
  const [{ data: projectsData }, { data: engagementsData }, { data: meetingsData }] = await Promise.all([
    supabase
      .from("client_projects")
      .select("id, project_type, project_country, project_location, status, created_at, choice_requested_at")
      .order("created_at", { ascending: false }) as unknown as Promise<{ data: Project[] | null }>,
    supabase
      .from("client_engagements")
      .select("id, project_id, architect_id, status") as unknown as Promise<{ data: Engagement[] | null }>,
    supabase
      .from("meetings")
      .select("id, project_id, architect_id, scheduled_at, video_url, status")
      .order("scheduled_at", { ascending: true }) as unknown as Promise<{ data: Meeting[] | null }>,
  ]);
  const projects = projectsData ?? [];
  const engagements = engagementsData ?? [];
  // RDV ouverts d'abord (à confirmer, confirmés), puis l'historique.
  const meetings = [...(meetingsData ?? [])].sort(
    (a, b) => Number(OPEN_MEETINGS.has(b.status)) - Number(OPEN_MEETINGS.has(a.status)),
  );
  const projectById = new Map(projects.map((p) => [p.id, p]));

  // Profils anonymes des architectes proposés : lus avec la clé service, mais
  // uniquement pour les architectes de SES engagements, et seulement les
  // colonnes non identifiantes.
  const architectIds = [...new Set(engagements.map((e) => e.architect_id))];
  const anonById = new Map<string, AnonProfile>();
  if (architectIds.length) {
    const { data } = (await createServiceClient()
      .from("architect_profiles")
      .select("id, anon_handle, years_experience, country, specialties, languages, diploma")
      .in("id", architectIds)) as { data: AnonProfile[] | null };
    (data ?? []).forEach((a) => anonById.set(a.id, a));
  }

  // Identité révélée : lue sous la session du porteur — la RLS ne la donne
  // qu'après un RDV confirmé avec charte.
  const engaged = engagements.filter((e) => e.status === "engaged");
  const revealedById = new Map<string, Revealed>();
  const relayByEngagement = new Map<string, string>();
  if (engaged.length) {
    const [{ data: revealed }, { data: relays }] = await Promise.all([
      supabase
        .from("architect_profiles")
        .select("id, first_name, last_name, structure, city, country, email, phone, photo_url")
        .in("id", engaged.map((e) => e.architect_id)) as unknown as Promise<{ data: Revealed[] | null }>,
      supabase
        .from("engagement_relays")
        .select("engagement_id, client_relay")
        .in("engagement_id", engaged.map((e) => e.id)) as unknown as Promise<{
        data: { engagement_id: string; client_relay: string }[] | null;
      }>,
    ]);
    // Bucket privé : la photo n'est servie qu'en URL signée, et seulement pour
    // les profils que la RLS vient de révéler à ce porteur.
    const service = createServiceClient();
    const withPhotos = await Promise.all(
      (revealed ?? []).map(async (a) => ({ ...a, photo_url: await architectPhotoSrc(service, a.photo_url) })),
    );
    withPhotos.forEach((a) => revealedById.set(a.id, a));
    (relays ?? []).forEach((r) => relayByEngagement.set(r.engagement_id, r.client_relay));
  }

  const hasOpenMeeting = (projectId: string) =>
    meetings.some((m) => m.project_id === projectId && OPEN_MEETINGS.has(m.status));
  // Choix à faire : au moins deux propositions et aucun RDV ouvert.
  const choices = projects
    .map((p) => ({
      project: p,
      proposals: engagements.filter((e) => e.project_id === p.id && e.status === "proposed"),
    }))
    .filter((c) =>
      shortlistVisible({
        choiceRequested: !!c.project.choice_requested_at,
        proposedCount: c.proposals.length,
        hasOpenMeeting: hasOpenMeeting(c.project.id),
      }),
    );

  const placeOf = (p: Project | undefined) => (p ? `${p.project_location}, ${p.project_country}` : "");
  const label = (p: Project | undefined) => (p ? `${tt(p.project_type as "other")} · ${placeOf(p)}` : "");
  const btnGhost = "px-4 py-2 border border-[var(--hairline)] text-sm hover:border-ink";

  return (
    <section className="page-edge py-16">
      <p className="eyebrow">{t("eyebrow")}</p>
      <div className="flex flex-wrap items-end justify-between gap-4 mt-4">
        <h1 className="font-light text-[clamp(40px,5vw,72px)] leading-[1.05]">{t("title")}</h1>
        <div className="flex flex-wrap gap-3">
          <MessagesLink href="/dashboard/client/messages" />
          <Link href={`/${locale}/projets/initier`} className={btnGhost}>
            {t("newProject")}
          </Link>
        </div>
      </div>

      {notice && (
        <p role="status" className="mt-8 text-sm text-green">
          {t(`notices.${notice}` as "notices.chosen")}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-8 text-sm text-red-700">
          {t(`errors.${error}` as "errors.generic")}
        </p>
      )}

      {/* ── Votre architecte (révélé) ─────────────────────────────────── */}
      {engaged.map((e) => {
        const a = revealedById.get(e.architect_id);
        if (!a) return null;
        const relay = relayByEngagement.get(e.id);
        return (
          <article key={e.id} className="mt-14 border border-[var(--hairline)] p-6 md:p-8" style={{ background: "var(--paper-2)" }}>
            <p className="eyebrow">
              {t("architect.title")} · {label(projectById.get(e.project_id))}
            </p>
            <div className="mt-4 flex flex-wrap gap-6 items-start">
              {a.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.photo_url} alt="" className="w-24 h-28 object-cover" />
              ) : null}
              <div>
                <h2 className="font-light text-3xl">
                  {a.first_name} {a.last_name}
                </h2>
                {a.structure ? <p className="text-concrete-1 mt-1">{a.structure}</p> : null}
                <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3 text-sm">
                  <div>
                    <dt className="eyebrow">{t("architect.place")}</dt>
                    <dd>
                      {a.city}, {a.country}
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow">{t("architect.email")}</dt>
                    <dd>
                      <a href={`mailto:${a.email}`} className="underline">
                        {a.email}
                      </a>
                    </dd>
                  </div>
                  {a.phone ? (
                    <div>
                      <dt className="eyebrow">{t("architect.phone")}</dt>
                      <dd>{a.phone}</dd>
                    </div>
                  ) : null}
                  {relay ? (
                    <div>
                      <dt className="eyebrow">{t("architect.relay")}</dt>
                      <dd className="mono text-[13px]">{relay}</dd>
                    </div>
                  ) : null}
                </dl>
                {relay ? <p className="text-[13px] text-concrete-1 mt-3 max-w-[60ch]">{t("architect.relayHint")}</p> : null}
              </div>
            </div>
          </article>
        );
      })}

      {/* ── Propositions à départager ─────────────────────────────────── */}
      {choices.map(({ project, proposals }) => (
        <div key={project.id} className="mt-14">
          <h2 className="font-light text-2xl">{t("proposals.title")}</h2>
          <p className="eyebrow mt-2">{label(project)}</p>
          <p className="text-concrete-1 text-sm mt-3 max-w-[64ch]">{t("proposals.intro")}</p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {proposals.map((e) => {
              const a = anonById.get(e.architect_id);
              if (!a) return null;
              return (
                <article key={e.id} className="border border-[var(--hairline)] p-5 flex flex-col gap-3">
                  <p className="mono text-2xl">{a.anon_handle ?? "—"}</p>
                  <dl className="text-sm grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                    <dt className="eyebrow">{t("proposals.experience")}</dt>
                    <dd>{yearsBracket(a.years_experience)}</dd>
                    <dt className="eyebrow">{t("proposals.region")}</dt>
                    <dd>{a.country}</dd>
                    <dt className="eyebrow">{t("proposals.specialties")}</dt>
                    <dd>{a.specialties.join(" · ")}</dd>
                    <dt className="eyebrow">{t("proposals.languages")}</dt>
                    <dd>{a.languages.join(" · ")}</dd>
                    {a.diploma ? (
                      <>
                        <dt className="eyebrow">{t("proposals.diploma")}</dt>
                        <dd>{a.diploma}</dd>
                      </>
                    ) : null}
                  </dl>
                  <div className="mt-auto flex flex-wrap gap-2 pt-3 border-t border-[var(--hairline-soft)]">
                    <form action={chooseProposal}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="projectId" value={project.id} />
                      <input type="hidden" name="architectId" value={e.architect_id} />
                      <button className="px-4 py-2 bg-ink text-paper text-sm">{t("proposals.choose")}</button>
                    </form>
                    <form action={declineProposal}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="projectId" value={project.id} />
                      <input type="hidden" name="architectId" value={e.architect_id} />
                      <button className={btnGhost}>{t("proposals.decline")}</button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ))}

      {/* ── Rendez-vous ──────────────────────────────────────────────── */}
      {meetings.length > 0 && (
        <div className="mt-14">
          <h2 className="font-light text-2xl">{t("meetings.title")}</h2>
          <div className="mt-6 space-y-4">
            {meetings.map((m) => {
              const p = projectById.get(m.project_id);
              const toConfirm = m.status === "proposed" || m.status === "rescheduled";
              return (
                <article key={m.id} className="border border-[var(--hairline)] p-5">
                  <div className="flex flex-wrap justify-between items-baseline gap-2">
                    <p className="font-medium">
                      {formatMeetingTime(m.scheduled_at, {
                        locale,
                        projectTimeZone: countryTimeZone(p?.project_country ?? ""),
                      })}
                      <span className="ml-3 mono uppercase text-[10px] tracking-[0.16em] text-green">
                        {t(`meetings.status.${m.status}` as "meetings.status.proposed")}
                      </span>
                    </p>
                    <span className="eyebrow">{label(p)}</span>
                  </div>
                  {m.video_url && OPEN_MEETINGS.has(m.status) ? (
                    <p className="mt-2 text-sm">
                      <a href={m.video_url} target="_blank" rel="noopener noreferrer" className="underline">
                        {t("meetings.video")} →
                      </a>
                    </p>
                  ) : null}
                  {toConfirm && (
                    <div className="mt-4 border-t border-[var(--hairline-soft)] pt-4">
                      <p className="text-sm text-concrete-1 max-w-[64ch]">{t("meetings.intro")}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <ConfirmMeetingButton
                          meetingId={m.id}
                          architectHandle={anonById.get(m.architect_id)?.anon_handle ?? ""}
                        />
                        <form action={declineMeeting}>
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="meetingId" value={m.id} />
                          <button className={btnGhost}>{t("meetings.decline")}</button>
                        </form>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Projets ─────────────────────────────────────────────────── */}
      {projects.length === 0 ? (
        // Compte créé sans projet (ou avant le premier) : l'invitation à en
        // démarrer un, quand le porteur sera prêt.
        <div className="mt-12 border border-[var(--hairline)] p-8 md:p-10 max-w-[720px]">
          <p className="eyebrow">{t("emptyEyebrow")}</p>
          <p className="font-light text-[clamp(24px,2.6vw,34px)] leading-[1.15] mt-3">{t("empty")}</p>
          <p className="text-sm text-concrete-1 mt-3 max-w-[52ch]">{t("emptyBody")}</p>
          <Link href={`/${locale}/projets/initier`} className="btn btn-primary mt-6">
            {t("start")} <span className="btn-arrow" />
          </Link>
        </div>
      ) : (
        <div className="mt-14 overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="text-left">
              <tr className="border-b border-[var(--hairline)]">
                <th className="eyebrow py-3">{t("table.type")}</th>
                <th className="eyebrow">{t("table.place")}</th>
                <th className="eyebrow">{t("table.status")}</th>
                <th className="eyebrow">{t("table.submitted")}</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-[var(--hairline-soft)]">
                  <td className="py-4">{tt(p.project_type as "other")}</td>
                  <td>{placeOf(p)}</td>
                  <td>
                    <span className="mono uppercase text-[11px] tracking-[0.18em]">
                      {t(`projectStatus.${p.status}` as "projectStatus.new")}
                    </span>
                  </td>
                  <td>{new Date(p.created_at).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NewsletterToggle email={user.email} />
    </section>
  );
}
