import { createServiceClient } from "@/lib/supabase/service";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MAX_SCORE } from "@/lib/matching/score";
import { describeReasons } from "@/lib/matching/reasons";
import { countryTimeZone, formatMeetingTime } from "@/lib/time/meetingTime";
import { MeetingSlotFields } from "@/components/admin/MeetingSlotFields";
import { MeetingActions } from "@/components/admin/MeetingActions";
import { PROJECT_STATUS_FR, MEETING_STATUS_FR, ENGAGEMENT_STATUS_FR } from "@/lib/workflow/labels";
import {
  proposeArchitect,
  withdrawProposal,
  askClientToChoose,
  scheduleMeeting,
  closeProject,
} from "../actions";

type Project = {
  id: string;
  client_name: string;
  email: string;
  phone: string | null;
  project_type: string;
  project_country: string;
  project_location: string;
  project_description: string;
  required_specialties: string[];
  budget_range: string | null;
  timeline: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

type ArchitectLite = {
  first_name: string;
  last_name: string;
  anon_handle: string | null;
  city: string;
  country: string;
  specialties: string[];
  availability: string;
  rating: number | null;
  years_experience: number;
  status: string;
};

type MatchRow = {
  architect_id: string;
  score: number;
  reasons: unknown;
  architect_profiles: ArchitectLite | null;
};

type Engagement = {
  architect_id: string;
  status: string;
  architect_profiles: { first_name: string; last_name: string; anon_handle: string | null } | null;
};

type MeetingRow = {
  id: string;
  architect_id: string;
  scheduled_at: string;
  video_url: string | null;
  status: string;
  charter_accepted: boolean;
  architect_profiles: { first_name: string; last_name: string } | null;
};

const ERRORS_FR: Record<string, string> = {
  notVerified: "Seul un architecte vérifié peut être proposé.",
  meetingOpen: "Un rendez-vous est déjà ouvert pour ce projet.",
  needTwo: "Il faut au moins deux architectes proposés pour demander au porteur de choisir.",
  badSlot: "Créneau, fuseau ou lien visio invalide (le lien doit commencer par https://).",
  pastSlot: "Ce créneau est déjà passé.",
  notProposed: "Proposez d'abord cet architecte.",
  meetingClosed: "Ce rendez-vous n'est plus ouvert.",
  notConfirmed: "Seul un rendez-vous confirmé peut être marqué terminé.",
  confirmClose: "Cochez la case de confirmation pour clôturer le projet.",
  generic: "L'enregistrement a échoué : rien n'a été envoyé. Réessayez.",
};

const ACTIVE_MEETINGS = new Set(["proposed", "rescheduled", "confirmed"]);
const ACTIVE_ENGAGEMENTS = new Set(["proposed", "engaged"]);

const btn = "px-4 py-2 bg-ink text-paper text-sm";
const btnGhost = "px-4 py-2 border border-[var(--hairline)] text-sm hover:border-ink";

export default async function AdminProjectDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { id } = await params;
  const { error, notice } = await searchParams;
  const locale = await getLocale();
  const s = createServiceClient();

  const { data: project } = (await s
    .from("client_projects")
    .select(
      "id, client_name, email, phone, project_type, project_country, project_location, project_description, required_specialties, budget_range, timeline, notes, status, created_at",
    )
    .eq("id", id)
    .single()) as { data: Project | null };
  if (!project) notFound();

  const [{ data: matchData }, { data: engData }, { data: meetingData }] = await Promise.all([
    s
      .from("match_results")
      .select(
        "architect_id, score, reasons, architect_profiles(first_name, last_name, anon_handle, city, country, specialties, availability, rating, years_experience, status)",
      )
      .eq("project_id", id)
      .order("score", { ascending: false }) as unknown as Promise<{ data: MatchRow[] | null }>,
    s
      .from("client_engagements")
      .select("architect_id, status, architect_profiles(first_name, last_name, anon_handle)")
      .eq("project_id", id) as unknown as Promise<{ data: Engagement[] | null }>,
    s
      .from("meetings")
      .select(
        "id, architect_id, scheduled_at, video_url, status, charter_accepted, architect_profiles(first_name, last_name)",
      )
      .eq("project_id", id)
      .order("created_at", { ascending: false }) as unknown as Promise<{ data: MeetingRow[] | null }>,
  ]);

  const matches = matchData ?? [];
  const engagements = engData ?? [];
  const meetings = meetingData ?? [];
  const tz = countryTimeZone(project.project_country);
  const when = (iso: string) => formatMeetingTime(iso, { locale: "fr", projectTimeZone: tz });
  const engagementFor = (architectId: string) => engagements.find((e) => e.architect_id === architectId);
  const activeEngagements = engagements.filter((e) => ACTIVE_ENGAGEMENTS.has(e.status));
  const proposedCount = engagements.filter((e) => e.status === "proposed").length;
  const hasActiveMeeting = meetings.some((m) => ACTIVE_MEETINGS.has(m.status));
  const closed = project.status === "closed";

  return (
    <>
      <Link href={`/${locale}/admin/projets`} className="eyebrow hover:text-ink">
        ← Tous les projets
      </Link>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-light text-4xl">{project.client_name}</h1>
        <span className="mono uppercase text-[11px] tracking-[0.18em] text-green">
          {PROJECT_STATUS_FR[project.status] ?? project.status}
        </span>
      </div>
      <p className="eyebrow mt-2">Projet · #{project.id.slice(0, 8)}</p>

      {error && (
        <p role="alert" className="mt-6 border border-red-700/40 bg-red-700/5 p-3 text-sm text-red-700">
          {ERRORS_FR[error] ?? error}
        </p>
      )}
      {notice === "asked" && (
        <p role="status" className="mt-6 border border-[var(--hairline)] p-3 text-sm text-green">
          Le porteur a été invité à choisir son architecte.
        </p>
      )}

      {/* ── Brief ─────────────────────────────────────────────────────── */}
      <section className="border border-[var(--hairline)] mt-8 p-6" style={{ background: "var(--paper-2)" }}>
        <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 text-sm">
          <Field label="Type" value={project.project_type} capitalize />
          <Field label="Pays du chantier" value={project.project_country} />
          <Field label="Localité / site" value={project.project_location} />
          <Field label="Budget" value={project.budget_range ?? "—"} />
          <Field label="Échéance" value={project.timeline ?? "—"} />
          <Field label="Spécialités requises" value={project.required_specialties.join(" · ") || "—"} />
          <Field label="Contact" value={project.email} />
          <Field label="Téléphone" value={project.phone ?? "—"} />
          <Field label="Déposé le" value={new Date(project.created_at).toLocaleDateString("fr-FR")} />
        </dl>
        <div className="mt-5 border-t border-[var(--hairline-soft)] pt-4">
          <dt className="eyebrow">Descriptif</dt>
          <dd className="mt-2 text-sm text-concrete-1 whitespace-pre-line max-w-[70ch]">
            {project.project_description}
          </dd>
          {project.notes ? (
            <>
              <dt className="eyebrow mt-4">Notes</dt>
              <dd className="mt-2 text-sm text-concrete-1 max-w-[70ch]">{project.notes}</dd>
            </>
          ) : null}
        </div>
      </section>

      {/* ── Propositions en cours ─────────────────────────────────────── */}
      <div className="mt-12">
        <h2 className="font-light text-2xl">Propositions</h2>
        {activeEngagements.length === 0 ? (
          <p className="text-concrete-1 text-sm mt-3 max-w-[60ch]">
            Aucun architecte proposé. Choisissez-en un (ou plusieurs) parmi les correspondances ci-dessous.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            {activeEngagements.map((e) => {
              const a = e.architect_profiles;
              const meetingOpenHere = meetings.some(
                (m) => m.architect_id === e.architect_id && ACTIVE_MEETINGS.has(m.status),
              );
              return (
                <article key={e.architect_id} className="border border-[var(--hairline)] p-5">
                  <div className="flex flex-wrap justify-between items-baseline gap-2">
                    <h3 className="font-medium">
                      {a ? `${a.first_name} ${a.last_name}` : "Architecte"}
                      <span className="ml-2 mono text-[11px] text-concrete-2">{a?.anon_handle ?? ""}</span>
                    </h3>
                    <span className="mono uppercase text-[10px] tracking-[0.16em] text-green">
                      {ENGAGEMENT_STATUS_FR[e.status] ?? e.status}
                    </span>
                  </div>
                  {!closed && (
                    <div className="mt-4 flex flex-wrap items-end gap-4 border-t border-[var(--hairline-soft)] pt-4">
                      {!hasActiveMeeting && (
                        <form action={scheduleMeeting} className="flex flex-wrap items-end gap-3">
                          <input type="hidden" name="projectId" value={project.id} />
                          <input type="hidden" name="architectId" value={e.architect_id} />
                          <MeetingSlotFields />
                          <button className={btn}>Planifier le RDV</button>
                        </form>
                      )}
                      {e.status === "proposed" && !meetingOpenHere && (
                        <form action={withdrawProposal}>
                          <input type="hidden" name="projectId" value={project.id} />
                          <input type="hidden" name="architectId" value={e.architect_id} />
                          <button className={btnGhost}>Retirer la proposition</button>
                        </form>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
        {!closed && proposedCount >= 2 && !hasActiveMeeting && (
          <form action={askClientToChoose} className="mt-4">
            <input type="hidden" name="projectId" value={project.id} />
            <button className={btnGhost}>Demander au porteur de choisir parmi les {proposedCount} propositions</button>
          </form>
        )}
      </div>

      {/* ── Correspondances ───────────────────────────────────────────── */}
      <div className="mt-12 flex items-baseline justify-between">
        <h2 className="font-light text-2xl">Correspondances</h2>
        <Link href={`/${locale}/admin/matches`} className="eyebrow hover:text-ink">
          Re-calculer →
        </Link>
      </div>

      {matches.length === 0 ? (
        <p className="text-concrete-1 text-sm mt-4 max-w-[60ch]">
          Aucune correspondance pour ce projet. Lancez un re-calcul depuis l&apos;onglet Matches.
        </p>
      ) : (
        <div className="mt-6 space-y-5">
          {matches.map((m) => {
            const a = m.architect_profiles;
            const eng = engagementFor(m.architect_id);
            const reasons = describeReasons(m.reasons);
            const pct = Math.round((m.score / MAX_SCORE) * 100);
            const canPropose = !closed && (!eng || !ACTIVE_ENGAGEMENTS.has(eng.status)) && a?.status === "verified";
            return (
              <article key={m.architect_id} className="border border-[var(--hairline)] p-5">
                <div className="flex flex-wrap justify-between items-baseline gap-2">
                  <h3 className="font-medium">
                    {a ? `${a.first_name} ${a.last_name}` : "Architecte"}
                    {eng ? (
                      <span className="ml-3 mono uppercase text-[10px] tracking-[0.16em] text-green">
                        · {ENGAGEMENT_STATUS_FR[eng.status] ?? eng.status}
                      </span>
                    ) : null}
                  </h3>
                  <span className="mono text-green text-[13px]">{pct}%</span>
                </div>
                {a ? (
                  <p className="eyebrow mt-1">
                    {a.city} · {a.country} · {a.years_experience} ans
                    {a.rating != null ? ` · ${a.rating.toFixed(1)}/5` : ""}
                    {a.status !== "verified" ? ` · ${a.status}` : ""}
                  </p>
                ) : null}
                {a && a.specialties.length > 0 ? (
                  <p className="text-[12px] text-concrete-1 mt-2">{a.specialties.join(" · ")}</p>
                ) : null}
                <ul className="mt-3 space-y-1 text-[13px] text-concrete-2">
                  {reasons.map((r, j) => (
                    <li key={j}>
                      · {r.text} <span className="mono text-[10px] text-concrete-2">+{r.weight}</span>
                    </li>
                  ))}
                </ul>
                {canPropose && (
                  <form action={proposeArchitect} className="mt-4 border-t border-[var(--hairline-soft)] pt-4">
                    <input type="hidden" name="projectId" value={project.id} />
                    <input type="hidden" name="architectId" value={m.architect_id} />
                    <button className={btn}>Proposer cet architecte</button>
                  </form>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* ── Rendez-vous du projet ─────────────────────────────────────── */}
      {meetings.length > 0 ? (
        <div className="mt-12">
          <h2 className="font-light text-2xl">Rendez-vous</h2>
          <ul className="mt-5 space-y-3">
            {meetings.map((mt) => (
              <li key={mt.id} className="border border-[var(--hairline)] p-4 text-sm">
                <div className="flex flex-wrap justify-between items-baseline gap-3">
                  <span>
                    {when(mt.scheduled_at)}
                    {mt.architect_profiles
                      ? ` · ${mt.architect_profiles.first_name} ${mt.architect_profiles.last_name}`
                      : ""}
                    {mt.video_url ? (
                      <>
                        {" · "}
                        <a href={mt.video_url} target="_blank" rel="noopener noreferrer" className="underline">
                          lien visio
                        </a>
                      </>
                    ) : null}
                  </span>
                  <span className="mono uppercase text-[11px] tracking-[0.18em] text-concrete-1">
                    {MEETING_STATUS_FR[mt.status] ?? mt.status}
                    {mt.charter_accepted ? " · charte ✓" : ""}
                  </span>
                </div>
                {ACTIVE_MEETINGS.has(mt.status) && !closed && <MeetingActions meetingId={mt.id} status={mt.status} />}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* ── Clôture ──────────────────────────────────────────────────── */}
      {!closed && (
        <form action={closeProject} className="mt-14 border-t border-[var(--hairline)] pt-6 flex flex-wrap items-center gap-4">
          <input type="hidden" name="projectId" value={project.id} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="confirm" required />
            Clôturer ce projet (les rendez-vous encore ouverts seront annulés)
          </label>
          <button className={btnGhost}>Clôturer le projet</button>
        </form>
      )}
    </>
  );
}

function Field({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className={`mt-1 ${capitalize ? "capitalize" : ""}`}>{value}</dd>
    </div>
  );
}
