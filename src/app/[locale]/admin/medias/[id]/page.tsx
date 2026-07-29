import { createServiceClient } from "@/lib/supabase/service";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminImageInput } from "@/components/admin/AdminImageInput";
import { createMedia, updateMedia } from "../actions";

type Media = {
  id: string;
  title_fr: string;
  title_en: string;
  excerpt_fr: string | null;
  excerpt_en: string | null;
  image_url: string | null;
  read_time: string | null;
  date: string | null;
  url: string | null;
  published: boolean;
  sort_order: number;
};

export default async function MediaForm({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const isNew = id === "new";

  let m: Media | null = null;
  if (!isNew) {
    const s = createServiceClient();
    const { data } = (await s
      .from("media_items")
      .select(
        "id, title_fr, title_en, excerpt_fr, excerpt_en, image_url, read_time, date, url, published, sort_order",
      )
      .eq("id", id)
      .single()) as { data: Media | null };
    if (!data) notFound();
    m = data;
  }

  return (
    <>
      <Link href={`/${locale}/admin/medias`} className="eyebrow hover:text-ink">
        ← Médias
      </Link>
      <h1 className="font-light text-4xl mt-4">{isNew ? "Nouveau média" : "Éditer le média"}</h1>

      <form action={isNew ? createMedia : updateMedia} className="mt-8 max-w-[720px] space-y-6">
        {!isNew ? <input type="hidden" name="id" value={m!.id} /> : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Text label="Titre (FR)" name="title_fr" defaultValue={m?.title_fr} required />
          <Text label="Titre (EN)" name="title_en" defaultValue={m?.title_en} required />
          <Area label="Extrait (FR)" name="excerpt_fr" defaultValue={m?.excerpt_fr ?? ""} />
          <Area label="Extrait (EN)" name="excerpt_en" defaultValue={m?.excerpt_en ?? ""} />
          <Text label="Catégorie / temps de lecture" name="read_time" defaultValue={m?.read_time ?? ""} />
          <Text label="Date (affichée)" name="date" defaultValue={m?.date ?? ""} placeholder="12.05.26" />
          <Text label="Lien (article)" name="url" defaultValue={m?.url ?? ""} placeholder="https://…" />
          <Text label="Ordre d'affichage" name="sort_order" type="number" defaultValue={String(m?.sort_order ?? 0)} />
        </div>

        <div className="block">
          <span className="eyebrow">Image</span>
          <div className="mt-1">
            <AdminImageInput name="image_url" defaultValue={m?.image_url ?? ""} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked={m?.published ?? false} />
          <span>Publié (visible sur la landing)</span>
        </label>

        <div className="flex gap-3 pt-2">
          <button className="px-5 py-2 bg-ink text-paper text-sm">
            {isNew ? "Créer" : "Enregistrer"}
          </button>
          <Link
            href={`/${locale}/admin/medias`}
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
    <label className="block md:col-span-1">
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
