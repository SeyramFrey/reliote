import { createServiceClient } from "@/lib/supabase/service";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RichTextInput } from "@/components/admin/RichTextInput";
import { updateLegal } from "../actions";

type LegalPage = {
  id: string;
  slug: string;
  title_fr: string;
  title_en: string;
  body_fr: string;
  body_en: string;
  seo_description_fr: string | null;
  seo_description_en: string | null;
  published: boolean;
  sort_order: number;
};

export default async function LegalForm({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();

  const s = createServiceClient();
  const { data } = (await s
    .from("legal_pages")
    .select(
      "id, slug, title_fr, title_en, body_fr, body_en, seo_description_fr, seo_description_en, published, sort_order",
    )
    .eq("id", id)
    .single()) as { data: LegalPage | null };
  if (!data) notFound();
  const p = data;

  return (
    <>
      <Link href={`/${locale}/admin/legal`} className="eyebrow hover:text-ink">
        ← Pages légales
      </Link>
      <h1 className="font-light text-4xl mt-4">{p.title_fr}</h1>
      <p className="mono text-[12px] text-concrete-2 mt-3">
        /{locale}/legal/{p.slug}
      </p>

      <form action={updateLegal} className="mt-8 max-w-[860px] space-y-6">
        <input type="hidden" name="id" value={p.id} />
        <input type="hidden" name="slug" value={p.slug} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Text label="Titre (FR)" name="title_fr" defaultValue={p.title_fr} required />
          <Text label="Titre (EN)" name="title_en" defaultValue={p.title_en} required />
          <Area
            label="Description SEO (FR)"
            name="seo_description_fr"
            defaultValue={p.seo_description_fr ?? ""}
          />
          <Area
            label="Description SEO (EN)"
            name="seo_description_en"
            defaultValue={p.seo_description_en ?? ""}
          />
        </div>

        <RichTextInput name="body_fr" label="Corps (FR)" defaultValue={p.body_fr} />
        <RichTextInput name="body_en" label="Corps (EN)" defaultValue={p.body_en} />

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked={p.published} />
          <span>Publiée (accessible publiquement et citée dans le pied de page)</span>
        </label>

        <p className="text-concrete-2 text-[13px] max-w-[68ch]">
          Enregistrer met à jour la date de dernière révision affichée en tête de la page
          publique.
        </p>

        <div className="flex gap-3 pt-2">
          <button className="px-5 py-2 bg-ink text-paper text-sm">Enregistrer</button>
          <Link
            href={`/${locale}/admin/legal`}
            className="px-5 py-2 border border-[var(--hairline)] text-sm hover:border-ink"
          >
            Annuler
          </Link>
        </div>
      </form>
    </>
  );
}

function Text({
  label,
  name,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="mt-1 w-full border border-[var(--hairline)] px-3 py-2 text-sm bg-paper"
      />
    </label>
  );
}

function Area({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={3}
        className="mt-1 w-full border border-[var(--hairline)] px-3 py-2 text-sm bg-paper"
      />
    </label>
  );
}
