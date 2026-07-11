-- 0005_architect_cnoa_fields.sql
-- Split full_name → first_name + last_name on profiles + architect_profiles.
-- Add CNOA-required architect columns: ordre_number, diploma, structure.
-- Replace text fee_from with structured fee_currency + fee_amount.
-- Idempotent (uses IF NOT EXISTS / DO blocks).

-- ── profiles: split full_name ──────────────────────────────────────────────
alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name  text;

-- Backfill from full_name on the LAST space (matches "Aïssata N'Guessan" → first="Aïssata", last="N'Guessan").
update public.profiles
   set last_name  = coalesce(last_name,  nullif(regexp_replace(full_name, '^.+\s+(\S+)$', '\1'), full_name)),
       first_name = coalesce(first_name, nullif(regexp_replace(full_name, '^(.+)\s+\S+$', '\1'), full_name))
 where full_name is not null
   and (first_name is null or last_name is null);

-- If full_name had no space (one token), put it in last_name and leave first_name NULL.
update public.profiles
   set last_name = full_name
 where last_name is null
   and full_name is not null;

alter table public.profiles drop column if exists full_name;

-- ── architect_profiles: split full_name + new CNOA columns ────────────────
alter table public.architect_profiles
  add column if not exists first_name    text,
  add column if not exists last_name     text,
  add column if not exists ordre_number  text,
  add column if not exists diploma       text,
  add column if not exists structure     text;

update public.architect_profiles
   set last_name  = coalesce(last_name,  nullif(regexp_replace(full_name, '^.+\s+(\S+)$', '\1'), full_name)),
       first_name = coalesce(first_name, nullif(regexp_replace(full_name, '^(.+)\s+\S+$', '\1'), full_name))
 where full_name is not null
   and (first_name is null or last_name is null);

update public.architect_profiles
   set last_name = full_name
 where last_name is null
   and full_name is not null;

-- Backfill `structure` + synthetic `ordre_number` for the 8 seeded architects so the
-- CHECK constraint below holds (matches the design's data.jsx studios; numbers are
-- year/dossier/individual CNOA-style).
update public.architect_profiles set structure = 'Atelier Faïdhèrbe',    ordre_number = coalesce(ordre_number, '2014/418/1') where id = '00000000-0000-0000-0000-0000000a0001';
update public.architect_profiles set structure = 'Forme & Latitude',     ordre_number = coalesce(ordre_number, '2008/318/2') where id = '00000000-0000-0000-0000-0000000a0002';
update public.architect_profiles set structure = 'Studio Asa',           ordre_number = coalesce(ordre_number, '2017/441/3') where id = '00000000-0000-0000-0000-0000000a0003';
update public.architect_profiles set structure = 'Parallèle Architectes',ordre_number = coalesce(ordre_number, '2011/364/4') where id = '00000000-0000-0000-0000-0000000a0004';
update public.architect_profiles set structure = 'Bureau Lagune',        ordre_number = coalesce(ordre_number, '2019/468/5') where id = '00000000-0000-0000-0000-0000000a0005';
update public.architect_profiles set structure = 'Atelier 21',           ordre_number = coalesce(ordre_number, '2010/352/6') where id = '00000000-0000-0000-0000-0000000a0006';
update public.architect_profiles set structure = 'Studio Rive Est',      ordre_number = coalesce(ordre_number, '2016/430/7') where id = '00000000-0000-0000-0000-0000000a0007';
update public.architect_profiles set structure = 'Plan B Architectes',   ordre_number = coalesce(ordre_number, '2013/395/8') where id = '00000000-0000-0000-0000-0000000a0008';

alter table public.architect_profiles
  alter column first_name set not null,
  alter column last_name  set not null;

alter table public.architect_profiles drop column if exists full_name;

-- ── Fee: text fee_from → currency + integer amount ────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'fee_currency') then
    create type fee_currency as enum ('EUR', 'XOF');
  end if;
end$$;

alter table public.architect_profiles
  add column if not exists fee_currency fee_currency,
  add column if not exists fee_amount   integer check (fee_amount is null or fee_amount > 0);

-- Backfill from existing '€48k' / '€90k' strings.
update public.architect_profiles
   set fee_currency = 'EUR',
       fee_amount   = (substring(fee_from from '([0-9]+)'))::integer * 1000
 where fee_from is not null
   and fee_currency is null
   and fee_from ~ '^€[0-9]+k$';

alter table public.architect_profiles drop column if exists fee_from;

-- ── Conditional constraint: ordre_number required when country = CI ──────
alter table public.architect_profiles drop constraint if exists architect_ordre_required_for_ci;
alter table public.architect_profiles
  add constraint architect_ordre_required_for_ci
  check (
    country is distinct from 'Côte d''Ivoire'
    or (ordre_number is not null and length(trim(ordre_number)) > 0)
  );

-- ── Trigger update: handle_new_user reads first_name/last_name from metadata ──
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, first_name, last_name, locale)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'client'),
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    coalesce(new.raw_user_meta_data ->> 'locale', 'fr')
  );
  return new;
end;
$$;
