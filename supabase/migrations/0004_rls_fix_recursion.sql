-- 0004_rls_fix_recursion.sql
-- Fix infinite recursion between client_projects and match_results RLS policies.
--
-- The original "projects matched architect read" policy queried match_results,
-- which has policies that query client_projects, which then re-evaluated this
-- policy — Postgres reports "infinite recursion detected in policy". The fix is
-- to use SECURITY DEFINER helper functions that bypass RLS in their body, so
-- the policy evaluation no longer chains through the other table's policies.

-- is_admin() must be SECURITY DEFINER too, otherwise calling it from a profiles
-- policy that itself uses is_admin() recurses infinitely.
create or replace function public.is_admin()
returns boolean
language sql security definer stable
set search_path = public, auth
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.user_role_for_current()
returns user_role
language sql security definer stable
set search_path = public, auth
as $$
  select role from public.profiles where id = auth.uid();
$$;

drop policy if exists "projects matched architect read" on client_projects;
drop policy if exists "matches project owner read"     on match_results;
drop policy if exists "matches architect read"         on match_results;

create or replace function public.is_matched_architect_for_project(p_project_id uuid)
returns boolean
language sql security definer stable
set search_path = public, auth
as $$
  select exists(
    select 1 from public.match_results mr
    join public.architect_profiles ap on ap.id = mr.architect_id
    where mr.project_id = p_project_id and ap.user_id = auth.uid()
  );
$$;

create or replace function public.owns_project(p_project_id uuid)
returns boolean
language sql security definer stable
set search_path = public, auth
as $$
  select exists(
    select 1 from public.client_projects cp
    where cp.id = p_project_id and cp.user_id = auth.uid()
  );
$$;

create or replace function public.is_architect_for_row(p_architect_id uuid)
returns boolean
language sql security definer stable
set search_path = public, auth
as $$
  select exists(
    select 1 from public.architect_profiles ap
    where ap.id = p_architect_id and ap.user_id = auth.uid()
  );
$$;

create policy "projects matched architect read"
  on client_projects for select using (public.is_matched_architect_for_project(id));

create policy "matches project owner read"
  on match_results for select using (public.owns_project(project_id));

create policy "matches architect read"
  on match_results for select using (public.is_architect_for_row(architect_id));
