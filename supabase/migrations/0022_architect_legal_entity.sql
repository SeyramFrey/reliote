-- 0022_architect_legal_entity.sql
-- Statut juridique de l'architecte inscrit : personne physique (architecte
-- indépendant) ou personne morale (agence, société d'architecture).
--
-- Pour une personne morale : raison sociale, forme juridique, numéro
-- d'immatriculation (RCCM, SIRET…) et représentant légal sont obligatoires ;
-- le numéro d'Ordre (ordre_number) est alors celui de la société.
--
-- Ces colonnes identifient l'agence : elles ne sont PAS ajoutées à la vue
-- architect_profiles_anon (l'anonymat tient jusqu'à la révélation). Idempotent.

alter table public.architect_profiles
  add column if not exists legal_status text not null default 'individual',
  add column if not exists company_name text,
  add column if not exists legal_form text,
  add column if not exists registration_number text,
  add column if not exists legal_representative text;

alter table public.architect_profiles
  drop constraint if exists architect_profiles_legal_status_check;
alter table public.architect_profiles
  add constraint architect_profiles_legal_status_check
  check (legal_status in ('individual', 'company'));

alter table public.architect_profiles
  drop constraint if exists architect_profiles_company_fields_check;
alter table public.architect_profiles
  add constraint architect_profiles_company_fields_check
  check (
    legal_status = 'individual'
    or (
      nullif(btrim(company_name), '') is not null
      and nullif(btrim(legal_form), '') is not null
      and nullif(btrim(registration_number), '') is not null
      and nullif(btrim(legal_representative), '') is not null
    )
  );
