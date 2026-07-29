import { createServiceClient } from "@/lib/supabase/service";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { setMeetingStatus } from "../projets/actions";

type Row = {
  id: string;
  scheduled_at: string;
  video_url: string | null;
  status: string;
  charter_accepted: boolean;
  client_projects: { id: string; client_name: string; project_location: string } | null;
  architect_profiles: { first_name: string; last_name: string } | null;
};

const MEETING_STATUS_FR: Record<string, string> = {
  proposed: "Proposé",
  confirmed: "Confirmé",
  declined: "Décliné",
  rescheduled: "Replanifié",
  completed: "Terminé",
  cancelled: "Annulé",
};

// Un meeting « actif » (en cours de cycle) peut encore être terminé ou annulé.
const ACTIONABLE = new Set(["proposed", "confirmed", "rescheduled"]);

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminRdv() {
  const locale = await getLocale();
  const s = createServiceClient();
  const { data } = (await s
    .from("meetings")
    .select(
      "id, scheduled_at, video_url, status, charter_accepted, client_projects(id, client_name, project_location), architect_profiles(first_name, last_name)",
    )
    .order("scheduled_at", { ascending: true })) as { data: Row[] | null };
  const rows = data ?? [];

  return (
    <>
      <p className="eyebrow">Admin · Rendez-vous</p>
      <h1 className="font-light text-4xl mt-4">{rows.length} rendez-vous</h1>

      {rows.length === 0 ? (
        <p className="text-concrete-1 text-sm mt-10 max-w-[60ch]">
          Aucun rendez-vous planifié. Ouvrez une fiche projet pour choisir un architecte et
          proposer un créneau.
        </p>
      ) : (
        <div className="mt-10 space-y-4">
          {rows.map((m) => (
            <article
              key={m.id}
              className="border border-[var(--hairline)] p-5 flex flex-wrap justify-between gap-4"
            >
              <div>
                <p className="font-medium">
                  {fmtDateTime(m.scheduled_at)}
                  <span className="ml-3 mono uppercase text-[10px] tracking-[0.16em] text-green">
                    {MEETING_STATUS_FR[m.status] ?? m.status}
                    {m.charter_accepted ? " · charte ✓" : ""}
                  </span>
                </p>
                <p className="eyebrow mt-2">
                  {m.client_projects ? m.client_projects.client_name : "Projet"} ·{" "}
                  {m.client_projects?.project_location ?? "—"}
                  {m.architect_profiles
                    ? ` · ${m.architect_profiles.first_name} ${m.architect_profiles.last_name}`
                    : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-4 text-[13px]">
                  {m.video_url ? (
                    <a
                      href={m.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Lien visio →
                    </a>
                  ) : (
                    <span className="text-concrete-2">Sans lien visio</span>
                  )}
                  {m.client_projects ? (
                    <Link
                      href={`/${locale}/admin/projets/${m.client_projects.id}`}
                      className="underline"
                    >
                      Fiche projet →
                    </Link>
                  ) : null}
                </div>
              </div>

              {ACTIONABLE.has(m.status) ? (
                <div className="flex items-start gap-2">
                  <form action={setMeetingStatus}>
                    <input type="hidden" name="meetingId" value={m.id} />
                    <input type="hidden" name="status" value="completed" />
                    <button className="px-3 py-1.5 bg-ink text-paper text-[13px]">
                      Terminer
                    </button>
                  </form>
                  <form action={setMeetingStatus}>
                    <input type="hidden" name="meetingId" value={m.id} />
                    <input type="hidden" name="status" value="cancelled" />
                    <button className="px-3 py-1.5 border border-[var(--hairline)] text-[13px] hover:border-ink">
                      Annuler
                    </button>
                  </form>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
