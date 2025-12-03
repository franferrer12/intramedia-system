#!/bin/bash
# ============================================
# Script de Deployment con Docker Compose
# ============================================
# Autor: Club Management System
# Fecha: 2025-10-09
# Uso: ./deploy-docker.sh
# ============================================

set -e  # Exit on error

echo "🐳 DEPLOYMENT CON DOCKER COMPOSE"
echo "=========================================="
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado"
    echo "Instala desde: https://www.docker.com/get-started"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado"
    exit 1
fi

echo "✅ Docker y Docker Compose detectados"
echo ""

# Check .env.prod exists
if [ ! -f ".env.prod" ]; then
    echo "❌ ERROR: .env.prod no encontrado"
    echo ""
    echo "Crea .env.prod desde .env.prod.example:"
    echo "  cp .env.prod.example .env.prod"
    echo "  nano .env.prod  # Editar con tus valores"
    echo ""
    exit 1
fi

echo "✅ Archivo .env.prod encontrado"
echo ""

# Check VITE_API_URL is configured
if grep -q "CAMBIAR_POR_TU_DOMINIO" .env.prod; then
    echo "⚠️  WARNING: VITE_API_URL no está configurado"
    echo ""
    read -p "Ingresa tu dominio (ej: https://tuclub.com): " DOMAIN

    # Update .env.prod
    sed -i.bak "s|https://CAMBIAR_POR_TU_DOMINIO/api|${DOMAIN}/api|g" .env.prod
    echo "✅ VITE_API_URL actualizado a: ${DOMAIN}/api"
    echo ""
fi

# Security checks
echo "🔒 Ejecutando checks de seguridad..."
if [ -f "./security-check.sh" ]; then
    ./security-check.sh
    echo ""
fi

# Show current configuration
echo "📋 Configuración actual:"
echo ""
grep -E "JWT_SECRET=|VITE_API_URL=|POSTGRES_PASSWORD=|SPRING_PROFILES_ACTIVE=" .env.prod | \
    sed 's/JWT_SECRET=.*/JWT_SECRET=***hidden***/' | \
    sed 's/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=***hidden***/'
echo ""

read -p "¿Continuar con deployment? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelado"
    exit 1
fi

# Stop existing containers
echo ""
echo "🛑 Deteniendo contenedores existentes..."
docker-compose -f docker-compose.prod.yml down

# Build images
echo ""
echo "🏗️  Construyendo imágenes Docker..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Start services
echo ""
echo "🚀 Iniciando servicios..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Wait for services to start
echo ""
echo "⏳ Esperando a que los servicios inicien..."
sleep 10

# Check services status
echo ""
echo "📊 Estado de los servicios:"
docker-compose -f docker-compose.prod.yml ps

# Wait for database migrations
echo ""
echo "⏳ Esperando migraciones de base de datos..."
sleep 15

# Check health
echo ""
echo "🏥 Verificando health check..."
MAX_RETRIES=30
RETRY=0

while [ $RETRY -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
        echo "✅ Backend está UP!"
        break
    fi
    RETRY=$((RETRY+1))
    echo "Intento $RETRY/$MAX_RETRIES..."
    sleep 2
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    echo "❌ Backend no respondió después de $MAX_RETRIES intentos"
    echo ""
    echo "Ver logs con:"
    echo "  docker-compose -f docker-compose.prod.yml logs backend"
    exit 1
fi

# Verify migrations
echo ""
echo "📝 Verificando migraciones..."
docker exec club_postgres_prod psql -U club_admin -d club_management -c "SELECT version, description FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;" 2>/dev/null || echo "⚠️  No se pudo verificar migraciones (normal en primer despliegue)"

echo ""
echo "=========================================="
echo "✅ DEPLOYMENT COMPLETADO"
echo "=========================================="
echo ""
echo "📋 Información de acceso:"
echo ""
echo "Frontend:  http://localhost:80"
echo "Backend:   http://localhost:8080"
echo "Health:    http://localhost:8080/actuator/health"
echo ""
echo "Credenciales iniciales:"
echo "  Usuario: admin"
echo "  Password: ClubManagement2025!Secure#ProdPass"
echo "  (o el que configuraste en V010)"
echo ""
echo "=========================================="
echo "📋 Comandos útiles:"
echo "=========================================="
echo ""
echo "Ver logs:"
echo "  docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "Ver logs del backend:"
echo "  docker-compose -f docker-compose.prod.yml logs -f backend"
echo ""
echo "Ver estado:"
echo "  docker-compose -f docker-compose.prod.yml ps"
echo ""
echo "Detener servicios:"
echo "  docker-compose -f docker-compose.prod.yml down"
echo ""
echo "Backup de base de datos:"
echo "  docker exec club_postgres_prod pg_dump -U club_admin club_management > backup_\$(date +%Y%m%d_%H%M%S).sql"
echo ""
echo "⚠️  IMPORTANTE:"
echo "  1. Cambia el password admin en el primer login"
echo "  2. Configura backups automáticos"
echo "  3. Configura HTTPS/SSL (Let's Encrypt o Cloudflare)"
echo ""
