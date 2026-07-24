#!/usr/bin/env bash
set -Eeuo pipefail

# MySQL's official entrypoint only scans files in this directory's first level.
# Execute the versioned SQL files stored in the migrations subdirectory after
# the base schema and seed files have finished.
for migration in /docker-entrypoint-initdb.d/migrations/V*.sql; do
  echo "Applying database migration: ${migration}"
  mysql --protocol=socket -uroot -p"${MYSQL_ROOT_PASSWORD}" "${MYSQL_DATABASE}" < "${migration}"
done
