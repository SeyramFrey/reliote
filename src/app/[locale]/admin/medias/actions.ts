"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

async function locale(): Promise<string> {
  return (await cookies()).get("NEXT_LOCALE")?.value || "fr";
}

function revalidateMedia(): void {
  for (const l of ["fr", "en"]) {
    revalidatePath(`/${l}/admin/medias`);
    revalidatePath(`/${l}`); // la landing (Journal)
  }
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const strOrNull = (fd: FormData, k: string) => str(fd, k) || null;

function parse(fd: FormData) {
  return {
    title_fr: str(fd, "title_fr"),
    title_en: str(fd, "title_en"),
    excerpt_fr: strOrNull(fd, "excerpt_fr"),
    excerpt_en: strOrNull(fd, "excerpt_en"),
    image_url: strOrNull(fd, "image_url"),
    read_time: strOrNull(fd, "read_time"),
    date: strOrNull(fd, "date"),
    url: strOrNull(fd, "url"),
    published: fd.get("published") != null,
    sort_order: Number(fd.get("sort_order") ?? 0) || 0,
  };
}

export async function createMedia(fd: FormData): Promise<void> {
  await requireAdmin();
  const row = parse(fd);
  if (!row.title_fr || !row.title_en) throw new Error("Titre FR et EN requis");
  const s = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (s.from("media_items") as any).insert(row);
  revalidateMedia();
  redirect(`/${await locale()}/admin/medias`);
}

export async function updateMedia(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "id");
  if (!id) throw new Error("Missing id");
  const row = parse(fd);
  if (!row.title_fr || !row.title_en) throw new Error("Titre FR et EN requis");
  const s = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (s.from("media_items") as any).update(row).eq("id", id);
  revalidateMedia();
  redirect(`/${await locale()}/admin/medias`);
}

export async function deleteMedia(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "id");
  if (!id) throw new Error("Missing id");
  const s = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (s.from("media_items") as any).delete().eq("id", id);
  revalidateMedia();
}

export async function setMediaPublished(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "id");
  if (!id) throw new Error("Missing id");
  const published = str(fd, "published") === "1";
  const s = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (s.from("media_items") as any).update({ published }).eq("id", id);
  revalidateMedia();
}
