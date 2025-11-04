#!/bin/bash

# Script de prueba completo para todos los endpoints
# Uso: ./test-endpoints.sh

BASE_URL="http://localhost:3001"
RESULTS_FILE="test-results.log"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para probar endpoints
test_endpoint() {
    local name="$1"
    local url="$2"
    local method="${3:-GET}"
    local data="$4"

    echo -n "Testing $name... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$url")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$BASE_URL$url")
    elif [ "$method" = "PUT" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PUT -H "Content-Type: application/json" -d "$data" "$BASE_URL$url")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL$url")
    elif [ "$method" = "PATCH" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE_URL$url")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $http_code)"
        echo "[$name] PASS - HTTP $http_code" >> "$RESULTS_FILE"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $http_code)"
        echo "[$name] FAIL - HTTP $http_code" >> "$RESULTS_FILE"
        echo "Response: $body" | head -c 200 >> "$RESULTS_FILE"
        echo "" >> "$RESULTS_FILE"
        return 1
    fi
}

echo "🧪 INICIANDO PRUEBAS DE ENDPOINTS"
echo "==================================="
echo ""
echo "Guardando resultados en: $RESULTS_FILE"
echo "" > "$RESULTS_FILE"

PASSED=0
FAILED=0

echo ""
echo "📊 1. EXECUTIVE DASHBOARD"
echo "-------------------------"
test_endpoint "Metrics" "/api/executive-dashboard/metrics" && ((PASSED++)) || ((FAILED++))
test_endpoint "Health Score" "/api/executive-dashboard/health-score" && ((PASSED++)) || ((FAILED++))

echo ""
echo "📈 2. ANÁLISIS COMPARATIVO"
echo "-------------------------"
test_endpoint "Period Comparison" "/api/comparative-analysis/period-comparison?metric=revenue&period=month" && ((PASSED++)) || ((FAILED++))
test_endpoint "Seasonal Analysis" "/api/comparative-analysis/seasonal" && ((PASSED++)) || ((FAILED++))
test_endpoint "Forecast" "/api/comparative-analysis/forecast?metric=revenue&periods=6" && ((PASSED++)) || ((FAILED++))
test_endpoint "Top Performers" "/api/comparative-analysis/top-performers?entity=client&limit=10" && ((PASSED++)) || ((FAILED++))
test_endpoint "Client Analysis" "/api/comparative-analysis/client/272" && ((PASSED++)) || ((FAILED++))
test_endpoint "DJ Analysis" "/api/comparative-analysis/dj/62" && ((PASSED++)) || ((FAILED++))

echo ""
echo "💰 3. GESTIÓN FINANCIERA CLIENTES"
echo "---------------------------------"
test_endpoint "Clientes Financial" "/api/clientes-financial" && ((PASSED++)) || ((FAILED++))
test_endpoint "Cliente Financial por ID" "/api/clientes-financial/272" && ((PASSED++)) || ((FAILED++))
test_endpoint "Cobros Pendientes" "/api/clientes-financial/cobros-pendientes" && ((PASSED++)) || ((FAILED++))

echo ""
echo "🎧 4. GESTIÓN FINANCIERA DJS"
echo "----------------------------"
test_endpoint "DJs Financial" "/api/djs-financial" && ((PASSED++)) || ((FAILED++))
test_endpoint "DJ Financial por ID" "/api/djs-financial/62" && ((PASSED++)) || ((FAILED++))
test_endpoint "Pagos Pendientes" "/api/djs-financial/pagos-pendientes" && ((PASSED++)) || ((FAILED++))

echo ""
echo "🚨 5. ALERTAS FINANCIERAS"
echo "-------------------------"
test_endpoint "Todas las Alertas" "/api/financial-alerts" && ((PASSED++)) || ((FAILED++))
test_endpoint "Alertas No Leídas" "/api/financial-alerts/unread" && ((PASSED++)) || ((FAILED++))

echo ""
echo "🎉 6. CRUD EVENTOS"
echo "------------------"
test_endpoint "GET Eventos" "/api/eventos" && ((PASSED++)) || ((FAILED++))
test_endpoint "GET Evento por ID" "/api/eventos/1" && ((PASSED++)) || ((FAILED++))

echo ""
echo "👥 7. CRUD CLIENTES"
echo "-------------------"
test_endpoint "GET Clientes" "/api/clientes" && ((PASSED++)) || ((FAILED++))
test_endpoint "GET Cliente por ID" "/api/clientes/272" && ((PASSED++)) || ((FAILED++))

echo ""
echo "🎵 8. CRUD DJS"
echo "--------------"
test_endpoint "GET DJs" "/api/djs" && ((PASSED++)) || ((FAILED++))
test_endpoint "GET DJ por ID" "/api/djs/62" && ((PASSED++)) || ((FAILED++))

echo ""
echo "=================================="
echo "📊 RESUMEN DE PRUEBAS"
echo "=================================="
echo -e "${GREEN}✅ Pasadas: $PASSED${NC}"
echo -e "${RED}❌ Fallidas: $FAILED${NC}"
TOTAL=$((PASSED + FAILED))
echo "📝 Total: $TOTAL"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ¡TODAS LAS PRUEBAS PASARON!${NC}"
    exit 0
else
    echo -e "\n${YELLOW}⚠️  Algunas pruebas fallaron. Revisa $RESULTS_FILE para más detalles.${NC}"
    exit 1
fi
