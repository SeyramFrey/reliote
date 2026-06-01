-- 00-init.sql: roles + schemas + extensions that GoTrue/PostgREST/Storage expect
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Roles required by Supabase stack
do $$ begin
  if not exists (select from pg_roles where rolname = 'anon') then create role anon nologin noinherit; end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select from pg_roles where rolname = 'service_role') then create role service_role nologin noinherit bypassrls; end if;
  if not exists (select from pg_roles where rolname = 'authenticator') then create role authenticator noinherit login password 'reliote_dev_pwd'; end if;
  if not exists (select from pg_roles where rolname = 'supabase_auth_admin') then create role supabase_auth_admin noinherit login password 'reliote_dev_pwd'; end if;
end $$;

grant anon, authenticated, service_role to authenticator;

-- Auth schema for GoTrue
create schema if not exists auth authorization supabase_auth_admin;
grant usage on schema auth to anon, authenticated, service_role;
alter default privileges in schema auth grant all on tables to anon, authenticated, service_role;
alter default privileges in schema auth grant all on functions to anon, authenticated, service_role;
alter default privileges in schema auth grant all on sequences to anon, authenticated, service_role;

-- helper used in RLS
create or replace function auth.uid() returns uuid language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

create or replace function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb,
    nullif(current_setting('request.jwt.claim', true), '')::jsonb,
    '{}'::jsonb
  );
$$;

grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

-- Stub auth.users so our FKs validate before GoTrue boots and runs its own migrations.
-- GoTrue will extend this table on first connect.
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  instance_id uuid,
  aud text,
  role text,
  email text,
  encrypted_password text,
  email_confirmed_at timestamptz,
  raw_user_meta_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
