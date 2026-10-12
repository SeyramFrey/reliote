-- Vérifie public.message_unread_counts (0018) sur la pile locale. Tout est annulé.
-- Lancer (depuis supabase/) :
--   docker compose exec -T -e PGPASSWORD=$POSTGRES_PASSWORD db \
--     psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -f - < tests/messaging_unread.sql
-- Attendu : « NOTICE:  messaging unread ok » puis ROLLBACK.
begin;

insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('00000000-0000-4000-8000-0000000001c1', 'unread-client@reliote.test', 'authenticated', 'authenticated', '{"role":"client"}'),
  ('00000000-0000-4000-8000-0000000001ad', 'unread-admin@reliote.test',  'authenticated', 'authenticated', '{"role":"client"}');
update public.profiles set role = 'admin' where id = '00000000-0000-4000-8000-0000000001ad';

insert into public.client_projects (id, user_id, client_name, email, project_type, project_description, project_location, project_country)
values ('00000000-0000-4000-8000-000000001b01', '00000000-0000-4000-8000-0000000001c1', 'Client unread',
        'unread-client@reliote.test', 'residential', repeat('x', 120), 'Dakar', 'Sénégal');

insert into public.message_threads (id, kind, project_id)
values ('00000000-0000-4000-8000-000000001f01', 'project_client', '00000000-0000-4000-8000-000000001b01');

-- 3 messages du porteur (dont 1 supprimé), 2 de l'admin.
insert into public.messages (thread_id, author_side, body, created_at, deleted_at) values
  ('00000000-0000-4000-8000-000000001f01', 'owner', 'o1', '2026-10-13 10:00+00', null),
  ('00000000-0000-4000-8000-000000001f01', 'owner', 'o2', '2026-10-13 11:00+00', null),
  ('00000000-0000-4000-8000-000000001f01', 'owner', 'o3', '2026-10-13 12:00+00', '2026-10-13 12:01+00'),
  ('00000000-0000-4000-8000-000000001f01', 'admin', 'a1', '2026-10-13 10:30+00', null),
  ('00000000-0000-4000-8000-000000001f01', 'admin', 'a2', '2026-10-13 11:30+00', null);

create or replace function pg_temp.expect(label text, got bigint, want bigint) returns void
language plpgsql as $$
begin
  if got is distinct from want then raise exception 'unread % : %, attendu %', label, got, want; end if;
end $$;

-- Personne n'a rien lu : côté admin 2 (o3 supprimé), côté porteur 2.
select pg_temp.expect('admin, nothing read',
  (select unread from public.message_unread_counts(array['00000000-0000-4000-8000-000000001f01']::uuid[], 'admin', '00000000-0000-4000-8000-0000000001ad')), 2);
select pg_temp.expect('owner, nothing read',
  (select unread from public.message_unread_counts(array['00000000-0000-4000-8000-000000001f01']::uuid[], 'owner', '00000000-0000-4000-8000-0000000001c1')), 2);

-- L'admin a lu à 10:45 ; le porteur à 11:45.
insert into public.message_thread_reads (thread_id, user_id, last_read_at) values
  ('00000000-0000-4000-8000-000000001f01', '00000000-0000-4000-8000-0000000001ad', '2026-10-13 10:45+00'),
  ('00000000-0000-4000-8000-000000001f01', '00000000-0000-4000-8000-0000000001c1', '2026-10-13 11:45+00');
select pg_temp.expect('admin after read',
  (select unread from public.message_unread_counts(array['00000000-0000-4000-8000-000000001f01']::uuid[], 'admin', '00000000-0000-4000-8000-0000000001ad')), 1);
select pg_temp.expect('owner after read',
  (select unread from public.message_unread_counts(array['00000000-0000-4000-8000-000000001f01']::uuid[], 'owner', '00000000-0000-4000-8000-0000000001c1')), 0);

-- La lecture du porteur ne compte jamais comme une lecture admin.
select pg_temp.expect('owner read is not admin read',
  (select unread from public.message_unread_counts(array['00000000-0000-4000-8000-000000001f01']::uuid[], 'admin', '00000000-0000-4000-8000-0000000001c1')), 1);

-- Fil inconnu : 0, pas d'erreur.
select pg_temp.expect('unknown thread',
  (select unread from public.message_unread_counts(array['00000000-0000-4000-8000-00000000ffff']::uuid[], 'owner', '00000000-0000-4000-8000-0000000001c1')), 0);

-- Inaccessible aux rôles de l'API.
do $$ begin
  if has_function_privilege('authenticated', 'public.message_unread_counts(uuid[], public.message_side, uuid)', 'execute')
     or has_function_privilege('anon', 'public.message_unread_counts(uuid[], public.message_side, uuid)', 'execute') then
    raise exception 'unread counts callable by anon/authenticated';
  end if;
end $$;

do $$ begin raise notice 'messaging unread ok'; end $$;
rollback;
