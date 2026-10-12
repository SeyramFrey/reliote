-- Schémas de Supabase Realtime (service « realtime » du docker-compose) :
--   _realtime : base interne du service (tenants) ;
--   realtime  : objets du tenant (abonnements postgres_changes), créés par les
--               migrations du service, qui exigent que le schéma existe déjà.
-- Exécuté à la création du volume ; sur un volume existant, le lancer une fois :
--   docker compose exec db psql -U supabase_admin -d postgres -f /docker-entrypoint-initdb.d/98-realtime.sql
create schema if not exists _realtime;
alter schema _realtime owner to supabase_admin;
create schema if not exists realtime;
alter schema realtime owner to supabase_admin;
grant usage on schema realtime to postgres, anon, authenticated, service_role;
