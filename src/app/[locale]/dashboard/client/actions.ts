"use server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendEmail, adminEmail } from "@/lib/email/client";
import {
  meetingConfirmedEmail,
  meetingDeclinedAdminEmail,
  clientChoseAdminEmail,
  proposalsDeclinedAdminEmail,
} from "@/lib/email/templates";
import { countryTimeZone } from "@/lib/time/meetingTime";
import { appOrigin } from "@/lib/auth/origin";
import { safeLocale } from "@/lib/auth/safeRedirect";
import { advanceProject, ACTIVE_MEETING_STATUSES } from "@/lib/workflow/projectState";
import { shortlistVisible } from "@/lib/workflow/guards";

// Actions du PORTEUR. Chacune vérifie que l'utilisateur possède le projet
// avant toute écriture ; les réponses aux RDV passent par sa session (RLS
// « meetings owner respond » + trigger de garde 0014), le reste par la clé
// service après vérification.

type Svc = ReturnType<typeof createServiceClient>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = (s: Svc, name: "client_engagements" | "meetings") => s.from(name) as any;

function revalidateAll(projectId?: string) {
  for (const l of ["fr", "en"]) {
    revalidatePath(`/${l}/dashboard/client`);
    revalidatePath(`/${l}/dashboard/architecte`);
    revalidatePath(`/${l}/admin/rdv`);
    revalidatePath(`/${l}/admin`);
    if (projectId) revalidatePath(`/${l}/admin/projets/${projectId}`);
  }
}

function back(formData: FormData, query: string): never {
  redirect(`/${safeLocale(formData.get("locale"))}/dashboard/client?${query}`);
}

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function ownedProject(s: Svc, projectId: string, userId: string) {
  const { data } = (await s
    .from("client_projects")
    .select("id, client_name")
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle()) as { data: { id: string; client_name: string } | null };
  return data;
}

// Multi-proposition : le porteur retient un profil anonyme. Rien n'est
// révélé ici ; les autres propositions sont écartées et l'admin planifie.
export async function chooseProposal(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId") ?? "");
  const architectId = String(formData.get("architectId") ?? "");
  const userId = await currentUserId();
  if (!userId) back(formData, "error=notAllowed");
  const s = createServiceClient();
  const project = await ownedProject(s, projectId, userId);
  if (!project) back(formData, "error=notAllowed");

  const [{ count: openMeetings }, { count: proposedCount }, { data: proj }] = await Promise.all([
    s
      .from("meetings")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .in("status", [...ACTIVE_MEETING_STATUSES]),
    s
      .from("client_engagements")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("status", "proposed"),
    s.from("client_projects").select("choice_requested_at").eq("id", projectId).single() as unknown as Promise<{
      data: { choice_requested_at: string | null } | null;
    }>,
  ]);
  const visible = shortlistVisible({
    choiceRequested: !!proj?.choice_requested_at,
    proposedCount: proposedCount ?? 0,
    hasOpenMeeting: (openMeetings ?? 0) > 0,
  });

  const { data: chosen } = (await s
    .from("client_engagements")
    .select("id, architect_profiles(anon_handle)")
    .eq("project_id", projectId)
    .eq("architect_id", architectId)
    .eq("status", "proposed")
    .maybeSingle()) as { data: { id: string; architect_profiles: { anon_handle: string | null } | null } | null };
  if (!chosen) back(formData, "error=notAllowed");
  // Double clic : le premier envoi a déjà écarté les autres profils, la
  // présélection n'est plus visible — le choix est fait, rien à renvoyer.
  if (!visible) back(formData, (proposedCount ?? 0) === 1 && (openMeetings ?? 0) === 0 ? "notice=chosen" : "error=notAllowed");

  const { error: declineErr } = await table(s, "client_engagements")
    .update({ status: "declined" })
    .eq("project_id", projectId)
    .eq("status", "proposed")
    .neq("architect_id", architectId);
  if (declineErr) back(formData, "error=generic");

  const admin = adminEmail();
  if (admin) {
    const m = clientChoseAdminEmail({
      clientName: project.client_name,
      architectHandle: chosen.architect_profiles?.anon_handle ?? "—",
      adminUrl: `${await appOrigin()}/fr/admin/projets/${projectId}`,
    });
    await sendEmail({ to: admin, subject: m.subject, html: m.html });
  }
  revalidateAll(projectId);
  back(formData, "notice=chosen");
}

// Le porteur écarte un profil proposé.
export async function declineProposal(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId") ?? "");
  const architectId = String(formData.get("architectId") ?? "");
  const userId = await currentUserId();
  if (!userId) back(formData, "error=notAllowed");
  const s = createServiceClient();
  const project = await ownedProject(s, projectId, userId);
  if (!project) back(formData, "error=notAllowed");

  const { count: openMeetings } = await s
    .from("meetings")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("architect_id", architectId)
    .in("status", [...ACTIVE_MEETING_STATUSES]);
  if ((openMeetings ?? 0) > 0) back(formData, "error=notAllowed");

  const { error: declineErr } = await table(s, "client_engagements")
    .update({ status: "declined" })
    .eq("project_id", projectId)
    .eq("architect_id", architectId)
    .eq("status", "proposed");
  if (declineErr) back(formData, "error=generic");
  const next = await advanceProject(s, projectId, "proposal_withdrawn");

  const admin = adminEmail();
  if (admin && next === "matched") {
    const m = proposalsDeclinedAdminEmail({
      clientName: project.client_name,
      adminUrl: `${await appOrigin()}/fr/admin/projets/${projectId}`,
    });
    await sendEmail({ to: admin, subject: m.subject, html: m.html });
  }
  revalidateAll(projectId);
  back(formData, "notice=declined");
}

