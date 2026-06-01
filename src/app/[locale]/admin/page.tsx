import { createServiceClient } from "@/lib/supabase/service";

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="border-t border-[var(--hairline)] pt-4">
      <span className="font-display text-5xl">{value}</span>
      <p className="eyebrow mt-2">{title}</p>
    </div>
  );
}

type StatusRow = { status: string };

export default async function AdminOverview() {
  const s = createServiceClient();
  const [aRes, pRes, mRes] = await Promise.all([
    s.from("architect_profiles").select("status") as unknown as Promise<{ data: StatusRow[] | null; count: number | null }>,
    s.from("client_projects").select("status") as unknown as Promise<{ data: StatusRow[] | null; count: number | null }>,
    s.from("match_results").select("id", { count: "exact", head: true }) as unknown as Promise<{ count: number | null }>,
  ]);

  const archRows = aRes.data ?? [];
  const projRows = pRes.data ?? [];

  const count = (rows: StatusRow[], status: string) => rows.filter((r) => r.status === status).length;

  return (
    <>
      <p className="eyebrow">Admin · Vue d&apos;ensemble</p>
      <h1 className="font-light text-[clamp(40px,4vw,56px)] mt-4">Reliote · MVP</h1>
      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card title="Architectes total" value={archRows.length} />
        <Card title="Vérifiés" value={count(archRows, "verified")} />
        <Card title="En attente" value={count(archRows, "pending")} />
        <Card title="Refusés" value={count(archRows, "rejected")} />
        <Card title="Projets total" value={projRows.length} />
        <Card title="Nouveaux" value={count(projRows, "new")} />
        <Card title="Matchés" value={count(projRows, "matched")} />
        <Card title="Matches" value={mRes.count ?? 0} />
      </div>
    </>
  );
}
