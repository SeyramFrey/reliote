"use server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { sendEmail, adminEmail } from "@/lib/email/client";
import { meetingConfirmedEmail } from "@/lib/email/templates";

// Réponse du PORTEUR à un RDV proposé. Client AUTHENTIFIÉ : la RLS
// "meetings owner respond" garantit que seul le propriétaire du projet peut
// passer SON meeting à 'confirmed' / 'declined'.
//
// Confirmer + charte déclenche le trigger 0010 (engage_on_meeting_confirmed) :
// engagement 'engaged' → relais + identité révélée, projet 'meeting_confirmed'.
export async function respondToMeeting(formData: FormData): Promise<void> {
  const meetingId = String(formData.get("meetingId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!meetingId || !["confirm", "decline"].includes(decision)) {
    throw new Error("Invalid response");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  if (decision === "confirm") {
    const charter = formData.get("charter");
    if (charter == null) throw new Error("Charter acceptance required");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("meetings") as any)
      .update({ status: "confirmed", charter_accepted: true })
      .eq("id", meetingId);

    await notifyConfirmed(meetingId);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("meetings") as any)
      .update({ status: "declined" })
      .eq("id", meetingId);
  }

  for (const l of ["fr", "en"]) {
    revalidatePath(`/${l}/dashboard/client`);
    revalidatePath(`/${l}/admin/rdv`);
  }
}

// E-mails de confirmation (best-effort). On relit le meeting via le service client
// et on n'envoie QUE si la confirmation a bien été appliquée (garde anti no-op RLS).
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
    svc.from("client_projects").select("email, user_id").eq("id", mtg.project_id).single(),
    svc.from("architect_profiles").select("email, user_id").eq("id", mtg.architect_id).single(),
  ])) as [
    { data: { email: string; user_id: string | null } | null },
    { data: { email: string; user_id: string | null } | null },
  ];

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

  const sends: Promise<void>[] = [];
  if (proj?.email) {
    const m = meetingConfirmedEmail(porteurLoc, "client", {
      scheduledAt: mtg.scheduled_at,
      videoUrl: mtg.video_url,
    });
    sends.push(sendEmail({ to: proj.email, cc: adminEmail(), subject: m.subject, html: m.html }));
  }
  if (arch?.email) {
    const m = meetingConfirmedEmail(archLoc, "architect", {
      scheduledAt: mtg.scheduled_at,
      videoUrl: mtg.video_url,
    });
    sends.push(sendEmail({ to: arch.email, subject: m.subject, html: m.html }));
  }
  await Promise.all(sends);
}
