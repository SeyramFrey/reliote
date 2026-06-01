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
docker compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/migrations/0001_schema.sql
# repeat for 0002_rls.sql, 0003_triggers.sql, then zz-seed.sql
```

## Reset everything

```bash
docker compose down -v
```
