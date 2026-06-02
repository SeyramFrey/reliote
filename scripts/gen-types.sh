#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
PGPASS="${POSTGRES_PASSWORD:-reliote_dev_pwd}"
npx --yes supabase gen types typescript \
  --db-url "postgresql://supabase_admin:${PGPASS}@localhost:54322/postgres" \
  --schema public \
  > src/types/database.ts
echo "Generated src/types/database.ts"
