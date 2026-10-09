-- 0014_security_hardening.sql
-- Durcissement sécurité (audit du 2026-10-09).
--
-- Failles corrigées :
--   1. Escalade vers admin par auto-modification : "profiles self update" n'avait
--      pas de WITH CHECK et rien n'empêchait un utilisateur de changer sa colonne
--      `role`. → trigger de garde + WITH CHECK.
--   2. Escalade vers admin à l'inscription : handle_new_user castait sans filtre
--      `raw_user_meta_data ->> 'role'` (donnée fournie par le client) en user_role.
--      → seuls 'client' et 'architect' sont acceptés, tout le reste devient 'client'.
--   3. Auto-validation architecte : "architects owner update" laissait l'architecte
--      passer son propre `status` à 'verified' et fixer sa `rating`.
--      → trigger de garde (insert forcé en 'pending', colonnes de modération
--        verrouillées) + WITH CHECK.
--   4. Contournement de la révélation : un client pouvait créer ou passer lui-même
--      un client_engagement à 'engaged' (et lire e-mail + téléphone de l'architecte)
--      via les policies "engagements client insert/update". → supprimées : les
--      engagements ne s'écrivent plus que côté serveur (service_role) ou par les
--      triggers SECURITY DEFINER (confirmation de RDV).
--   5. "meetings owner respond" laissait le porteur réécrire n'importe quelle
--      colonne (architecte, créneau, lien visio) et rouvrir un RDV annulé.
--      → seul un RDV 'proposed'/'rescheduled' peut être confirmé ou décliné, et
--        seules `status` et `charter_accepted` peuvent changer.
--   6. Un client pouvait insérer un projet directement via l'API avec un statut
--      arbitraire. → statut forcé à 'new' hors service_role/admin.
--   7. Le bucket architect-photos était listable par tout le monde (énumération
--      de toutes les photos). → plus de policy de lecture publique ; les URL
--      publiques restent servies (bucket public), mais on ne peut plus lister.
--   8. Les fonctions SECURITY DEFINER de `public` étaient appelables en RPC par
--      anon/authenticated (/rest/v1/rpc/...). → déplacées dans le schéma `private`,
--      non exposé par l'API. Les policies les référencent par OID : elles suivent
--      le déplacement sans être réécrites.
--   9. La vue architect_profiles_anon tournait en SECURITY DEFINER (alerte ERROR
--      de l'advisor). Elle n'est pas lue par l'application (l'anonymisation est
--      faite côté serveur) → passée en security_invoker.
--  10. search_path mutable sur generate_anon_handle / touch_updated_at ; et
--      generate_anon_handle générait un doublon quand un architecte créait son
--      dossier via l'API (la RLS lui cachait les autres handles).
--  11. Confirmer un RDV pouvait repasser à 'engaged' un engagement annulé ou
--      décliné par l'admin (et révéler l'architecte). → seul 'proposed' bascule.
--  12. Les 5 architectes du matching automatique lisaient nom, e-mail et
--      téléphone du porteur via l'API. → seul l'architecte proposé/engagé.
--  13. profiles.locale libre → liste blanche fr/en.
--
-- ⚠ Pour les migrations suivantes : les helpers RLS vivent désormais dans
--   `private` → écrire `private.is_admin()`, `private.owns_project(...)`, etc.
--
-- « Privilégié » = tout rôle autre que anon/authenticated (service_role, postgres,
-- supabase_admin, ou le propriétaire d'un trigger SECURITY DEFINER), ou un admin.
--
-- Idempotent.

-- ── 0. Schéma privé (non exposé par PostgREST) ────────────────────────────
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

-- ── 1. Déplacer les fonctions SECURITY DEFINER hors de l'API ──────────────
do $$
declare
  f text;
begin
  foreach f in array array[
    'is_admin()',
    'user_role_for_current()',
    'is_matched_architect_for_project(uuid)',
    'owns_project(uuid)',
    'is_architect_for_row(uuid)',
    'is_architect_matched_to_user(uuid)',
    'client_can_reveal_architect(uuid)',
    'create_engagement_relay()',
    'engage_on_meeting_confirmed()',
    'handle_new_user()'
  ]
  loop
    if to_regprocedure('public.' || f) is not null then
      execute format('alter function public.%s set schema private', f);
    end if;
  end loop;
end $$;

-- Les fonctions de trigger ne doivent être appelables par personne en direct
-- (le déclenchement d'un trigger ne vérifie pas EXECUTE).
revoke execute on function private.create_engagement_relay()     from public, anon, authenticated;
revoke execute on function private.engage_on_meeting_confirmed() from public, anon, authenticated;
revoke execute on function private.handle_new_user()             from public, anon, authenticated;

-- ── 2. Inscription : rôle filtré ──────────────────────────────────────────
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, first_name, last_name, locale)
  values (
    new.id,
    -- Jamais 'admin' depuis les métadonnées : elles sont fournies par le client.
    case
      when new.raw_user_meta_data ->> 'role' = 'architect' then 'architect'::public.user_role
      else 'client'::public.user_role
    end,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    case
      when new.raw_user_meta_data ->> 'locale' in ('fr', 'en') then new.raw_user_meta_data ->> 'locale'
      else 'fr'
    end
  );
  return new;
end;
$$;
revoke execute on function private.handle_new_user() from public, anon, authenticated;

-- ── 3. Helper : l'appelant est-il privilégié ? ────────────────────────────
-- SECURITY INVOKER (défaut) : current_user est le rôle réel de l'appelant.
create or replace function private.is_privileged()
returns boolean
language sql
stable
set search_path = ''
as $$
  select current_user not in ('anon', 'authenticated') or private.is_admin();
$$;

-- ── 4. profiles : le rôle ne se modifie pas soi-même ──────────────────────
create or replace function private.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.role is distinct from old.role or new.id is distinct from old.id)
     and not private.is_privileged() then
    raise exception 'Changing role is not allowed' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke execute on function private.guard_profile_update() from public, anon, authenticated;

