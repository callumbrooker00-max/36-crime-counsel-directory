#!/usr/bin/env bash
# Secrets check: service-role key must not reach the client bundle, and no .env
# (other than .env.example) may be committed. Run after `npm run build`.
set -uo pipefail
cd "$(dirname "$0")/../.." || exit 1
fail=0

if [ -f .env.local ]; then
  SERVICE_KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' .env.local | cut -d= -f2-)
  if [ -n "$SERVICE_KEY" ] && grep -rq -- "$SERVICE_KEY" .next/static 2>/dev/null; then
    echo "FAIL: service-role key found in .next/static"; fail=1
  else
    echo "PASS: service-role key absent from client bundle (.next/static)"
  fi
else
  echo "SKIP: no .env.local to derive the service key from"
fi

if git ls-files | grep -E '^\.env($|\.)' | grep -qv '.env.example'; then
  echo "FAIL: a real .env file is committed"; git ls-files | grep -E '^\.env' | grep -v '.env.example'; fail=1
else
  echo "PASS: no real .env committed (only .env.example)"
fi

exit $fail
