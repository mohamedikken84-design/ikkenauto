#!/bin/bash
# Lokale ontwikkeldatabase. Het wachtwoord is geen productiecredential.
set -euo pipefail
PASSWORD="${IKKENAUTO_DB_PASSWORD:-local-dev-only}"
if [[ ! "$PASSWORD" =~ ^[A-Za-z0-9_-]+$ ]]; then
  echo "IKKENAUTO_DB_PASSWORD mag alleen letters, cijfers, _ en - bevatten." >&2
  exit 1
fi
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ikkenauto') THEN
    CREATE ROLE ikkenauto LOGIN PASSWORD '${PASSWORD}';
  ELSE
    ALTER ROLE ikkenauto WITH LOGIN PASSWORD '${PASSWORD}';
  END IF;
END
\$\$;
SQL
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname = 'ikkenauto_test'" | grep -q 1; then
  sudo -u postgres createdb -O ikkenauto ikkenauto_test
fi
sudo -u postgres psql -d ikkenauto_test -v ON_ERROR_STOP=1 -c "CREATE EXTENSION IF NOT EXISTS btree_gist;"
sudo -u postgres psql -d ikkenauto_test -v ON_ERROR_STOP=1 <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
  END IF;
END
$$;
GRANT anon, authenticated, service_role TO ikkenauto;
GRANT USAGE, CREATE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
SQL
echo "Database ikkenauto_test staat klaar voor rol ikkenauto."
