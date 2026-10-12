# Messagerie admin ↔ porteurs / architectes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Threads between the Reliote admin and project owners (one per project) and between the admin and architects (one per retained-architect × project, plus one admission thread per architect), with file attachments, edit/delete within 5 minutes, "Seen" receipts, realtime delivery and throttled e-mail alerts.

**Architecture:** All writes go through server actions that authorise in TypeScript with the service client (the codebase's pattern). Reads for realtime are protected by read-only RLS policies; the browser subscribes to `postgres_changes` on the open thread and, on any event, reloads a server-computed `ThreadView` (labels, permissions, "Seen"). Files go browser → private bucket through single-use signed upload URLs; downloads go through a route that checks rights and redirects to a 5-minute signed URL with forced download.

**Tech Stack:** Next.js 16 App Router (server actions, route handlers), next-intl fr/en, Supabase (Postgres RLS, Storage, Realtime), Vitest, Playwright MCP for verification.

**Spec:** `docs/superpowers/specs/2026-10-13-messagerie-design.md`

## Global Constraints

- Migration file: `supabase/migrations/0017_messaging.sql`, idempotent where practical; helpers live in schema `private` (never `public`), `security definer`, `set search_path = ''`.
- No `insert/update/delete` RLS policy for `authenticated` on any messaging table; no storage policy for `authenticated` on bucket `message-files`.
- Bucket `message-files`: private, `file_size_limit` = 25 MiB (26 214 400 bytes), `allowed_mime_types` = null (DWG/DXF arrive as `application/octet-stream`); extension whitelist enforced server-side.
- Allowed extensions: `pdf jpg jpeg png webp heic heif docx xlsx dwg dxf`. Max 5 files per message. Body ≤ 5 000 characters. Edit/delete window: 5 minutes after `created_at`, author only.
- Signed download URL lifetime: 300 s, always `download: file_name` (never inline).
- Non-admin viewers always see the admin as **« Reliote »**; never an admin's name.
- E-mail throttle: one per thread per recipient side per hour, unless the recipient read the thread since the last e-mail.
- Every new UI string in both `src/messages/fr.json` and `src/messages/en.json` (parity test). Admin-only screens may stay French like the rest of `/admin`.
- Verification on a production build against the local stack (`reliote-local-verification` memory), Playwright at 1440 and 375 px, FR and EN.
- Never write to the Supabase Cloud project; never push.

## Review Focus

1. A non-retained architect (other proposals still open, or declined later) must not be able to post in a project thread, even by calling the server action directly → `canWrite` false, action returns `error: "readOnly"`.
2. A user uploading to someone else's thread, or sending a `path` outside its own thread prefix, must be rejected → `prepareUploads`/`sendMessage` refuse; covered by `attachmentPathBelongs` tests.
3. File names with path separators, control characters, or > 120 chars, and extensions in capitals (`PLAN.DWG`) → sanitised, accepted case-insensitively; `.zip`, `.exe`, `.svg`, `.html`, no extension → refused.
4. Editing exactly at 5:00 or deleting an already-deleted message → refused (window is `< 5 min`, deleted messages are final).
5. A client must never receive realtime events or file links of an architect thread on their own project → RLS script asserts 0 rows; download route returns 404.

---

## File Structure

| File | Responsibility |
|---|---|
| `supabase/migrations/0017_messaging.sql` | Tables, constraints, indexes, `private.can_read_thread`, read RLS, realtime publication, bucket |
| `supabase/tests/messaging_rls.sql` | Manual RLS assertions on the local stack (rolled back) |
| `supabase/docker-compose.yml`, `supabase/kong.template.yml`, `supabase/init/98-realtime.sql`, `supabase/.env.example` | Local Realtime service |
| `src/lib/messaging/files.ts` (+ test) | Attachment validation, name sanitising, storage path helpers |
| `src/lib/messaging/rules.ts` (+ test) | Pure permission / "Seen" / unread / notify / forward rules |
| `src/lib/messaging/types.ts` | Shared view types (`ThreadView`, `MessageView`, …) |
| `src/lib/messaging/data.ts` | Server-only loaders (viewer, threads, views, unread counts, get-or-create) |
| `src/lib/messaging/notify.ts` | Server-only e-mail decision + sending |
| `src/lib/messaging/actions.ts` | `"use server"` actions |
| `src/app/api/messages/files/[id]/route.ts` | Authorised download redirect |
| `src/lib/email/templates.ts` (+ test) | `newMessageEmail`, `newMessageAdminEmail` |
| `src/components/messaging/*` | `ThreadView`, `MessageItem`, `Composer`, `ForwardDialog`, `ThreadList`, `useThreadRealtime` |
| Pages under `dashboard/client/messages`, `dashboard/architecte/messages`, `admin/messages` | Screens |
| `AdminShell`, admin layout, admin project & architect pages, dashboards, `NavAccount` | Entry points and counters |

---

### Task 1: Local Realtime service

**Files:** Modify `supabase/docker-compose.yml`, `supabase/kong.template.yml`, `supabase/.env.example`; Create `supabase/init/98-realtime.sql`.

- [ ] **Step 1:** Add to `docker-compose.yml`:

```yaml
  realtime:
    # Le nom d'hôte sert d'identifiant de tenant : « realtime-dev » est le tenant
    # créé par SEED_SELF_HOST.
    image: supabase/realtime:v2.34.47
    container_name: realtime-dev.supabase-realtime
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      PORT: 4000
      DB_HOST: db
      DB_PORT: 5432
      DB_USER: supabase_admin
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      DB_NAME: postgres
      DB_AFTER_CONNECT_QUERY: "SET search_path TO _realtime"
      DB_ENC_KEY: supabaserealtime
      API_JWT_SECRET: ${JWT_SECRET}
      SECRET_KEY_BASE: ${REALTIME_SECRET_KEY_BASE}
      ERL_AFLAGS: -proto_dist inet_tcp
      DNS_NODES: "''"
      RLIMIT_NOFILE: "10000"
      APP_NAME: realtime
      SEED_SELF_HOST: "true"
      RUN_JANITOR: "true"
```

and mount `./init/98-realtime.sql` in `db` like `99-reliote-perms.sql`.
- [ ] **Step 2:** `init/98-realtime.sql`: `create schema if not exists _realtime; alter schema _realtime owner to supabase_admin;`. For the existing volume, run it once with `docker compose exec db psql -U supabase_admin -d postgres -f /docker-entrypoint-initdb.d/98-realtime.sql`.
- [ ] **Step 3:** Kong route in `kong.template.yml`:

```yaml
  - name: realtime-v1-ws
    url: http://realtime-dev.supabase-realtime:4000/socket
    protocol: ws
    routes:
      - name: realtime-v1-ws
        strip_path: true
        paths:
          - /realtime/v1/
    plugins:
      - name: cors
      - name: key-auth
        config:
          hide_credentials: false
```

`.env.example`: `REALTIME_SECRET_KEY_BASE=` (64+ chars, generate with `openssl rand -hex 32`). Render Kong (`./render-kong.sh`), `docker compose up -d realtime kong`.
- [ ] **Step 4:** Verify: `docker logs realtime-dev.supabase-realtime` shows the tenant seeded; `curl -i -H "apikey: $ANON_KEY" "http://127.0.0.1:54321/realtime/v1/api/health"` (or a websocket handshake) answers.
- [ ] **Step 5:** Commit `chore(supabase): local Realtime service`.

### Task 2: Migration 0017 + RLS script

**Files:** Create `supabase/migrations/0017_messaging.sql`, `supabase/tests/messaging_rls.sql`; regenerate `src/types/database.ts`.

- [ ] **Step 1:** Write `0017_messaging.sql`:

```sql
-- 0017_messaging.sql — fils admin ↔ porteur / architecte, pièces jointes.
-- Lecture par RLS (temps réel), écritures uniquement côté serveur (service).

do $$ begin
  create type public.thread_kind as enum ('project_client', 'project_architect', 'architect_admission');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.message_side as enum ('admin', 'owner');
exception when duplicate_object then null; end $$;

create table if not exists public.message_threads (
  id                uuid primary key default gen_random_uuid(),
  kind              public.thread_kind not null,
  project_id        uuid references public.client_projects(id) on delete cascade,
  architect_id      uuid references public.architect_profiles(id) on delete cascade,
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  last_message_at   timestamptz,
  owner_notified_at timestamptz,
  admin_notified_at timestamptz,
  constraint message_threads_shape check (
    (kind = 'project_client'      and project_id is not null and architect_id is null) or
    (kind = 'project_architect'   and project_id is not null and architect_id is not null) or
    (kind = 'architect_admission' and project_id is null     and architect_id is not null)
  )
);
create unique index if not exists message_threads_client_uq    on public.message_threads (project_id) where kind = 'project_client';
create unique index if not exists message_threads_architect_uq on public.message_threads (project_id, architect_id) where kind = 'project_architect';
create unique index if not exists message_threads_admission_uq on public.message_threads (architect_id) where kind = 'architect_admission';
create index if not exists message_threads_last_idx on public.message_threads (last_message_at desc nulls last);

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references public.message_threads(id) on delete cascade,
  author_id   uuid references auth.users(id) on delete set null,
  author_side public.message_side not null,
  body        text not null default '' check (char_length(body) <= 5000),
  created_at  timestamptz not null default now(),
  edited_at   timestamptz,
  deleted_at  timestamptz
);
create index if not exists messages_thread_created_idx on public.messages (thread_id, created_at desc);

create table if not exists public.message_revisions (
  id          uuid primary key default gen_random_uuid(),
  message_id  uuid not null references public.messages(id) on delete cascade,
  body        text not null,
  action      text not null check (action in ('edit', 'delete')),
  revised_by  uuid references auth.users(id) on delete set null,
  revised_at  timestamptz not null default now()
);
create index if not exists message_revisions_message_idx on public.message_revisions (message_id);

create table if not exists public.message_attachments (
  id             uuid primary key default gen_random_uuid(),
  message_id     uuid not null references public.messages(id) on delete cascade,
  thread_id      uuid not null references public.message_threads(id) on delete cascade,
  storage_path   text not null unique,
  file_name      text not null check (char_length(file_name) between 1 and 160),
  mime_type      text not null,
  size_bytes     bigint not null check (size_bytes > 0 and size_bytes <= 26214400),
  created_at     timestamptz not null default now(),
  removed_at     timestamptz,
  forwarded_from uuid references public.message_attachments(id) on delete set null
);
create index if not exists message_attachments_message_idx on public.message_attachments (message_id);
create index if not exists message_attachments_thread_idx on public.message_attachments (thread_id);

create table if not exists public.message_thread_reads (
  thread_id    uuid not null references public.message_threads(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

-- Propriétaire (côté non admin) : porteur du projet, ou utilisateur de l'architecte.
create or replace function private.can_read_thread(t uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin() or exists (
    select 1
    from public.message_threads th
    left join public.client_projects p on p.id = th.project_id
    left join public.architect_profiles a on a.id = th.architect_id
    where th.id = t
      and (
        (th.kind = 'project_client' and p.user_id = (select auth.uid()))
        or (th.kind in ('project_architect', 'architect_admission') and a.user_id = (select auth.uid()))
      )
  );
$$;
revoke execute on function private.can_read_thread(uuid) from public, anon;
grant execute on function private.can_read_thread(uuid) to authenticated, service_role;

alter table public.message_threads      enable row level security;
alter table public.messages             enable row level security;
alter table public.message_revisions    enable row level security;
alter table public.message_attachments  enable row level security;
alter table public.message_thread_reads enable row level security;

drop policy if exists "threads participant read"     on public.message_threads;
drop policy if exists "messages participant read"    on public.messages;
drop policy if exists "revisions admin read"         on public.message_revisions;
drop policy if exists "attachments participant read" on public.message_attachments;
drop policy if exists "reads participant read"       on public.message_thread_reads;

create policy "threads participant read"     on public.message_threads      for select to authenticated using (private.can_read_thread(id));
create policy "messages participant read"    on public.messages             for select to authenticated using (private.can_read_thread(thread_id));
create policy "revisions admin read"         on public.message_revisions    for select to authenticated using (private.is_admin());
create policy "attachments participant read" on public.message_attachments  for select to authenticated using (private.can_read_thread(thread_id));
create policy "reads participant read"       on public.message_thread_reads for select to authenticated using (private.can_read_thread(thread_id));

-- Temps réel : uniquement si la publication existe (Cloud et pile locale).
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['messages', 'message_attachments', 'message_thread_reads'] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
      ) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

-- Bucket privé ; aucune policy pour authenticated (URL signées uniquement).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('message-files', 'message-files', false, 26214400, null)
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = null;
```

- [ ] **Step 2:** Apply locally: `cd supabase && RELIOTE_DEV_ADMIN_PASSWORD=… ./apply-migrations.sh`. Expected: `0017` applied.
- [ ] **Step 3:** Write `supabase/tests/messaging_rls.sql` (runs in a transaction, rolled back): creates a client user, an architect user, a third user, a project, an architect profile, three threads with one message each, then for each user `set local role authenticated; set local request.jwt.claims = '{"sub":"<id>","role":"authenticated"}'` and asserts with `do $$ … raise exception … $$` that: the client sees exactly its `project_client` thread and messages; the architect sees the `project_architect` and `architect_admission` threads but not the client thread; the third user sees nothing; nobody but admin sees `message_revisions`; an `insert into public.messages` as the client fails with RLS.
- [ ] **Step 4:** Run: `docker compose exec -T db psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -f /dev/stdin < tests/messaging_rls.sql`. Expected: `NOTICE: messaging RLS ok` and `ROLLBACK`.
- [ ] **Step 5:** `npm run db:types`; `npx tsc --noEmit -p .` passes.
- [ ] **Step 6:** Commit `feat(db): messaging tables, read-only RLS, realtime publication, private bucket`.

### Task 3: File rules (`files.ts`)

**Interfaces — Produces:**
```ts
export const MESSAGE_BUCKET = "message-files";
export const MAX_FILE_BYTES = 26_214_400;
export const MAX_FILES = 5;
export const ALLOWED_EXTENSIONS: readonly string[]; // pdf jpg jpeg png webp heic heif docx xlsx dwg dxf
export type FileCheck = { ok: true; ext: string; name: string } | { ok: false; error: "type" | "size" | "empty" | "name" };
export function checkAttachment(f: { name: string; size: number }): FileCheck;
export function sanitizeFileName(name: string): string; // basename, no control chars, ≤ 120 chars, keeps extension
export function storagePathFor(threadId: string, id: string, ext: string): string; // `${threadId}/${id}.${ext}`
export function attachmentPathBelongs(path: string, threadId: string): boolean;
export function mimeForExtension(ext: string): string;
```
- [ ] **Step 1: Tests** (`src/lib/messaging/files.test.ts`): accepts `plan.pdf`, `PLAN.DWG` (ext `dwg`), `photo.HEIC`; refuses `a.zip`, `a.exe`, `a.svg`, `a.html`, `noext`, size 0 (`empty`), size `MAX_FILE_BYTES + 1` (`size`); exact `MAX_FILE_BYTES` accepted; `sanitizeFileName("../../etc/passwd.pdf") === "passwd.pdf"`, strips `\u0000`/`\n`, truncates a 300-char name to ≤ 120 while keeping `.pdf`; `attachmentPathBelongs("t1/x.pdf","t1")` true, `("t2/x.pdf","t1")` false, `("t1/../t2/x.pdf","t1")` false, `("t1/sub/x.pdf","t1")` false; `mimeForExtension("dwg") === "application/acad"`, unknown → `application/octet-stream`.
- [ ] **Step 2:** Run → fail. **Step 3:** Implement. **Step 4:** Run → pass. **Step 5:** Commit.

### Task 4: Messaging rules (`rules.ts`)

**Interfaces — Produces:**
```ts
export type ThreadKind = "project_client" | "project_architect" | "architect_admission";
export type Side = "admin" | "owner";
export type EngagementLite = { architectId: string; status: "proposed" | "engaged" | "declined" | "cancelled" | "expired" };
export const EDIT_WINDOW_MS = 5 * 60 * 1000;
export function retainedArchitectId(engagements: EngagementLite[]): string | null; // the only active (proposed|engaged) one
export function canOpenArchitectThread(engagements: EngagementLite[], architectId: string): boolean;
export function threadWritable(t: { kind: ThreadKind; architectId: string | null }, engagements: EngagementLite[]): boolean;
export function canEditMessage(m: { authorId: string | null; createdAt: string; deletedAt: string | null }, viewerId: string, now: Date): boolean;
export function editableUntil(m: { createdAt: string; deletedAt: string | null }): string | null; // ISO or null if deleted
export function isSeen(createdAt: string, otherSideLastRead: string | null): boolean;
export function unreadCount(messages: { side: Side; createdAt: string; deleted: boolean }[], viewerSide: Side, lastRead: string | null): number;
export function shouldNotify(p: { lastNotifiedAt: string | null; recipientLastReadAt: string | null; now: Date }): boolean;
export function forwardTarget(kind: ThreadKind): ThreadKind | null; // client ↔ architect, admission → null
export function needsAnonymityCheck(retainedStatus: EngagementLite["status"] | null): boolean; // true unless "engaged"
```
- [ ] **Step 1: Tests** (`rules.test.ts`): `retainedArchitectId` — `[]`→null; one proposed→its id; one engaged→its id; two proposed→null; one proposed + one declined→the proposed; only declined/cancelled→null. `threadWritable` — client & admission always true; architect thread true only for the retained architect, false after decline. `canEditMessage` — author at +4:59 true, at +5:00 false, other user false, deleted false, null author false. `isSeen` — null false, equal timestamps true, earlier false. `unreadCount` — counts only other side, after lastRead, not deleted. `shouldNotify` — never notified→true; notified 30 min ago and not read since→false; notified 61 min ago→true; notified 10 min ago but read after notification→true. `forwardTarget` mapping. `needsAnonymityCheck("engaged")` false, `("proposed")`/`null` true.
- [ ] **Steps 2–5:** fail → implement → pass → commit.

### Task 5: Server data layer (`types.ts`, `data.ts`)

**Interfaces — Produces:**
```ts
// types.ts
export type AttachmentView = { id: string; name: string; size: number; removed: boolean; forwarded: boolean; href: string;
  forward?: { label: string; needsCheck: boolean } };
export type MessageView = { id: string; mine: boolean; side: Side; authorLabel: string; body: string; createdAt: string;
  edited: boolean; deleted: boolean; editableUntil: string | null; seen: boolean; attachments: AttachmentView[] };
export type ThreadView = { id: string; kind: ThreadKind; title: string; subtitle: string; viewerSide: Side; writable: boolean;
  closed: boolean; anonymityReminder: boolean; messages: MessageView[]; hasOlder: boolean };
export type ThreadSummary = { id: string; kind: ThreadKind; title: string; subtitle: string; lastMessageAt: string | null;
  unread: number; closed: boolean; href: string };
export type Viewer = { userId: string; role: "admin" | "client" | "architect"; architectId: string | null };
// data.ts (server-only)
export async function currentViewer(): Promise<Viewer | null>;
export async function canViewThread(viewer: Viewer, threadId: string): Promise<ThreadRow | null>;
export async function loadThreadView(viewer: Viewer, threadId: string, opts?: { before?: string; locale: string }): Promise<ThreadView | null>;
export async function listThreads(viewer: Viewer, locale: string): Promise<ThreadSummary[]>;
export async function unreadTotal(viewer: Viewer): Promise<number>;
export async function getOrCreateClientThread(projectId: string, by: string): Promise<string>;
export async function getOrCreateAdmissionThread(architectId: string, by: string): Promise<string>;
export async function engagementsFor(projectId: string): Promise<EngagementLite[]>;
```
Titles: client thread → project type label + country; architect thread → same + « · {anon_handle} » for admin only; admission → « Dossier d'admission » / « Admission file » (+ architect name for admin). `authorLabel` for non-admin viewers: admin side → « Reliote », own side → « Vous »/« You »; for admin: owner side → client name / architect name, admin side → « Reliote ». Page size 50, `hasOlder` by fetching 51.
- [ ] Implement, `tsc` green, commit. (Exercised by Task 9 Playwright run.)

### Task 6: E-mail templates + notify

**Interfaces — Produces:** `newMessageEmail(loc, { ctaUrl })`, `newMessageAdminEmail({ threadLabel, adminUrl })` in `templates.ts`; `notifyNewMessage(threadId: string, authorSide: Side): Promise<void>` in `notify.ts` (uses `shouldNotify`, updates `owner_notified_at`/`admin_notified_at`, links: client `/{loc}/dashboard/client/messages/{projectId}`, architect `/{loc}/dashboard/architecte/messages/{threadId}`, admin `/fr/admin/messages/{threadId}`; never includes message content).
- [ ] **Tests** in `templates.test.ts`: FR default / EN switch; CTA url present; no message body leaked (template takes no body).
- [ ] fail → implement → pass → commit.

### Task 7: Server actions + download route

**Interfaces — Produces** (`src/lib/messaging/actions.ts`, all return `{ ok: true, … } | { error: string }`, never throw to the client):
```ts
prepareUploads(threadId: string, files: { name: string; size: number }[]): Promise<{ ok: true; uploads: { path: string; token: string; name: string }[] } | { error: string }>;
sendMessage(input: { threadId: string; body: string; attachments: { path: string; name: string }[] }): Promise<{ ok: true } | { error: string }>;
editMessage(messageId: string, body: string): Promise<…>;
deleteMessage(messageId: string): Promise<…>;
markRead(threadId: string): Promise<{ ok: true }>;
refreshThread(threadId: string, locale: string, before?: string): Promise<{ ok: true; view: ThreadView } | { error: string }>;
openArchitectThread(projectId: string, architectId: string): Promise<void>; // admin, redirects to /fr/admin/messages/{id}
forwardAttachment(input: { attachmentId: string; note: string; confirmed: boolean }): Promise<…>; // admin
removeAttachment(attachmentId: string): Promise<…>; // admin
unreadMessagesTotal(): Promise<number>;
```
Error codes: `notAllowed`, `readOnly`, `tooLate`, `empty`, `tooLong`, `tooMany`, `fileType`, `fileSize`, `fileMissing`, `checkRequired`, `noTarget`, `generic`.
`sendMessage`: viewer → `canViewThread` → `threadWritable` → body trimmed ≤ 5000 → attachments ≤ 5, each `attachmentPathBelongs`, object exists (`storage.list(threadId, { search: basename })`, take `metadata.size`) → insert message (+ attachments with `thread_id`, mime from extension) → `last_message_at` → mark author read → `notifyNewMessage`.
`editMessage/deleteMessage`: `canEditMessage` with `new Date()`; revision row first; delete sets `body = ''`, `deleted_at`, and `removed_at` on its attachments.
Route `GET /api/messages/files/[id]`: viewer, attachment + `canViewThread`, not removed → `createSignedUrl(path, 300, { download: file_name })` → 302; otherwise 404.
- [ ] Implement, `tsc`/lint green, commit.

### Task 8: UI components, pages, entry points, i18n

**Files:** `src/components/messaging/{ThreadView,MessageItem,Composer,ForwardDialog,ThreadList,useThreadRealtime}.tsx`; pages `dashboard/client/messages/page.tsx`, `dashboard/client/messages/[projectId]/page.tsx`, `dashboard/architecte/messages/page.tsx`, `dashboard/architecte/messages/[threadId]/page.tsx`, `admin/messages/page.tsx`, `admin/messages/[threadId]/page.tsx`; modify `AdminShell.tsx` (Messages tab + `unread` prop), `admin/layout.tsx` (passes count), `admin/projets/[id]/page.tsx` (Messages section + open-thread button), `admin/architectes/[id]/page.tsx` (admission link), `dashboard/client/page.tsx` and `dashboard/architecte/page.tsx` (Messages link with count), `NavAccount.tsx` (badge from `unreadMessagesTotal`), `fr.json`/`en.json` (`messaging` namespace).
- `useThreadRealtime(threadId, onChange)`: browser client, channel `thread:{id}`, `postgres_changes` `*` on `messages` / `message_attachments` / `message_thread_reads` with `filter: thread_id=eq.{id}`; debounced `onChange`; also on `visibilitychange` → visible and on `SUBSCRIBED` after reconnect.
- `ThreadView`: initial server `view`; on change → `refreshThread` then `markRead`; optimistic pending message with retry; « Voir les plus anciens »; read-only banner; anonymity reminder (admin, client thread, before engagement).
- `Composer`: textarea (Enter = newline, Ctrl/⌘+Enter = send), « Joindre » → `prepareUploads` → `uploadToSignedUrl` with per-file progress state → `sendMessage`; client-side `checkAttachment` for instant feedback.
- `MessageItem`: author label, time (locale), « modifié », « message supprimé », attachments as links to `/api/messages/files/{id}`, Modifier/Supprimer until `editableUntil` (timer hides them), « Vu » under the last own seen message; admin: « Transmettre » + « Retirer ».
- `ForwardDialog`: note + mandatory checkbox when `needsCheck`.
- [ ] Implement; parity test, `tsc`, lint green; commit (may be split: components, then pages/entry points).

### Task 9: End-to-end verification

- [ ] Production build into `.next-verify` on :3001 against the local stack (with Realtime). Throwaway local users (client, architect) created via admin API, deleted after; project + engagement fixtures inserted locally then removed.
- [ ] Playwright: client posts message with a PDF → admin sees it live in a second page without reload, unread badge in nav and tab; admin replies → client sees « Reliote » live; « Vu » appears for the client after admin opens the thread; edit within 5 min shows « modifié », delete shows « message supprimé »; admin opens architect thread only when one proposal remains; architect posts DWG; admin forwards to client (checkbox required before RDV confirmed); client downloads it (302 to signed URL, `Content-Disposition: attachment`); client requesting the architect attachment id → 404; declining the engagement makes the architect thread read-only with the banner. FR/EN, 1440/375, no horizontal overflow, no raw keys.
- [ ] `supabase/tests/messaging_rls.sql` green.
- [ ] Independent reviewer agent on the whole branch; fix Critical/Important; merge into local `main`.
