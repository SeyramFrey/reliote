#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
[ -f .env ] || { echo "Run cp .env.example .env first"; exit 1; }
# shellcheck disable=SC1091
set -a; . ./.env; set +a
envsubst < kong.template.yml > kong.yml
echo "kong.yml rendered"
