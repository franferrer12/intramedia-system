#!/bin/bash
# ============================================
# Script de Deployment a Railway.app
# ============================================
# Autor: Club Management System
# Fecha: 2025-10-09
# Uso: ./deploy-railway.sh
# ============================================

set -e  # Exit on error

echo "🚂 DEPLOYMENT A RAILWAY.APP"
echo "=========================================="
echo ""

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI no está instalado"
    echo ""
    echo "Instala con:"
    echo "  npm install -g @railway/cli"
    echo ""
    exit 1
fi

echo "✓ Railway CLI detectado"
echo ""

# Check if logged in
echo "🔐 Verificando autenticación..."
if ! railway whoami &> /dev/null; then
    echo "❌ No estás autenticado en Railway"
    echo ""
    echo "Ejecuta primero:"
    echo "  railway login"
    echo ""
    exit 1
fi

echo "✅ Autenticado correctamente"
echo ""

# Check if project exists
echo "📋 Verificando proyecto..."
if ! railway status &> /dev/null; then
    echo "⚠️  No hay proyecto de Railway configurado"
    echo ""
    echo "Opciones:"
    echo "  1. Crear nuevo proyecto: railway init"
    echo "  2. Vincular proyecto existente: railway link"
    echo ""
    read -p "¿Quieres crear un nuevo proyecto ahora? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        railway init
    else
        echo "Abortando deployment. Configura primero con 'railway init' o 'railway link'"
        exit 1
    fi
fi

echo "✅ Proyecto configurado"
echo ""

# Check for PostgreSQL service
echo "🗄️  Verificando base de datos..."
if ! railway status | grep -q "postgres"; then
    echo "⚠️  No se detectó servicio PostgreSQL"
    echo ""
    read -p "¿Quieres agregar PostgreSQL ahora? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        railway add
    fi
fi

echo ""
echo "📝 Configurando variables de entorno..."
echo ""

# Read JWT secret from .env.prod
if [ -f ".env.prod" ]; then
    JWT_SECRET=$(grep "JWT_SECRET=" .env.prod | cut -d'=' -f2)
    echo "  - JWT_SECRET (desde .env.prod)"
else
    echo "⚠️  No se encontró .env.prod"
    JWT_SECRET="GENERAR_CON_OPENSSL_RAND_BASE64_64"
fi

# Configure environment variables
echo ""
echo "Configurando variables..."
railway variables set SPRING_PROFILES_ACTIVE="prod"
railway variables set JWT_SECRET="$JWT_SECRET"
railway variables set JWT_EXPIRATION="86400000"

echo ""
read -p "Ingresa tu dominio/URL de Railway (ej: https://tu-app.up.railway.app): " RAILWAY_URL

railway variables set VITE_API_URL="${RAILWAY_URL}/api"
railway variables set CORS_ALLOWED_ORIGINS="$RAILWAY_URL"

echo ""
echo "✅ Variables configuradas"
echo ""

# Verify security checks
echo "🔒 Ejecutando checks de seguridad..."
if [ -f "./security-check.sh" ]; then
    ./security-check.sh
    echo ""
fi

# Deploy
echo "=========================================="
echo "🚀 Iniciando deployment..."
echo "=========================================="
echo ""

railway up

echo ""
echo "=========================================="
echo "✅ DEPLOYMENT COMPLETADO"
echo "=========================================="
echo ""
echo "📋 Próximos pasos:"
echo ""
echo "1. Ver logs:"
echo "   railway logs"
echo ""
echo "2. Abrir en navegador:"
echo "   railway open"
echo ""
echo "3. Ver estado:"
echo "   railway status"
echo ""
echo "4. Verificar health:"
echo "   curl ${RAILWAY_URL}/actuator/health"
echo ""
echo "5. Probar login:"
echo "   URL: ${RAILWAY_URL}"
echo "   Usuario: admin"
echo "   Password: ClubManagement2025!Secure#ProdPass"
echo "   (o el que configuraste en V010)"
echo ""
echo "⚠️  IMPORTANTE: Cambia el password admin después del primer login!"
echo ""