drop trigger if exists trg_guard_profile_update on public.profiles;
create trigger trg_guard_profile_update
  before update on public.profiles
  for each row execute function private.guard_profile_update();

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ── 5. architect_profiles : pas d'auto-validation ─────────────────────────
create or replace function private.guard_architect_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if private.is_privileged() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Un dossier créé par l'architecte lui-même part toujours en modération.
    new.status      := 'pending';
    new.rating      := null;
    new.anon_handle := null;  -- généré par trg_generate_anon_handle
    return new;
  end if;

  if new.status      is distinct from old.status
     or new.rating      is distinct from old.rating
     or new.user_id     is distinct from old.user_id
     or new.anon_handle is distinct from old.anon_handle
     or new.id          is distinct from old.id then
    raise exception 'Moderation fields are read-only' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke execute on function private.guard_architect_profile() from public, anon, authenticated;

-- Le nom trie avant trg_generate_anon_handle : la remise à null du handle
-- s'applique avant sa génération.
drop trigger if exists trg_a_guard_architect_profile on public.architect_profiles;
create trigger trg_a_guard_architect_profile
  before insert or update on public.architect_profiles
  for each row execute function private.guard_architect_profile();

drop policy if exists "architects owner update" on public.architect_profiles;
create policy "architects owner update"
  on public.architect_profiles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ── 6. client_projects : statut initial imposé ────────────────────────────
create or replace function private.guard_client_project_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not private.is_privileged() then
    new.status := 'new';
  end if;
  return new;
end;
$$;
revoke execute on function private.guard_client_project_insert() from public, anon, authenticated;

drop trigger if exists trg_guard_client_project_insert on public.client_projects;
create trigger trg_guard_client_project_insert
  before insert on public.client_projects
  for each row execute function private.guard_client_project_insert();

-- ── 7. client_engagements : plus d'écriture côté client ───────────────────
drop policy if exists "engagements client insert" on public.client_engagements;
drop policy if exists "engagements client update" on public.client_engagements;

-- ── 8. meetings : le porteur ne fait que répondre ─────────────────────────
create or replace function private.guard_meeting_response()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if private.is_privileged() then
    return new;
  end if;

  if new.project_id    is distinct from old.project_id
     or new.architect_id  is distinct from old.architect_id
     or new.scheduled_at  is distinct from old.scheduled_at
     or new.video_url     is distinct from old.video_url
     or new.proposed_by   is distinct from old.proposed_by
     or new.notes         is distinct from old.notes
     or new.created_at    is distinct from old.created_at then
    raise exception 'Only the response can be changed' using errcode = '42501';
  end if;

  if new.status = 'confirmed' and new.charter_accepted is not true then
    raise exception 'Charter acceptance is required to confirm' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke execute on function private.guard_meeting_response() from public, anon, authenticated;

drop trigger if exists trg_guard_meeting_response on public.meetings;
create trigger trg_guard_meeting_response
  before update on public.meetings
  for each row execute function private.guard_meeting_response();

