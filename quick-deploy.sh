#!/bin/bash
# ============================================
# Quick Deploy Script - Interactive
# ============================================

set -e

echo "🚀 CLUB MANAGEMENT - DEPLOYMENT INTERACTIVO"
echo "=========================================="
echo ""

# Ask deployment option
echo "¿Qué opción de deployment prefieres?"
echo ""
echo "  1) Railway.app (Recomendado - Más fácil, gratis)"
echo "  2) Docker en VPS (Requiere servidor propio)"
echo ""
read -p "Elige opción (1 o 2): " DEPLOY_OPTION

case $DEPLOY_OPTION in
  1)
    echo ""
    echo "✅ Opción: Railway.app"
    echo ""

    # Check Railway CLI
    if ! command -v railway &> /dev/null; then
        echo "📦 Instalando Railway CLI..."
        npm install -g @railway/cli
    fi

    # Run Railway deployment
    ./deploy-railway.sh
    ;;

  2)
    echo ""
    echo "✅ Opción: Docker en VPS"
    echo ""

    # Check domain
    echo "¿Cuál es tu dominio? (ej: miclub.com o IP:puerto)"
    read -p "Dominio: " DOMAIN

    # Update .env.prod
    if [ ! -z "$DOMAIN" ]; then
        echo "Actualizando .env.prod con dominio: $DOMAIN"
        sed -i.bak "s|https://CAMBIAR_POR_TU_DOMINIO/api|https://${DOMAIN}/api|g" .env.prod
    fi

    # Run Docker deployment
    ./deploy-docker.sh
    ;;

  *)
    echo "❌ Opción inválida"
    exit 1
    ;;
esac

echo ""
echo "=========================================="
echo "✅ DEPLOYMENT PROCESS COMPLETED"
echo "=========================================="
echo ""
echo "📋 Próximos pasos:"
echo ""
echo "1. Subir a GitHub:"
echo "   git remote add origin https://github.com/TU_USUARIO/club-management.git"
echo "   git push -u origin main"
echo ""
echo "2. Hacer repo público:"
echo "   GitHub → Settings → General → Change visibility → Make public"
echo ""
echo "3. ¡Compartir tu proyecto! 🎉"
echo ""
