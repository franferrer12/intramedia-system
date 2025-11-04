# IntraMedia System - Production Deployment Guide

**Version:** 2.3.0  
**Last Updated:** October 28, 2025  
**Status:** Production-Ready

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Security Configuration](#security-configuration)
5. [Deployment Options](#deployment-options)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)
8. [Backup & Recovery](#backup--recovery)

---

## Prerequisites

### Required Software

- **Docker** (v20.10+)
- **Docker Compose** (v2.0+)
- **Git**

### System Requirements

**Minimum:**
- 2 CPU cores
- 4 GB RAM
- 20 GB disk space

**Recommended (Production):**
- 4+ CPU cores
- 8+ GB RAM
- 50+ GB SSD storage

### Network Requirements

- Port 80 (Frontend)
- Port 3001 (Backend API)
- Port 5432 (PostgreSQL - can be internal only)

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/intra-media-system.git
cd intra-media-system

# 2. Create production environment file
cp .env.production.example .env.production

# 3. Edit .env.production with your values
nano .env.production

# 4. Deploy
./deploy.sh
```

**That's it!** The system will be running at:
- Frontend: http://localhost
- Backend API: http://localhost:3001

---

## Detailed Setup

### 1. Environment Configuration

Copy the example file:
```bash
cp .env.production.example .env.production
```

#### Critical Variables (MUST Change)

```bash
# Generate strong JWT secret
JWT_SECRET=$(openssl rand -base64 64)

# Set strong database password
DB_PASSWORD="your-strong-password-here"

# Email configuration
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

#### Optional Instagram OAuth

```bash
INSTAGRAM_CLIENT_ID="your_client_id"
INSTAGRAM_CLIENT_SECRET="your_client_secret"
INSTAGRAM_REDIRECT_URI="https://yourdomain.com/api/oauth/instagram/callback"
```

### 2. SSL/TLS Configuration (Production)

For production, you should use HTTPS. Add a reverse proxy (nginx) in front:

```yaml
# docker-compose.yml addition
  nginx-proxy:
    image: nginxproxy/nginx-proxy
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - /var/run/docker.sock:/tmp/docker.sock:ro
      - ./certs:/etc/nginx/certs
```

### 3. Database Initialization

The database will be automatically initialized on first run. Migrations are located in:
```
database/migrations/
```

To manually run a migration:
```bash
docker-compose exec backend node database/migrations/run-migration.js
```

---

## Security Configuration

### 1. Firewall Rules

```bash
# Allow only necessary ports
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw allow 22/tcp   # SSH (for management)
ufw enable
```

### 2. Database Security

```bash
# Restrict database to internal network only
# In docker-compose.yml, remove the ports section for database:
# ports:
#   - "5432:5432"  # Remove this
```

### 3. Environment Variables

**NEVER commit `.env.production` to git!**

Verify it's ignored:
```bash
git check-ignore .env.production
# Should output: .env.production
```

### 4. Docker Security

Run containers as non-root (already configured in Dockerfiles):
```dockerfile
USER nodejs  # Backend
USER nginx   # Frontend
```

---

## Deployment Options

### Option 1: Local Docker (Development/Testing)

```bash
./deploy.sh
```

### Option 2: Cloud Deployment (AWS EC2)

```bash
# 1. Launch EC2 instance (Ubuntu 22.04 LTS)
# 2. SSH into instance
ssh ubuntu@your-ec2-ip

# 3. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 4. Clone and deploy
git clone https://github.com/your-org/intra-media-system.git
cd intra-media-system
cp .env.production.example .env.production
# Edit .env.production
./deploy.sh
```

### Option 3: DigitalOcean Droplet

```bash
# 1. Create Droplet (Docker image)
# 2. SSH into droplet
ssh root@your-droplet-ip

# 3. Clone and deploy
git clone https://github.com/your-org/intra-media-system.git
cd intra-media-system
cp .env.production.example .env.production
# Edit .env.production
./deploy.sh
```

### Option 4: Docker Swarm (High Availability)

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml intramedia
```

---

## Monitoring & Maintenance

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database
```

### Check Service Health

```bash
# Service status
docker-compose ps

# Health checks
curl http://localhost:3001/health  # Backend
curl http://localhost/health        # Frontend

# Performance metrics
curl http://localhost:3001/metrics
```

### Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df
```

### Database Monitoring

```bash
# Connect to database
docker-compose exec database psql -U postgres -d intra_media_system

# View active connections
SELECT count(*) FROM pg_stat_activity;

# View database size
SELECT pg_size_pretty(pg_database_size('intra_media_system'));
```

---

## Backup & Recovery

### Automated Backups

```bash
# Create backup
./backup.sh

# Backups are saved to: ./backups/intramedia_YYYYMMDD_HHMMSS.sql.gz
```

### Schedule Automatic Backups (Cron)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/intra-media-system && ./backup.sh
```

### Restore from Backup

```bash
# List backups
ls -lh backups/

# Restore specific backup
gunzip -c backups/intramedia_20251028_120000.sql.gz | \
  docker-compose exec -T database psql -U postgres -d intra_media_system
```

### Disaster Recovery

```bash
# 1. Stop all services
./stop.sh

# 2. Restore database from backup
gunzip -c backups/latest_backup.sql.gz | \
  docker-compose exec -T database psql -U postgres -d intra_media_system

# 3. Restart services
./deploy.sh
```

---

## Troubleshooting

### Backend Not Starting

```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Database not ready - wait 30 seconds and restart
docker-compose restart backend

# 2. Environment variables not set
docker-compose config

# 3. Port already in use
lsof -i :3001
kill -9 PID
```

### Database Connection Errors

```bash
# Check database is running
docker-compose ps database

# Check database logs
docker-compose logs database

# Restart database
docker-compose restart database

# Wait for it to be ready
sleep 10
```

### Frontend 404 Errors

```bash
# Check nginx configuration
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf

# Rebuild frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Out of Disk Space

```bash
# Clean Docker system
docker system prune -a --volumes

# Remove old images
docker image prune -a

# Check disk usage
df -h
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Increase Docker resources (Docker Desktop)
# Settings → Resources → Increase CPU/Memory

# Check slow queries (PostgreSQL)
docker-compose exec database psql -U postgres -d intra_media_system -c "
  SELECT query, calls, total_time, mean_time 
  FROM pg_stat_statements 
  ORDER BY mean_time DESC 
  LIMIT 10;
"
```

---

## Scaling

### Horizontal Scaling (Multiple Instances)

```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3

# Add load balancer (nginx)
# See: nginx-loadbalancer.conf.example
```

### Vertical Scaling (More Resources)

```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 2G
```

---

## Updates & Migrations

### Update to New Version

```bash
# 1. Backup database
./backup.sh

# 2. Pull latest code
git pull origin main

# 3. Rebuild and restart
docker-compose build
docker-compose up -d

# 4. Verify health
curl http://localhost:3001/health
```

### Rollback

```bash
# 1. Checkout previous version
git checkout <previous-version-tag>

# 2. Rebuild and restart
docker-compose build
docker-compose up -d
```

---

## Production Checklist

Before going live, ensure:

- [ ] Strong JWT secret generated (`openssl rand -base64 64`)
- [ ] Strong database password set
- [ ] SSL/TLS certificate configured
- [ ] Firewall rules configured
- [ ] Automated backups scheduled
- [ ] Monitoring configured
- [ ] Health checks passing
- [ ] Performance tests passed
- [ ] Security headers validated
- [ ] Rate limiting configured
- [ ] Database indexes created
- [ ] Logs rotating properly
- [ ] `.env.production` not in git
- [ ] Domain DNS configured
- [ ] Email SMTP configured
- [ ] Error tracking configured (Sentry)

---

## Useful Commands

```bash
# Start services
./deploy.sh

# Stop services
./stop.sh

# Backup database
./backup.sh

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart backend

# Rebuild specific service
docker-compose build backend

# Execute command in container
docker-compose exec backend sh

# View running containers
docker-compose ps

# View resource usage
docker stats

# Clean up Docker
docker system prune -a
```

---

## Support & Resources

- **Documentation:** `/docs`
- **API Docs:** `http://localhost:3001/api-docs` (coming soon)
- **Test Report:** `/backend/TEST_REPORT.md`
- **GitHub Issues:** https://github.com/your-org/intra-media-system/issues

---

## License

Proprietary - IntraMedia System © 2025

---

**Deployment Guide Version:** 2.0  
**Last Updated:** October 28, 2025  
**Status:** Production-Ready ✅
