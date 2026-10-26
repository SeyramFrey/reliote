import { createServiceClient } from "@/lib/supabase/service";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { DEFAULT_PARTNER_PLACEHOLDERS } from "@/lib/landing/data";
import { deletePartner, setPartnerPublished, setPlaceholders } from "./actions";

type Row = {
  id: string;
  name: string;
  logo_url: string;
  published: boolean;
  sort_order: number;
};

const plural = (n: number, word: string) => `${word}${n > 1 ? "s" : ""}`;

export default async function AdminPartenaires() {
  const locale = await getLocale();
  const s = createServiceClient();
  const [{ data }, { data: setting }] = (await Promise.all([
    s
      .from("partners")
      .select("id, name, logo_url, published, sort_order")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    s.from("site_settings").select("value").eq("key", "partners_placeholders").maybeSingle(),
  ])) as [{ data: Row[] | null }, { data: { value: unknown } | null }];
  const rows = data ?? [];
  const n = Number(setting?.value);
  const placeholders = Number.isFinite(n) ? n : DEFAULT_PARTNER_PLACEHOLDERS;
  const published = rows.filter((r) => r.published).length;

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="eyebrow">Admin · Partenaires</p>
          <h1 className="font-light text-4xl mt-4">{rows.length} partenaires</h1>
        </div>
        <Link href={`/${locale}/admin/partenaires/new`} className="px-4 py-2 bg-ink text-paper text-sm">
          Nouveau partenaire
        </Link>
      </div>

      <form
        action={setPlaceholders}
        className="mt-10 flex flex-wrap items-end gap-4 border border-[var(--hairline)] p-5 max-w-[720px]"
      >
        <label className="block">
          <span className="eyebrow">Pastilles vides</span>
          <input
            type="number"
            name="placeholders"
            min={0}
            max={24}
            defaultValue={placeholders}
            className="block w-24 mt-1 bg-transparent border-b border-[var(--hairline)] py-1.5 text-sm outline-none focus:border-green"
          />
        </label>
        <button className="px-4 py-2 border border-[var(--hairline)] text-sm hover:border-ink">
          Enregistrer
        </button>
        <p className="text-concrete-1 text-[13px] basis-full">
          L&apos;anneau de la landing compte {published + placeholders} pastilles : {published}{" "}
          {plural(published, "logo")} {plural(published, "publié")} et {placeholders}{" "}
          {plural(placeholders, "pastille")} {plural(placeholders, "vide")}, en attente de logos.
          Baisser ce nombre retire des pastilles vides (0 à 24).
        </p>
      </form>

      {rows.length === 0 ? (
        <p className="text-concrete-1 text-sm mt-10 max-w-[60ch]">
          Aucun partenaire. L&apos;anneau n&apos;affiche que des pastilles vides tant qu&apos;aucun
          logo n&apos;est publié.
        </p>
      ) : (
        <div className="mt-10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left">
              <tr className="border-b border-[var(--hairline)]">
                <th className="eyebrow py-3">Logo</th>
                <th className="eyebrow">Nom</th>
                <th className="eyebrow">Ordre</th>
                <th className="eyebrow">Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-[var(--hairline-soft)]">
                  <td className="py-3 pr-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.logo_url}
                      alt=""
                      className="h-12 w-12 rounded-full object-contain bg-paper p-2 border border-[var(--hairline)]"
                    />
                  </td>
                  <td className="pr-4">{p.name}</td>
                  <td className="mono">{p.sort_order}</td>
                  <td>
                    <span
                      className={`mono uppercase text-[11px] tracking-[0.18em] ${
                        p.published ? "text-green" : "text-concrete-2"
                      }`}
                    >
                      {p.published ? "Publié" : "Brouillon"}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end items-center gap-3">
                      <form action={setPartnerPublished}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="published" value={p.published ? "0" : "1"} />
                        <button className="underline text-[13px]">
                          {p.published ? "Dépublier" : "Publier"}
                        </button>
                      </form>
                      <Link className="underline text-[13px]" href={`/${locale}/admin/partenaires/${p.id}`}>
                        Éditer
                      </Link>
                      <form action={deletePartner}>
                        <input type="hidden" name="id" value={p.id} />
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
