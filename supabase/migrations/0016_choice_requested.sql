-- 0016_choice_requested.sql
-- Le porteur ne voit la présélection anonyme (≥ 2 architectes proposés)
-- qu'après la demande explicite de l'admin (« Demander au porteur de
-- choisir »). Avant : elle apparaissait dès la deuxième proposition, alors que
-- l'admin pouvait encore être en train de composer sa sélection.
--
-- Idempotent.

alter table public.client_projects
  add column if not exists choice_requested_at timestamptz;
