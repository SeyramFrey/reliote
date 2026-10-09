"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendEmail, adminEmail } from "@/lib/email/client";
import {
  meetingProposedEmail,
  meetingCancelledEmail,
  proposalsReadyEmail,
} from "@/lib/email/templates";
import { appOrigin } from "@/lib/auth/origin";
import { safeAdminReturn } from "@/lib/auth/safeRedirect";
import { countryTimeZone, zonedWallTimeToUtc, TIMEZONE_CHOICES } from "@/lib/time/meetingTime";
import { advanceProject, ACTIVE_MEETING_STATUSES } from "@/lib/workflow/projectState";

// Toutes les mutations passent par le service client (bypass RLS) APRÈS le
// garde-fou requireAdmin(). Les server actions sont des endpoints POST
// indépendants : le rôle admin est revérifié à chaque appel. Une erreur
// métier renvoie sur la fiche avec ?error=<code> (affiché par la page).

type Svc = ReturnType<typeof createServiceClient>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = (s: Svc, name: "client_engagements" | "meetings" | "client_projects") => s.from(name) as any;

function revalidateProject(projectId: string): void {
  for (const l of ["fr", "en"]) {
    revalidatePath(`/${l}/admin/projets/${projectId}`);
    revalidatePath(`/${l}/admin/projets`);
    revalidatePath(`/${l}/admin/rdv`);
    revalidatePath(`/${l}/admin/matches`);
    revalidatePath(`/${l}/admin`);
    revalidatePath(`/${l}/dashboard/client`);
    revalidatePath(`/${l}/dashboard/architecte`);
  }
}

function fail(projectId: string, code: string): never {
  redirect(`/fr/admin/projets/${projectId}?error=${code}`);
}

// Une écriture qui échoue arrête l'action AVANT tout e-mail ou changement de
// statut : on ne prévient personne d'un RDV qui n'existe pas.
function check(res: { error: { code?: string; message: string } | null }, projectId: string): void {
  if (!res.error) return;
  if (res.error.code === "23505") fail(projectId, "meetingOpen");
  fail(projectId, "generic");
}

// Après une action réussie : revalide, puis renvoie sur une URL propre (sans
// ?error= d'une tentative précédente). `returnTo` permet à la page RDV de
// rester sur la page RDV ; seul un chemin admin interne est accepté.
function done(formData: FormData, projectId: string): never {
  revalidateProject(projectId);
  redirect(safeAdminReturn(String(formData.get("returnTo") ?? ""), `/fr/admin/projets/${projectId}`));
}

// Langue de chaque destinataire, depuis son profil (fr par défaut).
async function localesFor(s: Svc, ids: (string | null | undefined)[]): Promise<Map<string, string>> {
  const clean = ids.filter(Boolean) as string[];
  const map = new Map<string, string>();
  if (clean.length === 0) return map;
  const { data } = (await s.from("profiles").select("id, locale").in("id", clean)) as {
    data: { id: string; locale: string }[] | null;
  };
  (data ?? []).forEach((p) => map.set(p.id, p.locale));
  return map;
}

type ProjectInfo = {
  id: string;
  email: string;
  user_id: string | null;
  client_name: string;
  project_type: string;
  project_country: string;
  project_location: string;
};

async function projectInfo(s: Svc, projectId: string): Promise<ProjectInfo | null> {
  const { data } = (await s
    .from("client_projects")
    .select("id, email, user_id, client_name, project_type, project_country, project_location")
    .eq("id", projectId)
    .single()) as { data: ProjectInfo | null };
  return data;
}

async function activeMeetingCount(s: Svc, projectId: string): Promise<number> {
  const { count } = await s
    .from("meetings")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .in("status", [...ACTIVE_MEETING_STATUSES]);
  return count ?? 0;
}

// ── Propositions ────────────────────────────────────────────────────────────

