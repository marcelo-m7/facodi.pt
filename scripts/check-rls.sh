#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "SUPABASE_DB_URL is required"
  exit 1
fi

query="select tablename from pg_tables where schemaname = 'public' and not rowsecurity order by tablename;"
output="$(psql "$SUPABASE_DB_URL" -At -c "$query")"

if [[ -n "$output" ]]; then
  echo "RLS check failed. Public tables without RLS:"
  echo "$output"
  exit 1
fi

echo "RLS check passed: all public tables have RLS enabled."
