import { createServiceClient } from "@/lib/supabase/service";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { PROJECT_STATUS_FR } from "@/lib/workflow/labels";
import { countryTimeZone, formatMeetingTime } from "@/lib/time/meetingTime";

type Project = { id: string; client_name: string; status: string; project_country: string; created_at: string };
type Engagement = { project_id: string; status: string };
type Meeting = { id: string; project_id: string; status: string; scheduled_at: string };

const OPEN_MEETINGS = new Set(["proposed", "rescheduled", "confirmed"]);
const PROJECT_ORDER = ["new", "matched", "selected", "meeting_proposed", "meeting_confirmed", "in_review", "closed"];

// RDV ouverts dans les 7 prochains jours.
function nextSevenDays(meetings: Meeting[]): Meeting[] {
  const now = Date.now();
  const week = now + 7 * 24 * 3600 * 1000;
  return meetings.filter((m) => {
    const t = new Date(m.scheduled_at).getTime();
    return OPEN_MEETINGS.has(m.status) && t >= now && t <= week;
  });
}

function Card({ title, value, href }: { title: string; value: number; href?: string }) {
  const inner = (
    <>
      <span className="font-display text-5xl">{value}</span>
      <p className="eyebrow mt-2">{title}</p>
    </>
  );
  return (
    <div className="border-t border-[var(--hairline)] pt-4">
      {href ? (
        <Link href={href} className="block hover:text-green">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </div>
  );
}

export default async function AdminOverview() {
  const locale = await getLocale();
  const s = createServiceClient();
  const [{ data: archData }, { data: projData }, { data: engData }, { data: meetData }] = await Promise.all([
    s.from("architect_profiles").select("status") as unknown as Promise<{ data: { status: string }[] | null }>,
    s
      .from("client_projects")
      .select("id, client_name, status, project_country, created_at")
      .order("created_at", { ascending: false }) as unknown as Promise<{ data: Project[] | null }>,
    s.from("client_engagements").select("project_id, status") as unknown as Promise<{ data: Engagement[] | null }>,
    s
      .from("meetings")
      .select("id, project_id, status, scheduled_at")
      .order("scheduled_at", { ascending: true }) as unknown as Promise<{ data: Meeting[] | null }>,
  ]);
  const architects = archData ?? [];
  const projects = projData ?? [];
  const engagements = engData ?? [];
  const meetings = meetData ?? [];
  const projectById = new Map(projects.map((p) => [p.id, p]));

  const archCount = (st: string) => architects.filter((a) => a.status === st).length;
  const projCount = (st: string) => projects.filter((p) => p.status === st).length;
  const openMeeting = (pid: string) => meetings.some((m) => m.project_id === pid && OPEN_MEETINGS.has(m.status));
  const proposedCount = (pid: string) =>
    engagements.filter((e) => e.project_id === pid && e.status === "proposed").length;

  // Ce qui attend une action de l'admin.
  const toSelect = projects.filter((p) => p.status === "matched" || p.status === "new");
  const awaitingChoice = projects.filter(
    (p) => p.status !== "closed" && proposedCount(p.id) >= 2 && !openMeeting(p.id),
  );
  const toSchedule = projects.filter(
    (p) => p.status === "selected" && proposedCount(p.id) === 1 && !openMeeting(p.id),
  );
  const upcoming = nextSevenDays(meetings);

  const projectLink = (p: Project) => (
    <li key={p.id}>
      <Link href={`/${locale}/admin/projets/${p.id}`} className="underline">
        {p.client_name}
      </Link>{" "}
      <span className="text-concrete-2">· {p.project_country}</span>
    </li>
  );

  return (
    <>
      <p className="eyebrow">Admin · Vue d&apos;ensemble</p>
      <h1 className="font-light text-[clamp(40px,4vw,56px)] mt-4">Reliote</h1>

      <h2 className="font-light text-2xl mt-12">À traiter</h2>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 text-sm">
        <section className="border border-[var(--hairline)] p-5">
          <p className="eyebrow">Dossiers architectes à vérifier</p>
          <p className="font-display text-4xl mt-2">{archCount("pending")}</p>
          <Link href={`/${locale}/admin/architectes?status=pending`} className="underline mt-2 inline-block">
            Ouvrir la liste →
          </Link>
        </section>
        <section className="border border-[var(--hairline)] p-5">
          <p className="eyebrow">Projets à sélectionner</p>
          <ul className="mt-3 space-y-1">{toSelect.slice(0, 6).map(projectLink)}</ul>
          {toSelect.length === 0 && <p className="text-concrete-2 mt-3">Rien en attente.</p>}
        </section>
        <section className="border border-[var(--hairline)] p-5">
          <p className="eyebrow">RDV à planifier</p>
          <ul className="mt-3 space-y-1">{toSchedule.slice(0, 6).map(projectLink)}</ul>
          {toSchedule.length === 0 && <p className="text-concrete-2 mt-3">Rien en attente.</p>}
        </section>
        <section className="border border-[var(--hairline)] p-5">
          <p className="eyebrow">Porteurs en train de choisir</p>
          <ul className="mt-3 space-y-1">{awaitingChoice.slice(0, 6).map(projectLink)}</ul>
          {awaitingChoice.length === 0 && <p className="text-concrete-2 mt-3">Aucun.</p>}
        </section>
      </div>

      <h2 className="font-light text-2xl mt-12">Rendez-vous des 7 prochains jours</h2>
      {upcoming.length === 0 ? (
        <p className="text-concrete-1 text-sm mt-4">Aucun rendez-vous prévu.</p>
      ) : (
        <ul className="mt-4 space-y-2 text-sm">
          {upcoming.map((m) => {
            const p = projectById.get(m.project_id);
            return (
              <li key={m.id}>
                {formatMeetingTime(m.scheduled_at, {
                  locale: "fr",
                  projectTimeZone: countryTimeZone(p?.project_country ?? ""),
                })}{" "}
                ·{" "}
                <Link href={`/${locale}/admin/projets/${m.project_id}`} className="underline">
                  {p?.client_name ?? "Projet"}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="font-light text-2xl mt-12">Projets par étape</h2>
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-6">
        {PROJECT_ORDER.map((st) => (
          <Card key={st} title={PROJECT_STATUS_FR[st]} value={projCount(st)} />
        ))}
      </div>

      <h2 className="font-light text-2xl mt-12">Architectes</h2>
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card title="Vérifiés" value={archCount("verified")} href={`/${locale}/admin/architectes?status=verified`} />
        <Card title="À vérifier" value={archCount("pending")} href={`/${locale}/admin/architectes?status=pending`} />
        <Card title="En pause" value={archCount("paused")} href={`/${locale}/admin/architectes?status=paused`} />
        <Card title="Refusés" value={archCount("rejected")} href={`/${locale}/admin/architectes?status=rejected`} />
      </div>
    </>
  );
}
