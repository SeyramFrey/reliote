import { createServiceClient } from "@/lib/supabase/service";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MAX_SCORE } from "@/lib/matching/score";
import { describeReasons } from "@/lib/matching/reasons";
import { selectArchitect, scheduleMeeting } from "../actions";

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
  city: string;
  country: string;
  specialties: string[];
  availability: string;
  rating: number | null;
  years_experience: number;
};

type MatchRow = {
  architect_id: string;
  score: number;
  reasons: unknown;
  architect_profiles: ArchitectLite | null;
};

type Engagement = { architect_id: string; status: string };

type MeetingRow = {
  id: string;
  architect_id: string;
  scheduled_at: string;
  video_url: string | null;
  status: string;
  charter_accepted: boolean;
  architect_profiles: { first_name: string; last_name: string } | null;
};

const PROJECT_STATUS_FR: Record<string, string> = {
  new: "Nouveau",
  matched: "Matché",
  selected: "Architecte choisi",
  meeting_proposed: "RDV proposé",
  meeting_confirmed: "RDV confirmé",
  in_review: "En revue",
  closed: "Clôturé",
};

const MEETING_STATUS_FR: Record<string, string> = {
  proposed: "Proposé",
  confirmed: "Confirmé",
  declined: "Décliné",
  rescheduled: "Replanifié",
  completed: "Terminé",
  cancelled: "Annulé",
};

const ENGAGEMENT_STATUS_FR: Record<string, string> = {
  proposed: "Proposé",
  engaged: "Engagé",
  declined: "Décliné",
  cancelled: "Annulé",
  expired: "Expiré",
};

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminProjectDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
        "architect_id, score, reasons, architect_profiles(first_name, last_name, city, country, specialties, availability, rating, years_experience)",
      )
      .eq("project_id", id)
      .order("score", { ascending: false }) as unknown as Promise<{ data: MatchRow[] | null }>,
    s
      .from("client_engagements")
      .select("architect_id, status")
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
  const engagementFor = (architectId: string) =>
    engagements.find((e) => e.architect_id === architectId);

  return (
    <>
      <Link href={`/${locale}/admin/projets`} className="eyebrow hover:text-ink">
        ← Tous les projets
      </Link>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-light text-4xl capitalize">{project.client_name}</h1>
        <span className="mono uppercase text-[11px] tracking-[0.18em] text-green">
          {PROJECT_STATUS_FR[project.status] ?? project.status}
        </span>
      </div>
      <p className="eyebrow mt-2">Projet · #{project.id.slice(0, 8)}</p>

      {/* ── Brief ─────────────────────────────────────────────────────── */}
      <section
        className="border border-[var(--hairline)] mt-8 p-6"
        style={{ background: "var(--paper-2)" }}
      >
        <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 text-sm">
          <Field label="Type" value={project.project_type} capitalize />
          <Field label="Pays du chantier" value={project.project_country} />
          <Field label="Localité / site" value={project.project_location} />
          <Field label="Budget" value={project.budget_range ?? "—"} />
          <Field label="Échéance" value={project.timeline ?? "—"} />
          <Field
            label="Spécialités requises"
            value={project.required_specialties.join(" · ") || "—"}
          />
          <Field label="Contact" value={project.email} />
          <Field label="Téléphone" value={project.phone ?? "—"} />
          <Field label="Déposé le" value={fmtDateTime(project.created_at)} />
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

      {/* ── Correspondances ───────────────────────────────────────────── */}
      <div className="mt-12 flex items-baseline justify-between">
        <h2 className="font-light text-2xl">Correspondances</h2>
        <Link
          href={`/${locale}/admin/matches`}
          className="eyebrow hover:text-ink"
        >
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
            return (
              <article
                key={m.architect_id}
                className="border border-[var(--hairline)] p-5"
              >
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
                  </p>
                ) : null}
                {a && a.specialties.length > 0 ? (
                  <p className="text-[12px] text-concrete-1 mt-2">
                    {a.specialties.join(" · ")}
                  </p>
                ) : null}

                <ul className="mt-3 space-y-1 text-[13px] text-concrete-2">
                  {reasons.map((r, j) => (
                    <li key={j}>
                      · {r.text}{" "}
                      <span className="mono text-[10px] text-concrete-2">+{r.weight}</span>
                    </li>
                  ))}
                </ul>

                {/* Actions : choisir puis planifier */}
                <div className="mt-4 flex flex-wrap items-end gap-4 border-t border-[var(--hairline-soft)] pt-4">
                  {!eng ? (
                    <form action={selectArchitect}>
                      <input type="hidden" name="projectId" value={project.id} />
                      <input type="hidden" name="architectId" value={m.architect_id} />
                      <button className="px-4 py-2 bg-ink text-paper text-sm">
                        Choisir cet architecte
                      </button>
                    </form>
                  ) : (
                    <form
                      action={scheduleMeeting}
                      className="flex flex-wrap items-end gap-3"
                    >
                      <input type="hidden" name="projectId" value={project.id} />
                      <input type="hidden" name="architectId" value={m.architect_id} />
                      <label className="block">
                        <span className="eyebrow">Créneau proposé</span>
                        <input
                          type="datetime-local"
                          name="scheduledAt"
                          required
                          className="block mt-1 bg-transparent border-b border-[var(--hairline)] py-1.5 text-sm outline-none focus:border-green"
                        />
                      </label>
                      <label className="block">
                        <span className="eyebrow">Lien visio</span>
                        <input
                          type="url"
                          name="videoUrl"
                          placeholder="https://meet…"
                          className="block mt-1 bg-transparent border-b border-[var(--hairline)] py-1.5 text-sm outline-none focus:border-green min-w-[220px]"
                        />
                      </label>
                      <button className="px-4 py-2 bg-ink text-paper text-sm">
                        Planifier un RDV
                      </button>
                    </form>
                  )}
                </div>
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
              <li
                key={mt.id}
                className="border border-[var(--hairline)] p-4 flex flex-wrap justify-between items-baseline gap-3 text-sm"
              >
                <span>
                  {fmtDateTime(mt.scheduled_at)}
                  {mt.architect_profiles
                    ? ` · ${mt.architect_profiles.first_name} ${mt.architect_profiles.last_name}`
                    : ""}
                  {mt.video_url ? (
                    <>
                      {" · "}
                      <a
                        href={mt.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        lien visio
                      </a>
                    </>
                  ) : null}
                </span>
                <span className="mono uppercase text-[11px] tracking-[0.18em] text-concrete-1">
                  {MEETING_STATUS_FR[mt.status] ?? mt.status}
                  {mt.charter_accepted ? " · charte ✓" : ""}
                </span>
              </li>
            ))}
          </ul>
          <p className="eyebrow mt-3">
            Gérer les statuts (terminer / annuler) depuis l&apos;onglet{" "}
            <Link href={`/${locale}/admin/rdv`} className="underline hover:text-ink">
              RDV
            </Link>
            .
          </p>
        </div>
      ) : null}
    </>
  );
}

function Field({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className={`mt-1 ${capitalize ? "capitalize" : ""}`}>{value}</dd>
    </div>
  );
}
