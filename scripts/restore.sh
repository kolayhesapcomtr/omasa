#!/bin/bash

# Database Restore Script for Omasa
# Usage: ./scripts/restore.sh <backup_file>

set -e

if [ -z "$1" ]; then
    echo "❌ Error: No backup file specified"
    echo "Usage: ./scripts/restore.sh <backup_file>"
    echo ""
    echo "Available backups:"
    ls -lh backups/omasa_backup_*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Load environment
if [ -f ".env" ]; then
    source .env
fi

POSTGRES_USER=${POSTGRES_USER:-omasa}
POSTGRES_DB=${POSTGRES_DB:-omasa}

echo "⚠️  WARNING: This will replace the current database with the backup!"
echo "   Backup file: $BACKUP_FILE"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Create temporary backup of current database
echo "📦 Creating safety backup of current database..."
SAFETY_BACKUP="backups/safety_backup_$(date +%Y%m%d_%H%M%S).sql"
mkdir -p backups
docker-compose exec -T postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > "$SAFETY_BACKUP"
gzip "$SAFETY_BACKUP"
echo "✅ Safety backup created: $SAFETY_BACKUP.gz"

# Stop backend to prevent connections
echo "🛑 Stopping backend..."
docker-compose stop backend

# Drop and recreate database
echo "🗑️  Dropping existing database..."
docker-compose exec -T postgres psql -U $POSTGRES_USER -c "DROP DATABASE IF EXISTS $POSTGRES_DB;"
docker-compose exec -T postgres psql -U $POSTGRES_USER -c "CREATE DATABASE $POSTGRES_DB;"

# Restore from backup
echo "📥 Restoring database from backup..."
if [[ "$BACKUP_FILE" == *.gz ]]; then
    zcat "$BACKUP_FILE" | docker-compose exec -T postgres psql -U $POSTGRES_USER $POSTGRES_DB
else
    docker-compose exec -T postgres psql -U $POSTGRES_USER $POSTGRES_DB < "$BACKUP_FILE"
fi

# Start backend
echo "✅ Restarting backend..."
docker-compose start backend

echo "🎉 Database restore completed successfully!"
echo ""
echo "Safety backup saved at: $SAFETY_BACKUP.gz"
