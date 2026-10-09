-- 0015_reveal_on_engagement.sql
-- Relecture finale du parcours complet (2026-10-10).
--
--   1. Coordonnées du porteur : l'architecte ne lit la ligne complète du projet
--      (nom, e-mail, téléphone) qu'une fois la mise en relation ENGAGÉE, c'est-à-
--      dire au rendez-vous confirmé avec charte. 0014 l'ouvrait dès la simple
--      proposition — or la proposition est désormais l'état normal avant tout
--      RDV (et une présélection peut compter plusieurs architectes).
--      L'espace architecte lit avec la clé service et n'affiche le contact
--      qu'après engagement : il n'est pas affecté.
--
--   2. Un seul rendez-vous ouvert par projet. La vérification applicative
--      (« pas de RDV ouvert ») précède l'insertion : deux envois simultanés
--      pouvaient créer deux RDV. L'index unique partiel ferme cette course.
--
-- Idempotent.

-- ── 1. Lecture du projet par l'architecte : engagé seulement ────────────────
create or replace function private.is_selected_architect_for_project(p_project_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists(
    select 1
    from public.client_engagements ce
    join public.architect_profiles ap on ap.id = ce.architect_id
    where ce.project_id = p_project_id
      and ce.status = 'engaged'
      and ap.user_id = (select auth.uid())
  );
$$;

-- ── 2. Au plus un RDV ouvert par projet ─────────────────────────────────────
create unique index if not exists meetings_one_open_per_project
  on public.meetings (project_id)
  where status in ('proposed', 'rescheduled', 'confirmed');
