#!/bin/bash
# ============================================
# 🚀 DEPLOYMENT EN 1 COMANDO
# ============================================
# Este script hace TODO automáticamente
# Solo necesitas responder 2 preguntas
# ============================================

set -e

clear
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║        🚀 CLUB MANAGEMENT - DEPLOYMENT AUTOMÁTICO         ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Este script hará TODO el deployment automáticamente."
echo "Solo necesitas responder 2 preguntas simples."
echo ""
echo "Presiona ENTER para continuar..."
read

clear
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  PREGUNTA 1 DE 2                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "¿Dónde quieres deployar?"
echo ""
echo "  [1] Railway.app (RECOMENDADO)"
echo "      ✅ Gratis para empezar"
echo "      ✅ Dominio incluido (*.up.railway.app)"
echo "      ✅ Setup en 5 minutos"
echo "      ✅ PostgreSQL incluido"
echo ""
echo "  [2] Mi propio servidor (VPS/Docker)"
echo "      • Requiere VPS configurado"
echo "      • Requiere Docker instalado"
echo "      • Más control técnico"
echo ""
read -p "Elige opción (1 o 2): " DEPLOY_CHOICE
echo ""

if [ "$DEPLOY_CHOICE" = "1" ]; then
    echo "✅ Perfecto! Usaremos Railway.app"
    echo ""

    # Check Railway CLI
    echo "📦 Verificando Railway CLI..."
    if ! command -v railway &> /dev/null; then
        echo "Instalando Railway CLI..."
        npm install -g @railway/cli
        echo "✅ Railway CLI instalado"
    else
        echo "✅ Railway CLI ya está instalado"
    fi
    echo ""

    clear
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                  PREGUNTA 2 DE 2                           ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "🔐 Necesito que inicies sesión en Railway"
    echo ""
    echo "Se abrirá tu navegador para autenticarte."
    echo "Si no tienes cuenta, puedes crear una (es gratis)."
    echo ""
    echo "Presiona ENTER para abrir el navegador..."
    read

    railway login

    echo ""
    echo "✅ Autenticado correctamente"
    echo ""
    echo "=========================================="
    echo "🚀 INICIANDO DEPLOYMENT..."
    echo "=========================================="
    echo ""

    # Initialize Railway project
    echo "📋 Configurando proyecto Railway..."
    if ! railway status &> /dev/null 2>&1; then
        railway init
    fi

    # Add PostgreSQL
    echo ""
    echo "🗄️  Configurando PostgreSQL..."
    railway add --database postgres || echo "PostgreSQL ya existe"

    # Deploy
    echo ""
    echo "=========================================="
    echo "🚀 DESPLEGANDO APLICACIÓN..."
    echo "=========================================="
    echo ""

    railway up

    # Get URL
    echo ""
    RAILWAY_URL=$(railway status 2>/dev/null | grep -i "url" | awk '{print $2}' | head -1)

    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║              ✅ DEPLOYMENT COMPLETADO                      ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "🎉 Tu aplicación está LIVE en:"
    echo "   $RAILWAY_URL"
    echo ""
    echo "📋 Credenciales de acceso:"
    echo "   Usuario: admin"
    echo "   Password: ClubManagement2025!Secure#ProdPass"
    echo ""
    echo "⚠️  IMPORTANTE: Cambia el password en el primer login"
    echo ""
    echo "=========================================="
    echo "📋 COMANDOS ÚTILES"
    echo "=========================================="
    echo ""
    echo "Ver logs:        railway logs"
    echo "Abrir dashboard: railway open"
    echo "Ver estado:      railway status"
    echo ""

elif [ "$DEPLOY_CHOICE" = "2" ]; then
    clear
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                  PREGUNTA 2 DE 2                           ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "🌐 ¿Cuál es tu dominio o IP?"
    echo ""
    echo "Ejemplos:"
    echo "  - tuclub.com"
    echo "  - 192.168.1.100"
    echo "  - miservidor.com"
    echo ""
    read -p "Dominio o IP: " DOMAIN

    if [ -z "$DOMAIN" ]; then
        echo "❌ Necesitas especificar un dominio"
        exit 1
    fi

    echo ""
    echo "✅ Configurando para: $DOMAIN"
    echo ""

    # Update .env.prod
    echo "📝 Actualizando configuración..."
    sed -i.bak "s|https://CAMBIAR_POR_TU_DOMINIO/api|http://${DOMAIN}:8080/api|g" .env.prod

    echo ""
    echo "=========================================="
    echo "🚀 INICIANDO DEPLOYMENT CON DOCKER..."
    echo "=========================================="
    echo ""

    # Run Docker deployment script
    ./deploy-docker.sh

    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║              ✅ DEPLOYMENT COMPLETADO                      ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "🎉 Tu aplicación está corriendo en:"
    echo "   http://${DOMAIN}:80"
    echo ""
    echo "Backend API: http://${DOMAIN}:8080"
    echo ""
    echo "📋 Credenciales de acceso:"
    echo "   Usuario: admin"
    echo "   Password: ClubManagement2025!Secure#ProdPass"
    echo ""
    echo "⚠️  IMPORTANTE: Cambia el password en el primer login"
    echo ""

else
    echo "❌ Opción inválida"
    exit 1
fi

# GitHub instructions
echo ""
echo "=========================================="
echo "📦 SUBIR A GITHUB"
echo "=========================================="
echo ""
echo "Tu código ya está en Git local con 3 commits."
echo ""
echo "Para subirlo a GitHub:"
echo ""
echo "1. Ve a https://github.com/new"
echo "2. Crea un repo llamado: club-management"
echo "3. Ejecuta estos comandos:"
echo ""
echo "   git remote add origin https://github.com/TU_USUARIO/club-management.git"
echo "   git push -u origin main"
echo ""
echo "4. Hacer público:"
echo "   GitHub → Settings → General → Change visibility → Make public"
echo ""
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║                 🎉 ¡TODO LISTO!                           ║"
echo "║                                                            ║"
echo "║     Tu aplicación está corriendo en producción            ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
