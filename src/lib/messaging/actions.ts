"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import {
  MAX_FILES,
  MAX_FILE_BYTES,
  MESSAGE_BUCKET,
  attachmentPathBelongs,
  checkAttachment,
  mimeForExtension,
  storagePathFor,
} from "./files";
import {
  canEditMessage,
  canOpenArchitectThread,
  forwardTarget,
  needsAnonymityCheck,
  needsReadUpdate,
  retainedArchitectId,
  threadWritable,
} from "./rules";
import {
  canViewThread,
  currentViewer,
  engagementsFor,
  findArchitectThread,
  getOrCreateAdmissionThread,
  getOrCreateArchitectThread,
  getOrCreateClientThread,
  loadThreadView,
  threadContext,
  unreadTotal,
  viewerSide,
  type ThreadContext,
  type ThreadRow,
} from "./data";
import { notifyNewMessage } from "./notify";
import type { ActionResult, ThreadView, Viewer } from "./types";

// Toutes les écritures de la messagerie. Chaque action revérifie le lecteur,
// son droit sur le fil et la règle métier : ce sont des points d'entrée POST
// publics, appelables hors de l'interface.

const MAX_BODY = 5000;
const fail = (error: string) => ({ error });
const svc = () => createServiceClient();

const writableCtx = (ctx: ThreadContext) =>
  threadWritable({ kind: ctx.thread.kind, architectId: ctx.thread.architect_id }, ctx.engagements);

async function viewerAndThread(threadId: string): Promise<{ viewer: Viewer; ctx: ThreadContext } | null> {
  const viewer = await currentViewer();
  if (!viewer) return null;
  const ctx = await canViewThread(viewer, threadId);
  return ctx ? { viewer, ctx } : null;
}

// Après un envoi, l'auteur a forcément lu le fil où il écrit. Pas après une
// transmission : l'admin n'a pas lu le fil de destination, et marquer ce fil
// comme lu masquerait les messages du porteur et lui afficherait un faux « Vu ».
async function touchThread(threadId: string, userId: string, opts: { authorRead: boolean }) {
  const s = svc();
  const now = new Date().toISOString();
  await Promise.all([
    s.from("message_threads").update({ last_message_at: now }).eq("id", threadId),
    opts.authorRead
      ? s.from("message_thread_reads").upsert({ thread_id: threadId, user_id: userId, last_read_at: now })
      : Promise.resolve(),
  ]);
}

// ── Envoi ─────────────────────────────────────────────────────────────────
export async function prepareUploads(
  threadId: string,
  files: { name: string; size: number }[],
): Promise<ActionResult<{ uploads: { path: string; token: string; name: string }[] }>> {
  const vt = await viewerAndThread(threadId);
  if (!vt) return fail("notAllowed");
  if (!writableCtx(vt.ctx)) return fail("readOnly");
  if (files.length === 0) return { ok: true, uploads: [] };
  if (files.length > MAX_FILES) return fail("tooMany");

  const uploads: { path: string; token: string; name: string }[] = [];
  for (const f of files) {
    const c = checkAttachment(f);
    if (!c.ok) return fail(c.error === "size" || c.error === "empty" ? "fileSize" : "fileType");
    const path = storagePathFor(threadId, randomUUID(), c.ext);
    const { data, error } = await svc().storage.from(MESSAGE_BUCKET).createSignedUploadUrl(path);
    if (error || !data) return fail("generic");
    uploads.push({ path, token: data.token, name: c.name });
  }
  return { ok: true, uploads };
}

export async function sendMessage(input: {
  threadId: string;
  body: string;
  attachments: { path: string; name: string }[];
}): Promise<ActionResult> {
  const vt = await viewerAndThread(input.threadId);
  if (!vt) return fail("notAllowed");
  const { viewer, ctx } = vt;
  if (!writableCtx(ctx)) return fail("readOnly");

  const body = String(input.body ?? "").trim();
  const atts = Array.isArray(input.attachments) ? input.attachments : [];
  if (body.length > MAX_BODY) return fail("tooLong");
  if (atts.length > MAX_FILES) return fail("tooMany");
  if (!body && atts.length === 0) return fail("empty");

  // Les fichiers ont été envoyés par le navigateur : on ne croit que ce que
  // le stockage contient, dans le dossier de CE fil.
  const s = svc();
  const rows: { storage_path: string; file_name: string; mime_type: string; size_bytes: number }[] = [];
  for (const a of atts) {
    if (!attachmentPathBelongs(String(a.path), input.threadId)) return fail("notAllowed");
    const objectName = a.path.slice(input.threadId.length + 1);
    const ext = objectName.slice(objectName.lastIndexOf(".") + 1);
    const c = checkAttachment({ name: String(a.name), size: 1 });
    if (!c.ok || c.ext !== ext) return fail("fileType");
    const { data: listed } = await s.storage.from(MESSAGE_BUCKET).list(input.threadId, { search: objectName });
    const obj = listed?.find((o) => o.name === objectName);
    if (!obj) return fail("fileMissing");
    const size = Number((obj.metadata as { size?: number } | null)?.size ?? 0);
    if (!(size > 0) || size > MAX_FILE_BYTES) return fail("fileSize");
    rows.push({ storage_path: a.path, file_name: c.name, mime_type: mimeForExtension(ext), size_bytes: size });
  }

  const side = viewerSide(viewer);
  const { data: msg, error } = await s
    .from("messages")
    .insert({ thread_id: input.threadId, author_id: viewer.userId, author_side: side, body })
    .select("id")
    .single();
  if (error || !msg) return fail("generic");
  if (rows.length) {
    const { error: attErr } = await s
      .from("message_attachments")
      .insert(rows.map((r) => ({ ...r, message_id: msg.id, thread_id: input.threadId })));
    if (attErr) {
      await s.from("messages").delete().eq("id", msg.id);
      return fail("generic");
    }
  }
  await touchThread(input.threadId, viewer.userId, { authorRead: true });
  await notifyNewMessage(ctx, side);
  return { ok: true };
}

