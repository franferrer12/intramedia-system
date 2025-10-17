#!/bin/bash

# Script de inicio del proyecto Club Management
# Muestra enlaces clicables y arranca los servicios

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          🎵 Club Management System - Inicio                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Verificar que Docker esté corriendo
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker no está corriendo. Por favor, inicia Docker Desktop."
    exit 1
fi

echo "🚀 Iniciando servicios..."
echo ""

# Iniciar servicios en Docker
docker-compose up -d

echo ""
echo "⏳ Esperando que los servicios estén listos..."
sleep 5

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                   ✅ Servicios Iniciados                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📍 Accede a las siguientes URLs:"
echo ""
echo "   🖥️  Frontend (App Principal):"
echo "   👉 http://localhost:5173"
echo "   👉 http://localhost:5173/pos              (Punto de Venta)"
echo "   👉 http://localhost:5173/login            (Login)"
echo ""
echo "   📱 Terminal POS Standalone:"
echo "   👉 http://localhost:5173/pos-terminal/pair       (Vincular Dispositivo)"
echo "   👉 http://localhost:5173/pos-terminal/standalone (Terminal POS)"
echo ""
echo "   🔧 Backend (API):"
echo "   👉 http://localhost:8080/actuator/health         (Health Check)"
echo "   👉 http://localhost:8080/swagger-ui/index.html   (API Docs)"
echo ""
echo "   🗄️  Base de Datos PostgreSQL:"
echo "   📊 Host: localhost:5432"
echo "   👤 User: club_admin"
echo "   🔑 DB: club_management"
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                   🔐 Credenciales por defecto                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "   Usuario: admin"
echo "   Password: admin123"
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                   📝 Comandos útiles                           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "   Ver logs:           docker-compose logs -f"
echo "   Ver logs backend:   docker-compose logs -f backend"
echo "   Detener servicios:  docker-compose down"
echo "   Reiniciar:          docker-compose restart"
echo ""
echo "¡Listo para usar! 🎉"
echo ""