drop policy if exists "meetings owner respond" on public.meetings;
create policy "meetings owner respond"
  on public.meetings for update
  to authenticated
  using (
    private.owns_project(project_id)
    and status in ('proposed', 'rescheduled')
  )
  with check (
    private.owns_project(project_id)
    and status in ('confirmed', 'declined')
  );

-- ── 9. Storage : photos d'architectes non listables ───────────────────────
drop policy if exists "architect photos public read" on storage.objects;
drop policy if exists "architect photos owner read"  on storage.objects;
create policy "architect photos owner read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'architect-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "architect photos owner insert" on storage.objects;
create policy "architect photos owner insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'architect-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "architect photos owner update" on storage.objects;
create policy "architect photos owner update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'architect-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'architect-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ── 10. Vue anonymisée en security_invoker ────────────────────────────────
alter view public.architect_profiles_anon set (security_invoker = true);

-- ── 11. search_path figé ──────────────────────────────────────────────────
alter function public.touch_updated_at() set search_path = '';

-- generate_anon_handle calcule max(handle)+1 : exécuté avec les droits d'un
-- architecte (insert via l'API), la RLS ne lui montrait que sa propre ligne et
-- le handle généré entrait en collision (A001). SECURITY DEFINER pour voir
-- toute la table, donc hors de l'API et non exécutable directement.
do $$
begin
  if to_regprocedure('public.generate_anon_handle()') is not null then
    alter function public.generate_anon_handle() set schema private;
  end if;
end $$;
alter function private.generate_anon_handle() security definer;
alter function private.generate_anon_handle() set search_path = '';
revoke execute on function private.generate_anon_handle() from public, anon, authenticated;

-- ── 12. Confirmation de RDV : seul un engagement 'proposed' devient 'engaged' ─
-- Avant : `status is distinct from 'engaged'` repassait aussi à 'engaged' un
-- engagement 'declined'/'cancelled'/'expired'. Un porteur pouvait donc, en
-- confirmant un RDV resté ouvert, ressusciter un architecte retiré par l'admin
-- et obtenir son identité. Sans engagement proposé, la confirmation échoue.
create or replace function private.engage_on_meeting_confirmed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'confirmed' and new.charter_accepted = true
     and (tg_op = 'INSERT'
          or old.status is distinct from new.status
          or old.charter_accepted is distinct from new.charter_accepted) then

    update public.client_engagements
       set status           = 'engaged',
           charter_accepted  = true,
           charter_version   = coalesce(charter_version, 'v1'),
           engaged_at        = coalesce(engaged_at, now())
     where project_id   = new.project_id
       and architect_id = new.architect_id
       and status in ('proposed', 'engaged');

    if not found then
      raise exception 'No active proposal for this architect on this project'
        using errcode = '42501';
    end if;

    update public.client_projects
       set status = 'meeting_confirmed'
     where id = new.project_id
       and status is distinct from 'meeting_confirmed';
  end if;
  return new;
end;
$$;
revoke execute on function private.engage_on_meeting_confirmed() from public, anon, authenticated;

-- ── 13. Coordonnées du porteur : pas avant la sélection par l'admin ───────
-- Avant (0004) : les architectes du top 5 automatique lisaient la ligne complète
-- du projet (nom, e-mail, téléphone) via l'API, sans sélection ni engagement.
-- Désormais : seulement l'architecte que l'admin a proposé (ou engagé).
-- L'espace architecte lit via la clé service et n'est pas affecté.
create or replace function private.is_selected_architect_for_project(p_project_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists(
    select 1
    from public.client_engagements ce
    join public.architect_profiles ap on ap.id = ce.architect_id
    where ce.project_id = p_project_id
      and ce.status in ('proposed', 'engaged')
      and ap.user_id = (select auth.uid())
  );
$$;

drop policy if exists "projects matched architect read"  on public.client_projects;
drop policy if exists "projects selected architect read" on public.client_projects;
create policy "projects selected architect read"
  on public.client_projects for select
  to authenticated
  using (private.is_selected_architect_for_project(id));

-- ── 14. Locale : liste blanche (sert à choisir le modèle d'e-mail) ────────
update public.profiles set locale = 'fr' where locale not in ('fr', 'en');
alter table public.profiles drop constraint if exists profiles_locale_check;
alter table public.profiles add constraint profiles_locale_check check (locale in ('fr', 'en'));
