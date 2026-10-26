-- 0023_security_hardening_2.sql
-- Deuxième passe de durcissement avant la mise en production (audit du
-- 2026-10-26). Idempotent.
--
-- 1. Photos d'architectes : bucket privé. La photo est l'identité que la
--    révélation protège jusqu'au RDV confirmé ; une URL publique, une fois
--    connue, la livrait sans contrôle. L'app sert désormais des URL signées
--    (lib/storage/architectPhoto.ts). Seul un compte architecte peut déposer.
-- 2. Rôles vérifiés à l'insertion : un projet ne se crée que depuis un compte
--    porteur.
-- 3. match_results : plus de lecture directe par le porteur ni l'architecte.
--    `reasons` contient la ville et l'expérience des architectes proposés
--    (fuite avant révélation) ; l'app ne lit cette table qu'en clé service.
-- 4. Notes internes (`client_engagements.notes`, `meetings.notes`) : jamais
--    lisibles par les comptes porteur/architecte — privilèges de colonne.
-- 5. Limitation de débit : compteur à fenêtre fixe, appelé par les actions
--    serveur (clé service) sur les formulaires publics.

-- ── 1. Photos d'architectes ────────────────────────────────────────────────
update storage.buckets set public = false where id = 'architect-photos';

drop policy if exists "architect photos owner insert" on storage.objects;
create policy "architect photos owner insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'architect-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and private.user_role_for_current() = 'architect'::public.user_role
  );

-- ── 2. Projets : compte porteur uniquement ─────────────────────────────────
drop policy if exists "projects owner insert" on public.client_projects;
create policy "projects owner insert"
  on public.client_projects for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and private.user_role_for_current() = 'client'::public.user_role
  );

-- ── 3. match_results : clé service et admin seulement ──────────────────────
drop policy if exists "matches project owner read" on public.match_results;
drop policy if exists "matches architect read" on public.match_results;

-- ── 4. Notes internes hors de portée des comptes ───────────────────────────
-- Un REVOKE de colonne est sans effet tant que le privilège de table existe :
-- on retire le SELECT de table puis on rend les colonnes publiques une à une.
revoke select on public.client_engagements from anon, authenticated;
grant select (id, project_id, architect_id, status, charter_version, charter_accepted, proposed_at, engaged_at)
  on public.client_engagements to authenticated;

revoke select on public.meetings from anon, authenticated;
grant select (id, project_id, architect_id, scheduled_at, video_url, status, charter_accepted, proposed_by, created_at, updated_at)
  on public.meetings to authenticated;

-- ── 5. Limitation de débit ─────────────────────────────────────────────────
create table if not exists private.rate_limits (
  key          text primary key,
  hits         integer     not null default 0,
  window_start timestamptz not null default now()
);
alter table private.rate_limits enable row level security;
revoke all on private.rate_limits from public, anon, authenticated;

-- true si l'appel est accepté, false si la limite est atteinte sur la fenêtre.
create or replace function public.rate_limit_hit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hits integer;
begin
  insert into private.rate_limits as r (key, hits, window_start)
  values (p_key, 1, now())
  on conflict (key) do update
    set hits = case
                 when r.window_start < now() - make_interval(secs => p_window_seconds) then 1
                 else r.hits + 1
               end,
        window_start = case
                 when r.window_start < now() - make_interval(secs => p_window_seconds) then now()
                 else r.window_start
               end
  returning hits into v_hits;
  return v_hits <= p_max;
end;
$$;
revoke execute on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, integer, integer) to service_role;

-- Ménage : fenêtres échues depuis plus d'un jour (appelé à l'occasion par l'app).
create or replace function public.rate_limit_prune()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from private.rate_limits where window_start < now() - interval '1 day';
$$;
revoke execute on function public.rate_limit_prune() from public, anon, authenticated;
grant execute on function public.rate_limit_prune() to service_role;
