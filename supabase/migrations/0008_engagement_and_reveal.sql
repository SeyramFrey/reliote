-- 0008_engagement_and_reveal.sql
-- Révélation progressive Niveau 2 → Niveau 3.
--
-- Niveau 2 : vue `architect_profiles_anon` ; expose des colonnes anonymisées
--           (handle, bracket d'expérience, région) ; visible par un client matché.
-- Niveau 3 : la table complète `architect_profiles` ; visible par un client qui a
--           accepté la charte de non-contournement pour cet architecte précis
--           (status='engaged' sur la nouvelle table client_engagements).
--
-- Asymétrie : l'architecte voit le client dès le match (table match_results +
--             profiles via FK). Le client voit l'architecte uniquement après
--             engagement.
--
-- Idempotent.

-- ── 1. Architect side : anon_handle + charte d'admission ─────────────────
alter table public.architect_profiles
  add column if not exists anon_handle       text unique,
  add column if not exists charter_version   text,
  add column if not exists charter_signed_at timestamptz;

-- Génération du handle anonyme sur insert : A001, A002, ... (zero-pad sur 3).
create or replace function public.generate_anon_handle()
returns trigger language plpgsql as $$
declare
  v_seq int;
begin
  if new.anon_handle is null then
    select coalesce(max(
      case when anon_handle ~ '^A[0-9]+$'
        then substring(anon_handle from 2)::int
      end
    ), 0) + 1
      into v_seq
      from public.architect_profiles;
    new.anon_handle := 'A' || lpad(v_seq::text, 3, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_generate_anon_handle on public.architect_profiles;
create trigger trg_generate_anon_handle
  before insert on public.architect_profiles
  for each row execute function public.generate_anon_handle();

-- Backfill des 8 seed architects (ordre stable par id pour des handles déterministes).
update public.architect_profiles set anon_handle = 'A001' where id = '00000000-0000-0000-0000-0000000a0001' and anon_handle is null;
update public.architect_profiles set anon_handle = 'A002' where id = '00000000-0000-0000-0000-0000000a0002' and anon_handle is null;
update public.architect_profiles set anon_handle = 'A003' where id = '00000000-0000-0000-0000-0000000a0003' and anon_handle is null;
update public.architect_profiles set anon_handle = 'A004' where id = '00000000-0000-0000-0000-0000000a0004' and anon_handle is null;
update public.architect_profiles set anon_handle = 'A005' where id = '00000000-0000-0000-0000-0000000a0005' and anon_handle is null;
update public.architect_profiles set anon_handle = 'A006' where id = '00000000-0000-0000-0000-0000000a0006' and anon_handle is null;
update public.architect_profiles set anon_handle = 'A007' where id = '00000000-0000-0000-0000-0000000a0007' and anon_handle is null;
update public.architect_profiles set anon_handle = 'A008' where id = '00000000-0000-0000-0000-0000000a0008' and anon_handle is null;

-- ── 2. Niveau 2 view ─────────────────────────────────────────────────────
-- Tourne en `security_invoker = false` (défaut sur PG15+) donc bypass la RLS de
-- architect_profiles. La vue applique elle-même son propre filtre : un client
-- ne voit que les architectes matchés à un de ses propres projets.
-- Aucune colonne sensible : pas de nom, ville précise, téléphone, email,
-- photo, structure, ordre_number, fee_amount, portfolio_url.

create or replace view public.architect_profiles_anon as
select
  ap.id,
  ap.anon_handle,
  case
    when ap.years_experience < 5  then '< 5 ans'
    when ap.years_experience < 10 then '5 — 10 ans'
    when ap.years_experience < 15 then '10 — 15 ans'
    else '15 ans et +'
  end                                                  as years_bracket,
  ap.specialties,
  ap.project_types,
  ap.languages,
  ap.diploma,
  ap.rating,
  case
    when ap.city ilike '%abidjan%'
      or ap.city ~* '^(cocody|plateau|marcory|riviera|bingerville|yopougon|treichville|adjame|attecoube|abobo|koumassi|port-bouet)'
      then 'Grand Abidjan'
    when ap.country = 'Côte d''Ivoire'
      then 'Côte d''Ivoire'
    else ap.country
  end                                                  as region,
  ap.availability,
  ap.status
from public.architect_profiles ap
where ap.status = 'verified'
  and exists (
    select 1 from public.match_results mr
    join public.client_projects cp on cp.id = mr.project_id
    where mr.architect_id = ap.id
      and cp.user_id = auth.uid()
  );

grant select on public.architect_profiles_anon to authenticated;
revoke select on public.architect_profiles_anon from anon;

-- ── 3. Engagement object ─────────────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_type where typname = 'engagement_status') then
    create type engagement_status as enum (
      'proposed',   -- Reliote a proposé l'architecte au client (au moment du match)
      'engaged',    -- le client a accepté la charte → identité révélée
      'declined',   -- le client a explicitement décliné cette proposition
      'cancelled',  -- engagement annulé après acceptation
      'expired'     -- non engagé dans le délai imparti
    );
  end if;
end $$;

create table if not exists public.client_engagements (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references public.client_projects(id) on delete cascade,
  architect_id      uuid not null references public.architect_profiles(id) on delete cascade,
  status            engagement_status not null default 'proposed',
  charter_version   text,
  charter_accepted  boolean not null default false,
  proposed_at       timestamptz not null default now(),
  engaged_at        timestamptz,
  notes             text,
  unique (project_id, architect_id)
);

create index if not exists idx_client_engagements_project on public.client_engagements (project_id);
create index if not exists idx_client_engagements_architect on public.client_engagements (architect_id);
create index if not exists idx_client_engagements_status on public.client_engagements (status);