// Confirmation du RDV avec acceptation de la charte : déclenche la révélation
// (trigger 0010/0014). Appelée depuis la modale de charte.
export async function confirmMeeting(meetingId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "notAllowed" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updated, error } = (await (supabase.from("meetings") as any)
    .update({ status: "confirmed", charter_accepted: true })
    .eq("id", meetingId)
    .select("id, project_id")) as {
    data: { id: string; project_id: string }[] | null;
    error: { message: string } | null;
  };
  if (error) return { error: /No active proposal/i.test(error.message) ? "noProposal" : "generic" };
  if (!updated || updated.length === 0) return { error: "notAllowed" };

  await notifyConfirmed(meetingId);
  revalidateAll(updated[0].project_id);
  return { ok: true };
}

// Le porteur décline le créneau proposé.
export async function declineMeeting(formData: FormData): Promise<void> {
  const meetingId = String(formData.get("meetingId") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) back(formData, "error=notAllowed");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updated } = (await (supabase.from("meetings") as any)
    .update({ status: "declined" })
    .eq("id", meetingId)
    .select("id, project_id, scheduled_at")) as {
    data: { id: string; project_id: string; scheduled_at: string }[] | null;
  };
  if (!updated || updated.length === 0) {
    // Double clic : le RDV est peut-être déjà décliné par le premier envoi.
    const { data: current } = (await supabase.from("meetings").select("status").eq("id", meetingId).maybeSingle()) as {
      data: { status: string } | null;
    };
    back(formData, current?.status === "declined" ? "notice=meetingDeclined" : "error=notAllowed");
  }

  const s = createServiceClient();
  const mtg = updated[0];
  await advanceProject(s, mtg.project_id, "meeting_declined");

  const admin = adminEmail();
  if (admin) {
    const { data: proj } = (await s
      .from("client_projects")
      .select("client_name, project_country")
      .eq("id", mtg.project_id)
      .single()) as { data: { client_name: string; project_country: string } | null };
    const m = meetingDeclinedAdminEmail({
      clientName: proj?.client_name ?? "—",
      scheduledAt: mtg.scheduled_at,
      projectTimeZone: countryTimeZone(proj?.project_country ?? ""),
      adminUrl: `${await appOrigin()}/fr/admin/projets/${mtg.project_id}`,
    });
    await sendEmail({ to: admin, subject: m.subject, html: m.html });
  }
  revalidateAll(mtg.project_id);
  back(formData, "notice=meetingDeclined");
}

// E-mails de confirmation (best-effort), envoyés seulement si la
// confirmation vient d'être appliquée par la requête appelante.
async function notifyConfirmed(meetingId: string): Promise<void> {
  const svc = createServiceClient();
  const { data: mtg } = (await svc
    .from("meetings")
    .select("scheduled_at, video_url, status, project_id, architect_id")
    .eq("id", meetingId)
    .single()) as {
    data: {
      scheduled_at: string;
      video_url: string | null;
      status: string;
      project_id: string;
      architect_id: string;
    } | null;
  };
  if (!mtg || mtg.status !== "confirmed") return;

  const [{ data: proj }, { data: arch }] = (await Promise.all([
    svc.from("client_projects").select("email, user_id, project_country").eq("id", mtg.project_id).single(),
    svc.from("architect_profiles").select("email, user_id").eq("id", mtg.architect_id).single(),
  ])) as [
    { data: { email: string; user_id: string | null; project_country: string } | null },
    { data: { email: string; user_id: string | null } | null },
  ];
  const projectTimeZone = countryTimeZone(proj?.project_country ?? "");

  const ids = [proj?.user_id, arch?.user_id].filter(Boolean) as string[];
  const localeById = new Map<string, string>();
  if (ids.length) {
    const { data: profs } = (await svc.from("profiles").select("id, locale").in("id", ids)) as {
      data: { id: string; locale: string }[] | null;
    };
    (profs ?? []).forEach((p) => localeById.set(p.id, p.locale));
  }
  const porteurLoc = (proj?.user_id && localeById.get(proj.user_id)) || "fr";
  const archLoc = (arch?.user_id && localeById.get(arch.user_id)) || "fr";
  const origin = await appOrigin();

  const sends: Promise<void>[] = [];
  if (proj?.email) {
    const m = meetingConfirmedEmail(porteurLoc, "client", {
      scheduledAt: mtg.scheduled_at,
      projectTimeZone,
      videoUrl: mtg.video_url,
      ctaUrl: `${origin}/${porteurLoc}/dashboard/client`,
    });
    sends.push(sendEmail({ to: proj.email, cc: adminEmail(), subject: m.subject, html: m.html }));
  }
  if (arch?.email) {
    const m = meetingConfirmedEmail(archLoc, "architect", {
      scheduledAt: mtg.scheduled_at,
      projectTimeZone,
      videoUrl: mtg.video_url,
      ctaUrl: `${origin}/${archLoc}/dashboard/architecte`,
    });
    sends.push(sendEmail({ to: arch.email, subject: m.subject, html: m.html }));
  }
  await Promise.all(sends);
}
