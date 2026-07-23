#!/usr/bin/env bash
# Apply Reliote migrations + seed to the running Supabase Postgres.
# Run AFTER `docker compose up -d` and once `reliote-auth` reports "running on host …".
# Idempotent: migrations use create-if-not-exists patterns; seed uses on-conflict.
set -euo pipefail
cd "$(dirname "$0")"

export PGPASSWORD="${POSTGRES_PASSWORD:-reliote_dev_pwd}"

DB_USER="${DB_USER:-supabase_admin}"
SQL_FILES=(
  /reliote/migrations/0001_schema.sql
  /reliote/migrations/0002_rls.sql
  /reliote/migrations/0003_triggers.sql
  /reliote/migrations/0004_rls_fix_recursion.sql
  /reliote/migrations/0005_architect_cnoa_fields.sql
  /reliote/migrations/0006_storage_architect_photos.sql
  /reliote/migrations/0007_architects_private.sql
  /reliote/migrations/0008_engagement_and_reveal.sql
  /reliote/migrations/0009_geo_panafrican.sql
  /reliote/seed.sql
)

for f in "${SQL_FILES[@]}"; do
  echo "Applying $f..."
  MSYS_NO_PATHCONV=1 docker compose exec -T -e PGPASSWORD="$PGPASSWORD" db \
    psql -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 -f "$f"
done

echo "Reload PostgREST schema cache so it sees the new tables and FKs..."
MSYS_NO_PATHCONV=1 docker compose exec -T -e PGPASSWORD="$PGPASSWORD" db \
  psql -U "$DB_USER" -d postgres -c "notify pgrst, 'reload schema';"

echo "Reliote migrations + seed applied."
