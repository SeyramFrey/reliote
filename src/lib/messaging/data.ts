import "server-only";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  editableUntil as editableUntilFor,
  forwardTarget,
  isSeen,
  needsAnonymityCheck,
  retainedArchitectId,
  threadWritable,
  type EngagementLite,
  type EngagementStatus,
  type Side,
  type ThreadKind,
} from "./rules";
import type { AttachmentView, MessageView, ThreadSummary, ThreadView, Viewer } from "./types";

// Lectures de la messagerie. Client service (contourne la RLS) : chaque
// fonction reçoit le lecteur et ne renvoie que ce qu'il a le droit de voir.
// La RLS de 0017 protège, elle, les lectures directes et le temps réel.

export const PAGE_SIZE = 50;

export type ThreadRow = {
  id: string;
  kind: ThreadKind;
  project_id: string | null;
  architect_id: string | null;
  created_at: string;
  last_message_at: string | null;
  owner_notified_at: string | null;
  admin_notified_at: string | null;
};

type ProjectLite = {
  id: string;
  user_id: string | null;
  client_name: string;
  project_type: string;
  project_location: string;
  project_country: string;
};

type ArchitectLite = {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  anon_handle: string | null;
};

export type ThreadContext = {
  thread: ThreadRow;
  project: ProjectLite | null;
  architect: ArchitectLite | null;
  engagements: EngagementLite[];
  /** Utilisateur « propriétaire » (côté non admin) du fil. */
  ownerUserId: string | null;
};

const THREAD_COLS =
  "id, kind, project_id, architect_id, created_at, last_message_at, owner_notified_at, admin_notified_at";
const PROJECT_COLS = "id, user_id, client_name, project_type, project_location, project_country";
const ARCHITECT_COLS = "id, user_id, first_name, last_name, anon_handle";

const svc = () => createServiceClient();

// ── Lecteur ───────────────────────────────────────────────────────────────
export async function currentViewer(): Promise<Viewer | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const s = svc();
  const { data: prof } = await s.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const role = prof?.role === "admin" || prof?.role === "architect" ? prof.role : "client";
  let architectId: string | null = null;
  if (role === "architect") {
    const { data: a } = await s.from("architect_profiles").select("id").eq("user_id", user.id).maybeSingle();
    architectId = a?.id ?? null;
  }
  return { userId: user.id, role, architectId };
}

// ── Fils ──────────────────────────────────────────────────────────────────
export async function engagementsFor(projectId: string): Promise<EngagementLite[]> {
  const { data } = await svc()
    .from("client_engagements")
    .select("architect_id, status")
    .eq("project_id", projectId);
  return (data ?? []).map((e) => ({ architectId: e.architect_id, status: e.status as EngagementStatus }));
}

export async function threadContext(thread: ThreadRow): Promise<ThreadContext> {
  const s = svc();
  const [project, architect, engagements] = await Promise.all([
    thread.project_id
      ? s.from("client_projects").select(PROJECT_COLS).eq("id", thread.project_id).maybeSingle().then((r) => r.data as ProjectLite | null)
      : Promise.resolve(null),
    thread.architect_id
      ? s.from("architect_profiles").select(ARCHITECT_COLS).eq("id", thread.architect_id).maybeSingle().then((r) => r.data as ArchitectLite | null)
      : Promise.resolve(null),
    thread.project_id ? engagementsFor(thread.project_id) : Promise.resolve([] as EngagementLite[]),
  ]);
  const ownerUserId = thread.kind === "project_client" ? (project?.user_id ?? null) : (architect?.user_id ?? null);
  return { thread, project, architect, engagements, ownerUserId };
}

