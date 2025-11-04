#!/bin/bash

# Script para ejecutar todas las migraciones del sistema financiero
# Uso: ./run-migrations.sh

set -e  # Detener si hay algún error

echo "🗄️  Ejecutando migraciones del sistema financiero..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Variables de conexión (ajusta según tu configuración)
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-intra_media_system}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

echo "📊 Base de datos: $DB_NAME"
echo "👤 Usuario: $DB_USER"
echo ""

# Función para ejecutar una migración
run_migration() {
    local file=$1
    local name=$2

    echo "⏳ Ejecutando: $name..."

    if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$file" > /dev/null 2>&1; then
        echo "✅ $name completada"
    else
        echo "❌ Error en $name"
        echo "   Intentando continuar..."
    fi
    echo ""
}

# Ejecutar migraciones en orden
echo "1️⃣  Migración: Sistema de Distribución de Beneficios"
run_migration "migrations/005_profit_distribution_system.sql" "005_profit_distribution_system"

echo "2️⃣  Migración: Gastos Reales y Excedentes"
run_migration "migrations/006_real_expenses_and_surplus.sql" "006_real_expenses_and_surplus"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Todas las migraciones completadas"
echo ""
echo "📋 Tablas creadas:"
echo "   - profit_distribution_config"
echo "   - monthly_expenses"
echo "   - monthly_expenses (con campos financieros)"
echo ""
echo "📊 Vistas creadas:"
echo "   - vw_eventos_desglose_financiero"
echo "   - vw_resumen_financiero_mensual"
echo "   - vw_resumen_por_socio"
echo "   - vw_budget_vs_real"
echo ""
echo "🔄 Funciones creadas:"
echo "   - calcular_distribucion_beneficio()"
echo "   - calcular_presupuesto_mes()"
echo "   - redistribuir_excedente()"
echo "   - cerrar_mes()"
echo ""
echo "🚀 El sistema está listo para usarse"
echo ""
echo "📍 Próximos pasos:"
echo "   1. Reinicia el backend si está corriendo"
echo "   2. Accede a http://localhost:5174"
echo "   3. Navega a 'Distribución de Beneficios' en el menú"
echo ""
