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
echo "Database ikkenauto_test staat klaar voor rol ikkenauto."
