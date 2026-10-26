-- 0021_newsletter.sql
-- Newsletter Reliote : abonnés (double opt-in) et lettres rédigées dans l'admin.
--
--   1. newsletter_subscribers → une ligne par adresse. 'pending' tant que le
--      lien de confirmation n'a pas été cliqué ; seuls les 'subscribed'
--      reçoivent les lettres. Désinscription en un clic par unsubscribe_token.
--   2. newsletter_issues      → les lettres (sujet et corps FR/EN), brouillon
--      puis envoyée.
--
-- RLS : aucune lecture publique. Inscriptions, confirmations et envois passent
-- par le client service côté serveur ; l'admin garde une policy en défense en
-- profondeur. Après 0014, les helpers RLS vivent dans `private`. Idempotent.

-- ── 1. newsletter_subscribers ─────────────────────────────────────────────
create table if not exists public.newsletter_subscribers (
  id                 uuid primary key default gen_random_uuid(),
  email              text not null unique check (email = lower(email)),
  locale             text not null default 'fr' check (locale in ('fr', 'en')),
  status             text not null default 'pending'
                     check (status in ('pending', 'subscribed', 'unsubscribed')),
  source             text not null default 'footer',   -- footer · register · project · dashboard
  user_id            uuid references auth.users (id) on delete set null,
  confirm_token      uuid not null default gen_random_uuid(),
  unsubscribe_token  uuid not null default gen_random_uuid() unique,
  created_at         timestamptz not null default now(),
  confirmed_at       timestamptz,
  unsubscribed_at    timestamptz
);

create index if not exists idx_newsletter_subscribers_status
  on public.newsletter_subscribers (status);
create index if not exists idx_newsletter_subscribers_user
  on public.newsletter_subscribers (user_id);
create unique index if not exists idx_newsletter_subscribers_confirm
  on public.newsletter_subscribers (confirm_token);

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "newsletter subscribers admin all" on public.newsletter_subscribers;
create policy "newsletter subscribers admin all"
  on public.newsletter_subscribers for all
  using (private.is_admin())
  with check (private.is_admin());

-- ── 2. newsletter_issues ──────────────────────────────────────────────────
create table if not exists public.newsletter_issues (
  id                uuid primary key default gen_random_uuid(),
  subject_fr        text not null,
  subject_en        text not null,
  body_fr           text not null default '',
  body_en           text not null default '',
  status            text not null default 'draft' check (status in ('draft', 'sent')),
  sent_at           timestamptz,
  recipients_count  integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.newsletter_issues enable row level security;

drop policy if exists "newsletter issues admin all" on public.newsletter_issues;
create policy "newsletter issues admin all"
  on public.newsletter_issues for all
  using (private.is_admin())
  with check (private.is_admin());