/** Contextes de plusieurs fils en trois requêtes (listes, compteurs). */
export async function threadContexts(threads: ThreadRow[]): Promise<ThreadContext[]> {
  if (threads.length === 0) return [];
  const s = svc();
  const projectIds = [...new Set(threads.map((t) => t.project_id).filter((x): x is string => !!x))];
  const architectIds = [...new Set(threads.map((t) => t.architect_id).filter((x): x is string => !!x))];
  const [{ data: projects }, { data: architects }, { data: engs }] = await Promise.all([
    projectIds.length
      ? s.from("client_projects").select(PROJECT_COLS).in("id", projectIds)
      : Promise.resolve({ data: [] }),
    architectIds.length
      ? s.from("architect_profiles").select(ARCHITECT_COLS).in("id", architectIds)
      : Promise.resolve({ data: [] }),
    projectIds.length
      ? s.from("client_engagements").select("project_id, architect_id, status").in("project_id", projectIds)
      : Promise.resolve({ data: [] }),
  ]);
  const pById = new Map(((projects ?? []) as ProjectLite[]).map((p) => [p.id, p]));
  const aById = new Map(((architects ?? []) as ArchitectLite[]).map((a) => [a.id, a]));
  const engRows = (engs ?? []) as { project_id: string; architect_id: string; status: string }[];
  return threads.map((thread) => {
    const project = thread.project_id ? (pById.get(thread.project_id) ?? null) : null;
    const architect = thread.architect_id ? (aById.get(thread.architect_id) ?? null) : null;
    const engagements = engRows
      .filter((e) => e.project_id === thread.project_id)
      .map((e) => ({ architectId: e.architect_id, status: e.status as EngagementStatus }));
    const ownerUserId = thread.kind === "project_client" ? (project?.user_id ?? null) : (architect?.user_id ?? null);
    return { thread, project, architect, engagements, ownerUserId };
  });
}

/** Le fil et son contexte si le lecteur peut le voir, sinon null. */
export async function canViewThread(viewer: Viewer, threadId: string): Promise<ThreadContext | null> {
  const { data } = await svc().from("message_threads").select(THREAD_COLS).eq("id", threadId).maybeSingle();
  if (!data) return null;
  const ctx = await threadContext(data as ThreadRow);
  if (viewer.role === "admin") return ctx;
  return ctx.ownerUserId === viewer.userId ? ctx : null;
}

export function viewerSide(viewer: Viewer): Side {
  return viewer.role === "admin" ? "admin" : "owner";
}

async function getOrCreate(
  match: { kind: ThreadKind; project_id: string | null; architect_id: string | null },
  by: string,
): Promise<string> {
  const s = svc();
  const find = () => {
    let q = s.from("message_threads").select("id").eq("kind", match.kind);
    q = match.project_id ? q.eq("project_id", match.project_id) : q.is("project_id", null);
    q = match.architect_id ? q.eq("architect_id", match.architect_id) : q.is("architect_id", null);
    return q.maybeSingle();
  };
  const found = await find();
  if (found.data) return found.data.id;
  const ins = await s.from("message_threads").insert({ ...match, created_by: by }).select("id").single();
  if (ins.data) return ins.data.id;
  // Course : un autre onglet l'a créé entre-temps (index unique).
  const again = await find();
  if (again.data) return again.data.id;
  throw new Error(ins.error?.message ?? "thread creation failed");
}

export function getOrCreateClientThread(projectId: string, by: string): Promise<string> {
  return getOrCreate({ kind: "project_client", project_id: projectId, architect_id: null }, by);
}

export function getOrCreateAdmissionThread(architectId: string, by: string): Promise<string> {
  return getOrCreate({ kind: "architect_admission", project_id: null, architect_id: architectId }, by);
}

export function getOrCreateArchitectThread(projectId: string, architectId: string, by: string): Promise<string> {
  return getOrCreate({ kind: "project_architect", project_id: projectId, architect_id: architectId }, by);
}

export async function findArchitectThread(projectId: string, architectId: string): Promise<string | null> {
  const { data } = await svc()
    .from("message_threads")
    .select("id")
    .eq("kind", "project_architect")
    .eq("project_id", projectId)
    .eq("architect_id", architectId)
    .maybeSingle();
  return data?.id ?? null;
}

// ── Libellés ──────────────────────────────────────────────────────────────
type Labels = {
  t: Awaited<ReturnType<typeof getTranslations<"messaging">>>;
  types: Awaited<ReturnType<typeof getTranslations<"projectTypes">>>;
};

async function labels(locale: string): Promise<Labels> {
  const [t, types] = await Promise.all([
    getTranslations({ locale, namespace: "messaging" }),
    getTranslations({ locale, namespace: "projectTypes" }),
  ]);
  return { t, types };
}

function projectTitle(l: Labels, p: ProjectLite | null): string {
  if (!p) return "—";
  const type = l.types.has(p.project_type as never) ? l.types(p.project_type as never) : p.project_type;
  return l.t("projectTitle", { type, location: p.project_location, country: p.project_country });
}

const architectName = (a: ArchitectLite | null) => (a ? `${a.first_name} ${a.last_name}`.trim() : "—");

