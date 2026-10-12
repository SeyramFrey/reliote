-- 0017_messaging.sql
-- Messagerie : fils admin ↔ porteur (un par projet), admin ↔ architecte retenu
-- (un par projet × architecte) et fil d'admission (un par architecte), pièces
-- jointes dans un bucket privé.
--
-- Lecture par RLS (c'est elle qui filtre le temps réel) ; AUCUNE écriture
-- possible pour authenticated : tout passe par les actions serveur (client
-- service), qui vérifient les droits métier (architecte retenu, fenêtre de
-- 5 minutes…). Idempotent.

do $$ begin
  create type public.thread_kind as enum ('project_client', 'project_architect', 'architect_admission');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.message_side as enum ('admin', 'owner');
exception when duplicate_object then null; end $$;

-- ── Fils ──────────────────────────────────────────────────────────────────
create table if not exists public.message_threads (
  id                uuid primary key default gen_random_uuid(),
  kind              public.thread_kind not null,
  project_id        uuid references public.client_projects(id) on delete cascade,
  architect_id      uuid references public.architect_profiles(id) on delete cascade,
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  last_message_at   timestamptz,
  -- Limitation des e-mails « nouveau message » (un par heure et par côté).
  owner_notified_at timestamptz,
  admin_notified_at timestamptz,
  constraint message_threads_shape check (
    (kind = 'project_client'      and project_id is not null and architect_id is null) or
    (kind = 'project_architect'   and project_id is not null and architect_id is not null) or
    (kind = 'architect_admission' and project_id is null     and architect_id is not null)
  )
);

create unique index if not exists message_threads_client_uq
  on public.message_threads (project_id) where kind = 'project_client';
create unique index if not exists message_threads_architect_uq
  on public.message_threads (project_id, architect_id) where kind = 'project_architect';
create unique index if not exists message_threads_admission_uq
  on public.message_threads (architect_id) where kind = 'architect_admission';
create index if not exists message_threads_last_idx
  on public.message_threads (last_message_at desc nulls last);
create index if not exists message_threads_architect_idx
  on public.message_threads (architect_id);

-- ── Messages ──────────────────────────────────────────────────────────────
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
create index if not exists messages_thread_created_idx
  on public.messages (thread_id, created_at desc);

-- Anciennes versions (modification / suppression) : trace pour l'admin seul.
create table if not exists public.message_revisions (
  id          uuid primary key default gen_random_uuid(),
  message_id  uuid not null references public.messages(id) on delete cascade,
  body        text not null,
  action      text not null check (action in ('edit', 'delete')),
  revised_by  uuid references auth.users(id) on delete set null,
  revised_at  timestamptz not null default now()
);
create index if not exists message_revisions_message_idx
  on public.message_revisions (message_id);

-- thread_id dénormalisé : le temps réel ne sait filtrer que sur une colonne
-- de la table elle-même.
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
create index if not exists message_attachments_message_idx
  on public.message_attachments (message_id);
create index if not exists message_attachments_thread_idx
  on public.message_attachments (thread_id);

-- Dernière lecture de chaque participant : non-lus et « Vu ».
create table if not exists public.message_thread_reads (
  thread_id    uuid not null references public.message_threads(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);
create index if not exists message_thread_reads_user_idx
  on public.message_thread_reads (user_id);

-- ── Droit de lecture d'un fil ─────────────────────────────────────────────
-- Admin, ou « propriétaire » du fil : le porteur du projet pour un fil
-- porteur, l'utilisateur de l'architecte pour un fil architecte / admission.
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
    left join public.client_projects p    on p.id = th.project_id
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

create policy "threads participant read" on public.message_threads
  for select to authenticated using (private.can_read_thread(id));
create policy "messages participant read" on public.messages
  for select to authenticated using (private.can_read_thread(thread_id));
create policy "revisions admin read" on public.message_revisions
  for select to authenticated using (private.is_admin());
create policy "attachments participant read" on public.message_attachments
  for select to authenticated using (private.can_read_thread(thread_id));
create policy "reads participant read" on public.message_thread_reads
  for select to authenticated using (private.can_read_thread(thread_id));

-- ── Temps réel ────────────────────────────────────────────────────────────
-- La publication existe sur le Cloud et sur la pile locale (image
-- supabase/postgres) ; garde au cas où.
do $$
declare
  t text;
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

-- ── Fichiers ──────────────────────────────────────────────────────────────
-- Bucket privé, 25 Mo. Pas de liste de types MIME : les plans DWG/DXF
-- arrivent en application/octet-stream ; la liste blanche d'extensions est
-- appliquée côté serveur. Aucune policy storage pour authenticated : envoi
-- par URL signée à usage unique, lecture par URL signée de 5 minutes.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('message-files', 'message-files', false, 26214400, null)
on conflict (id) do update
  set public             = false,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = null;
