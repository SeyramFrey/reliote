import { createClient } from "@/lib/supabase/server";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";

type Project = {
  id: string;
  project_type: string;
  project_location: string;
  status: string;
  created_at: string;
};

type Profile = { role: string };

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
  const { data: projects } = await supabase
    .from("client_projects")
    .select("id, project_type, project_location, status, created_at")
    .order("created_at", { ascending: false }) as { data: Project[] | null };

  const rows = projects ?? [];
  return (
    <section className="page-edge py-16">
      <p className="eyebrow">Espace client</p>
      <h1 className="font-light text-[clamp(40px,5vw,72px)] leading-[1.05] mt-4">Mes projets.</h1>
      {rows.length === 0 ? (
        <p className="text-concrete-1 mt-12 max-w-[60ch]">
          Vous n&apos;avez pas encore initié de projet sur Reliote.{" "}
          <Link href={`/${locale}/projets/initier`} className="underline">Démarrer un projet</Link>.
        </p>
      ) : (
        <table className="w-full mt-12 text-sm">
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