function titles(l: Labels, ctx: ThreadContext, viewer: Viewer): { title: string; subtitle: string } {
  const admin = viewer.role === "admin";
  if (ctx.thread.kind === "architect_admission") {
    return { title: l.t("admissionTitle"), subtitle: admin ? architectName(ctx.architect) : l.t("reliote") };
  }
  const title = projectTitle(l, ctx.project);
  if (!admin) return { title, subtitle: l.t("reliote") };
  if (ctx.thread.kind === "project_client") return { title, subtitle: ctx.project?.client_name ?? "—" };
  const handle = ctx.architect?.anon_handle ? ` · ${ctx.architect.anon_handle}` : "";
  return { title, subtitle: `${architectName(ctx.architect)}${handle}` };
}

function authorLabel(l: Labels, ctx: ThreadContext, viewer: Viewer, side: Side, mine: boolean): string {
  if (mine) return l.t("you");
  if (side === "admin") return l.t("reliote");
  // Côté propriétaire vu par l'admin.
  return ctx.thread.kind === "project_client" ? (ctx.project?.client_name ?? "—") : architectName(ctx.architect);
}

// ── Vue d'un fil ──────────────────────────────────────────────────────────
type MessageRow = {
  id: string;
  author_id: string | null;
  author_side: Side;
  body: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
};

type AttachmentRow = {
  id: string;
  message_id: string;
  file_name: string;
  size_bytes: number;
  removed_at: string | null;
  forwarded_from: string | null;
};

export async function loadThreadView(
  viewer: Viewer,
  threadId: string,
  opts: { locale: string; before?: string; since?: string },
): Promise<ThreadView | null> {
  const ctx = await canViewThread(viewer, threadId);
  if (!ctx) return null;
  return buildThreadView(viewer, ctx, opts);
}

