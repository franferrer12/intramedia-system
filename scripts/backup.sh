#!/bin/bash

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# IntraMedia System - Database Backup Script
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
CONTAINER_NAME="intramedia-db"
DB_NAME=${DB_NAME:-intra_media_system}
DB_USER=${DB_USER:-postgres}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Database Backup${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if container is running
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo "Error: Database container is not running"
    exit 1
fi

# Backup filename
BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql"

echo -e "${YELLOW}→${NC} Creating backup..."
echo "  File: $BACKUP_FILE"

# Create backup
docker exec $CONTAINER_NAME pg_dump -U $DB_USER $DB_NAME > "$BACKUP_FILE"

# Compress backup
echo -e "${YELLOW}→${NC} Compressing backup..."
gzip "$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"

# Get file size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

echo ""
echo -e "${GREEN}✓ Backup completed successfully${NC}"
echo "  File: $BACKUP_FILE"
echo "  Size: $BACKUP_SIZE"
echo ""

# Cleanup old backups (keep last 7 days)
echo -e "${YELLOW}→${NC} Cleaning up old backups (keeping last 7 days)..."
find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +7 -delete
echo -e "${GREEN}✓ Cleanup completed${NC}"
echo ""

# List existing backups
echo "Existing backups:"
ls -lh "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
echo ""
