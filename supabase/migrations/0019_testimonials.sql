-- 0019_testimonials.sql
-- Avis clients affichés en bas de la landing (section « Avis »).
--
-- Seuls de vrais avis, saisis par l'admin avec l'accord de leur auteur : tant
-- qu'aucun n'est publié, la landing affiche un état d'attente, jamais de
-- témoignage de repli.
--
-- Bilinguisme : colonnes suffixées _fr / _en, comme media_items (0011).
-- RLS : lecture publique des seuls avis publiés ; écriture réservée admin.
-- Après 0014, les helpers RLS vivent dans le schéma `private`. Idempotent.

create table if not exists public.testimonials (
  id           uuid primary key default gen_random_uuid(),
  quote_fr     text not null,
  quote_en     text not null,
  author       text not null,          -- « Awa K. » : prénom + initiale suffisent
  role_fr      text,                   -- « Cliente — villa familiale »
  role_en      text,
  location     text,                   -- « Abidjan, Côte d'Ivoire »
  published    boolean not null default false,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists idx_testimonials_pub_order
  on public.testimonials (published, sort_order);

alter table public.testimonials enable row level security;

drop policy if exists "testimonials public read" on public.testimonials;
drop policy if exists "testimonials admin all"   on public.testimonials;

create policy "testimonials public read"
  on public.testimonials for select
  using (published = true);
create policy "testimonials admin all"
  on public.testimonials for all
  using (private.is_admin())
  with check (private.is_admin());
