#!/bin/bash

# Database Backup Script for Omasa
# Usage: ./scripts/backup.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Load environment
cd "$PROJECT_ROOT"
if [ -f ".env" ]; then
    source .env
fi

POSTGRES_USER=${POSTGRES_USER:-omasa}
POSTGRES_DB=${POSTGRES_DB:-omasa}

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "🔄 Creating database backup..."

# Create SQL backup
BACKUP_FILE="$BACKUP_DIR/omasa_backup_$DATE.sql"
docker-compose exec -T postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > "$BACKUP_FILE"

# Compress backup
echo "📦 Compressing backup..."
gzip "$BACKUP_FILE"

COMPRESSED_FILE="$BACKUP_FILE.gz"
FILE_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)

echo "✅ Backup completed successfully!"
echo "   File: $COMPRESSED_FILE"
echo "   Size: $FILE_SIZE"

# Keep only last 7 backups
echo "🧹 Cleaning old backups (keeping last 7)..."
cd "$BACKUP_DIR"
ls -t omasa_backup_*.sql.gz | tail -n +8 | xargs -r rm

echo "📊 Available backups:"
ls -lh omasa_backup_*.sql.gz 2>/dev/null || echo "No backups found"