export async function buildThreadView(
  viewer: Viewer,
  ctx: ThreadContext,
  opts: { locale: string; before?: string; since?: string },
): Promise<ThreadView> {
  const s = svc();
  const l = await labels(opts.locale);
  const side = viewerSide(viewer);
  const isAdmin = side === "admin";

  let messages: MessageRow[];
  let hasOlder: boolean;
  const cols = "id, author_id, author_side, body, created_at, edited_at, deleted_at";
  if (opts.since) {
    // Toute la fenêtre déjà affichée, plus les nouveaux messages.
    const { data: rows } = await s
      .from("messages")
      .select(cols)
      .eq("thread_id", ctx.thread.id)
      .gte("created_at", opts.since)
      .order("created_at", { ascending: true })
      .limit(1000);
    messages = (rows ?? []) as MessageRow[];
    const { count } = await s
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("thread_id", ctx.thread.id)
      .lt("created_at", opts.since);
    hasOlder = (count ?? 0) > 0;
  } else {
    let q = s
      .from("messages")
      .select(cols)
      .eq("thread_id", ctx.thread.id)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE + 1);
    if (opts.before) q = q.lt("created_at", opts.before);
    const { data: rows } = await q;
    const page = (rows ?? []) as MessageRow[];
    hasOlder = page.length > PAGE_SIZE;
    messages = page.slice(0, PAGE_SIZE).reverse();
  }

  const ids = messages.map((m) => m.id);
  const edited = messages.filter((m) => m.edited_at || m.deleted_at).map((m) => m.id);
  const [{ data: atts }, { data: reads }, { data: revs }] = await Promise.all([
    ids.length
      ? s.from("message_attachments").select("id, message_id, file_name, size_bytes, removed_at, forwarded_from").in("message_id", ids)
      : Promise.resolve({ data: [] as AttachmentRow[] }),
    s.from("message_thread_reads").select("user_id, last_read_at").eq("thread_id", ctx.thread.id),
    // Historique des modifications : admin seulement.
    isAdmin && edited.length
      ? s.from("message_revisions").select("message_id, body, action, revised_at").in("message_id", edited).order("revised_at")
      : Promise.resolve({ data: [] as { message_id: string; body: string; action: string; revised_at: string }[] }),
  ]);
  const revisionsByMessage = new Map<string, { body: string; action: "edit" | "delete"; at: string }[]>();
  for (const r of revs ?? []) {
    const list = revisionsByMessage.get(r.message_id) ?? [];
    list.push({ body: r.body, action: r.action === "delete" ? "delete" : "edit", at: r.revised_at });
    revisionsByMessage.set(r.message_id, list);
  }

  // Dernière lecture de l'autre côté : le propriétaire pour l'admin, n'importe
  // quel admin pour le propriétaire.
  const otherReads = (reads ?? []).filter((r) => (isAdmin ? r.user_id === ctx.ownerUserId : r.user_id !== ctx.ownerUserId));
  const otherLastRead = otherReads.reduce<string | null>(
    (max, r) => (!max || Date.parse(r.last_read_at) > Date.parse(max) ? r.last_read_at : max),
    null,
  );

  const retained = retainedArchitectId(ctx.engagements);
  const retainedStatus = ctx.engagements.find((e) => e.architectId === retained)?.status ?? null;
  const writable = threadWritable({ kind: ctx.thread.kind, architectId: ctx.thread.architect_id }, ctx.engagements);

  // Transfert (admin) : vers le fil porteur depuis le fil architecte, ou vers le
  // fil de l'architecte retenu (s'il existe et est ouvert) depuis le fil porteur.
  let forward: AttachmentView["forward"] | undefined;
  if (isAdmin && forwardTarget(ctx.thread.kind)) {
    const needsCheck = needsAnonymityCheck(retainedStatus);
    if (ctx.thread.kind === "project_architect" && writable) forward = { target: "client", needsCheck };
    if (ctx.thread.kind === "project_client" && retained && ctx.project) {
      const target = await findArchitectThread(ctx.project.id, retained);
      if (target) forward = { target: "architect", needsCheck };
    }
  }

  const byMessage = new Map<string, AttachmentView[]>();
  for (const a of (atts ?? []) as AttachmentRow[]) {
    const list = byMessage.get(a.message_id) ?? [];
    list.push({
      id: a.id,
      name: a.file_name,
      size: Number(a.size_bytes),
      removed: !!a.removed_at,
      forwarded: !!a.forwarded_from,
      href: `/api/messages/files/${a.id}`,
      ...(forward && !a.removed_at ? { forward } : {}),
    });
    byMessage.set(a.message_id, list);
  }

  const { title, subtitle } = titles(l, ctx, viewer);
  const view: MessageView[] = messages.map((m) => {
    const mine = m.author_id === viewer.userId;
    const deleted = !!m.deleted_at;
    return {
      id: m.id,
      mine,
      side: m.author_side,
      authorLabel: authorLabel(l, ctx, viewer, m.author_side, mine),
      body: deleted ? "" : m.body,
      createdAt: m.created_at,
      edited: !!m.edited_at,
      deleted,
      editableUntil: mine && writable ? editableUntilFor({ createdAt: m.created_at, deletedAt: m.deleted_at }) : null,
      seen: m.author_side === side && isSeen(m.created_at, otherLastRead),
      attachments: deleted ? [] : (byMessage.get(m.id) ?? []),
      ...(isAdmin && revisionsByMessage.has(m.id) ? { revisions: revisionsByMessage.get(m.id) } : {}),
    };
  });

  return {
    id: ctx.thread.id,
    kind: ctx.thread.kind,
    title,
    subtitle,
    viewerSide: side,
    writable,
    closed: !writable,
    anonymityReminder: isAdmin && ctx.thread.kind === "project_client" && needsAnonymityCheck(retainedStatus),
    messages: view,
    hasOlder,
  };
}

// ── Listes et non-lus ─────────────────────────────────────────────────────
// Non-lus calculés en base (0018) : aucune limite de lignes, un seul aller-retour.
async function unreadByThread(
  threads: { id: string; ownerUserId: string | null }[],
  side: Side,
  userId: string,
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (threads.length === 0) return out;
  const { data } = await svc().rpc("message_unread_counts", {
    p_thread_ids: threads.map((t) => t.id),
    p_side: side,
    p_user: userId,
  });
  for (const row of data ?? []) out.set(row.thread_id, Number(row.unread));
  return out;
}

const byRecent = (a: ThreadSummary, b: ThreadSummary) =>
  b.unread - a.unread ||
  (b.lastMessageAt ? Date.parse(b.lastMessageAt) : 0) - (a.lastMessageAt ? Date.parse(a.lastMessageAt) : 0);

