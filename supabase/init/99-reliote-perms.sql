-- 99-reliote-perms.sql
-- Runs after postgres init. Builds the Supabase roles + auth schema + auth.uid()/jwt()
-- helpers that GoTrue and PostgREST expect, plus the table that our schema FKs to.
-- Designed for the slim Reliote stack (we don't use supabase/postgres's full init).

-- ---------- Roles ----------
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon')
    then create role anon nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated')
    then create role authenticated nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role')
    then create role service_role nologin noinherit bypassrls; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticator')
    then create role authenticator noinherit login password 'reliote_dev_pwd'; end if;
  if not exists (select 1 from pg_roles where rolname = 'supabase_auth_admin')
    then create role supabase_auth_admin noinherit login password 'reliote_dev_pwd'; end if;
end $$;

-- Reset passwords every boot to guarantee they match docker-compose env
alter role authenticator       with login password 'reliote_dev_pwd';
alter role supabase_auth_admin with login password 'reliote_dev_pwd';

grant anon, authenticated, service_role to authenticator;

-- ---------- public schema permissions ----------
grant usage  on schema public to anon, authenticated, service_role;
grant create on schema public to supabase_auth_admin;
alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

-- ---------- auth schema ----------
create schema if not exists auth authorization supabase_auth_admin;
grant usage on schema auth to anon, authenticated, service_role, supabase_auth_admin;
grant create on schema auth to supabase_auth_admin;
alter role supabase_auth_admin set search_path = auth, public;

-- Stub auth.users so our public.profiles FK resolves before GoTrue migrates.
-- GoTrue will run its own migrations into this table on first boot.
create table if not exists auth.users (
  id                  uuid primary key default gen_random_uuid(),
  instance_id         uuid,
  aud                 varchar(255),
  role                varchar(255),
  email               varchar(255),
  encrypted_password  varchar(255),
  email_confirmed_at  timestamptz,
  invited_at          timestamptz,
  confirmation_token  varchar(255),
  confirmation_sent_at timestamptz,
  recovery_token      varchar(255),
  recovery_sent_at    timestamptz,
  email_change_token_new  varchar(255),
  email_change        varchar(255),
  email_change_sent_at timestamptz,
  last_sign_in_at     timestamptz,
  raw_app_meta_data   jsonb,
  raw_user_meta_data  jsonb,
  is_super_admin      boolean,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Make sure the auth schema owner can do its job. GoTrue will replace auth.uid()
-- and other helpers from its own migrations on first boot.
alter table auth.users owner to supabase_auth_admin;
grant all on table auth.users to supabase_auth_admin, service_role;
