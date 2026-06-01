-- 0002_rls.sql

create or replace function public.user_role_for_current()
returns user_role language sql stable as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

-- profiles --
alter table profiles enable row level security;
create policy "profiles self read"
  on profiles for select using (auth.uid() = id);
create policy "profiles self update"
  on profiles for update using (auth.uid() = id);
create policy "profiles admin all"
  on profiles for all using (is_admin());

-- architect_profiles --
alter table architect_profiles enable row level security;
create policy "architects public read verified"
  on architect_profiles for select using (status = 'verified');
create policy "architects owner read"
  on architect_profiles for select using (auth.uid() = user_id);
create policy "architects admin all"
  on architect_profiles for all using (is_admin());
create policy "architects owner insert"
  on architect_profiles for insert with check (auth.uid() = user_id and public.user_role_for_current() = 'architect');
create policy "architects owner update"
  on architect_profiles for update using (auth.uid() = user_id);

-- client_projects --
alter table client_projects enable row level security;
create policy "projects owner read"
  on client_projects for select using (auth.uid() = user_id);
create policy "projects owner insert"
  on client_projects for insert with check (auth.uid() = user_id);
create policy "projects admin all"
  on client_projects for all using (is_admin());
create policy "projects matched architect read"
  on client_projects for select using (
    exists (
      select 1 from match_results mr
      join architect_profiles ap on ap.id = mr.architect_id
      where mr.project_id = client_projects.id and ap.user_id = auth.uid()
    )
  );

-- match_results --
alter table match_results enable row level security;
create policy "matches project owner read"
  on match_results for select using (
    exists (select 1 from client_projects cp where cp.id = match_results.project_id and cp.user_id = auth.uid())
  );
create policy "matches architect read"
  on match_results for select using (
    exists (select 1 from architect_profiles ap where ap.id = match_results.architect_id and ap.user_id = auth.uid())
  );
create policy "matches admin all"
  on match_results for all using (is_admin());
