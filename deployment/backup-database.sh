#!/bin/bash
# Database Backup Script for FarmaDisplay

set -e

BACKUP_DIR="/opt/farmadisplay/backups"
DB_NAME="farmadisplay"
DB_USER="farmadisplay"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "=== Starting database backup ==="
echo "Database: $DB_NAME"
echo "Timestamp: $TIMESTAMP"

# Perform backup
pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_FILE

# Check if backup was successful
if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h $BACKUP_FILE | cut -f1)
    echo "Backup completed successfully!"
    echo "File: $BACKUP_FILE"
    echo "Size: $BACKUP_SIZE"
else
    echo "ERROR: Backup failed!"
    exit 1
fi

# Remove old backups
echo "Removing backups older than $RETENTION_DAYS days..."
find $BACKUP_DIR -name "${DB_NAME}_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

# List recent backups
echo ""
echo "Recent backups:"
ls -lh $BACKUP_DIR/${DB_NAME}_*.sql.gz | tail -5

echo ""
echo "=== Backup completed! ==="