export async function listThreads(viewer: Viewer, locale: string): Promise<ThreadSummary[]> {
  const s = svc();
  const l = await labels(locale);

  if (viewer.role === "client") {
    const { data: projects } = await s
      .from("client_projects")
      .select(PROJECT_COLS + ", created_at")
      .eq("user_id", viewer.userId)
      .order("created_at", { ascending: false });
    const ps = (projects ?? []) as unknown as (ProjectLite & { created_at: string })[];
    if (ps.length === 0) return [];
    const { data: threads } = await s
      .from("message_threads")
      .select(THREAD_COLS)
      .eq("kind", "project_client")
      .in("project_id", ps.map((p) => p.id));
    const byProject = new Map(((threads ?? []) as ThreadRow[]).map((t) => [t.project_id, t]));
    const unread = await unreadByThread(
      [...byProject.values()].map((t) => ({ id: t.id, ownerUserId: viewer.userId })),
      "owner",
      viewer.userId,
    );
    return ps
      .map((p) => {
        const t = byProject.get(p.id);
        return {
          key: p.id,
          kind: "project_client" as const,
          title: projectTitle(l, p),
          subtitle: l.t("reliote"),
          lastMessageAt: t?.last_message_at ?? null,
          unread: t ? (unread.get(t.id) ?? 0) : 0,
          closed: false,
          href: `/${locale}/dashboard/client/messages/${p.id}`,
        };
      })
      .sort(byRecent);
  }

  if (viewer.role === "architect") {
    if (!viewer.architectId) return [];
    const { data: threads } = await s
      .from("message_threads")
      .select(THREAD_COLS)
      .eq("architect_id", viewer.architectId);
    const rows = (threads ?? []) as ThreadRow[];
    const ctxs = await threadContexts(rows);
    const unread = await unreadByThread(
      ctxs.map((c) => ({ id: c.thread.id, ownerUserId: viewer.userId })),
      "owner",
      viewer.userId,
    );
    const admission = ctxs.find((c) => c.thread.kind === "architect_admission");
    const items: ThreadSummary[] = [
      {
        key: "admission",
        kind: "architect_admission",
        title: l.t("admissionTitle"),
        subtitle: l.t("reliote"),
        lastMessageAt: admission?.thread.last_message_at ?? null,
        unread: admission ? (unread.get(admission.thread.id) ?? 0) : 0,
        closed: false,
        href: `/${locale}/dashboard/architecte/messages/admission`,
      },
    ];
    const projects = ctxs
      .filter((c) => c.thread.kind === "project_architect")
      .map((c) => {
        const closed = !threadWritable({ kind: c.thread.kind, architectId: c.thread.architect_id }, c.engagements);
        return {
          key: c.thread.id,
          kind: c.thread.kind,
          title: projectTitle(l, c.project),
          subtitle: l.t("reliote"),
          lastMessageAt: c.thread.last_message_at,
          unread: unread.get(c.thread.id) ?? 0,
          closed,
          href: `/${locale}/dashboard/architecte/messages/${c.thread.id}`,
        };
      });
    // Fils ouverts d'abord, fermés en bas.
    const open = projects.filter((p) => !p.closed).sort(byRecent);
    const closed = projects.filter((p) => p.closed).sort(byRecent);
    return [...items, ...open, ...closed];
  }

  // Admin : tous les fils, non-lus d'abord.
  const { data: threads } = await s
    .from("message_threads")
    .select(THREAD_COLS)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(300);
  const ctxs = await threadContexts((threads ?? []) as ThreadRow[]);
  const unread = await unreadByThread(
    ctxs.map((c) => ({ id: c.thread.id, ownerUserId: c.ownerUserId })),
    "admin",
    viewer.userId,
  );
  return ctxs
    .map((c) => {
      const { title, subtitle } = titles(l, c, viewer);
      return {
        key: c.thread.id,
        kind: c.thread.kind,
        title,
        subtitle,
        lastMessageAt: c.thread.last_message_at,
        unread: unread.get(c.thread.id) ?? 0,
        closed: !threadWritable({ kind: c.thread.kind, architectId: c.thread.architect_id }, c.engagements),
        href: `/${locale}/admin/messages/${c.thread.id}`,
      };
    })
    .sort(byRecent);
}

export async function unreadTotal(viewer: Viewer): Promise<number> {
  const list = await listThreads(viewer, "fr");
  return list.reduce((n, t) => n + t.unread, 0);
}

/** Libellé du fil tel que l'admin le voit (e-mails admin). */
export async function adminThreadLabel(ctx: ThreadContext): Promise<string> {
  const l = await labels("fr");
  const { title, subtitle } = titles(l, ctx, { userId: "", role: "admin", architectId: null });
  return `${title} — ${subtitle}`;
}
