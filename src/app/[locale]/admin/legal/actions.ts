"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

async function locale(): Promise<string> {
  return (await cookies()).get("NEXT_LOCALE")?.value || "fr";
}

function revalidateLegal(slug?: string | null): void {
  for (const l of ["fr", "en"]) {
    revalidatePath(`/${l}/admin/legal`);
    if (slug) revalidatePath(`/${l}/legal/${slug}`);
    revalidatePath(`/${l}`); // le pied de page cite les pages publiées
  }
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const strOrNull = (fd: FormData, k: string) => str(fd, k) || null;

// Le slug n'est pas modifiable : il est figé par la migration 0012, cité par la
// liste blanche de la route publique et par les liens du pied de page. Il transite
// en champ caché uniquement pour cibler les revalidations.
function parse(fd: FormData) {
  return {
    title_fr: str(fd, "title_fr"),
    title_en: str(fd, "title_en"),
    body_fr: str(fd, "body_fr"),
    body_en: str(fd, "body_en"),
    seo_description_fr: strOrNull(fd, "seo_description_fr"),
    seo_description_en: strOrNull(fd, "seo_description_en"),
    published: fd.get("published") != null,
    sort_order: Number(fd.get("sort_order") ?? 0) || 0,
  };
}

function validate(row: ReturnType<typeof parse>): void {
  if (!row.title_fr || !row.title_en) throw new Error("Titre FR et EN requis");
  // Publier une page légale vide est pire que ne pas l'avoir : le pied de page
  // annoncerait un document qui n'existe pas.
  if (row.published && !row.body_fr.trim()) {
    throw new Error("Impossible de publier une page dont le corps FR est vide");
  }
}

export async function updateLegal(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "id");
  if (!id) throw new Error("Missing id");
  const row = parse(fd);
  validate(row);
  const s = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (s.from("legal_pages") as any).update(row).eq("id", id);
  revalidateLegal(strOrNull(fd, "slug"));
  redirect(`/${await locale()}/admin/legal`);
}

export async function setLegalPublished(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "id");
  if (!id) throw new Error("Missing id");
  const published = str(fd, "published") === "1";
  const s = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (s.from("legal_pages") as any).update({ published }).eq("id", id);
  revalidateLegal(strOrNull(fd, "slug"));
}
