"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email/client";
import { architectStatusEmail } from "@/lib/email/templates";
import { appOrigin } from "@/lib/auth/origin";

type Status = "pending" | "verified" | "rejected" | "paused";
const STATUSES: Status[] = ["pending", "verified", "rejected", "paused"];

// Change le statut d'un dossier et prévient l'architecte (dans sa langue)
// quand le changement le concerne : validé, refusé ou mis en pause.
export async function setArchitectStatus(id: string, status: Status): Promise<void> {
  await requireAdmin();
  if (!STATUSES.includes(status)) throw new Error("Invalid status");
  const s = createServiceClient();

  const { data: before } = (await s
    .from("architect_profiles")
    .select("status, first_name, email, user_id")
    .eq("id", id)
    .single()) as { data: { status: Status; first_name: string; email: string; user_id: string | null } | null };
  if (!before) throw new Error("Architect not found");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (s.from("architect_profiles") as any).update({ status }).eq("id", id);

  if (before.status !== status && status !== "pending") {
    let loc = "fr";
    if (before.user_id) {
      const { data: prof } = (await s.from("profiles").select("locale").eq("id", before.user_id).single()) as {
        data: { locale: string } | null;
      };
      loc = prof?.locale ?? "fr";
    }
    const m = architectStatusEmail(loc, {
      firstName: before.first_name,
      status,
      ctaUrl: `${await appOrigin()}/${loc}/dashboard/architecte`,
    });
    await sendEmail({ to: before.email, subject: m.subject, html: m.html });
  }

  for (const l of ["fr", "en"]) {
    revalidatePath(`/${l}/admin/architectes`);
    revalidatePath(`/${l}/admin/architectes/${id}`);
    revalidatePath(`/${l}/admin`);
    revalidatePath(`/${l}/dashboard/architecte`);
  }
}