// L'admin propose un architecte (vérifié) pour un projet. Un architecte retiré
// ou décliné auparavant peut être reproposé : son engagement repart à zéro.
export async function proposeArchitect(formData: FormData): Promise<void> {
  await requireAdmin();
  const projectId = String(formData.get("projectId") ?? "");
  const architectId = String(formData.get("architectId") ?? "");
  if (!projectId || !architectId) throw new Error("Missing project or architect");

  const s = createServiceClient();
  const { data: arch } = (await s
    .from("architect_profiles")
    .select("status")
    .eq("id", architectId)
    .single()) as { data: { status: string } | null };
  if (arch?.status !== "verified") fail(projectId, "notVerified");

  const { data: existing } = (await s
    .from("client_engagements")
    .select("id, status")
    .eq("project_id", projectId)
    .eq("architect_id", architectId)
    .maybeSingle()) as { data: { id: string; status: string } | null };

  if (!existing) {
    check(
      await table(s, "client_engagements").insert({
        project_id: projectId,
        architect_id: architectId,
        status: "proposed",
      }),
      projectId,
    );
  } else if (["declined", "cancelled", "expired"].includes(existing.status)) {
    check(
      await table(s, "client_engagements")
        .update({
          status: "proposed",
          proposed_at: new Date().toISOString(),
          engaged_at: null,
          charter_accepted: false,
        })
        .eq("id", existing.id),
      projectId,
    );
  }

  await advanceProject(s, projectId, "proposed");
  done(formData, projectId);
}

// Retire une proposition tant qu'aucun RDV n'est ouvert avec cet architecte.
export async function withdrawProposal(formData: FormData): Promise<void> {
  await requireAdmin();
  const projectId = String(formData.get("projectId") ?? "");
  const architectId = String(formData.get("architectId") ?? "");
  const s = createServiceClient();

  const { count } = await s
    .from("meetings")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("architect_id", architectId)
    .in("status", [...ACTIVE_MEETING_STATUSES]);
  if ((count ?? 0) > 0) fail(projectId, "meetingOpen");

  check(
    await table(s, "client_engagements")
      .update({ status: "cancelled" })
      .eq("project_id", projectId)
      .eq("architect_id", architectId)
      .eq("status", "proposed"),
    projectId,
  );

  await advanceProject(s, projectId, "proposal_withdrawn");
  done(formData, projectId);
}

// Multi-proposition : le porteur choisit lui-même parmi ≥ 2 profils anonymes.
export async function askClientToChoose(formData: FormData): Promise<void> {
  await requireAdmin();
  const projectId = String(formData.get("projectId") ?? "");
  const s = createServiceClient();

  const { count: proposed } = await s
    .from("client_engagements")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("status", "proposed");
  if ((proposed ?? 0) < 2) fail(projectId, "needTwo");
  if ((await activeMeetingCount(s, projectId)) > 0) fail(projectId, "meetingOpen");

  const proj = await projectInfo(s, projectId);
  if (proj?.email) {
    const locs = await localesFor(s, [proj.user_id]);
    const loc = (proj.user_id && locs.get(proj.user_id)) || "fr";
    const m = proposalsReadyEmail(loc, {
      count: proposed ?? 0,
      ctaUrl: `${await appOrigin()}/${loc}/dashboard/client`,
    });
    await sendEmail({ to: proj.email, subject: m.subject, html: m.html });
  }
  revalidateProject(projectId);
  redirect(`/fr/admin/projets/${projectId}?notice=asked`);
}

// ── Rendez-vous ─────────────────────────────────────────────────────────────

