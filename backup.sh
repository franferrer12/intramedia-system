#!/bin/bash

# ============================================
# IntraMedia System - Database Backup
# ============================================

set -e

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/intramedia_${TIMESTAMP}.sql"

echo "📦 Creating database backup..."

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup
docker-compose exec -T database pg_dump -U ${DB_USER:-postgres} ${DB_NAME:-intra_media_system} > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

echo "✅ Backup created: ${BACKUP_FILE}.gz"
echo ""
echo "To restore this backup, run:"
echo "  gunzip -c ${BACKUP_FILE}.gz | docker-compose exec -T database psql -U ${DB_USER:-postgres} -d ${DB_NAME:-intra_media_system}"