// ── Modifier / supprimer (5 minutes, auteur seul) ────────────────────────
async function ownMessage(messageId: string) {
  const viewer = await currentViewer();
  if (!viewer) return null;
  const { data: m } = await svc()
    .from("messages")
    .select("id, thread_id, author_id, body, created_at, deleted_at")
    .eq("id", messageId)
    .maybeSingle();
  if (!m) return null;
  const ctx = await canViewThread(viewer, m.thread_id);
  return ctx ? { viewer, ctx, m } : null;
}

export async function editMessage(messageId: string, body: string): Promise<ActionResult> {
  const o = await ownMessage(messageId);
  if (!o) return fail("notAllowed");
  if (!writableCtx(o.ctx)) return fail("readOnly");
  const now = new Date();
  if (!canEditMessage({ authorId: o.m.author_id, createdAt: o.m.created_at, deletedAt: o.m.deleted_at }, o.viewer.userId, now)) {
    return fail("tooLate");
  }
  const next = String(body ?? "").trim();
  if (next.length > MAX_BODY) return fail("tooLong");
  if (next === o.m.body) return { ok: true };
  const s = svc();
  if (!next) {
    const { count } = await s.from("message_attachments").select("id", { count: "exact", head: true }).eq("message_id", messageId);
    if (!count) return fail("empty");
  }
  await s.from("message_revisions").insert({ message_id: messageId, body: o.m.body, action: "edit", revised_by: o.viewer.userId });
  const { error } = await s.from("messages").update({ body: next, edited_at: now.toISOString() }).eq("id", messageId);
  return error ? fail("generic") : { ok: true };
}

export async function deleteMessage(messageId: string): Promise<ActionResult> {
  const o = await ownMessage(messageId);
  if (!o) return fail("notAllowed");
  if (!writableCtx(o.ctx)) return fail("readOnly");
  const now = new Date();
  if (!canEditMessage({ authorId: o.m.author_id, createdAt: o.m.created_at, deletedAt: o.m.deleted_at }, o.viewer.userId, now)) {
    return fail("tooLate");
  }
  const s = svc();
  // Le texte part en révision (trace admin) ; les fichiers deviennent
  // inaccessibles mais restent stockés pour la même raison.
  await s.from("message_revisions").insert({ message_id: messageId, body: o.m.body, action: "delete", revised_by: o.viewer.userId });
  const iso = now.toISOString();
  const [{ error }] = await Promise.all([
    s.from("messages").update({ body: "", deleted_at: iso }).eq("id", messageId),
    s.from("message_attachments").update({ removed_at: iso }).eq("message_id", messageId).is("removed_at", null),
  ]);
  return error ? fail("generic") : { ok: true };
}

