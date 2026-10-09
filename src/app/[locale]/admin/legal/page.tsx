import { createServiceClient } from "@/lib/supabase/service";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { setLegalPublished } from "./actions";

type Row = {
  id: string;
  slug: string;
  title_fr: string;
  body_fr: string;
  published: boolean;
  sort_order: number;
  updated_at: string;
};

export default async function AdminLegal() {
  const locale = await getLocale();
  const s = createServiceClient();
  const { data } = (await s
    .from("legal_pages")
    .select("id, slug, title_fr, body_fr, published, sort_order, updated_at")
    .order("sort_order", { ascending: true })) as { data: Row[] | null };
  const rows = data ?? [];
  const published = rows.filter((r) => r.published).length;

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="eyebrow">Admin · Pages légales</p>
          <h1 className="font-light text-4xl mt-4">
            {published} publiée{published > 1 ? "s" : ""} sur {rows.length}
          </h1>
        </div>
      </div>

      <p className="text-concrete-1 text-sm mt-6 max-w-[68ch]">
        Le contenu livré est un <strong>brouillon</strong> rédigé à partir de ce que
        l&apos;application collecte réellement. Il doit être relu par un juriste avant
        publication : ces textes engagent Reliote. Une page non publiée renvoie un 404
        public — rien ne fuite pendant la relecture.
      </p>

      <div className="mt-10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left">
            <tr className="border-b border-[var(--hairline)]">
              <th className="eyebrow py-3">Page</th>
              <th className="eyebrow">URL</th>
              <th className="eyebrow">Corps FR</th>
              <th className="eyebrow">Révision</th>
              <th className="eyebrow">Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-[var(--hairline-soft)]">
                <td className="py-4">{r.title_fr}</td>
                <td className="mono text-[12px] text-concrete-1">/{locale}/legal/{r.slug}</td>
                <td className="mono text-[12px] text-concrete-1">
                  {r.body_fr ? `${r.body_fr.length.toLocaleString("fr-FR")} car.` : "vide"}
                </td>
                <td className="mono text-[12px] text-concrete-1">
                  {new Intl.DateTimeFormat("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                  }).format(new Date(r.updated_at))}
                </td>
                <td>
                  <span
                    className={`mono uppercase text-[11px] tracking-[0.18em] ${
                      r.published ? "text-green" : "text-concrete-2"
                    }`}
                  >
                    {r.published ? "Publiée" : "Brouillon"}
                  </span>
                </td>
                <td className="text-right">
                  <div className="flex justify-end items-center gap-3">
                    <form action={setLegalPublished}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="slug" value={r.slug} />
                      <input type="hidden" name="published" value={r.published ? "0" : "1"} />
                      <button className="underline text-[13px]">
                        {r.published ? "Dépublier" : "Publier"}
                      </button>
                    </form>
                    <Link className="underline text-[13px]" href={`/${locale}/admin/legal/${r.id}`}>
                      Éditer
                    </Link>
                    {r.published ? (
                      <Link
                        className="underline text-[13px] text-concrete-1"
                        href={`/${locale}/legal/${r.slug}`}
                      >
                        Voir
                      </Link>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
