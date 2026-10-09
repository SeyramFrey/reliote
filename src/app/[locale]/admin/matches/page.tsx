import { createServiceClient } from "@/lib/supabase/service";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { MAX_SCORE } from "@/lib/matching/score";
import { describeReasons } from "@/lib/matching/reasons";
import { RecalculateButton } from "@/components/admin/RecalculateButton";

type Project = { id: string; client_name: string; project_type: string; project_country: string; project_location: string };
type Match = {
  score: number;
  reasons: unknown;
  architect_profiles: { first_name: string; last_name: string; city: string; country: string; specialties: string[] };
};

export default async function AdminMatches({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const locale = await getLocale();
  const { project } = await searchParams;
  const s = createServiceClient();
  const { data: projectsData } = (await s
    .from("client_projects")
    .select("id, client_name, project_type, project_country, project_location")
    .order("created_at", { ascending: false })) as { data: Project[] | null };
  const projects = projectsData ?? [];
  const selected = projects.find((p) => p.id === project) ?? projects[0];

  const { data: matchData } = selected
    ? ((await s
        .from("match_results")
        .select("score, reasons, architect_profiles!inner(first_name, last_name, city, country, specialties)")
        .eq("project_id", selected.id)
        .order("score", { ascending: false })) as { data: Match[] | null })
    : { data: [] as Match[] };
  const matches = matchData ?? [];

  return (
    <>
      <p className="eyebrow">Admin · Matches</p>
      <h1 className="font-light text-4xl mt-4">Mises en relation</h1>
      <div className="mt-10 grid grid-cols-12 gap-6">
        <ul className="col-span-12 md:col-span-4 space-y-1">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/${locale}/admin/matches?project=${p.id}`}
                className={`block text-left text-sm w-full py-2 border-l-2 pl-3 transition-colors ${
                  selected?.id === p.id ? "border-green text-ink" : "border-transparent text-concrete-1 hover:text-ink"
                }`}
              >
                {p.client_name} — {p.project_type}
                <br />
                <span className="eyebrow">
                  {p.project_location}, {p.project_country}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="col-span-12 md:col-span-8">
          {selected ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <RecalculateButton projectId={selected.id} />
              <Link href={`/${locale}/admin/projets/${selected.id}`} className="eyebrow hover:text-ink">
                Fiche projet →
              </Link>
            </div>
          ) : null}
          <div className="mt-6 space-y-4">
            {matches.map((m, i) => (
              <article key={i} className="border border-[var(--hairline)] p-5">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-medium">
                    {m.architect_profiles.first_name} {m.architect_profiles.last_name}
                  </h3>
                  <span className="mono text-green text-[13px]">{Math.round((m.score / MAX_SCORE) * 100)}%</span>
                </div>
                <p className="eyebrow mt-1">
                  {m.architect_profiles.city} · {m.architect_profiles.country}
                </p>
                <p className="text-[12px] text-concrete-1 mt-2">{m.architect_profiles.specialties.join(" · ")}</p>
                <ul className="mt-3 space-y-1 text-[13px] text-concrete-2">
                  {describeReasons(m.reasons).map((r, j) => (
                    <li key={j}>
                      · {r.text} <span className="mono text-[10px]">+{r.weight}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
            {matches.length === 0 && <p className="text-concrete-1 text-sm">Aucun match pour ce projet.</p>}
          </div>
        </div>
      </div>
    </>
  );
}
