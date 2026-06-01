import { createServiceClient } from "@/lib/supabase/service";
import { setArchitectStatus } from "./actions";

type Row = {
  id: string;
  full_name: string;
  city: string;
  status: "pending" | "verified" | "rejected" | "paused";
  created_at: string;
  rating: number | null;
  years_experience: number;
};

export default async function AdminArchitects() {
  const s = createServiceClient();
  const { data } = await s
    .from("architect_profiles")
    .select("id, full_name, city, status, created_at, rating, years_experience")
    .order("created_at", { ascending: false }) as { data: Row[] | null };
  const rows = data ?? [];

  return (
    <>
      <p className="eyebrow">Admin · Architectes</p>
      <h1 className="font-light text-4xl mt-4">{rows.length} architectes</h1>
      <table className="w-full mt-10 text-sm">
        <thead className="text-left">
          <tr className="border-b border-[var(--hairline)]">
            <th className="eyebrow py-3">Nom</th>
            <th className="eyebrow">Ville</th>
            <th className="eyebrow">Statut</th>
            <th className="eyebrow">Note</th>
            <th className="eyebrow">Exp.</th>
            <th className="eyebrow">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id} className="border-b border-[var(--hairline-soft)]">
              <td className="py-4">{a.full_name}</td>
              <td>{a.city}</td>
              <td>
                <span
                  className={`mono uppercase text-[11px] tracking-[0.18em] ${
                    a.status === "verified"
                      ? "text-green"
                      : a.status === "pending"
                      ? "text-brass"
                      : "text-concrete-2"
                  }`}
                >
                  {a.status}
                </span>
              </td>
              <td>{a.rating?.toFixed(1) ?? "—"}</td>
              <td>{a.years_experience} ans</td>
              <td className="space-x-3 whitespace-nowrap">
                <form action={setArchitectStatus.bind(null, a.id, "verified")} className="inline">
                  <button className="underline text-green text-xs">Valider</button>
                </form>
                <form action={setArchitectStatus.bind(null, a.id, "rejected")} className="inline">
                  <button className="underline text-concrete-1 text-xs">Refuser</button>
                </form>
                <form action={setArchitectStatus.bind(null, a.id, "paused")} className="inline">
                  <button className="underline text-concrete-1 text-xs">Pause</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
