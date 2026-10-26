-- 0020_partners.sql
-- Logos de l'anneau de partenaires (PartnersOrbit) et réglages de la landing.
--
--   1. partners      → un logo par partenaire, publié ou non, ordonné.
--   2. site_settings → réglages clé/valeur de la landing. Première clé :
--      'partners_placeholders', le nombre de pastilles vides qui complètent
--      l'anneau (14 par défaut, comme avant les logos).
--
-- RLS : lecture publique des partenaires publiés et des réglages (rien de
-- sensible n'y est rangé) ; écriture réservée admin. Après 0014, les helpers
-- RLS vivent dans le schéma `private`. Idempotent.

-- ── 1. partners ───────────────────────────────────────────────────────────
create table if not exists public.partners (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  logo_url     text not null,
  url          text,
  published    boolean not null default false,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists idx_partners_pub_order
  on public.partners (published, sort_order);

alter table public.partners enable row level security;

drop policy if exists "partners public read" on public.partners;
drop policy if exists "partners admin all"   on public.partners;

create policy "partners public read"
  on public.partners for select
  using (published = true);
create policy "partners admin all"
  on public.partners for all
  using (private.is_admin())
  with check (private.is_admin());

-- ── 2. site_settings ──────────────────────────────────────────────────────
create table if not exists public.site_settings (
  key          text primary key,
  value        jsonb not null,
  updated_at   timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "settings public read" on public.site_settings;
drop policy if exists "settings admin all"   on public.site_settings;

create policy "settings public read"
  on public.site_settings for select
  using (true);
create policy "settings admin all"
  on public.site_settings for all
  using (private.is_admin())
  with check (private.is_admin());

insert into public.site_settings (key, value)
values ('partners_placeholders', '14'::jsonb)
on conflict (key) do nothing;