function parseSlot(formData: FormData): { at: Date; videoUrl: string | null } | null {
  const raw = String(formData.get("scheduledAt") ?? "");
  const zone = String(formData.get("timeZone") ?? "Europe/Paris");
  if (!TIMEZONE_CHOICES.some((z) => z.value === zone)) return null;
  try {
    const at = zonedWallTimeToUtc(raw, zone);
    const videoUrl = String(formData.get("videoUrl") ?? "").trim() || null;
    if (videoUrl && !/^https:\/\//i.test(videoUrl)) return null;
    return { at, videoUrl };
  } catch {
    return null;
  }
}

async function emailMeeting(
  s: Svc,
  proj: ProjectInfo,
  architectId: string,
  slot: { iso: string; videoUrl: string | null },
  rescheduled: boolean,
): Promise<void> {
  const { data: arch } = (await s
    .from("architect_profiles")
    .select("email, user_id")
    .eq("id", architectId)
    .single()) as { data: { email: string; user_id: string | null } | null };
  const locs = await localesFor(s, [proj.user_id, arch?.user_id]);
  const porteurLoc = (proj.user_id && locs.get(proj.user_id)) || "fr";
  const archLoc = (arch?.user_id && locs.get(arch.user_id)) || "fr";
  const origin = await appOrigin();
  const common = {
    scheduledAt: slot.iso,
    projectTimeZone: countryTimeZone(proj.project_country),
    videoUrl: slot.videoUrl,
    projectLabel: [proj.project_type, proj.project_location].filter(Boolean).join(" · "),
    rescheduled,
  };
  const client = meetingProposedEmail(porteurLoc, "client", {
    ...common,
    ctaUrl: `${origin}/${porteurLoc}/dashboard/client`,
  });
  const architect = meetingProposedEmail(archLoc, "architect", common);
  await Promise.all([
    sendEmail({ to: proj.email, cc: adminEmail(), subject: client.subject, html: client.html }),
    arch?.email ? sendEmail({ to: arch.email, subject: architect.subject, html: architect.html }) : Promise.resolve(),
  ]);
}

// L'admin planifie un RDV avec un architecte proposé (ou déjà engagé).
export async function scheduleMeeting(formData: FormData): Promise<void> {
  const { userId } = await requireAdmin();
  const projectId = String(formData.get("projectId") ?? "");
  const architectId = String(formData.get("architectId") ?? "");
  const slot = parseSlot(formData);
  if (!projectId || !architectId) throw new Error("Missing project or architect");
  if (!slot) fail(projectId, "badSlot");
  if (slot.at.getTime() < Date.now()) fail(projectId, "pastSlot");

  const s = createServiceClient();
  const { data: eng } = (await s
    .from("client_engagements")
    .select("status")
    .eq("project_id", projectId)
    .eq("architect_id", architectId)
    .maybeSingle()) as { data: { status: string } | null };
  if (!eng || !["proposed", "engaged"].includes(eng.status)) fail(projectId, "notProposed");
  if ((await activeMeetingCount(s, projectId)) > 0) fail(projectId, "meetingOpen");

  check(
    await table(s, "meetings").insert({
      project_id: projectId,
      architect_id: architectId,
      scheduled_at: slot.at.toISOString(),
      video_url: slot.videoUrl,
      status: "proposed",
      proposed_by: userId,
    }),
    projectId,
  );
  await advanceProject(s, projectId, "meeting_scheduled");

  const proj = await projectInfo(s, projectId);
  if (proj) await emailMeeting(s, proj, architectId, { iso: slot.at.toISOString(), videoUrl: slot.videoUrl }, false);
  done(formData, projectId);
}

// Nouveau créneau pour un RDV ouvert. Un RDV confirmé replanifié doit être
// reconfirmé par le porteur ; une révélation déjà faite reste acquise.
export async function rescheduleMeeting(formData: FormData): Promise<void> {
  await requireAdmin();
  const meetingId = String(formData.get("meetingId") ?? "");
  const s = createServiceClient();
  const { data: mtg } = (await s
    .from("meetings")
    .select("project_id, architect_id, status, video_url")
    .eq("id", meetingId)
    .single()) as {
    data: { project_id: string; architect_id: string; status: string; video_url: string | null } | null;
  };
  if (!mtg) throw new Error("Meeting not found");
  if (!(ACTIVE_MEETING_STATUSES as readonly string[]).includes(mtg.status)) fail(mtg.project_id, "meetingClosed");
  const slot = parseSlot(formData);
  if (!slot) fail(mtg.project_id, "badSlot");
  if (slot.at.getTime() < Date.now()) fail(mtg.project_id, "pastSlot");
  const videoUrl = slot.videoUrl ?? mtg.video_url;

  check(
    await table(s, "meetings")
      .update({ scheduled_at: slot.at.toISOString(), video_url: videoUrl, status: "rescheduled" })
      .eq("id", meetingId),
    mtg.project_id,
  );
  // Le RDV est de nouveau en attente du porteur.
  await table(s, "client_projects")
    .update({ status: "meeting_proposed" })
    .eq("id", mtg.project_id)
    .eq("status", "meeting_confirmed");

  const proj = await projectInfo(s, mtg.project_id);
  if (proj) await emailMeeting(s, proj, mtg.architect_id, { iso: slot.at.toISOString(), videoUrl }, true);
  done(formData, mtg.project_id);
}

// Terminer (RDV tenu → projet en revue) ou annuler un RDV.
export async function setMeetingStatus(formData: FormData): Promise<void> {
  await requireAdmin();
  const meetingId = String(formData.get("meetingId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!meetingId || !["completed", "cancelled"].includes(status)) {
    throw new Error("Invalid meeting update");
  }

  const s = createServiceClient();
  const { data: mtg } = (await s
    .from("meetings")
    .select("project_id, architect_id, status, scheduled_at")
    .eq("id", meetingId)
    .single()) as {
    data: { project_id: string; architect_id: string; status: string; scheduled_at: string } | null;
  };
  if (!mtg) throw new Error("Meeting not found");
  if (status === "completed" && mtg.status !== "confirmed") fail(mtg.project_id, "notConfirmed");
  if (status === "cancelled" && !(ACTIVE_MEETING_STATUSES as readonly string[]).includes(mtg.status)) {
    fail(mtg.project_id, "meetingClosed");
  }

  check(await table(s, "meetings").update({ status }).eq("id", meetingId), mtg.project_id);
  await advanceProject(s, mtg.project_id, status === "completed" ? "meeting_completed" : "meeting_cancelled");

  if (status === "cancelled") {
    const proj = await projectInfo(s, mtg.project_id);
    if (proj) {
      const { data: arch } = (await s
        .from("architect_profiles")
        .select("email, user_id")
        .eq("id", mtg.architect_id)
        .single()) as { data: { email: string; user_id: string | null } | null };
      const locs = await localesFor(s, [proj.user_id, arch?.user_id]);
      const d = {
        scheduledAt: mtg.scheduled_at,
        projectTimeZone: countryTimeZone(proj.project_country),
        projectLabel: [proj.project_type, proj.project_location].filter(Boolean).join(" · "),
      };
      const c = meetingCancelledEmail((proj.user_id && locs.get(proj.user_id)) || "fr", "client", d);
      const a = meetingCancelledEmail((arch?.user_id && locs.get(arch.user_id)) || "fr", "architect", d);
      await Promise.all([
        sendEmail({ to: proj.email, subject: c.subject, html: c.html }),
        arch?.email ? sendEmail({ to: arch.email, subject: a.subject, html: a.html }) : Promise.resolve(),
      ]);
    }
  }
  done(formData, mtg.project_id);
}

// Clôture du projet : les RDV encore ouverts sont annulés.
export async function closeProject(formData: FormData): Promise<void> {
  await requireAdmin();
  const projectId = String(formData.get("projectId") ?? "");
  if (formData.get("confirm") == null) fail(projectId, "confirmClose");
  const s = createServiceClient();
  check(
    await table(s, "meetings")
      .update({ status: "cancelled" })
      .eq("project_id", projectId)
      .in("status", [...ACTIVE_MEETING_STATUSES]),
    projectId,
  );
  // Les propositions encore en suspens tombent aussi : un projet clos ne doit
  // plus rien ouvrir à personne.
  check(
    await table(s, "client_engagements")
      .update({ status: "cancelled" })
      .eq("project_id", projectId)
      .eq("status", "proposed"),
    projectId,
  );
  await advanceProject(s, projectId, "closed");
  done(formData, projectId);
}
