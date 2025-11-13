#!/bin/bash

# Omasa Deployment Script
# Usage: ./scripts/deploy.sh [environment]
# Example: ./scripts/deploy.sh production

set -e  # Exit on error

ENVIRONMENT=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🚀 Starting Omasa deployment for $ENVIRONMENT environment..."

cd "$PROJECT_ROOT"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env exists
if [ ! -f ".env" ]; then
    log_error ".env file not found! Please copy .env.example and configure it."
    exit 1
fi

# Load environment variables
source .env

# Check required environment variables
REQUIRED_VARS=("DATABASE_URL" "JWT_SECRET" "JWT_REFRESH_SECRET")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        log_error "Required environment variable $var is not set!"
        exit 1
    fi
done

# Backup database (production only)
if [ "$ENVIRONMENT" == "production" ]; then
    log_info "Creating database backup..."
    BACKUP_DIR="$PROJECT_ROOT/backups"
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if docker-compose ps postgres | grep -q "Up"; then
        docker-compose exec -T postgres pg_dump -U ${POSTGRES_USER:-omasa} ${POSTGRES_DB:-omasa} > "$BACKUP_FILE"
        log_info "Database backup created: $BACKUP_FILE"
    else
        log_warn "PostgreSQL container not running. Skipping backup."
    fi
fi

# Pull latest changes (if git repo)
if [ -d ".git" ]; then
    log_info "Pulling latest changes from git..."
    git pull origin main || log_warn "Git pull failed. Continuing anyway..."
fi

# Stop existing containers
log_info "Stopping existing containers..."
docker-compose down

# Build images
log_info "Building Docker images..."
docker-compose build --no-cache

# Start database first
log_info "Starting PostgreSQL..."
docker-compose up -d postgres redis

# Wait for database to be ready
log_info "Waiting for database to be ready..."
sleep 10

# Run database migrations
log_info "Running database migrations..."
docker-compose run --rm backend npx prisma migrate deploy

# Generate Prisma Client
log_info "Generating Prisma Client..."
docker-compose run --rm backend npx prisma generate

# Start all services
log_info "Starting all services..."
docker-compose up -d

# Wait for services to be healthy
log_info "Waiting for services to be healthy..."
sleep 15

# Health checks
log_info "Performing health checks..."

# Check backend
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    log_info "✅ Backend is healthy"
else
    log_error "❌ Backend health check failed"
    docker-compose logs backend
fi

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    log_info "✅ Frontend is healthy"
else
    log_error "❌ Frontend health check failed"
    docker-compose logs frontend
fi

# Check Nginx
if curl -f http://localhost/health > /dev/null 2>&1; then
    log_info "✅ Nginx is healthy"
else
    log_warn "⚠️ Nginx health check failed (may not be configured yet)"
fi

# Show running containers
log_info "Running containers:"
docker-compose ps

# Show logs
log_info "Recent logs:"
docker-compose logs --tail=20

echo ""
log_info "🎉 Deployment completed successfully!"
echo ""
echo "Access your application at:"
echo "  Frontend: http://localhost"
echo "  Backend API: http://localhost/api"
echo "  Backend Direct: http://localhost:3001"
echo ""
echo "Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  Stop services: docker-compose down"
echo "  Restart service: docker-compose restart [service]"
echo ""
