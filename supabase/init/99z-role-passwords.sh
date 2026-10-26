#!/bin/bash
# Aligne les mots de passe des rôles de service (créés par 99-reliote-perms.sql
# avec une valeur de dev) sur POSTGRES_PASSWORD, que docker-compose passe aux
# services. Sans ce script, une base de prod garderait 'reliote_dev_pwd'.
# Lancé une seule fois, au premier démarrage du volume.
set -euo pipefail
psql -v ON_ERROR_STOP=1 -v pwd="$POSTGRES_PASSWORD" --username "${POSTGRES_USER:-postgres}" --dbname postgres <<'SQL'
alter role authenticator          with login password :'pwd';
alter role supabase_auth_admin    with login password :'pwd';
alter role supabase_storage_admin with login password :'pwd';
SQL
