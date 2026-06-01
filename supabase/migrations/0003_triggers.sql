-- 0003_triggers.sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name, locale)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'client'),
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'locale', 'fr')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at maintenance
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists touch_architect_profiles on architect_profiles;
create trigger touch_architect_profiles before update on architect_profiles
  for each row execute function public.touch_updated_at();
