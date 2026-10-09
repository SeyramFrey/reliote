import { createServiceClient } from "@/lib/supabase/service";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { countryTimeZone, formatMeetingTime } from "@/lib/time/meetingTime";
import { MEETING_STATUS_FR } from "@/lib/workflow/labels";
import { MeetingActions } from "@/components/admin/MeetingActions";

type Row = {
  id: string;
  scheduled_at: string;
  video_url: string | null;
  status: string;
  charter_accepted: boolean;
  client_projects: { id: string; client_name: string; project_country: string; project_location: string } | null;
  architect_profiles: { first_name: string; last_name: string } | null;
};

// Un RDV « ouvert » peut encore être replanifié, terminé (si confirmé) ou annulé.
const ACTIONABLE = new Set(["proposed", "confirmed", "rescheduled"]);

export default async function AdminRdv() {
  const locale = await getLocale();
  const s = createServiceClient();
  const { data } = (await s
    .from("meetings")
    .select(
      "id, scheduled_at, video_url, status, charter_accepted, client_projects(id, client_name, project_country, project_location), architect_profiles(first_name, last_name)",
    )
    .order("scheduled_at", { ascending: true })) as { data: Row[] | null };
  const rows = data ?? [];
  const open = rows.filter((m) => ACTIONABLE.has(m.status));
  const past = rows.filter((m) => !ACTIONABLE.has(m.status));

  return (
    <>
      <p className="eyebrow">Admin · Rendez-vous</p>
      <h1 className="font-light text-4xl mt-4">
        {open.length} rendez-vous ouvert{open.length > 1 ? "s" : ""}
      </h1>

      {rows.length === 0 ? (
        <p className="text-concrete-1 text-sm mt-10 max-w-[60ch]">
          Aucun rendez-vous planifié. Ouvrez une fiche projet pour proposer un architecte et un créneau.
        </p>
      ) : (
        <div className="mt-10 space-y-4">
          {[...open, ...past].map((m) => (
            <article key={m.id} className="border border-[var(--hairline)] p-5">
              <p className="font-medium">
                {formatMeetingTime(m.scheduled_at, {
                  locale: "fr",
                  projectTimeZone: countryTimeZone(m.client_projects?.project_country ?? ""),
                })}
                <span className="ml-3 mono uppercase text-[10px] tracking-[0.16em] text-green">
                  {MEETING_STATUS_FR[m.status] ?? m.status}
                  {m.charter_accepted ? " · charte ✓" : ""}
                </span>
              </p>
              <p className="eyebrow mt-2">
                {m.client_projects ? m.client_projects.client_name : "Projet"} ·{" "}
                {m.client_projects
                  ? `${m.client_projects.project_location}, ${m.client_projects.project_country}`
                  : "—"}
                {m.architect_profiles
                  ? ` · ${m.architect_profiles.first_name} ${m.architect_profiles.last_name}`
                  : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-4 text-[13px]">
                {m.video_url ? (
                  <a href={m.video_url} target="_blank" rel="noopener noreferrer" className="underline">
                    Lien visio →
                  </a>
                ) : (
                  <span className="text-concrete-2">Sans lien visio</span>
                )}
                {m.client_projects ? (
                  <Link href={`/${locale}/admin/projets/${m.client_projects.id}`} className="underline">
                    Fiche projet →
                  </Link>
                ) : null}
              </div>
              {ACTIONABLE.has(m.status) ? <MeetingActions meetingId={m.id} status={m.status} returnTo={`/${locale}/admin/rdv`} /> : null}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
