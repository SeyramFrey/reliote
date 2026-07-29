-- 0011_content_management.sql
-- Bloc D — Gestion de contenu éditorial (admin) pour la landing.
--
--   1. featured_projects → alimente FeaturedCase (projet mis en lumière).
--   2. media_items       → alimente Journal (médias / regards).
--   3. Bucket Storage 'content-images' (images éditoriales).
--
-- Bilinguisme : colonnes suffixées _fr / _en ; le rendu choisit selon le locale.
-- RLS : lecture publique des seuls contenus publiés ; écriture réservée admin.
-- L'admin lit/écrit via le service client (bypass RLS) — il voit donc aussi les
-- brouillons ; les policies "admin all" restent en défense en profondeur.
-- Idempotent.

-- ── 1. featured_projects ──────────────────────────────────────────────────
create table if not exists public.featured_projects (
  id           uuid primary key default gen_random_uuid(),
  title_fr     text not null,
  title_en     text not null,
  location     text,
  coordinates  text,
  slides       jsonb not null default '[]'::jsonb,  -- [{image, caption_fr, caption_en}]
  stats        jsonb not null default '[]'::jsonb,  -- [{n, suf, l_fr, l_en}]
  hotspots     jsonb not null default '[]'::jsonb,  -- [{x, y, title_fr, title_en, body_fr, body_en}]
  quote_fr     text,
  quote_en     text,
  cite         text,
  rows         jsonb not null default '[]'::jsonb,  -- [{label_fr, label_en, value_fr, value_en}]
  published    boolean not null default false,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists idx_featured_projects_pub_order
  on public.featured_projects (published, sort_order);

-- ── 2. media_items ────────────────────────────────────────────────────────
create table if not exists public.media_items (
  id           uuid primary key default gen_random_uuid(),
  title_fr     text not null,
  title_en     text not null,
  excerpt_fr   text,
  excerpt_en   text,
  image_url    text,
  read_time    text,
  date         text,
  url          text,
  published    boolean not null default false,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists idx_media_items_pub_order
  on public.media_items (published, sort_order);

-- ── 3. RLS ────────────────────────────────────────────────────────────────
alter table public.featured_projects enable row level security;
alter table public.media_items       enable row level security;

drop policy if exists "featured public read" on public.featured_projects;
drop policy if exists "featured admin all"   on public.featured_projects;
drop policy if exists "media public read"    on public.media_items;
drop policy if exists "media admin all"      on public.media_items;

-- Lecture publique : uniquement les contenus publiés (anon + authenticated).
create policy "featured public read"
  on public.featured_projects for select
  using (published = true);
create policy "featured admin all"
  on public.featured_projects for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "media public read"
  on public.media_items for select
  using (published = true);
create policy "media admin all"
  on public.media_items for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── 4. Storage bucket 'content-images' ────────────────────────────────────
-- Même pattern que 0006 : bucket public en lecture, écriture réservée admin.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'content-images',
  'content-images',
  true,
  5 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "content images public read"   on storage.objects;
drop policy if exists "content images admin insert"  on storage.objects;
drop policy if exists "content images admin update"  on storage.objects;
drop policy if exists "content images admin delete"  on storage.objects;

create policy "content images public read"
  on storage.objects for select
  using (bucket_id = 'content-images');

create policy "content images admin insert"
  on storage.objects for insert
  with check (bucket_id = 'content-images' and public.is_admin());

create policy "content images admin update"
  on storage.objects for update
  using (bucket_id = 'content-images' and public.is_admin());

create policy "content images admin delete"
  on storage.objects for delete
  using (bucket_id = 'content-images' and public.is_admin());
