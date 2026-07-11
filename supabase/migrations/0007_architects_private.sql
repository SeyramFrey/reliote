-- 0007_architects_private.sql
-- Fermer la lecture publique des architectes.
--
-- Avant : la policy "architects public read verified" laissait n'importe quelle
-- requête anonyme (ANON_KEY exposé côté front Next.js) lire tous les architectes
-- vérifiés. C'est la faille de désintermédiation : un curieux peut récupérer
-- nom + photo + email + ordre_number en une requête, puis contacter
-- l'architecte hors plateforme.
--
-- Après :
--   • anon → 0 ligne sur architect_profiles
--   • client authentifié → uniquement les architectes matchés à ses propres projets
--   • architecte authentifié → sa propre ligne (owner_read inchangé)
--   • admin → tout (admin_all inchangé)
--
-- Les agrégats côté landing (84 vérifiés, 4.9/5, etc.) sont calculés en Server
-- Component avec la SERVICE_ROLE_KEY qui bypass RLS — la clé ne quitte jamais
-- le serveur Next.js.
--
-- Idempotent : drop + create-or-replace.

-- SECURITY DEFINER pour éviter la récursion via match_results (même pattern que 0004).
create or replace function public.is_architect_matched_to_user(p_architect_id uuid)
returns boolean
language sql security definer stable
set search_path = public, auth
as $$
  select exists(
    select 1
    from public.match_results mr
    join public.client_projects cp on cp.id = mr.project_id
    where mr.architect_id = p_architect_id
      and cp.user_id = auth.uid()
  );
$$;

drop policy if exists "architects public read verified" on public.architect_profiles;
drop policy if exists "architects matched client read" on public.architect_profiles;

create policy "architects matched client read"
  on public.architect_profiles for select
  using (
    status = 'verified'
    and public.is_architect_matched_to_user(id)
  );
