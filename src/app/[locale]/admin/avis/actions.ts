"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

async function locale(): Promise<string> {
  return (await cookies()).get("NEXT_LOCALE")?.value || "fr";
}

function revalidateAvis(): void {
  for (const l of ["fr", "en"]) {
    revalidatePath(`/${l}/admin/avis`);
    revalidatePath(`/${l}`); // la landing (Avis)
  }
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const strOrNull = (fd: FormData, k: string) => str(fd, k) || null;

function parse(fd: FormData) {
  return {
    quote_fr: str(fd, "quote_fr"),
    quote_en: str(fd, "quote_en"),
    author: str(fd, "author"),
    role_fr: strOrNull(fd, "role_fr"),
    role_en: strOrNull(fd, "role_en"),
    location: strOrNull(fd, "location"),
    published: fd.get("published") != null,
    sort_order: Number(fd.get("sort_order") ?? 0) || 0,
  };
}

function check(row: ReturnType<typeof parse>): void {
  if (!row.quote_fr || !row.quote_en) throw new Error("Avis FR et EN requis");
  if (!row.author) throw new Error("Auteur requis");
}

export async function createAvis(fd: FormData): Promise<void> {
  await requireAdmin();
  const row = parse(fd);
  check(row);
  const s = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (s.from("testimonials") as any).insert(row);
  revalidateAvis();
  redirect(`/${await locale()}/admin/avis`);
}

export async function updateAvis(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "id");
  if (!id) throw new Error("Missing id");
  const row = parse(fd);
  check(row);
  const s = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (s.from("testimonials") as any).update(row).eq("id", id);
  revalidateAvis();
  redirect(`/${await locale()}/admin/avis`);
}

export async function deleteAvis(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "id");
  if (!id) throw new Error("Missing id");
  const s = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (s.from("testimonials") as any).delete().eq("id", id);
  revalidateAvis();
}

export async function setAvisPublished(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "id");
  if (!id) throw new Error("Missing id");
  const published = str(fd, "published") === "1";
  const s = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (s.from("testimonials") as any).update({ published }).eq("id", id);
  revalidateAvis();
}
