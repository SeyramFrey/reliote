-- 0012_legal_pages.sql
-- Pages légales (CGU, confidentialité, cookies, mentions) éditables depuis l'admin.
--
-- Le corps est du HTML produit par CKEditor. Il est assaini au rendu côté serveur
-- (src/lib/legal/sanitize.ts) et jamais rendu tel quel : l'écriture est réservée
-- aux admins, mais une base compromise ne doit pas devenir une injection de script.
--
-- Bilinguisme : colonnes suffixées _fr / _en, comme 0011. Le slug est commun aux
-- deux langues — /fr/legal/cgu et /en/legal/cgu servent le même document.
--
-- `updated_at` n'est pas décoratif : une page légale affiche sa date de dernière
-- révision, et c'est cette date qui fait foi en cas de litige.
--
-- RLS : lecture publique des seules pages publiées ; écriture admin.
-- Idempotent.

-- ── 1. Table ──────────────────────────────────────────────────────────────
create table if not exists public.legal_pages (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  title_fr           text not null,
  title_en           text not null,
  body_fr            text not null default '',
  body_en            text not null default '',
  seo_description_fr text,
  seo_description_en text,
  published          boolean not null default false,
  sort_order         integer not null default 0,
  updated_at         timestamptz not null default now(),
  created_at         timestamptz not null default now()
);

create index if not exists idx_legal_pages_pub_order
  on public.legal_pages (published, sort_order);

-- updated_at maintenance (réutilise le helper de 0003).
drop trigger if exists touch_legal_pages on public.legal_pages;
create trigger touch_legal_pages before update on public.legal_pages
  for each row execute function public.touch_updated_at();

-- ── 2. RLS ────────────────────────────────────────────────────────────────
alter table public.legal_pages enable row level security;

drop policy if exists "legal public read" on public.legal_pages;
drop policy if exists "legal admin all"   on public.legal_pages;

create policy "legal public read"
  on public.legal_pages for select
  using (published = true);

create policy "legal admin all"
  on public.legal_pages for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── 3. Les quatre pages promises par le pied de page ──────────────────────
-- Créées non publiées : le contenu est un brouillon qui doit être relu par un
-- juriste avant d'être rendu public. `on conflict do nothing` pour ne jamais
-- écraser un texte déjà révisé lors d'une réapplication.
insert into public.legal_pages (slug, title_fr, title_en, sort_order) values
  ('cgu',             'Conditions générales d''utilisation', 'Terms of Service',  1),
  ('confidentialite', 'Politique de confidentialité',        'Privacy Policy',    2),
  ('cookies',         'Gestion des cookies',                 'Cookie Policy',     3),
  ('mentions',        'Mentions légales',                    'Legal Notice',      4)
on conflict (slug) do nothing;
