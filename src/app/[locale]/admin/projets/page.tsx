import { createServiceClient } from "@/lib/supabase/service";
import { getLocale } from "next-intl/server";
import Link from "next/link";

type Row = {
  id: string;
  client_name: string;
  project_type: string;
  project_location: string;
  status: string;
  created_at: string;
};

export default async function AdminProjects() {
  const locale = await getLocale();
  const s = createServiceClient();
  const { data } = await s
    .from("client_projects")
    .select("id, client_name, project_type, project_location, status, created_at")
    .order("created_at", { ascending: false }) as { data: Row[] | null };
  const rows = data ?? [];

  return (
    <>
      <p className="eyebrow">Admin · Projets</p>
      <h1 className="font-light text-4xl mt-4">{rows.length} projets</h1>
      <div className="mt-10 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left">
          <tr className="border-b border-[var(--hairline)]">
            <th className="eyebrow py-3">Client</th>
            <th className="eyebrow">Type</th>
            <th className="eyebrow">Lieu</th>
            <th className="eyebrow">Statut</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-b border-[var(--hairline-soft)]">
              <td className="py-4">{p.client_name}</td>
              <td className="capitalize">{p.project_type}</td>
              <td>{p.project_location}</td>
              <td><span className="mono uppercase text-[11px] tracking-[0.18em]">{p.status}</span></td>
              <td className="text-right">
                <Link className="underline" href={`/${locale}/projets/${p.id}/confirmation`}>Détails →</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  );
}
