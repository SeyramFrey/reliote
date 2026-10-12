import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { adminEmail, sendEmail } from "@/lib/email/client";
import { newMessageAdminEmail, newMessageEmail } from "@/lib/email/templates";
import { appOrigin } from "@/lib/auth/origin";
import { adminThreadLabel, type ThreadContext } from "./data";
import { shouldNotify, type Side } from "./rules";

// Alerte e-mail « nouveau message » vers l'autre côté du fil, au plus une par
// heure — sauf si le destinataire a lu le fil depuis la dernière alerte.
// Best-effort : n'échoue jamais l'envoi du message lui-même.
export async function notifyNewMessage(ctx: ThreadContext, authorSide: Side): Promise<void> {
  try {
    const s = createServiceClient();
    const toOwner = authorSide === "admin";
    const { data: reads } = await s
      .from("message_thread_reads")
      .select("user_id, last_read_at")
      .eq("thread_id", ctx.thread.id);
    const recipientReads = (reads ?? []).filter((r) =>
      toOwner ? r.user_id === ctx.ownerUserId : r.user_id !== ctx.ownerUserId,
    );
    const recipientLastReadAt = recipientReads.reduce<string | null>(
      (max, r) => (!max || Date.parse(r.last_read_at) > Date.parse(max) ? r.last_read_at : max),
      null,
    );
    const lastNotifiedAt = toOwner ? ctx.thread.owner_notified_at : ctx.thread.admin_notified_at;
    const now = new Date();
    if (!shouldNotify({ lastNotifiedAt, recipientLastReadAt, now })) return;

    const origin = await appOrigin();
    if (toOwner) {
      if (!ctx.ownerUserId) return;
      const [{ data: prof }, email] = await Promise.all([
        s.from("profiles").select("locale").eq("id", ctx.ownerUserId).maybeSingle(),
        ownerEmail(ctx),
      ]);
      if (!email) return;
      const loc = prof?.locale === "en" ? "en" : "fr";
      const path =
        ctx.thread.kind === "project_client"
          ? `/${loc}/dashboard/client/messages/${ctx.thread.project_id}`
          : ctx.thread.kind === "architect_admission"
            ? `/${loc}/dashboard/architecte/messages/admission`
            : `/${loc}/dashboard/architecte/messages/${ctx.thread.id}`;
      const m = newMessageEmail(loc, { ctaUrl: `${origin}${path}` });
      await sendEmail({ to: email, subject: m.subject, html: m.html });
    } else {
      const to = adminEmail();
      if (!to) return;
      const m = newMessageAdminEmail({
        threadLabel: await adminThreadLabel(ctx),
        adminUrl: `${origin}/fr/admin/messages/${ctx.thread.id}`,
      });
      await sendEmail({ to, subject: m.subject, html: m.html });
    }

    await s
      .from("message_threads")
      .update(toOwner ? { owner_notified_at: now.toISOString() } : { admin_notified_at: now.toISOString() })
      .eq("id", ctx.thread.id);
  } catch (e) {
    console.error("[messaging] notification failed", e);
  }
}

async function ownerEmail(ctx: ThreadContext): Promise<string | null> {
  const s = createServiceClient();
  if (ctx.thread.kind === "project_client" && ctx.thread.project_id) {
    const { data } = await s.from("client_projects").select("email").eq("id", ctx.thread.project_id).maybeSingle();
    return data?.email ?? null;
  }
  if (ctx.thread.architect_id) {
    const { data } = await s.from("architect_profiles").select("email").eq("id", ctx.thread.architect_id).maybeSingle();
    return data?.email ?? null;
  }
  return null;
}
