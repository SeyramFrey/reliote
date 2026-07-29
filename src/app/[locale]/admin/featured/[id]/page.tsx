import { createServiceClient } from "@/lib/supabase/service";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminImageInput } from "@/components/admin/AdminImageInput";
import { createFeatured, updateFeatured } from "../actions";

type Featured = {
  id: string;
  title_fr: string;
  title_en: string;
  location: string | null;
  coordinates: string | null;
  quote_fr: string | null;
  quote_en: string | null;
  cite: string | null;
  slides: unknown;
  stats: unknown;
  hotspots: unknown;
  rows: unknown;
  published: boolean;
  sort_order: number;
};

const HINTS = {
  slides: '[{"image":"https://…","caption_fr":"Vue d\'eau","caption_en":"Water view"}]',
  stats: '[{"n":480,"suf":" m²","l_fr":"Surface utile","l_en":"Useful area"}]',
  hotspots:
    '[{"x":28,"y":38,"title_fr":"Béton banché","title_en":"Board-formed","body_fr":"…","body_en":"…"}]',
  rows: '[{"label_fr":"Client","label_en":"Client","value_fr":"Privé","value_en":"Private"}]',
};

function pretty(v: unknown): string {
  if (v == null) return "";
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return "";
  }
}

export default async function FeaturedForm({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const isNew = id === "new";

  let f: Featured | null = null;
  if (!isNew) {
    const s = createServiceClient();
    const { data } = (await s
      .from("featured_projects")
      .select(
        "id, title_fr, title_en, location, coordinates, quote_fr, quote_en, cite, slides, stats, hotspots, rows, published, sort_order",
      )
      .eq("id", id)
      .single()) as { data: Featured | null };
    if (!data) notFound();
    f = data;
  }

  return (
    <>
      <Link href={`/${locale}/admin/featured`} className="eyebrow hover:text-ink">
        ← Mis en lumière
      </Link>
      <h1 className="font-light text-4xl mt-4">
        {isNew ? "Nouveau projet mis en lumière" : "Éditer le projet"}
      </h1>

      <form action={isNew ? createFeatured : updateFeatured} className="mt-8 max-w-[820px] space-y-6">
        {!isNew ? <input type="hidden" name="id" value={f!.id} /> : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Text label="Titre (FR)" name="title_fr" defaultValue={f?.title_fr} required />
          <Text label="Titre (EN)" name="title_en" defaultValue={f?.title_en} required />
          <Text label="Lieu (coin haut-gauche)" name="location" defaultValue={f?.location ?? ""} placeholder="Rives de la Lagune · Bingerville" />
          <Text label="Coordonnées (coin bas-gauche)" name="coordinates" defaultValue={f?.coordinates ?? ""} placeholder="5.34°N / 3.98°W" />
          <Area label="Citation (FR)" name="quote_fr" defaultValue={f?.quote_fr ?? ""} />
          <Area label="Citation (EN)" name="quote_en" defaultValue={f?.quote_en ?? ""} />
          <Text label="Attribution (cite)" name="cite" defaultValue={f?.cite ?? ""} placeholder="M. R. — client Reliote · 2025" />
          <Text label="Ordre d'affichage" name="sort_order" type="number" defaultValue={String(f?.sort_order ?? 0)} />
        </div>

        <div className="block">
          <span className="eyebrow">Téléverser une image</span>
          <p className="text-[12px] text-concrete-2 mt-1">
            Copiez l&apos;URL générée dans le champ <code>image</code> du JSON « slides » ci-dessous.
          </p>
          <div className="mt-2">
            <AdminImageInput name="_image_helper" />
          </div>
        </div>

        <JsonArea label="Slides (images + légendes)" name="slides" defaultValue={pretty(f?.slides)} hint={HINTS.slides} />
        <JsonArea label="Statistiques" name="stats" defaultValue={pretty(f?.stats)} hint={HINTS.stats} />
        <JsonArea label="Points d'intérêt (hotspots)" name="hotspots" defaultValue={pretty(f?.hotspots)} hint={HINTS.hotspots} />
        <JsonArea label="Tableau (rows)" name="rows" defaultValue={pretty(f?.rows)} hint={HINTS.rows} />

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked={f?.published ?? false} />
          <span>Publié (visible sur la landing)</span>
        </label>

        <div className="flex gap-3 pt-2">
          <button className="px-5 py-2 bg-ink text-paper text-sm">
            {isNew ? "Créer" : "Enregistrer"}
          </button>
          <Link
            href={`/${locale}/admin/featured`}
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
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="eyebrow">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-1.5 text-sm outline-none focus:border-green"
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
        className="w-full mt-1 bg-transparent border border-[var(--hairline)] p-2 text-sm outline-none focus:border-green"
      />
    </label>
  );
}

function JsonArea({
  label,
  name,
  defaultValue,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  hint: string;
}) {
  return (
    <label className="block">
      <span className="eyebrow">{label} · JSON</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={5}
        placeholder={hint}
        spellCheck={false}
        className="w-full mt-1 bg-transparent border border-[var(--hairline)] p-2 text-[12.5px] mono outline-none focus:border-green"
      />
      <span className="text-[11px] text-concrete-2 mt-1 block mono">{hint}</span>
    </label>
  );
}
