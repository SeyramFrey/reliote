-- 0009_geo_panafrican.sql
-- Pivot pan-africain :
--   1. Ajoute client_projects.project_country (pays du chantier, africain).
--   2. Rend architect_profiles.ordre_number obligatoire pour TOUS les pays
--      (retire la contrainte spécifique Côte d'Ivoire de 0005).
-- Idempotent.

-- ── 1. Pays du chantier ───────────────────────────────────────────────────
alter table public.client_projects
  add column if not exists project_country text;

-- Backfill : les projets MVP existants étaient en Côte d'Ivoire.
update public.client_projects
   set project_country = 'Côte d''Ivoire'
 where project_country is null;

alter table public.client_projects
  alter column project_country set not null;

-- ── 2. Numéro d'ordre obligatoire partout ─────────────────────────────────
-- Retire la contrainte conditionnelle CI de 0005.
alter table public.architect_profiles
  drop constraint if exists architect_ordre_required_for_ci;

-- Filet de sécurité pour d'éventuelles lignes historiques sans numéro.
update public.architect_profiles
   set ordre_number = 'N/A'
 where ordre_number is null or length(trim(ordre_number)) = 0;

alter table public.architect_profiles
  alter column ordre_number set not null;

alter table public.architect_profiles
  drop constraint if exists architect_ordre_not_blank;
alter table public.architect_profiles
  add constraint architect_ordre_not_blank
  check (length(trim(ordre_number)) > 0);
