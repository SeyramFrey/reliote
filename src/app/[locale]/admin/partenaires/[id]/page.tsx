import { createServiceClient } from "@/lib/supabase/service";
import { getLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminImageInput } from "@/components/admin/AdminImageInput";
import { createPartner, updatePartner } from "../actions";

type Partner = {
  id: string;
  name: string;
  logo_url: string;
  url: string | null;
  published: boolean;
  sort_order: number;
};

export default async function PartnerForm({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const isNew = id === "new";

  let p: Partner | null = null;
  if (!isNew) {
    const s = createServiceClient();
    const { data } = (await s
      .from("partners")
      .select("id, name, logo_url, url, published, sort_order")
      .eq("id", id)
      .single()) as { data: Partner | null };
    if (!data) notFound();
    p = data;
  }

  return (
    <>
      <Link href={`/${locale}/admin/partenaires`} className="eyebrow hover:text-ink">
        ← Partenaires
      </Link>
      <h1 className="font-light text-4xl mt-4">{isNew ? "Nouveau partenaire" : "Éditer le partenaire"}</h1>

      <form action={isNew ? createPartner : updatePartner} className="mt-8 max-w-[720px] space-y-6">
        {!isNew ? <input type="hidden" name="id" value={p!.id} /> : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Text label="Nom" name="name" defaultValue={p?.name} required placeholder="Archigénie Afrik" />
          <Text label="Lien (site du partenaire)" name="url" defaultValue={p?.url ?? ""} placeholder="https://…" />
          <Text label="Ordre d'affichage" name="sort_order" type="number" defaultValue={String(p?.sort_order ?? 0)} />
        </div>

        <div className="block">
          <span className="eyebrow">Logo *</span>
          <div className="mt-1">
            <AdminImageInput name="logo_url" defaultValue={p?.logo_url ?? ""} fit="contain" />
          </div>
          <p className="text-concrete-1 text-[13px] mt-2 max-w-[60ch]">
            Le logo est posé sur une pastille ronde claire : un symbole carré sur fond transparent
            (PNG ou WebP) se lit bien mieux qu&apos;un logo en longueur.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked={p?.published ?? false} />
          <span>Publié (visible dans l&apos;anneau de la landing)</span>
        </label>

        <div className="flex gap-3 pt-2">
          <button className="px-5 py-2 bg-ink text-paper text-sm">
            {isNew ? "Créer" : "Enregistrer"}
          </button>
          <Link
            href={`/${locale}/admin/partenaires`}
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
