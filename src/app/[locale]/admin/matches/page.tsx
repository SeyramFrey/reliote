"use client";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Project = { id: string; client_name: string; project_type: string; project_location: string };
type Match = {
  score: number;
  reasons: { kind: string; weight: number }[];
  architect_profiles: { first_name: string; last_name: string; city: string; specialties: string[] };
};

export default function AdminMatches() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [busy, setBusy] = useState(false);

  const loadProjects = useCallback(async () => {
    const s = createClient();
    const { data } = await s
      .from("client_projects")
      .select("id, client_name, project_type, project_location")
      .order("created_at", { ascending: false }) as { data: Project[] | null };
    const rows = data ?? [];
    setProjects(rows);
    if (rows.length > 0 && !selected) setSelected(rows[0].id);
  }, [selected]);

  const loadMatches = useCallback(async (projectId: string) => {
    const s = createClient();
    const { data } = await s
      .from("match_results")
      .select("score, reasons, architect_profiles!inner(first_name, last_name, city, specialties)")
      .eq("project_id", projectId)
      .order("score", { ascending: false }) as { data: Match[] | null };
    setMatches(data ?? []);
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);
  useEffect(() => { if (selected) loadMatches(selected); }, [selected, loadMatches]);

  async function recalc() {
    if (!selected) return;
    setBusy(true);
    await fetch(`/api/admin/match/recalculate?projectId=${selected}`, { method: "POST" });
    await loadMatches(selected);
    setBusy(false);
  }

  return (
    <>
      <p className="eyebrow">Admin · Matches</p>
      <h1 className="font-light text-4xl mt-4">Mises en relation</h1>
      <div className="mt-10 grid grid-cols-12 gap-6">
        <ul className="col-span-12 md:col-span-4 space-y-1">
          {projects.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => setSelected(p.id)}
                className={`text-left text-sm w-full py-2 border-l-2 pl-3 transition-colors ${
                  selected === p.id ? "border-green text-ink" : "border-transparent text-concrete-1 hover:text-ink"
                }`}
              >
                <span className="capitalize">{p.client_name} — {p.project_type}</span>
                <br />
                <span className="eyebrow">{p.project_location}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="col-span-12 md:col-span-8">
          <button
            onClick={recalc}
            disabled={busy || !selected}
            className="px-4 py-2 bg-ink text-paper text-sm disabled:opacity-50"
          >
            {busy ? "…" : "Re-calculer"}
          </button>
          <div className="mt-6 space-y-4">
            {matches.map((m, i) => (
              <article key={i} className="border border-[var(--hairline)] p-5">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-medium">{m.architect_profiles.first_name} {m.architect_profiles.last_name}</h3>
                  <span className="mono text-green text-[13px]">{Math.round((m.score / 90) * 100)}%</span>
                </div>
                <p className="eyebrow mt-1">{m.architect_profiles.city}</p>
                <p className="text-[12px] text-concrete-1 mt-2">{m.architect_profiles.specialties.join(" · ")}</p>
                <ul className="mt-3 space-y-1 text-[12px] mono text-concrete-2">
                  {m.reasons.map((r, j) => (
                    <li key={j}>· {r.kind} (+{r.weight})</li>
                  ))}
                </ul>
              </article>
            ))}
            {matches.length === 0 && (
              <p className="text-concrete-1 text-sm">Aucun match pour ce projet.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
