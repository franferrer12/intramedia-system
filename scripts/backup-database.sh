#!/bin/bash
#
# Automatic Database Backup Script
# Backs up PostgreSQL database to AWS S3
# Usage: Run this script daily via cron job
#

set -e

# Configuration
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="club_management_backup_${BACKUP_DATE}.sql.gz"
S3_BUCKET="${AWS_S3_BUCKET:-club-management-backups}"
S3_PATH="s3://${S3_BUCKET}/backups/${BACKUP_FILE}"
RETENTION_DAYS=30

echo "🔄 Starting database backup..."
echo "Date: $(date)"
echo "Backup file: ${BACKUP_FILE}"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo "❌ ERROR: AWS CLI is not installed"
    exit 1
fi

# Perform backup
echo "📦 Creating database dump..."
pg_dump "$DATABASE_URL" | gzip > "/tmp/${BACKUP_FILE}"

if [ $? -ne 0 ]; then
    echo "❌ ERROR: Database dump failed"
    exit 1
fi

# Get file size
BACKUP_SIZE=$(du -h "/tmp/${BACKUP_FILE}" | cut -f1)
echo "✅ Backup created successfully (${BACKUP_SIZE})"

# Upload to S3
echo "☁️  Uploading to S3..."
aws s3 cp "/tmp/${BACKUP_FILE}" "${S3_PATH}"

if [ $? -ne 0 ]; then
    echo "❌ ERROR: S3 upload failed"
    rm "/tmp/${BACKUP_FILE}"
    exit 1
fi

echo "✅ Backup uploaded to ${S3_PATH}"

# Clean up local file
rm "/tmp/${BACKUP_FILE}"

# Remove old backups (older than RETENTION_DAYS)
echo "🗑️  Cleaning up old backups (older than ${RETENTION_DAYS} days)..."
CUTOFF_DATE=$(date -d "${RETENTION_DAYS} days ago" +%Y%m%d 2>/dev/null || date -v-${RETENTION_DAYS}d +%Y%m%d)

aws s3 ls "s3://${S3_BUCKET}/backups/" | while read -r line; do
    BACKUP_DATE_STR=$(echo "$line" | awk '{print $4}' | grep -o '[0-9]\{8\}' | head -1)
    if [ ! -z "$BACKUP_DATE_STR" ] && [ "$BACKUP_DATE_STR" -lt "$CUTOFF_DATE" ]; then
        BACKUP_FILE_TO_DELETE=$(echo "$line" | awk '{print $4}')
        echo "Deleting old backup: ${BACKUP_FILE_TO_DELETE}"
        aws s3 rm "s3://${S3_BUCKET}/backups/${BACKUP_FILE_TO_DELETE}"
    fi
done

echo "✅ Backup completed successfully!"
echo "Backup location: ${S3_PATH}"
echo "Retention: ${RETENTION_DAYS} days"
