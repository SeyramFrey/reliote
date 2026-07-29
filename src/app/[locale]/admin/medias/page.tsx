import { createServiceClient } from "@/lib/supabase/service";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { deleteMedia, setMediaPublished } from "./actions";

type Row = {
  id: string;
  title_fr: string;
  published: boolean;
  sort_order: number;
  date: string | null;
};

export default async function AdminMedias() {
  const locale = await getLocale();
  const s = createServiceClient();
  const { data } = (await s
    .from("media_items")
    .select("id, title_fr, published, sort_order, date")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })) as { data: Row[] | null };
  const rows = data ?? [];

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="eyebrow">Admin · Médias</p>
          <h1 className="font-light text-4xl mt-4">{rows.length} médias</h1>
        </div>
        <Link href={`/${locale}/admin/medias/new`} className="px-4 py-2 bg-ink text-paper text-sm">
          Nouveau média
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-concrete-1 text-sm mt-10 max-w-[60ch]">
          Aucun média. La section Journal de la landing utilise le contenu i18n par défaut tant
          qu&apos;aucun média n&apos;est publié.
        </p>
      ) : (
        <div className="mt-10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left">
              <tr className="border-b border-[var(--hairline)]">
                <th className="eyebrow py-3">Titre</th>
                <th className="eyebrow">Date</th>
                <th className="eyebrow">Ordre</th>
                <th className="eyebrow">Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="border-b border-[var(--hairline-soft)]">
                  <td className="py-4">{m.title_fr}</td>
                  <td className="text-concrete-1">{m.date ?? "—"}</td>
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
                      <form action={setMediaPublished}>
                        <input type="hidden" name="id" value={m.id} />
                        <input type="hidden" name="published" value={m.published ? "0" : "1"} />
                        <button className="underline text-[13px]">
                          {m.published ? "Dépublier" : "Publier"}
                        </button>
                      </form>
                      <Link className="underline text-[13px]" href={`/${locale}/admin/medias/${m.id}`}>
                        Éditer
                      </Link>
                      <form action={deleteMedia}>
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
