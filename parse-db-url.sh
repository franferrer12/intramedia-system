#!/bin/sh
# Parse DATABASE_URL and export JDBC-compatible DB_URL
# Handles: postgresql://user:pass@host[:port]/database

if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL not set"
    exit 1
fi

# Remove protocol prefix (postgresql://)
DB_REST="${DATABASE_URL#postgresql://}"

# Extract user:pass@host:port/db parts
DB_USER_PASS="${DB_REST%%@*}"
DB_HOST_DB="${DB_REST#*@}"

# Split user and password
DB_USER="${DB_USER_PASS%%:*}"
DB_PASS="${DB_USER_PASS#*:}"

# Split host:port and database
DB_HOST_PORT="${DB_HOST_DB%%/*}"
DB_NAME="${DB_HOST_DB#*/}"

# Check if port is included
case "$DB_HOST_PORT" in
    *:*)
        DB_HOST="${DB_HOST_PORT%:*}"
        DB_PORT="${DB_HOST_PORT#*:}"
        ;;
    *)
        DB_HOST="$DB_HOST_PORT"
        DB_PORT="5432"
        ;;
esac

# Construct JDBC URL
export DB_URL="jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}?user=${DB_USER}&password=${DB_PASS}&sslmode=require"

echo "✓ Database configured: ${DB_HOST}:${DB_PORT}/${DB_NAME}"
