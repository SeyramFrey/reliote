import { createServiceClient } from "@/lib/supabase/service";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { deleteFeatured, setFeaturedPublished } from "./actions";

type Row = {
  id: string;
  title_fr: string;
  location: string | null;
  published: boolean;
  sort_order: number;
};

export default async function AdminFeatured() {
  const locale = await getLocale();
  const s = createServiceClient();
  const { data } = (await s
    .from("featured_projects")
    .select("id, title_fr, location, published, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })) as { data: Row[] | null };
  const rows = data ?? [];

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="eyebrow">Admin · Mis en lumière</p>
          <h1 className="font-light text-4xl mt-4">{rows.length} projets</h1>
        </div>
        <Link href={`/${locale}/admin/featured/new`} className="px-4 py-2 bg-ink text-paper text-sm">
          Nouveau projet
        </Link>
      </div>

      <p className="text-concrete-1 text-[13px] mt-4 max-w-[70ch]">
        La landing affiche le projet publié le mieux classé (ordre croissant). Sans projet publié,
        la section Étude de cas utilise le contenu i18n par défaut.
      </p>

      {rows.length === 0 ? (
        <p className="text-concrete-1 text-sm mt-10">Aucun projet mis en lumière.</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left">
              <tr className="border-b border-[var(--hairline)]">
                <th className="eyebrow py-3">Titre</th>
                <th className="eyebrow">Lieu</th>
                <th className="eyebrow">Ordre</th>
                <th className="eyebrow">Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => (
                <tr key={f.id} className="border-b border-[var(--hairline-soft)]">
                  <td className="py-4">{f.title_fr}</td>
                  <td className="text-concrete-1">{f.location ?? "—"}</td>
                  <td className="mono">{f.sort_order}</td>
                  <td>
                    <span
                      className={`mono uppercase text-[11px] tracking-[0.18em] ${
                        f.published ? "text-green" : "text-concrete-2"
                      }`}
                    >
                      {f.published ? "Publié" : "Brouillon"}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end items-center gap-3">
                      <form action={setFeaturedPublished}>
                        <input type="hidden" name="id" value={f.id} />
                        <input type="hidden" name="published" value={f.published ? "0" : "1"} />
                        <button className="underline text-[13px]">
                          {f.published ? "Dépublier" : "Publier"}
                        </button>
                      </form>
                      <Link className="underline text-[13px]" href={`/${locale}/admin/featured/${f.id}`}>
                        Éditer
                      </Link>
                      <form action={deleteFeatured}>
                        <input type="hidden" name="id" value={f.id} />
                        <button className="underline text-[13px] text-red-700">Suppr.</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
