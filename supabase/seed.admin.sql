-- supabase/seed.admin.sql
-- Compte admin de DÉVELOPPEMENT LOCAL uniquement. Ne jamais lancer sur une base
-- distante. Le mot de passe n'est pas dans ce fichier : il est passé par
-- apply-migrations.sh en variable psql depuis RELIOTE_DEV_ADMIN_PASSWORD.
--
--   psql -v admin_email=admin@reliote.test -v admin_password=... -f seed.admin.sql
--
-- Idempotent : ne recrée pas un compte existant, mais réaligne son mot de passe.

set search_path = public, extensions, auth;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values (
  '00000000-0000-0000-0000-00000000a001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  :'admin_email',
  crypt(:'admin_password', gen_salt('bf')),
  now(),
  jsonb_build_object('first_name','Reliote','last_name','Admin','locale','fr'),
  now(), now()
) on conflict (id) do update
  set email = excluded.email,
      encrypted_password = excluded.encrypted_password;

-- GoTrue v2.177 cannot scan NULL into the *_token varchar columns.
update auth.users
  set confirmation_token         = coalesce(confirmation_token, ''),
      recovery_token             = coalesce(recovery_token, ''),
      email_change_token_new     = coalesce(email_change_token_new, ''),
      email_change_token_current = coalesce(email_change_token_current, ''),
      email_change               = coalesce(email_change, ''),
      phone_change               = coalesce(phone_change, ''),
      phone_change_token         = coalesce(phone_change_token, ''),
      reauthentication_token     = coalesce(reauthentication_token, '')
  where id = '00000000-0000-0000-0000-00000000a001';

-- Le trigger d'inscription ne donne jamais 'admin' (0014) : promotion explicite.
update public.profiles set role = 'admin', first_name = 'Reliote', last_name = 'Admin'
  where id = '00000000-0000-0000-0000-00000000a001';
