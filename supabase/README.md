# Reliote — Supabase self-hosted (slim)

## Start

```bash
cd supabase
cp .env.example .env   # adjust secrets if you want
./render-kong.sh       # generates kong.yml from kong.template.yml
docker compose up -d
```

- API gateway: http://localhost:54321
- Studio: http://localhost:54323

Migrations and seed are mounted into `/docker-entrypoint-initdb.d/` and applied on first DB init only.

## Re-apply migrations after schema changes

```bash
./apply-migrations.sh
```

It picks up `migrations/*.sql` from the directory, applies the seed, and reloads
PostgREST's schema cache. Nothing to edit when you add a migration — drop the file
in `migrations/` and re-run.

Safe to run repeatedly: applied migrations are recorded in
`supabase_migrations.schema_migrations` (same schema and shape the Supabase CLI
uses) and skipped afterwards. This ledger is what makes re-runs safe — the early
migrations are *not* idempotent, `0001` creates types and tables unguarded. The
seed replays every time and uses on-conflict throughout.

Always go through this script rather than calling `psql` yourself. It connects as
`supabase_admin`, which owns the `ALTER DEFAULT PRIVILEGES` set in
`init/99-reliote-perms.sql` — tables created by any other role (`postgres`
included) get no grants for `anon`/`authenticated`, and PostgREST then answers
`42501 permission denied` on them while the table plainly exists.

## Reset everything

```bash
docker compose down -v
```
