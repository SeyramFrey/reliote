import { createServiceClient } from "@/lib/supabase/service";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { deleteAvis, setAvisPublished } from "./actions";

type Row = {
  id: string;
  author: string;
  quote_fr: string;
  published: boolean;
  sort_order: number;
};

export default async function AdminAvis() {
  const locale = await getLocale();
  const s = createServiceClient();
  const { data } = (await s
    .from("testimonials")
    .select("id, author, quote_fr, published, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })) as { data: Row[] | null };
  const rows = data ?? [];

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="eyebrow">Admin · Avis</p>
          <h1 className="font-light text-4xl mt-4">{rows.length} avis</h1>
        </div>
        <Link href={`/${locale}/admin/avis/new`} className="px-4 py-2 bg-ink text-paper text-sm">
          Nouvel avis
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-concrete-1 text-sm mt-10 max-w-[60ch]">
          Aucun avis. Tant qu&apos;aucun n&apos;est publié, la section Avis de la landing affiche
          un état d&apos;attente. Ne publier que de vrais avis, avec l&apos;accord écrit de leur
          auteur : la landing annonce qu&apos;ils sont vérifiés et non réécrits.
        </p>
      ) : (
        <div className="mt-10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left">
              <tr className="border-b border-[var(--hairline)]">
                <th className="eyebrow py-3">Auteur</th>
                <th className="eyebrow">Avis</th>
                <th className="eyebrow">Ordre</th>
                <th className="eyebrow">Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="border-b border-[var(--hairline-soft)]">
                  <td className="py-4 pr-4">{m.author}</td>
                  <td className="text-concrete-1 max-w-[36ch] truncate pr-4">{m.quote_fr}</td>
                  <td className="mono">{m.sort_order}</td>
                  <td>
                    <span
                      className={`mono uppercase text-[11px] tracking-[0.18em] ${
                        m.published ? "text-green" : "text-concrete-2"
                      }`}
                    >
                      {m.published ? "Publié" : "Brouillon"}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end items-center gap-3">
                      <form action={setAvisPublished}>
                        <input type="hidden" name="id" value={m.id} />
                        <input type="hidden" name="published" value={m.published ? "0" : "1"} />
                        <button className="underline text-[13px]">
                          {m.published ? "Dépublier" : "Publier"}
                        </button>
                      </form>
                      <Link className="underline text-[13px]" href={`/${locale}/admin/avis/${m.id}`}>
                        Éditer
                      </Link>
                      <form action={deleteAvis}>
                        <input type="hidden" name="id" value={m.id} />
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
