#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
PGPASS="${POSTGRES_PASSWORD:-reliote_dev_pwd}"
# La base locale n'accepte pas TLS ; on écrit dans un fichier temporaire pour ne
# pas écraser les types avec un message d'erreur si la génération échoue.
tmp="$(mktemp)"
npx --yes supabase gen types typescript \
  --db-url "postgresql://supabase_admin:${PGPASS}@localhost:54322/postgres?sslmode=disable" \
  --schema public \
  > "$tmp"
if ! grep -q "export type Database" "$tmp"; then
  echo "Type generation failed:" >&2
  head -c 400 "$tmp" >&2
  rm -f "$tmp"
  exit 1
fi
mv "$tmp" src/types/database.ts
# Le générateur récent n'indente plus sa sortie.
npx --yes prettier --write --no-semi src/types/database.ts > /dev/null
echo "Generated src/types/database.ts"
