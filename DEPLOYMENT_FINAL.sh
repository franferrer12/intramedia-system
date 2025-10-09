#!/bin/bash
# ============================================
# 🚀 DEPLOYMENT FINAL - 1 COMANDO
# ============================================
# Usuario: franferrer12
# Opción: Railway.app
# Todo configurado y listo
# ============================================

set -e

clear
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║      🚀 CLUB MANAGEMENT - DEPLOYMENT A RAILWAY          ║"
echo "║                                                           ║"
echo "║      Usuario GitHub: franferrer12                         ║"
echo "║      Opción: Railway.app (gratis)                         ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Este script hará TODO el deployment automáticamente."
echo ""
echo "⏱️  Tiempo estimado: 10 minutos"
echo ""
echo "Presiona ENTER para comenzar..."
read

# Step 1: Install Railway CLI
echo ""
echo "=========================================="
echo "📦 PASO 1/5: Instalando Railway CLI"
echo "=========================================="
echo ""

if ! command -v railway &> /dev/null; then
    echo "Instalando Railway CLI (requiere password de administrador)..."
    sudo npm install -g @railway/cli
    echo "✅ Railway CLI instalado"
else
    echo "✅ Railway CLI ya está instalado"
fi

# Step 2: Login to Railway
echo ""
echo "=========================================="
echo "🔐 PASO 2/5: Autenticación en Railway"
echo "=========================================="
echo ""
echo "Se abrirá tu navegador para que inicies sesión."
echo "Si no tienes cuenta, puedes crear una (es gratis)."
echo ""
echo "Presiona ENTER para abrir el navegador..."
read

railway login

if [ $? -ne 0 ]; then
    echo "❌ Error en la autenticación"
    exit 1
fi

echo "✅ Autenticado correctamente"

# Step 3: Initialize Railway project
echo ""
echo "=========================================="
echo "📋 PASO 3/5: Creando proyecto en Railway"
echo "=========================================="
echo ""

if ! railway status &> /dev/null 2>&1; then
    echo "Creando nuevo proyecto..."
    railway init --name "club-management"
    echo "✅ Proyecto creado"
else
    echo "✅ Proyecto ya existe"
fi

# Step 4: Add PostgreSQL
echo ""
echo "=========================================="
echo "🗄️  PASO 4/5: Configurando PostgreSQL"
echo "=========================================="
echo ""

echo "Agregando servicio PostgreSQL..."
railway add --database postgres 2>/dev/null || echo "✅ PostgreSQL ya configurado"

# Configure environment variables
echo ""
echo "📝 Configurando variables de entorno..."

JWT_SECRET="bNqm8OtlzLZrG9tTVIVPekbGVEluHoRzQRyX1/ljSxgmTGwSW2SpsfQ7JIfOYzQe8B56MBtMsp0rSun0yPMZtQ=="

railway variables set SPRING_PROFILES_ACTIVE="prod"
railway variables set JWT_SECRET="$JWT_SECRET"
railway variables set JWT_EXPIRATION="86400000"

echo "✅ Variables configuradas"

# Step 5: Deploy
echo ""
echo "=========================================="
echo "🚀 PASO 5/5: DESPLEGANDO APLICACIÓN"
echo "=========================================="
echo ""
echo "Esto puede tardar 5-10 minutos..."
echo "(Puedes ver el progreso en el dashboard de Railway)"
echo ""

railway up

# Get the URL
echo ""
echo "📝 Obteniendo URL de la aplicación..."
sleep 5

RAILWAY_URL=$(railway status 2>/dev/null | grep -i "url\|domain" | head -1 | awk '{print $NF}')

if [ -z "$RAILWAY_URL" ]; then
    echo "⚠️  No se pudo obtener la URL automáticamente"
    echo "Ejecuta: railway open"
    echo "O visita: https://railway.app/dashboard"
    RAILWAY_URL="<ver en railway dashboard>"
fi

# Success!
clear
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║            ✅  DEPLOYMENT COMPLETADO                     ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "🎉 Tu aplicación está LIVE en:"
echo "   $RAILWAY_URL"
echo ""
echo "📋 Credenciales de acceso:"
echo "   Usuario: admin"
echo "   Password: ClubManagement2025!Secure#ProdPass"
echo ""
echo "⚠️  IMPORTANTE: Cambia el password en el primer login!"
echo ""
echo "=========================================="
echo "📋 COMANDOS ÚTILES"
echo "=========================================="
echo ""
echo "Ver dashboard:   railway open"
echo "Ver logs:        railway logs"
echo "Ver estado:      railway status"
echo ""
echo "=========================================="
echo "📦 SIGUIENTE PASO: SUBIR A GITHUB"
echo "=========================================="
echo ""
echo "Tu código ya está en Git local."
echo ""
echo "Para subirlo a GitHub:"
echo ""
echo "1. Ve a: https://github.com/new"
echo "   Nombre del repo: club-management"
echo "   Visibilidad: Public"
echo "   Click: Create repository"
echo ""
echo "2. Ejecuta estos comandos:"
echo ""
echo "   git remote add origin https://github.com/franferrer12/club-management.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. ¡Listo! Tu proyecto estará público en:"
echo "   https://github.com/franferrer12/club-management"
echo ""
echo "=========================================="
echo ""
echo "🎉 ¡FELICITACIONES!"
echo ""
echo "Tu aplicación está corriendo en producción y lista"
echo "para ser compartida con el mundo."
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                    ¡TODO LISTO! 🎊                       ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
