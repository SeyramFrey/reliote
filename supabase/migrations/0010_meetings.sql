-- 0010_meetings.sql
-- Bloc B/C — Workflow RDV (rendez-vous).
--
--   1. Étend l'enum project_status : selected, meeting_proposed, meeting_confirmed.
--   2. Enum meeting_status + table meetings (+ trigger updated_at).
--   3. Trigger : meeting 'confirmed' + charte acceptée → client_engagement 'engaged'
--      (ce qui déclenche à son tour la génération des relais + l'ouverture RLS
--       Niveau 3 déjà en place dans 0008) et fait avancer le projet à
--      'meeting_confirmed'.
--   4. RLS : lecture admin + architecte concerné + porteur du projet ; écriture
--      admin ; le porteur peut répondre à SON meeting (confirmer / décliner).
--
-- Idempotent.

-- ── 1. Extension des statuts projet ───────────────────────────────────────
-- Note Postgres : on ne peut pas ajouter une valeur d'enum ET la référencer
-- dans la même transaction, ni s'ancrer (AFTER) sur une valeur ajoutée dans la
-- même transaction. On ajoute donc les valeurs en fin d'enum : l'ordre de tri
-- de l'enum n'a aucune importance ici (project_status est toujours comparé par
-- égalité, jamais trié — cf. absence de `.order("status")` côté app).
-- Cycle de vie logique (piloté par le code applicatif) :
--   new → matched → selected → meeting_proposed → meeting_confirmed → in_review → closed
alter type public.project_status add value if not exists 'selected';
alter type public.project_status add value if not exists 'meeting_proposed';
alter type public.project_status add value if not exists 'meeting_confirmed';

-- ── 2. Enum + table meetings ──────────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_type where typname = 'meeting_status') then
    create type meeting_status as enum (
      'proposed',     -- l'admin a proposé un créneau + lien visio
      'confirmed',    -- le porteur a confirmé (et accepté la charte)
      'declined',     -- le porteur a décliné le créneau
      'rescheduled',  -- créneau replanifié
      'completed',    -- le RDV a eu lieu
      'cancelled'     -- annulé
    );
  end if;
end $$;

create table if not exists public.meetings (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references public.client_projects(id) on delete cascade,
  architect_id      uuid not null references public.architect_profiles(id) on delete cascade,
  scheduled_at      timestamptz not null,
  video_url         text,
  status            meeting_status not null default 'proposed',
  charter_accepted  boolean not null default false,
  proposed_by       uuid references public.profiles(id) on delete set null,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_meetings_project   on public.meetings (project_id);
create index if not exists idx_meetings_architect on public.meetings (architect_id);
create index if not exists idx_meetings_status    on public.meetings (status);

-- updated_at maintenance (réutilise le helper de 0003).
drop trigger if exists touch_meetings on public.meetings;
create trigger touch_meetings before update on public.meetings
  for each row execute function public.touch_updated_at();

-- ── 3. Trigger : RDV confirmé + charte → engagement 'engaged' ─────────────
-- SECURITY DEFINER : la fonction met à jour client_engagements / client_projects
-- au nom du propriétaire, indépendamment de la RLS du caller (le porteur n'a que
-- des droits restreints). Passer l'engagement à 'engaged' déclenche en cascade
-- le trigger create_engagement_relay de 0008 (relais + révélation des identités).
create or replace function public.engage_on_meeting_confirmed()
returns trigger language plpgsql security definer
set search_path = public, auth
as $$
begin
  if new.status = 'confirmed' and new.charter_accepted = true
     and (tg_op = 'INSERT'
          or old.status is distinct from new.status
          or old.charter_accepted is distinct from new.charter_accepted) then

    -- L'engagement (project_id, architect_id) a été créé 'proposed' par l'admin
    -- au moment de la sélection ; on le passe à 'engaged'.
    update public.client_engagements
       set status           = 'engaged',
           charter_accepted  = true,
           charter_version   = coalesce(charter_version, 'v1'),
           engaged_at        = coalesce(engaged_at, now())
     where project_id   = new.project_id
       and architect_id = new.architect_id
       and status is distinct from 'engaged';

    -- Fait avancer le projet.
    update public.client_projects
       set status = 'meeting_confirmed'
     where id = new.project_id
       and status is distinct from 'meeting_confirmed';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_engage_on_meeting_confirmed_ins on public.meetings;
drop trigger if exists trg_engage_on_meeting_confirmed_upd on public.meetings;

create trigger trg_engage_on_meeting_confirmed_ins
  after insert on public.meetings
  for each row execute function public.engage_on_meeting_confirmed();

create trigger trg_engage_on_meeting_confirmed_upd
  after update on public.meetings
  for each row execute function public.engage_on_meeting_confirmed();

-- ── 4. RLS ────────────────────────────────────────────────────────────────
alter table public.meetings enable row level security;

drop policy if exists "meetings admin all"      on public.meetings;
drop policy if exists "meetings owner read"     on public.meetings;
drop policy if exists "meetings architect read" on public.meetings;
drop policy if exists "meetings owner respond"  on public.meetings;

-- Admin : accès total (lecture + écriture).
create policy "meetings admin all"
  on public.meetings for all
  using (public.is_admin())
  with check (public.is_admin());

-- Porteur du projet : lecture de ses propres meetings.
create policy "meetings owner read"
  on public.meetings for select
  using (public.owns_project(project_id));

-- Architecte concerné : lecture seule.
create policy "meetings architect read"
  on public.meetings for select
  using (public.is_architect_for_row(architect_id));

-- Porteur : peut répondre à SON meeting — l'état résultant est borné à
-- 'confirmed' ou 'declined' (il ne peut pas le marquer completed/cancelled/etc.).
create policy "meetings owner respond"
  on public.meetings for update
  using (public.owns_project(project_id))
  with check (
    public.owns_project(project_id)
    and status in ('confirmed', 'declined')
  );
