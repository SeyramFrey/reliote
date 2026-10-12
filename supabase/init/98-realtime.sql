-- Schéma interne de Supabase Realtime (service « realtime » du docker-compose).
-- Exécuté à la création du volume ; sur un volume existant, le lancer une fois :
--   docker compose exec db psql -U supabase_admin -d postgres -f /docker-entrypoint-initdb.d/98-realtime.sql
create schema if not exists _realtime;
alter schema _realtime owner to supabase_admin;