// ── Lecture ───────────────────────────────────────────────────────────────
export async function markRead(threadId: string): Promise<ActionResult> {
  const vt = await viewerAndThread(threadId);
  if (!vt) return fail("notAllowed");
  const s = svc();
  const other = viewerSide(vt.viewer) === "admin" ? "owner" : "admin";
  const [{ data: cur }, { data: latest }] = await Promise.all([
    s.from("message_thread_reads").select("last_read_at").eq("thread_id", threadId).eq("user_id", vt.viewer.userId).maybeSingle(),
    s.from("messages").select("created_at").eq("thread_id", threadId).eq("author_side", other)
      .order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (!needsReadUpdate(cur?.last_read_at ?? null, latest?.created_at ?? null)) return { ok: true };
  await s
    .from("message_thread_reads")
    .upsert({ thread_id: threadId, user_id: vt.viewer.userId, last_read_at: new Date().toISOString() });
  return { ok: true };
}

// `before` : page plus ancienne. `since` : tout ce qui est postérieur au plus
// ancien message déjà affiché — un rafraîchissement couvre ainsi toute la
// fenêtre chargée, sans qu'un message ne glisse hors de l'écran.
export async function refreshThread(
  threadId: string,
  locale: string,
  opts: { before?: string; since?: string } = {},
): Promise<ActionResult<{ view: ThreadView }>> {
  const viewer = await currentViewer();
  if (!viewer) return fail("notAllowed");
  const view = await loadThreadView(viewer, threadId, {
    locale: locale === "en" ? "en" : "fr",
    before: typeof opts.before === "string" ? opts.before : undefined,
    since: typeof opts.since === "string" ? opts.since : undefined,
  });
  return view ? { ok: true, view } : fail("notAllowed");
}

export async function unreadMessagesTotal(): Promise<number> {
  const viewer = await currentViewer();
  return viewer ? unreadTotal(viewer) : 0;
}

// ── Admin ─────────────────────────────────────────────────────────────────
async function adminViewer(): Promise<Viewer | null> {
  const v = await currentViewer();
  return v?.role === "admin" ? v : null;
}

/** Formulaire de la fiche projet : ouvre (ou retrouve) le fil de l'architecte retenu. */
export async function openArchitectThread(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId") ?? "");
  const architectId = String(formData.get("architectId") ?? "");
  const admin = await adminViewer();
  if (!admin) redirect("/fr/admin");
  const engagements = await engagementsFor(projectId);
  if (!canOpenArchitectThread(engagements, architectId)) {
    redirect(`/fr/admin/projets/${projectId}?error=notAllowed`);
  }
  const id = await getOrCreateArchitectThread(projectId, architectId, admin.userId);
  redirect(`/fr/admin/messages/${id}`);
}

export async function forwardAttachment(input: {
  attachmentId: string;
  note: string;
  confirmed: boolean;
}): Promise<ActionResult> {
  const admin = await adminViewer();
  if (!admin) return fail("notAllowed");
  const s = svc();
  const { data: att } = await s
    .from("message_attachments")
    .select("id, thread_id, storage_path, file_name, mime_type, size_bytes, removed_at")
    .eq("id", input.attachmentId)
    .maybeSingle();
  if (!att || att.removed_at) return fail("notAllowed");
  const source = await canViewThread(admin, att.thread_id);
  if (!source || !source.thread.project_id) return fail("noTarget");
  const kind = forwardTarget(source.thread.kind);
  if (!kind) return fail("noTarget");

  const retained = retainedArchitectId(source.engagements);
  let targetId: string | null = null;
  if (kind === "project_client") {
    // Depuis le fil d'un architecte qui n'est plus retenu : rien à transmettre.
    if (!writableCtx(source)) return fail("readOnly");
    targetId = await getOrCreateClientThread(source.thread.project_id, admin.userId);
  } else {
    targetId = retained ? await findArchitectThread(source.thread.project_id, retained) : null;
  }
  if (!targetId) return fail("noTarget");
  const { data: targetRow } = await s
    .from("message_threads")
    .select("id, kind, project_id, architect_id, created_at, last_message_at, owner_notified_at, admin_notified_at")
    .eq("id", targetId)
    .single();
  const target = await threadContext(targetRow as ThreadRow);
  if (!writableCtx(target)) return fail("readOnly");

  const retainedStatus = source.engagements.find((e) => e.architectId === retained)?.status ?? null;
  if (needsAnonymityCheck(retainedStatus) && !input.confirmed) return fail("checkRequired");
  const note = String(input.note ?? "").trim();
  if (note.length > MAX_BODY) return fail("tooLong");

  const ext = att.storage_path.slice(att.storage_path.lastIndexOf(".") + 1);
  const newPath = storagePathFor(targetId, randomUUID(), ext);
  const { error: copyErr } = await s.storage.from(MESSAGE_BUCKET).copy(att.storage_path, newPath);
  if (copyErr) return fail("generic");

  const { data: msg, error } = await s
    .from("messages")
    .insert({ thread_id: targetId, author_id: admin.userId, author_side: "admin", body: note })
    .select("id")
    .single();
  if (error || !msg) return fail("generic");
  await s.from("message_attachments").insert({
    message_id: msg.id,
    thread_id: targetId,
    storage_path: newPath,
    file_name: att.file_name,
    mime_type: att.mime_type,
    size_bytes: att.size_bytes,
    forwarded_from: att.id,
  });
  await touchThread(targetId, admin.userId, { authorRead: false });
  await notifyNewMessage(target, "admin");
  return { ok: true };
}

export async function removeAttachment(attachmentId: string): Promise<ActionResult> {
  const admin = await adminViewer();
  if (!admin) return fail("notAllowed");
  const { error } = await svc()
    .from("message_attachments")
    .update({ removed_at: new Date().toISOString() })
    .eq("id", attachmentId)
    .is("removed_at", null);
  return error ? fail("generic") : { ok: true };
}

/** Fiche projet : ouvre (ou crée) le fil avec le porteur. */
export async function openClientThread(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId") ?? "");
  const admin = await adminViewer();
  if (!admin) redirect("/fr/admin");
  const id = await getOrCreateClientThread(projectId, admin.userId);
  redirect(`/fr/admin/messages/${id}`);
}

/** Fiche architecte : ouvre (ou crée) son fil d'admission. */
export async function openAdmissionThread(formData: FormData): Promise<void> {
  const architectId = String(formData.get("architectId") ?? "");
  const admin = await adminViewer();
  if (!admin) redirect("/fr/admin");
  const id = await getOrCreateAdmissionThread(architectId, admin.userId);
  redirect(`/fr/admin/messages/${id}`);
}
