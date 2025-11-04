#!/bin/bash

# ============================================
# IntraMedia System - Production Deployment
# ============================================

set -e  # Exit on error

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 IntraMedia System - Production Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ ERROR: .env.production file not found"
    echo "   Please copy .env.production.example to .env.production and configure it"
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

echo "📋 Pre-deployment checks..."
echo "   ✓ Environment file loaded"

# Check required environment variables
REQUIRED_VARS=("DB_PASSWORD" "JWT_SECRET" "SMTP_USER" "SMTP_PASS")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ ERROR: Required environment variable $var is not set"
        exit 1
    fi
done
echo "   ✓ Required environment variables set"

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ ERROR: Docker is not running"
    exit 1
fi
echo "   ✓ Docker is running"

# Check docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ ERROR: docker-compose is not installed"
    exit 1
fi
echo "   ✓ docker-compose is installed"

echo ""
echo "🏗️  Building Docker images..."
docker-compose build --no-cache

echo ""
echo "🗄️  Database migration..."
# Wait for database to be ready before running migrations
docker-compose up -d database
echo "   Waiting for database to be ready..."
sleep 10

echo ""
echo "🚀 Starting all services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 15

# Check health endpoints
echo ""
echo "🏥 Health checks..."

# Check backend
if curl -f http://localhost:${PORT:-3001}/health > /dev/null 2>&1; then
    echo "   ✅ Backend API is healthy"
else
    echo "   ❌ Backend API is not responding"
    echo "   Check logs with: docker-compose logs backend"
    exit 1
fi

# Check frontend
if curl -f http://localhost:${FRONTEND_PORT:-80}/health > /dev/null 2>&1; then
    echo "   ✅ Frontend is healthy"
else
    echo "   ❌ Frontend is not responding"
    echo "   Check logs with: docker-compose logs frontend"
    exit 1
fi

# Check database
if docker-compose exec -T database pg_isready -U ${DB_USER:-postgres} > /dev/null 2>&1; then
    echo "   ✅ Database is healthy"
else
    echo "   ❌ Database is not responding"
    echo "   Check logs with: docker-compose logs database"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment Successful!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Services:"
echo "   Backend API:  http://localhost:${PORT:-3001}"
echo "   Frontend:     http://localhost:${FRONTEND_PORT:-80}"
echo "   Database:     localhost:${DB_PORT:-5432}"
echo ""
echo "📊 Useful commands:"
echo "   View logs:        docker-compose logs -f"
echo "   Stop services:    docker-compose down"
echo "   Restart services: docker-compose restart"
echo "   View status:      docker-compose ps"
echo ""
