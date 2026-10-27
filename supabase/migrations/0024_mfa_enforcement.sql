-- 0024_mfa_enforcement.sql
-- Double authentification imposée par la base, pas seulement par l'app.
--
-- Règle (miroir de src/lib/auth/mfa.ts) : obligatoire pour l'admin et les
-- porteurs de projet, facultative pour les architectes ; un compte qui a
-- activé un facteur doit toujours le présenter. Une session qui ne remplit pas
-- la règle (mot de passe seul, `aal1`) ne lit ni n'écrit plus aucune donnée
-- privée, même en appelant l'API REST directement avec la clé publique.
--
-- Politiques RESTRICTIVES : elles s'ajoutent (ET) aux politiques existantes
-- sans les élargir. Hors de leur champ :
-- - la clé service (contourne la RLS) : l'app vérifie elle-même l'étape MFA
--   avant d'agir en clé service (lib/auth/mfaSession.ts) ;
-- - la lecture de `profiles` (rôle, nom) : nécessaire pour savoir quelle étape
--   demander avant la double authentification ;
-- - la lecture des contenus publiés (pages légales, partenaires, avis…), que
--   la landing affiche à tout visiteur.
-- Idempotent.

create or replace function private.mfa_satisfied()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2'
      or (
        coalesce(private.user_role_for_current()::text, 'client') not in ('admin', 'client')
        and not exists (
          select 1 from auth.mfa_factors f
          where f.user_id = (select auth.uid()) and f.status = 'verified'
        )
      );
$$;
revoke execute on function private.mfa_satisfied() from public, anon;
grant execute on function private.mfa_satisfied() to authenticated, service_role;

do $$
declare
  t text;
  op text;
begin
  -- Données privées : toute opération.
  foreach t in array array[
    'architect_profiles', 'client_projects', 'match_results', 'client_engagements',
    'engagement_relays', 'meetings', 'message_threads', 'messages', 'message_revisions',
    'message_attachments', 'message_thread_reads', 'newsletter_subscribers', 'newsletter_issues'
  ]
  loop
    execute format('drop policy if exists "mfa required" on public.%I', t);
    execute format(
      'create policy "mfa required" on public.%I as restrictive for all to authenticated '
      || 'using ((select private.mfa_satisfied())) with check ((select private.mfa_satisfied()))',
      t
    );
  end loop;

  -- Contenus publics et profils : les écritures seulement.
  foreach t in array array[
    'profiles', 'featured_projects', 'media_items', 'legal_pages', 'testimonials',
    'partners', 'site_settings'
  ]
  loop
    foreach op in array array['insert', 'update', 'delete']
    loop
      execute format('drop policy if exists "mfa required %s" on public.%I', op, t);
      execute format(
        'create policy "mfa required %s" on public.%I as restrictive for %s to authenticated %s',
        op, t, op,
        case op
          when 'insert' then 'with check ((select private.mfa_satisfied()))'
          when 'update' then 'using ((select private.mfa_satisfied())) with check ((select private.mfa_satisfied()))'
          else 'using ((select private.mfa_satisfied()))'
        end
      );
    end loop;
  end loop;

  -- Fichiers déposés avec la session de l'utilisateur (photos, images de contenu).
  foreach op in array array['insert', 'update', 'delete']
  loop
    execute format('drop policy if exists "mfa required %s" on storage.objects', op);
    execute format(
      'create policy "mfa required %s" on storage.objects as restrictive for %s to authenticated %s',
      op, op,
      case op
        when 'insert' then 'with check ((select private.mfa_satisfied()))'
        when 'update' then 'using ((select private.mfa_satisfied())) with check ((select private.mfa_satisfied()))'
        else 'using ((select private.mfa_satisfied()))'
      end
    );
  end loop;
end $$;
