"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { safeUrl } from "@/lib/security/safeUrl";

/** Borne haute des pastilles vides : au-delà, l'anneau sature et se lit mal. */
const MAX_PLACEHOLDERS = 24;

async function locale(): Promise<string> {
  return (await cookies()).get("NEXT_LOCALE")?.value || "fr";
}

function revalidatePartners(): void {
  for (const l of ["fr", "en"]) {
    revalidatePath(`/${l}/admin/partenaires`);
    revalidatePath(`/${l}`); // la landing (anneau de partenaires)
  }
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

function parse(fd: FormData) {
  return {
    name: str(fd, "name"),
    logo_url: safeUrl(str(fd, "logo_url")) ?? "",
    url: safeUrl(str(fd, "url")),
    published: fd.get("published") != null,
    sort_order: Number(fd.get("sort_order") ?? 0) || 0,
  };
}

function check(row: ReturnType<typeof parse>): void {
  if (!row.name) throw new Error("Nom requis");
  if (!row.logo_url) throw new Error("Logo requis (URL https ou image téléversée)");
}

export async function createPartner(fd: FormData): Promise<void> {
  await requireAdmin();
  const row = parse(fd);
  check(row);
  const s = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (s.from("partners") as any).insert(row);
  revalidatePartners();
  redirect(`/${await locale()}/admin/partenaires`);
}

export async function updatePartner(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "id");
  if (!id) throw new Error("Missing id");
  const row = parse(fd);
  check(row);
  const s = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (s.from("partners") as any).update(row).eq("id", id);
  revalidatePartners();
  redirect(`/${await locale()}/admin/partenaires`);
}

export async function deletePartner(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "id");
  if (!id) throw new Error("Missing id");
  const s = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (s.from("partners") as any).delete().eq("id", id);
  revalidatePartners();
}

export async function setPartnerPublished(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "id");
  if (!id) throw new Error("Missing id");
  const published = str(fd, "published") === "1";
  const s = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (s.from("partners") as any).update({ published }).eq("id", id);
  revalidatePartners();
}

export async function setPlaceholders(fd: FormData): Promise<void> {
  await requireAdmin();
  const n = Math.round(Number(str(fd, "placeholders")));
  if (!Number.isFinite(n)) throw new Error("Nombre de pastilles invalide");
  const value = Math.min(MAX_PLACEHOLDERS, Math.max(0, n));
  const s = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (s.from("site_settings") as any).upsert({
    key: "partners_placeholders",
    value,
    updated_at: new Date().toISOString(),
  });
  revalidatePartners();
}
