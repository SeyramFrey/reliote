-- Vérifie la RLS de la messagerie (0017) sur la pile locale. Tout est annulé.
-- Lancer (depuis supabase/) :
--   docker compose exec -T -e PGPASSWORD=$POSTGRES_PASSWORD db \
--     psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -f - < tests/messaging_rls.sql
-- Attendu : « NOTICE:  messaging RLS ok » puis ROLLBACK.
begin;

-- ── Données de test ──────────────────────────────────────────────────────
insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('00000000-0000-4000-8000-0000000000c1', 'rls-client@reliote.test', 'authenticated', 'authenticated', '{"role":"client"}'),
  ('00000000-0000-4000-8000-0000000000a1', 'rls-archi@reliote.test',  'authenticated', 'authenticated', '{"role":"architect"}'),
  ('00000000-0000-4000-8000-0000000000e1', 'rls-other@reliote.test',  'authenticated', 'authenticated', '{"role":"client"}');

insert into public.client_projects (id, user_id, client_name, email, project_type, project_description, project_location, project_country)
values ('00000000-0000-4000-8000-000000000b01', '00000000-0000-4000-8000-0000000000c1', 'Client RLS',
        'rls-client@reliote.test', 'residential', repeat('x', 120), 'Dakar', 'Sénégal');

insert into public.architect_profiles (id, user_id, email, first_name, last_name, city, country, description, years_experience, ordre_number)
values ('00000000-0000-4000-8000-000000000d01', '00000000-0000-4000-8000-0000000000a1', 'rls-archi@reliote.test',
        'Archi', 'RLS', 'Dakar', 'Sénégal', repeat('y', 100), 5, 'RLS-001');

insert into public.message_threads (id, kind, project_id, architect_id) values
  ('00000000-0000-4000-8000-000000000f01', 'project_client',      '00000000-0000-4000-8000-000000000b01', null),
  ('00000000-0000-4000-8000-000000000f02', 'project_architect',   '00000000-0000-4000-8000-000000000b01', '00000000-0000-4000-8000-000000000d01'),
  ('00000000-0000-4000-8000-000000000f03', 'architect_admission', null,                                   '00000000-0000-4000-8000-000000000d01');

insert into public.messages (id, thread_id, author_side, body) values
  ('00000000-0000-4000-8000-000000000e01', '00000000-0000-4000-8000-000000000f01', 'admin', 'au porteur'),
  ('00000000-0000-4000-8000-000000000e02', '00000000-0000-4000-8000-000000000f02', 'admin', 'à l''architecte'),
  ('00000000-0000-4000-8000-000000000e03', '00000000-0000-4000-8000-000000000f03', 'admin', 'admission');

insert into public.message_attachments (message_id, thread_id, storage_path, file_name, mime_type, size_bytes) values
  ('00000000-0000-4000-8000-000000000e02', '00000000-0000-4000-8000-000000000f02',
   '00000000-0000-4000-8000-000000000f02/x.pdf', 'esquisse.pdf', 'application/pdf', 1000);

insert into public.message_revisions (message_id, body, action) values
  ('00000000-0000-4000-8000-000000000e01', 'ancienne version', 'edit');

insert into public.message_thread_reads (thread_id, user_id) values
  ('00000000-0000-4000-8000-000000000f02', '00000000-0000-4000-8000-0000000000a1');

-- ── Assertions ───────────────────────────────────────────────────────────
create or replace function pg_temp.expect(label text, got bigint, want bigint) returns void
language plpgsql as $$
begin
  if got <> want then raise exception 'RLS % : % ligne(s), attendu %', label, got, want; end if;
end $$;

-- Porteur : son fil projet uniquement.
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-0000000000c1","role":"authenticated"}';
select pg_temp.expect('client threads',     (select count(*) from public.message_threads), 1);
select pg_temp.expect('client thread kind', (select count(*) from public.message_threads where kind = 'project_client'), 1);
select pg_temp.expect('client messages',    (select count(*) from public.messages), 1);
select pg_temp.expect('client attachments', (select count(*) from public.message_attachments), 0);
select pg_temp.expect('client reads',       (select count(*) from public.message_thread_reads), 0);
select pg_temp.expect('client revisions',   (select count(*) from public.message_revisions), 0);
do $$ begin
  insert into public.messages (thread_id, author_side, body)
  values ('00000000-0000-4000-8000-000000000f01', 'owner', 'forgé');
  raise exception 'RLS client insert : un utilisateur a pu écrire directement';
exception when insufficient_privilege then null;
end $$;
reset role;

-- Architecte : fil projet + admission, jamais le fil du porteur.
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}';
select pg_temp.expect('archi threads',      (select count(*) from public.message_threads), 2);
select pg_temp.expect('archi client thread',(select count(*) from public.message_threads where kind = 'project_client'), 0);
select pg_temp.expect('archi messages',     (select count(*) from public.messages), 2);
select pg_temp.expect('archi attachments',  (select count(*) from public.message_attachments), 1);
select pg_temp.expect('archi reads',        (select count(*) from public.message_thread_reads), 1);
select pg_temp.expect('archi revisions',    (select count(*) from public.message_revisions), 0);
reset role;

-- Tiers : rien.
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-0000000000e1","role":"authenticated"}';
select pg_temp.expect('other threads',  (select count(*) from public.message_threads), 0);
select pg_temp.expect('other messages', (select count(*) from public.messages), 0);
reset role;

-- Anonyme : rien.
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select pg_temp.expect('anon messages', (select count(*) from public.messages), 0);
reset role;

do $$ begin raise notice 'messaging RLS ok'; end $$;
rollback;
