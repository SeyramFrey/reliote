import { createClient } from "@/lib/supabase/server";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { respondToMeeting } from "./actions";

type Project = {
  id: string;
  project_type: string;
  project_location: string;
  status: string;
  created_at: string;
};

type Profile = { role: string };

type Meeting = {
  id: string;
  project_id: string;
  scheduled_at: string;
  video_url: string | null;
  status: string;
};

const MEETING_STATUS_FR: Record<string, string> = {
  proposed: "Proposé",
  confirmed: "Confirmé",
  declined: "Décliné",
  rescheduled: "Replanifié",
  completed: "Terminé",
  cancelled: "Annulé",
};

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function ClientDashboard() {
  const supabase = await createClient();
  const locale = await getLocale();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null; // layout already redirected — guard for TS narrowing
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() as { data: Profile | null };
  if (profile?.role === "architect") notFound();

  const [{ data: projects }, { data: meetingsData }] = await Promise.all([
    supabase
      .from("client_projects")
      .select("id, project_type, project_location, status, created_at")
      .order("created_at", { ascending: false }) as unknown as Promise<{ data: Project[] | null }>,
    // RLS "meetings owner read" restreint déjà aux meetings des projets du porteur.
    supabase
      .from("meetings")
      .select("id, project_id, scheduled_at, video_url, status")
      .order("scheduled_at", { ascending: true }) as unknown as Promise<{ data: Meeting[] | null }>,
  ]);

  const rows = projects ?? [];
  const meetings = meetingsData ?? [];
  const projectById = new Map(rows.map((p) => [p.id, p]));

  return (
    <section className="page-edge py-16">
      <p className="eyebrow">Espace client</p>
      <h1 className="font-light text-[clamp(40px,5vw,72px)] leading-[1.05] mt-4">Mes projets.</h1>

      {/* ── Rendez-vous à confirmer / confirmés ─────────────────────────── */}
      {meetings.length > 0 && (
        <div className="mt-14">
          <h2 className="font-light text-2xl">Vos rendez-vous.</h2>
          <div className="mt-6 space-y-4">
            {meetings.map((m) => {
              const proj = projectById.get(m.project_id);
              return (
                <article key={m.id} className="border border-[var(--hairline)] p-5">
                  <div className="flex flex-wrap justify-between items-baseline gap-2">
                    <p className="font-medium">
                      {fmtDateTime(m.scheduled_at)}
                      <span className="ml-3 mono uppercase text-[10px] tracking-[0.16em] text-green">
                        {MEETING_STATUS_FR[m.status] ?? m.status}
                      </span>
                    </p>
                    {proj ? (
                      <span className="eyebrow capitalize">
                        {proj.project_type} · {proj.project_location}
                      </span>
                    ) : null}
                  </div>

                  {m.status === "proposed" ? (
                    <form
                      action={respondToMeeting}
                      className="mt-4 border-t border-[var(--hairline-soft)] pt-4"
                    >
                      <input type="hidden" name="meetingId" value={m.id} />
                      <p className="text-sm text-concrete-1 max-w-[64ch]">
                        Reliote vous propose ce créneau avec l&apos;architecte présélectionné pour
                        votre projet. En confirmant, vous acceptez la charte de non-contournement
                        (la collaboration se mène via Reliote) et l&apos;identité de l&apos;architecte
                        vous est révélée.
                      </p>
                      {m.video_url ? (
                        <p className="mt-2 text-sm">
                          <a
                            href={m.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            Lien visio →
                          </a>
                        </p>
                      ) : null}
                      <label className="mt-4 flex items-start gap-2 text-sm">
                        <input type="checkbox" name="charter" required className="mt-1" />
                        <span>J&apos;accepte la charte de non-contournement Reliote.</span>
                      </label>
                      <div className="mt-4 flex gap-2">
                        <button
                          name="decision"
                          value="confirm"
                          className="px-4 py-2 bg-ink text-paper text-sm"
                        >
                          Confirmer le RDV
                        </button>
                        <button
                          name="decision"
                          value="decline"
                          formNoValidate
                          className="px-4 py-2 border border-[var(--hairline)] text-sm hover:border-ink"
                        >
                          Décliner
                        </button>
                      </div>
                    </form>
                  ) : m.status === "confirmed" ? (
                    <p className="mt-3 text-sm text-concrete-1">
                      RDV confirmé.{" "}
                      {m.video_url ? (
                        <a
                          href={m.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          Lien visio →
                        </a>
                      ) : null}{" "}
                      <Link href={`/${locale}/architectes`} className="underline">
                        Voir l&apos;architecte →
                      </Link>
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Projets ─────────────────────────────────────────────────────── */}
      {rows.length === 0 ? (
        <p className="text-concrete-1 mt-12 max-w-[60ch]">
          Vous n&apos;avez pas encore initié de projet sur Reliote.{" "}
          <Link href={`/${locale}/projets/initier`} className="underline">Démarrer un projet</Link>.
        </p>
      ) : (
        <table className="w-full mt-14 text-sm">
          <thead className="text-left">
            <tr className="border-b border-[var(--hairline)]">
              <th className="eyebrow py-3">Type</th>
              <th className="eyebrow">Lieu</th>
              <th className="eyebrow">Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-[var(--hairline-soft)]">
                <td className="py-4 capitalize">{p.project_type}</td>
                <td>{p.project_location}</td>
                <td><span className="mono uppercase text-[11px] tracking-[0.18em]">{p.status}</span></td>
                <td className="text-right">
                  <Link className="underline" href={`/${locale}/projets/${p.id}/confirmation`}>Voir →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
