#!/usr/bin/env bash
# Apply Reliote migrations + seed to the running Supabase Postgres.
# Run AFTER `docker compose up -d` and once `reliote-auth` reports "running on host …".
#
# Re-runnable: each migration is recorded in supabase_migrations.schema_migrations
# once applied, and skipped on later runs. The migrations themselves are NOT all
# idempotent (0001 creates types and tables unguarded), so the ledger — not
# create-if-not-exists — is what makes repeated runs safe. The seed is replayed
# every time; it uses on-conflict throughout.
set -euo pipefail
cd "$(dirname "$0")"

export PGPASSWORD="${POSTGRES_PASSWORD:-reliote_dev_pwd}"

# supabase_admin owns the ALTER DEFAULT PRIVILEGES set by init/99-reliote-perms.sql,
# so tables it creates are automatically granted to anon/authenticated/service_role.
# Applying migrations as any other role (postgres included) silently skips those
# grants and PostgREST answers 42501 "permission denied".
DB_USER="${DB_USER:-supabase_admin}"

psql_c() {
  MSYS_NO_PATHCONV=1 docker compose exec -T -e PGPASSWORD="$PGPASSWORD" db \
    psql -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 "$@"
}

# Same schema and shape the Supabase CLI uses, so a local stack and the cloud
# project stay legible to the same tooling.
psql_c -q -c "create schema if not exists supabase_migrations;
              create table if not exists supabase_migrations.schema_migrations (
                version    text primary key,
                name       text,
                applied_at timestamptz not null default now()
              );" > /dev/null

applied="$(psql_c -tAc "select version from supabase_migrations.schema_migrations;" | tr -d '\r')"

is_applied() {
  printf '%s\n' "$applied" | grep -qx "$1"
}

# Derived from the directory, never hand-maintained: a forgotten entry here leaves
# the local stack on an older schema than the code expects.
for path in migrations/[0-9]*.sql; do
  name="$(basename "$path" .sql)"     # 0012_legal_pages
  version="${name%%_*}"               # 0012

  if is_applied "$version"; then
    echo "Skipping  $name (already applied)"
    continue
  fi

  echo "Applying  $name..."
  psql_c -f "/reliote/$path"
  psql_c -q -c "insert into supabase_migrations.schema_migrations (version, name)
                values ('$version', '$name')
                on conflict (version) do nothing;" > /dev/null
done

echo "Applying  seed..."
psql_c -f /reliote/seed.sql

# Admin local : jamais de mot de passe dans le dépôt. Sans la variable, pas d'admin.
if [ -n "${RELIOTE_DEV_ADMIN_PASSWORD:-}" ]; then
  echo "Applying  local admin (${RELIOTE_DEV_ADMIN_EMAIL:-admin@reliote.test})..."
  psql_c -q -v admin_email="${RELIOTE_DEV_ADMIN_EMAIL:-admin@reliote.test}" \
            -v admin_password="$RELIOTE_DEV_ADMIN_PASSWORD" \
            -f /reliote/seed.admin.sql > /dev/null
else
  echo "Skipping  local admin (set RELIOTE_DEV_ADMIN_PASSWORD to create one)"
fi

echo "Reload PostgREST schema cache so it sees the new tables and FKs..."
psql_c -c "notify pgrst, 'reload schema';" > /dev/null

echo "Reliote migrations + seed applied."
