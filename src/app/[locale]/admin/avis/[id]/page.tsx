import { createServiceClient } from "@/lib/supabase/service";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAvis, updateAvis } from "../actions";

type Avis = {
  id: string;
  quote_fr: string;
  quote_en: string;
  author: string;
  role_fr: string | null;
  role_en: string | null;
  location: string | null;
  published: boolean;
  sort_order: number;
};

export default async function AvisForm({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const isNew = id === "new";

  let a: Avis | null = null;
  if (!isNew) {
    const s = createServiceClient();
    const { data } = (await s
      .from("testimonials")
      .select("id, quote_fr, quote_en, author, role_fr, role_en, location, published, sort_order")
      .eq("id", id)
      .single()) as { data: Avis | null };
    if (!data) notFound();
    a = data;
  }

  return (
    <>
      <Link href={`/${locale}/admin/avis`} className="eyebrow hover:text-ink">
        ← Avis
      </Link>
      <h1 className="font-light text-4xl mt-4">{isNew ? "Nouvel avis" : "Éditer l'avis"}</h1>

      <form action={isNew ? createAvis : updateAvis} className="mt-8 max-w-[720px] space-y-6">
        {!isNew ? <input type="hidden" name="id" value={a!.id} /> : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Area label="Avis (FR)" name="quote_fr" defaultValue={a?.quote_fr} required />
          <Area label="Avis (EN)" name="quote_en" defaultValue={a?.quote_en} required />
          <Text label="Auteur" name="author" defaultValue={a?.author} required placeholder="Awa K." />
          <Text label="Lieu" name="location" defaultValue={a?.location ?? ""} placeholder="Abidjan, Côte d'Ivoire" />
          <Text label="Qualité (FR)" name="role_fr" defaultValue={a?.role_fr ?? ""} placeholder="Cliente — villa familiale" />
          <Text label="Qualité (EN)" name="role_en" defaultValue={a?.role_en ?? ""} placeholder="Client — family villa" />
          <Text label="Ordre d'affichage" name="sort_order" type="number" defaultValue={String(a?.sort_order ?? 0)} />
        </div>

        <p className="text-concrete-1 text-[13px] max-w-[60ch]">
          L&apos;avis est publié tel que son auteur l&apos;a écrit, avec son accord. Un prénom et
          l&apos;initiale du nom suffisent.
        </p>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked={a?.published ?? false} />
          <span>Publié (visible sur la landing)</span>
        </label>

        <div className="flex gap-3 pt-2">
          <button className="px-5 py-2 bg-ink text-paper text-sm">
            {isNew ? "Créer" : "Enregistrer"}
          </button>
          <Link
            href={`/${locale}/admin/avis`}
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
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="block md:col-span-1">
      <span className="eyebrow">
        {label}
        {required ? " *" : ""}
      </span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        required={required}
        rows={5}
        className="w-full mt-1 bg-transparent border border-[var(--hairline)] p-2 text-sm outline-none focus:border-green"
      />
    </label>
  );
}
