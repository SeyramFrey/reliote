import { createServiceClient } from "@/lib/supabase/service";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { setArchitectStatus } from "./actions";
import { ARCHITECT_STATUS_FR } from "@/lib/workflow/labels";

type Status = "pending" | "verified" | "rejected" | "paused";

type Row = {
  id: string;
  first_name: string;
  last_name: string;
  structure: string | null;
  ordre_number: string | null;
  city: string;
  country: string;
  status: Status;
  created_at: string;
  rating: number | null;
  years_experience: number;
};


const FILTERS: (Status | "all")[] = ["pending", "verified", "paused", "rejected", "all"];

export default async function AdminArchitects({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const locale = await getLocale();
  const { status } = await searchParams;
  // Par défaut : les dossiers à vérifier, c'est le travail du jour.
  const filter = (FILTERS as string[]).includes(status ?? "") ? (status as Status | "all") : "pending";
  const s = createServiceClient();
  let q = s
    .from("architect_profiles")
    .select("id, first_name, last_name, structure, ordre_number, city, country, status, created_at, rating, years_experience")
    .order("created_at", { ascending: false });
  if (filter !== "all") q = q.eq("status", filter);
  const { data } = (await q) as { data: Row[] | null };
  const rows = data ?? [];

  return (
    <>
      <p className="eyebrow">Admin · Architectes</p>
      <h1 className="font-light text-4xl mt-4">
        {rows.length} architecte{rows.length > 1 ? "s" : ""}
        {filter !== "all" ? ` · ${ARCHITECT_STATUS_FR[filter].toLowerCase()}` : ""}
      </h1>
      <nav className="mt-6 flex flex-wrap gap-2 text-sm" aria-label="Filtrer par statut">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={`/${locale}/admin/architectes?status=${f}`}
            aria-current={f === filter ? "page" : undefined}
            className={`px-3 py-1.5 border ${f === filter ? "bg-ink text-paper border-ink" : "border-[var(--hairline)] hover:border-ink"}`}
          >
            {f === "all" ? "Tous" : ARCHITECT_STATUS_FR[f]}
          </Link>
        ))}
      </nav>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-sm min-w-[860px]">
          <thead className="text-left">
            <tr className="border-b border-[var(--hairline)]">
              <th className="eyebrow py-3">Nom</th>
              <th className="eyebrow">Structure</th>
              <th className="eyebrow">N° d&apos;ordre</th>
              <th className="eyebrow">Ville · Pays</th>
              <th className="eyebrow">Statut</th>
              <th className="eyebrow">Exp.</th>
              <th className="eyebrow">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-b border-[var(--hairline-soft)]">
                <td className="py-4">
                  <Link href={`/${locale}/admin/architectes/${a.id}`} className="underline">
                    {a.first_name} {a.last_name}
                  </Link>
                </td>
                <td className="text-concrete-1">{a.structure ?? "—"}</td>
                <td className="mono text-[12px]">{a.ordre_number ?? "—"}</td>
                <td>
                  {a.city} · {a.country}
                </td>
                <td>
                  <span
                    className={`mono uppercase text-[11px] tracking-[0.18em] ${
                      a.status === "verified" ? "text-green" : a.status === "pending" ? "text-gold-deep" : "text-concrete-2"
                    }`}
                  >
                    {ARCHITECT_STATUS_FR[a.status]}
                  </span>
                </td>
                <td>{a.years_experience} ans</td>
                <td className="space-x-3 whitespace-nowrap">
                  <Link href={`/${locale}/admin/architectes/${a.id}`} className="underline text-xs">
                    Dossier →
                  </Link>
                  {a.status !== "verified" && (
                    <form action={setArchitectStatus.bind(null, a.id, "verified")} className="inline">
                      <button className="underline text-green text-xs">Valider</button>
                    </form>
                  )}
                  {a.status !== "rejected" && (
                    <form action={setArchitectStatus.bind(null, a.id, "rejected")} className="inline">
                      <button className="underline text-concrete-1 text-xs">Refuser</button>
                    </form>
                  )}
                  {a.status === "verified" && (
                    <form action={setArchitectStatus.bind(null, a.id, "paused")} className="inline">
                      <button className="underline text-concrete-1 text-xs">Pause</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
