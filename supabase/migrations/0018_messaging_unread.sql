-- 0018_messaging_unread.sql
-- Nombre de messages non lus par fil, calculé en base : charger tous les
-- messages côté serveur pour les compter se heurte à la limite de lignes de
-- PostgREST sur le Cloud (1 000 par défaut) et coûte cher à chaque page.
--
-- « Lu côté admin » = la lecture la plus récente d'un admin ; « lu côté
-- propriétaire » = la lecture de l'utilisateur donné. Les messages supprimés
-- ne comptent pas. Réservée au client service (serveur). Idempotent.

create or replace function public.message_unread_counts(
  p_thread_ids uuid[],
  p_side public.message_side,
  p_user uuid
)
returns table (thread_id uuid, unread bigint)
language sql
stable
set search_path = ''
as $$
  select t.id,
    (
      select count(*)
      from public.messages m
      where m.thread_id = t.id
        and m.author_side <> p_side
        and m.deleted_at is null
        and m.created_at > coalesce(
          (
            select max(r.last_read_at)
            from public.message_thread_reads r
            where r.thread_id = t.id
              and case
                    when p_side = 'owner' then r.user_id = p_user
                    else exists (
                      select 1 from public.profiles pr where pr.id = r.user_id and pr.role = 'admin'
                    )
                  end
          ),
          '-infinity'::timestamptz
        )
    )
  from unnest(p_thread_ids) as t(id);
$$;

revoke execute on function public.message_unread_counts(uuid[], public.message_side, uuid) from public, anon, authenticated;
grant execute on function public.message_unread_counts(uuid[], public.message_side, uuid) to service_role;
