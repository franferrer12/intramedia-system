#!/bin/bash

###############################################################################
# Database Backup Script
#
# This script creates a compressed backup of the PostgreSQL database
# Usage: ./backup-database.sh [environment]
# Example: ./backup-database.sh production
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-"production"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
RETENTION_DAYS=30

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   Database Backup Script${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Load environment variables
if [ "$ENVIRONMENT" == "production" ]; then
    if [ -f .env.production ]; then
        source .env.production
    else
        echo -e "${RED}❌ .env.production not found${NC}"
        exit 1
    fi
elif [ "$ENVIRONMENT" == "staging" ]; then
    if [ -f .env.staging ]; then
        source .env.staging
    else
        echo -e "${RED}❌ .env.staging not found${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Using default environment variables${NC}"
fi

# Set defaults if not provided
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"intra_media_system"}
DB_USER=${DB_USER:-"postgres"}

# Check if password is provided
if [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}❌ DB_PASSWORD not set${NC}"
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate backup filename
BACKUP_FILE="${BACKUP_DIR}/intra_media_${ENVIRONMENT}_${TIMESTAMP}.sql"
BACKUP_FILE_GZ="${BACKUP_FILE}.gz"

echo "📋 Backup Configuration:"
echo "   Environment: $ENVIRONMENT"
echo "   Database: $DB_NAME"
echo "   Host: $DB_HOST:$DB_PORT"
echo "   User: $DB_USER"
echo "   Output: $BACKUP_FILE_GZ"
echo ""

# Create backup
echo "🗄️  Creating database backup..."
PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --format=plain \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    --verbose \
    > "$BACKUP_FILE" 2>&1

# Check if backup was created
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Backup creation failed!${NC}"
    exit 1
fi

# Compress backup
echo "📦 Compressing backup..."
gzip "$BACKUP_FILE"

# Verify compressed backup
if [ ! -f "$BACKUP_FILE_GZ" ]; then
    echo -e "${RED}❌ Backup compression failed!${NC}"
    exit 1
fi

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_FILE_GZ" | cut -f1)

echo -e "${GREEN}✅ Backup created successfully!${NC}"
echo "   File: $BACKUP_FILE_GZ"
echo "   Size: $BACKUP_SIZE"
echo ""

# Cleanup old backups
echo "🧹 Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
echo -e "${GREEN}✅ Cleanup complete${NC}"
echo ""

# Create backup manifest
MANIFEST_FILE="${BACKUP_DIR}/BACKUP_MANIFEST.txt"
echo "Backup created: $(date)" >> "$MANIFEST_FILE"
echo "Environment: $ENVIRONMENT" >> "$MANIFEST_FILE"
echo "File: $BACKUP_FILE_GZ" >> "$MANIFEST_FILE"
echo "Size: $BACKUP_SIZE" >> "$MANIFEST_FILE"
echo "----------------------------------------" >> "$MANIFEST_FILE"

echo "📝 Backup manifest updated"
echo ""

# Show recent backups
echo "📂 Recent backups:"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -5 || echo "No backups found"
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   Backup Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "To restore this backup, run:"
echo "  ./scripts/restore-database.sh $BACKUP_FILE_GZ"
echo ""
