"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

async function locale(): Promise<string> {
  return (await cookies()).get("NEXT_LOCALE")?.value || "fr";
}

function revalidateFeatured(): void {
  for (const l of ["fr", "en"]) {
    revalidatePath(`/${l}/admin/featured`);
    revalidatePath(`/${l}`); // la landing (FeaturedCase)
  }
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const strOrNull = (fd: FormData, k: string) => str(fd, k) || null;

// Parse un champ jsonb depuis un textarea. Vide → []. JSON invalide → erreur claire.
function jsonField(fd: FormData, k: string): unknown {
  const raw = str(fd, k);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`JSON invalide dans le champ « ${k} ». Vérifiez la syntaxe.`);
  }
}

function parse(fd: FormData) {
  return {
    title_fr: str(fd, "title_fr"),
    title_en: str(fd, "title_en"),
    location: strOrNull(fd, "location"),
    coordinates: strOrNull(fd, "coordinates"),
    quote_fr: strOrNull(fd, "quote_fr"),
    quote_en: strOrNull(fd, "quote_en"),
    cite: strOrNull(fd, "cite"),
    slides: jsonField(fd, "slides"),
    stats: jsonField(fd, "stats"),
    hotspots: jsonField(fd, "hotspots"),
    rows: jsonField(fd, "rows"),
    published: fd.get("published") != null,
    sort_order: Number(fd.get("sort_order") ?? 0) || 0,
  };
}

export async function createFeatured(fd: FormData): Promise<void> {
  await requireAdmin();
  const row = parse(fd);
  if (!row.title_fr || !row.title_en) throw new Error("Titre FR et EN requis");
  const s = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (s.from("featured_projects") as any).insert(row);
  revalidateFeatured();
  redirect(`/${await locale()}/admin/featured`);
}

export async function updateFeatured(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "id");
  if (!id) throw new Error("Missing id");
  const row = parse(fd);
  if (!row.title_fr || !row.title_en) throw new Error("Titre FR et EN requis");
  const s = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (s.from("featured_projects") as any).update(row).eq("id", id);
  revalidateFeatured();
  redirect(`/${await locale()}/admin/featured`);
}

export async function deleteFeatured(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "id");
  if (!id) throw new Error("Missing id");
  const s = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (s.from("featured_projects") as any).delete().eq("id", id);
  revalidateFeatured();
}

export async function setFeaturedPublished(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "id");
  if (!id) throw new Error("Missing id");
  const published = str(fd, "published") === "1";
  const s = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (s.from("featured_projects") as any).update({ published }).eq("id", id);
  revalidateFeatured();
}