alter table public.client_engagements enable row level security;

drop policy if exists "engagements client read"   on public.client_engagements;
drop policy if exists "engagements client insert" on public.client_engagements;
drop policy if exists "engagements client update" on public.client_engagements;
drop policy if exists "engagements architect read" on public.client_engagements;
drop policy if exists "engagements admin all"     on public.client_engagements;

create policy "engagements client read"
  on public.client_engagements for select
  using (exists (select 1 from public.client_projects cp where cp.id = project_id and cp.user_id = auth.uid()));

create policy "engagements client insert"
  on public.client_engagements for insert
  with check (exists (select 1 from public.client_projects cp where cp.id = project_id and cp.user_id = auth.uid()));

create policy "engagements client update"
  on public.client_engagements for update
  using (exists (select 1 from public.client_projects cp where cp.id = project_id and cp.user_id = auth.uid()));

create policy "engagements architect read"
  on public.client_engagements for select
  using (exists (select 1 from public.architect_profiles ap where ap.id = architect_id and ap.user_id = auth.uid()));

create policy "engagements admin all"
  on public.client_engagements for all
  using (public.is_admin());

-- ── 4. Engagement relays ─────────────────────────────────────────────────
-- Adresses anonymisées créées au moment de l'engagement. Pour le MVP on les
-- stocke mais on ne fait pas tourner la forwarders SMTP (Tier 2). L'UI affiche
-- l'adresse pour l'utilisateur, qui doit utiliser le canal interne plutôt
-- qu'un email direct (aucun email direct n'a jamais été transmis).

create table if not exists public.engagement_relays (
  engagement_id   uuid primary key references public.client_engagements(id) on delete cascade,
  client_relay    text not null,
  architect_relay text not null,
  created_at      timestamptz not null default now()
);

alter table public.engagement_relays enable row level security;

drop policy if exists "relay client read"    on public.engagement_relays;
drop policy if exists "relay architect read" on public.engagement_relays;
drop policy if exists "relay admin all"      on public.engagement_relays;

create policy "relay client read"
  on public.engagement_relays for select
  using (exists (
    select 1 from public.client_engagements ce
    join public.client_projects cp on cp.id = ce.project_id
    where ce.id = engagement_id and cp.user_id = auth.uid()
  ));

create policy "relay architect read"
  on public.engagement_relays for select
  using (exists (
    select 1 from public.client_engagements ce
    join public.architect_profiles ap on ap.id = ce.architect_id
    where ce.id = engagement_id and ap.user_id = auth.uid()
  ));

create policy "relay admin all"
  on public.engagement_relays for all
  using (public.is_admin());

-- Trigger : générer les adresses relais au moment où l'engagement passe à 'engaged'.
-- SECURITY DEFINER pour que le trigger puisse insérer dans engagement_relays
-- (table dont les policies n'autorisent que SELECT côté client). Le caller du
-- trigger n'a pas besoin d'INSERT sur engagement_relays, le trigger l'a au nom
-- du propriétaire de la fonction (supabase_admin).
create or replace function public.create_engagement_relay()
returns trigger language plpgsql security definer
set search_path = public, auth
as $$
declare
  v_short text;
begin
  if new.status = 'engaged' and (tg_op = 'INSERT' or old.status is distinct from 'engaged') then
    v_short := substring(replace(new.id::text, '-', '') from 1 for 8);
    insert into public.engagement_relays (engagement_id, client_relay, architect_relay)
    values (
      new.id,
      'client-'  || v_short || '@reliote-relay.com',
      'archi-'   || v_short || '@reliote-relay.com'
    )
    on conflict (engagement_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_create_engagement_relay_ins on public.client_engagements;
drop trigger if exists trg_create_engagement_relay_upd on public.client_engagements;

create trigger trg_create_engagement_relay_ins
  after insert on public.client_engagements
  for each row execute function public.create_engagement_relay();

create trigger trg_create_engagement_relay_upd
  after update on public.client_engagements
  for each row execute function public.create_engagement_relay();

-- ── 5. RLS update : Niveau 3 gate sur architect_profiles ─────────────────
-- On remplace la policy "matched client read" (qui laissait le client voir
-- l'identité complète dès le match — fuite résiduelle) par "engaged client read".
-- Désormais : pas d'engagement = pas de read sur la table complète.

-- Fonction SECURITY DEFINER (même pattern que 0004 / 0007) pour éviter à la
-- fois la récursion RLS et l'ambiguïté de colonne "id" dans la policy.
create or replace function public.client_can_reveal_architect(p_architect_id uuid)
returns boolean
language sql security definer stable
set search_path = public, auth
as $$
  select exists(
    select 1
    from public.client_engagements ce
    join public.client_projects cp on cp.id = ce.project_id
    where ce.architect_id = p_architect_id
      and cp.user_id = auth.uid()
      and ce.status = 'engaged'
      and ce.charter_accepted = true
  );
$$;

drop policy if exists "architects matched client read" on public.architect_profiles;
drop policy if exists "architects engaged client read" on public.architect_profiles;

create policy "architects engaged client read"
  on public.architect_profiles for select
  using (
    status = 'verified'
    and public.client_can_reveal_architect(id)
  );

-- Les policies owner_read, admin_all, owner_insert, owner_update restent inchangées.

-- ── 6. Helper : marquer l'architecte comme ayant signé la charte v1 ──────
-- Backfill : tous les seed architects ont signé v1 au moment de leur admission
-- (cohérent avec leur status='verified').
update public.architect_profiles
  set charter_version   = coalesce(charter_version, 'v1'),
      charter_signed_at = coalesce(charter_signed_at, now())
  where status = 'verified' and charter_signed_at is null;
