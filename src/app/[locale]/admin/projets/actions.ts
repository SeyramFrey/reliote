"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { revalidatePath } from "next/cache";
import { sendEmail, adminEmail, siteUrl } from "@/lib/email/client";
import { meetingProposedEmail } from "@/lib/email/templates";

// Résout le locale de chaque partie depuis son profil (fallback fr), pour des
// e-mails dans la bonne langue.
async function localesFor(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  s: any,
  ids: (string | null | undefined)[],
): Promise<Map<string, string>> {
  const clean = ids.filter(Boolean) as string[];
  const map = new Map<string, string>();
  if (clean.length === 0) return map;
  const { data } = (await s.from("profiles").select("id, locale").in("id", clean)) as {
    data: { id: string; locale: string }[] | null;
  };
  (data ?? []).forEach((p) => map.set(p.id, p.locale));
  return map;
}

// Toutes les mutations passent par le service client (bypass RLS) APRÈS le
// garde-fou requireAdmin(). Les server actions sont des endpoints POST
// indépendants : le rôle admin est revérifié à chaque appel.

function revalidateProject(projectId: string): void {
  for (const l of ["fr", "en"]) {
    revalidatePath(`/${l}/admin/projets/${projectId}`);
    revalidatePath(`/${l}/admin/projets`);
    revalidatePath(`/${l}/admin/rdv`);
    revalidatePath(`/${l}/admin/matches`);
    revalidatePath(`/${l}/dashboard/client`);
  }
}

// Admin choisit un architecte : crée l'engagement 'proposed' (sans jamais
// rétrograder un 'engaged' existant) et fait passer le projet à 'selected'.
export async function selectArchitect(formData: FormData): Promise<void> {
  await requireAdmin();
  const projectId = String(formData.get("projectId") ?? "");
  const architectId = String(formData.get("architectId") ?? "");
  if (!projectId || !architectId) throw new Error("Missing project or architect");

  const s = createServiceClient();
  // Insert-if-absent : ON CONFLICT DO NOTHING (ne touche pas un engagement déjà là).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (s.from("client_engagements") as any).upsert(
    { project_id: projectId, architect_id: architectId, status: "proposed" },
    { onConflict: "project_id,architect_id", ignoreDuplicates: true },
  );
  // Avance le projet à 'selected' sans régresser depuis un état plus avancé.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (s.from("client_projects") as any)
    .update({ status: "selected" })
    .eq("id", projectId)
    .in("status", ["new", "matched"]);

  revalidateProject(projectId);
}

// Admin planifie le RDV : insère un meeting 'proposed' (créneau + lien visio) et
// fait passer le projet à 'meeting_proposed'. Garantit qu'un engagement 'proposed'
// existe pour que la confirmation côté porteur révèle bien l'identité (trigger 0010).
export async function scheduleMeeting(formData: FormData): Promise<void> {
  const { userId } = await requireAdmin();
  const projectId = String(formData.get("projectId") ?? "");
  const architectId = String(formData.get("architectId") ?? "");
  const scheduledAtRaw = String(formData.get("scheduledAt") ?? "");
  const videoUrl = String(formData.get("videoUrl") ?? "").trim();
  if (!projectId || !architectId || !scheduledAtRaw) {
    throw new Error("Missing project, architect or slot");
  }
  const scheduledAt = new Date(scheduledAtRaw);
  if (Number.isNaN(scheduledAt.getTime())) throw new Error("Invalid date");

  const s = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (s.from("client_engagements") as any).upsert(
    { project_id: projectId, architect_id: architectId, status: "proposed" },
    { onConflict: "project_id,architect_id", ignoreDuplicates: true },
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (s.from("meetings") as any).insert({
    project_id: projectId,
    architect_id: architectId,
    scheduled_at: scheduledAt.toISOString(),
    video_url: videoUrl || null,
    status: "proposed",
    proposed_by: userId,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (s.from("client_projects") as any)
    .update({ status: "meeting_proposed" })
    .eq("id", projectId)
    .in("status", ["new", "matched", "selected"]);

  // E-mails de proposition (best-effort) : porteur (admin en copie) + architecte.
  const [{ data: proj }, { data: arch }] = (await Promise.all([
    s
      .from("client_projects")
      .select("email, project_type, project_location, user_id")
      .eq("id", projectId)
      .single(),
    s.from("architect_profiles").select("email, user_id").eq("id", architectId).single(),
  ])) as [
    { data: { email: string; project_type: string; project_location: string; user_id: string | null } | null },
    { data: { email: string; user_id: string | null } | null },
  ];

  const locs = await localesFor(s, [proj?.user_id, arch?.user_id]);
  const porteurLoc = (proj?.user_id && locs.get(proj.user_id)) || "fr";
  const archLoc = (arch?.user_id && locs.get(arch.user_id)) || "fr";
  const projectLabel = [proj?.project_type, proj?.project_location].filter(Boolean).join(" · ");
  const site = siteUrl();
  const iso = scheduledAt.toISOString();

  const sends: Promise<void>[] = [];
  if (proj?.email) {
    const m = meetingProposedEmail(porteurLoc, "client", {
      scheduledAt: iso,
      videoUrl: videoUrl || null,
      projectLabel,
      ctaUrl: site ? `${site}/${porteurLoc}/dashboard/client` : null,
    });
    sends.push(sendEmail({ to: proj.email, cc: adminEmail(), subject: m.subject, html: m.html }));
  }
  if (arch?.email) {
    const m = meetingProposedEmail(archLoc, "architect", {
      scheduledAt: iso,
      videoUrl: videoUrl || null,
      projectLabel,
    });
    sends.push(sendEmail({ to: arch.email, subject: m.subject, html: m.html }));
  }
  await Promise.all(sends);

  revalidateProject(projectId);
}

// Admin fait évoluer un meeting : 'completed' (RDV tenu → projet 'in_review') ou
// 'cancelled'. La confirmation reste l'action du porteur (charte + révélation).
export async function setMeetingStatus(formData: FormData): Promise<void> {
  await requireAdmin();
  const meetingId = String(formData.get("meetingId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!meetingId || !["completed", "cancelled"].includes(status)) {
    throw new Error("Invalid meeting update");
  }

  const s = createServiceClient();
  const { data: meeting } = (await s
    .from("meetings")
    .select("project_id")
    .eq("id", meetingId)
    .single()) as { data: { project_id: string } | null };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (s.from("meetings") as any).update({ status }).eq("id", meetingId);

  if (status === "completed" && meeting) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (s.from("client_projects") as any)
      .update({ status: "in_review" })
      .eq("id", meeting.project_id)
      .eq("status", "meeting_confirmed");
  }

  if (meeting) revalidateProject(meeting.project_id);
  else for (const l of ["fr", "en"]) revalidatePath(`/${l}/admin/rdv`);
}
