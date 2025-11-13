# Omasa Restaurant Management System - Deployment Guide

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Production Deployment](#production-deployment)
- [Database Migrations](#database-migrations)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Docker** (v20+) and **Docker Compose** (v2+)
- **Node.js** (v20+) and **pnpm** (v8+) for local development
- **PostgreSQL** (v14+)
- **Redis** (v7+) - optional but recommended for production

### System Requirements

**Minimum:**
- 2 CPU cores
- 4GB RAM
- 20GB disk space

**Recommended for Production:**
- 4+ CPU cores
- 8GB+ RAM
- 50GB+ SSD storage

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/omasa.git
cd omasa
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and configure:

**CRITICAL: Change these in production:**
- `JWT_SECRET` - Generate with: `openssl rand -base64 32`
- `JWT_REFRESH_SECRET` - Generate with: `openssl rand -base64 32`
- `POSTGRES_PASSWORD` - Strong database password
- `FRONTEND_URL` and `CORS_ORIGIN` - Your domain URL

Example production `.env`:
```env
# Database
POSTGRES_USER=omasa
POSTGRES_PASSWORD=super_secure_db_password_here
POSTGRES_DB=omasa
DATABASE_URL=postgresql://omasa:super_secure_db_password_here@postgres:5432/omasa?schema=public

# JWT Secrets
JWT_SECRET=a8f5f167f44f4964e6c998dee827110c
JWT_REFRESH_SECRET=3d6f8c4b5e7a9f2d1c8b4a3e6f9d2c1b

# URLs
FRONTEND_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
CORS_ORIGIN=https://yourdomain.com

NODE_ENV=production
```

## Local Development

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Database

```bash
# Start PostgreSQL (via Docker)
docker-compose up -d postgres

# Run migrations
cd apps/backend
npx prisma migrate dev
npx prisma generate
npx prisma db seed  # Optional: seed sample data
```

### 3. Start Development Servers

Terminal 1 - Backend:
```bash
cd apps/backend
pnpm run dev
```

Terminal 2 - Frontend:
```bash
cd apps/frontend
pnpm run dev
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/api

## Docker Deployment

### Development Mode

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Mode

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check health
docker-compose -f docker-compose.prod.yml ps
```

### Individual Service Management

```bash
# Restart backend only
docker-compose restart backend

# View backend logs
docker-compose logs -f backend

# Execute commands in container
docker-compose exec backend sh
docker-compose exec postgres psql -U omasa -d omasa
```

## Production Deployment

### Option 1: VPS/Cloud Server (Recommended)

#### 1. Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. Deploy Application

```bash
# Clone repository
git clone https://github.com/your-org/omasa.git
cd omasa

# Configure environment
cp .env.example .env
nano .env  # Edit with your values

# Build and start
docker-compose up -d

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Check status
docker-compose ps
docker-compose logs -f
```

#### 3. Configure Nginx (if using external Nginx)

```nginx
# /etc/nginx/sites-available/omasa
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:3001/;
        # ... (same proxy headers as above)
    }
}
```

#### 4. Setup SSL with Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (cron)
sudo crontab -e
# Add: 0 3 * * * certbot renew --quiet
```

### Option 2: Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yml omasa

# Check services
docker service ls
docker service logs omasa_backend
```

### Option 3: Kubernetes (Advanced)

See `k8s/` directory for Kubernetes manifests.

## Database Migrations

### Development

```bash
# Create migration
cd apps/backend
npx prisma migrate dev --name description_of_change

# Apply migrations
npx prisma migrate dev

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Production

```bash
# Apply pending migrations
docker-compose exec backend npx prisma migrate deploy

# Or manually:
cd apps/backend
npx prisma migrate deploy
```

### Backup & Restore

```bash
# Backup
docker-compose exec postgres pg_dump -U omasa omasa > backup_$(date +%Y%m%d).sql

# Restore
docker-compose exec -T postgres psql -U omasa omasa < backup_20240101.sql
```

## Monitoring & Maintenance

### Health Checks

```bash
# Application health
curl http://localhost/health
curl http://localhost:3001/health

# Database connection
docker-compose exec postgres psql -U omasa -d omasa -c "SELECT 1"

# Redis connection
docker-compose exec redis redis-cli ping
```

### Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Performance Monitoring

#### With Docker Stats
```bash
docker stats
```

#### With cAdvisor (Recommended)
```bash
docker run -d --name=cadvisor \
  -p 8080:8080 \
  -v /:/rootfs:ro \
  -v /var/run:/var/run:rw \
  -v /sys:/sys:ro \
  -v /var/lib/docker/:/var/lib/docker:ro \
  gcr.io/cadvisor/cadvisor:latest
```

### Updates & Upgrades

```bash
# Pull latest changes
git pull origin main

# Rebuild images
docker-compose build --no-cache

# Restart services
docker-compose up -d

# Run migrations if needed
docker-compose exec backend npx prisma migrate deploy
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
sudo lsof -i :3000
sudo lsof -i :3001

# Kill process
kill -9 <PID>
```

#### Database Connection Failed
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U omasa -d omasa
```

#### Frontend Can't Connect to Backend
- Check `NEXT_PUBLIC_API_URL` in `.env`
- Verify CORS settings in backend
- Check Nginx configuration if using reverse proxy

#### Out of Memory
```bash
# Increase Docker memory limit
# Docker Desktop: Settings > Resources > Memory

# Check container memory usage
docker stats

# Restart services
docker-compose restart
```

### Debug Mode

```bash
# Enable debug logging
docker-compose -f docker-compose.yml -f docker-compose.debug.yml up

# Or set in .env:
LOG_LEVEL=debug
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Generate secure JWT secrets
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure firewall (UFW/iptables)
- [ ] Enable rate limiting
- [ ] Regular security updates
- [ ] Database backups configured
- [ ] Environment variables secured (not in git)
- [ ] CORS properly configured
- [ ] File upload limits set

## Performance Optimization

### Database
- Enable connection pooling
- Create indexes on frequently queried columns
- Regular VACUUM and ANALYZE

### Backend
- Enable Redis caching
- Use PM2 for process management
- Enable gzip compression

### Frontend
- Enable CDN for static assets
- Optimize images (WebP, lazy loading)
- Enable Next.js image optimization

### Nginx
- Enable gzip compression
- Configure caching headers
- Use HTTP/2

## Support

For issues or questions:
- GitHub Issues: https://github.com/your-org/omasa/issues
- Documentation: https://docs.omasa.app
- Email: support@omasa.app
