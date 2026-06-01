# Reliote — MVP

Premium platform connecting French project owners with verified architects in Côte d'Ivoire.
Calm, architectural, structured — trust through clarity.

## Quick start (local)

```bash
# 1) Boot Supabase self-hosted
cd supabase
cp .env.example .env       # adjust secrets if you want (dev JWTs are pre-baked)
./render-kong.sh           # generates kong.yml with the keys substituted
docker compose up -d

# Studio dashboard: http://localhost:54323
# API gateway:      http://localhost:54321
```

Migrations + seed are mounted into `/docker-entrypoint-initdb.d/` and applied on the first DB init. To re-apply after a code change:
```bash
docker compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/migrations/0001_schema.sql
docker compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/migrations/0002_rls.sql
docker compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/migrations/0003_triggers.sql
docker compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/zz-seed.sql
```

To wipe and start over:
```bash
docker compose down -v
```

```bash
# 2) Boot the Next.js app
cd ..
cp .env.example .env.local   # ANON_KEY + SERVICE_ROLE_KEY are pre-baked for dev
npm install
npm run dev                  # http://localhost:3000  → /fr (default)
```

## Seeded accounts

| Role     | Email                  | Password           |
|----------|------------------------|--------------------|
| Admin    | admin@reliote.test     | ReliotePass2026!   |

Plus 8 verified architects and 3 demo client projects (no real auth).

## Routes

- `/fr` and `/en` — landing page (10 sections)
- `/{locale}/architectes` — public filterable index
- `/{locale}/architectes/[id]` — public architect profile (SEO)
- `/{locale}/architectes/rejoindre` — architect onboarding wizard (6 steps, auth required)
- `/{locale}/projets/initier` — client project submission wizard (5 steps, anonymous OK)
- `/{locale}/projets/[id]/confirmation` — ranked matches with score breakdown
- `/{locale}/dashboard/client` — own projects (auth required)
- `/{locale}/dashboard/architecte` — own profile + incoming matches (auth required)
- `/{locale}/admin` — overview counters (admin-only)
- `/{locale}/admin/{architectes,projets,matches}` — admin tables
- `/{locale}/auth/{login,register,forgot,callback}` — auth flows

## Testing

```bash
npm test           # vitest run (13 tests: 2 architect schema + 2 project schema + 7 matching + 2 utils)
npm run test:watch
npm run db:types   # regenerate src/types/database.ts from the live Postgres schema
```

## Production Docker build

```bash
docker build -t reliote-web .
docker run --rm -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=https://supabase.your-domain.tld \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  -e SUPABASE_SERVICE_ROLE_KEY=... \
  -e SITE_URL=https://reliote.tld \
  reliote-web
```

## Architecture

- **Frontend:** Next.js 16 App Router · React 19 · TypeScript · Tailwind v4 (CSS-first tokens via `@theme`) · shadcn-style primitives · Framer Motion (sparingly) · next-intl v4 (FR/EN, locale-prefixed) · React Hook Form + Zod.
- **Backend:** Supabase self-hosted via Docker Compose — Postgres 15 + GoTrue + PostgREST + Kong + Studio + postgres-meta. Single-tenant; three roles (`client`, `architect`, `admin`) with RLS on every table.
- **Matching:** rule-based pure function with explainable score breakdown (max 90, 7 unit tests). Lives in `src/lib/matching/score.ts`.
- **Auth:** `@supabase/ssr` cookies in middleware; service-role client used for server-side writes that bypass RLS.

Full design rationale and acceptance criteria: `docs/superpowers/specs/2026-06-01-reliote-mvp-design.md`.
Implementation plan: `docs/superpowers/plans/2026-06-01-reliote-mvp.md`.

## Visual identity

Locked direction: V1 **Éditorial minéral** (mineral editorial).

- Palette: paper `#f3f1ec`, ink `#14140f`, deep green `#073E18` (identity accent ≤ 8% surface), brass `#b89968`, concrete grays, water `#0c1614`.
- Type: Geist (sans) + Instrument Serif italic (display accent) + Geist Mono (metadata).
- Structure: 12-column grid, sections numbered 01—08, 1px hairlines everywhere, Paris ⇄ Abidjan coordinates as ambient detail.
- Language switch styled as an architect's dimension line with a green tick that slides between FR and EN.

## Deploy on a VPS

1. Provision a VPS with Docker + docker-compose.
2. Copy `supabase/` and fill `supabase/.env` with production secrets (generate fresh JWT secret + ANON_KEY + SERVICE_ROLE_KEY).
3. `cd supabase && ./render-kong.sh && docker compose up -d`.
4. Build the web image on the same VPS: `docker build -t reliote-web .`.
5. Run with envs pointing to your Supabase URL.
6. Front with nginx + Let's Encrypt for TLS termination.

For real email (password reset, admin notifications), wire up SMTP in `supabase/.env` (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, etc.) — currently dev uses GoTrue's autoconfirm mode (`GOTRUE_MAILER_AUTOCONFIRM=true`).

## What's deliberately out of scope (post-MVP)

- Production SMTP wire-up (Resend/Postmark)
- File upload for architect portfolio (text URLs only for now)
- Internal messaging between client and matched architect
- Real review system + rating computation
- Stripe-based mission escrow / milestone payments
- More refined matching (semantic search on `project_description`)
- Realtime updates in admin (poll-on-refresh for now)
