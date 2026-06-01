import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

type ArchProfile = {
  full_name: string;
  status: string;
  city: string;
  specialties: string[];
  rating: number | null;
};

type Profile = { role: string };

type IncomingMatch = {
  score: number;
  reasons: { kind: string; weight: number }[];
  client_projects: {
    id: string;
    project_type: string;
    project_location: string;
    project_description: string;
    created_at: string;
  };
};

export default async function ArchitectDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() as { data: Profile | null };
  if (profile?.role !== "architect") notFound();

  const { data: archProfile } = await supabase
    .from("architect_profiles")
    .select("full_name, status, city, specialties, rating")
    .eq("user_id", user.id)
    .single() as { data: ArchProfile | null };

  const { data: matches } = await supabase
    .from("match_results")
    .select("score, reasons, client_projects!inner(id, project_type, project_location, project_description, created_at)")
    .order("score", { ascending: false }) as { data: IncomingMatch[] | null };

  return (
    <section className="page-edge py-16">
      <p className="eyebrow">Espace architecte</p>
      <h1 className="font-light text-[clamp(40px,5vw,72px)] leading-[1.05] mt-4">
        {archProfile?.full_name ?? "Bienvenue"}
      </h1>
      <p className="text-concrete-1 mt-2">
        Statut :{" "}
        <span className="mono uppercase text-[11px] tracking-[0.18em]">
          {archProfile?.status ?? "—"}
        </span>
        {archProfile?.city && <> · {archProfile.city}</>}
        {archProfile?.rating != null && <> · {archProfile.rating.toFixed(1)}★</>}
      </p>

      <h2 className="font-light text-[clamp(28px,3vw,40px)] mt-16">Projets entrants</h2>
      {(matches ?? []).length === 0 ? (
        <p className="text-concrete-1 mt-6 max-w-[60ch]">
          Aucun projet ne vous a encore été matché. Vous serez notifié dès qu&apos;un client soumet un projet compatible avec votre profil.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-[var(--gutter)]">
          {(matches ?? []).map((m) => (
            <article key={m.client_projects.id} className="border border-[var(--hairline)] p-6">
              <div className="flex justify-between items-baseline">
                <span className="eyebrow capitalize">{m.client_projects.project_type}</span>
                <span className="mono text-green text-[13px]">{Math.round((m.score / 90) * 100)}%</span>
              </div>
              <p className="mt-3 text-sm">{m.client_projects.project_description}</p>
              <p className="eyebrow mt-3">{m.client_projects.project_location}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
