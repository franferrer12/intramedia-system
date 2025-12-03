#!/bin/bash
#
# Script de Testing POS - API Endpoints
# Ejecuta tests básicos contra la API de POS
#

set -e

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuración
API_URL="${API_URL:-https://club-manegament-production.up.railway.app/api}"
TOKEN=""
SESION_ID=""

echo "=================================="
echo "🧪 Testing POS System API"
echo "=================================="
echo ""

# Función para hacer login y obtener token
login() {
    echo "🔐 Step 1: Login..."
    RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "username": "admin",
            "password": "admin123"
        }')

    TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

    if [ -z "$TOKEN" ]; then
        echo -e "${RED}❌ Login failed${NC}"
        echo "Response: $RESPONSE"
        exit 1
    fi

    echo -e "${GREEN}✅ Login successful${NC}"
    echo "Token: ${TOKEN:0:20}..."
    echo ""
}

# Test 1: Abrir sesión de caja
test_apertura_caja() {
    echo "📦 Test 2: Apertura de Caja..."

    RESPONSE=$(curl -s -X POST "$API_URL/pos/sesiones-caja/abrir" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -w "\nHTTP_STATUS:%{http_code}" \
        -d '{
            "nombreCaja": "Test Automated",
            "empleadoAperturaId": 1,
            "montoInicial": 100.00,
            "observaciones": "Test automático de apertura"
        }')

    HTTP_STATUS=$(echo "$RESPONSE" | grep -o 'HTTP_STATUS:[0-9]*' | cut -d: -f2)
    BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS:[0-9]*//')

    if [ "$HTTP_STATUS" = "201" ] || [ "$HTTP_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ Apertura exitosa (HTTP $HTTP_STATUS)${NC}"
        SESION_ID=$(echo $BODY | grep -o '"id":[0-9]*' | cut -d: -f2 | head -1)
        echo "Sesión ID: $SESION_ID"
        echo "Response: $BODY" | head -c 200
        echo "..."
    else
        echo -e "${RED}❌ Apertura falló (HTTP $HTTP_STATUS)${NC}"
        echo "Response: $BODY"
        return 1
    fi
    echo ""
}

# Test 2: Obtener sesiones abiertas
test_sesiones_abiertas() {
    echo "📋 Test 3: Listar Sesiones Abiertas..."

    RESPONSE=$(curl -s -X GET "$API_URL/pos/sesiones-caja/abiertas" \
        -H "Authorization: Bearer $TOKEN" \
        -w "\nHTTP_STATUS:%{http_code}")

    HTTP_STATUS=$(echo "$RESPONSE" | grep -o 'HTTP_STATUS:[0-9]*' | cut -d: -f2)
    BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS:[0-9]*//')

    if [ "$HTTP_STATUS" = "200" ]; then
        COUNT=$(echo $BODY | grep -o '"id"' | wc -l)
        echo -e "${GREEN}✅ Sesiones obtenidas (HTTP $HTTP_STATUS)${NC}"
        echo "Sesiones abiertas: $COUNT"
    else
        echo -e "${RED}❌ Fallo al obtener sesiones (HTTP $HTTP_STATUS)${NC}"
        echo "Response: $BODY"
    fi
    echo ""
}

# Test 3: Obtener estadísticas de hoy
test_estadisticas_hoy() {
    echo "📊 Test 4: Estadísticas de Hoy..."

    RESPONSE=$(curl -s -X GET "$API_URL/pos/estadisticas/hoy" \
        -H "Authorization: Bearer $TOKEN" \
        -w "\nHTTP_STATUS:%{http_code}")

    HTTP_STATUS=$(echo "$RESPONSE" | grep -o 'HTTP_STATUS:[0-9]*' | cut -d: -f2)
    BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS:[0-9]*//')

    if [ "$HTTP_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ Estadísticas obtenidas (HTTP $HTTP_STATUS)${NC}"

        # Extraer valores clave
        TOTAL_VENTAS=$(echo $BODY | grep -o '"totalVentas":[0-9]*' | cut -d: -f2)
        TOTAL_INGRESOS=$(echo $BODY | grep -o '"totalIngresos":[0-9.]*' | cut -d: -f2)
        SESIONES_ABIERTAS=$(echo $BODY | grep -o '"sesionesAbiertas":[0-9]*' | cut -d: -f2)

        echo "  - Total Ventas: $TOTAL_VENTAS"
        echo "  - Total Ingresos: €$TOTAL_INGRESOS"
        echo "  - Sesiones Abiertas: $SESIONES_ABIERTAS"
    else
        echo -e "${RED}❌ Fallo al obtener estadísticas (HTTP $HTTP_STATUS)${NC}"
        echo "Response: $BODY"
    fi
    echo ""
}

# Test 4: Crear venta (requiere productos en DB)
test_crear_venta() {
    echo "🛒 Test 5: Crear Venta..."

    if [ -z "$SESION_ID" ]; then
        echo -e "${YELLOW}⚠️  Saltando - No hay sesión abierta${NC}"
        echo ""
        return 0
    fi

    RESPONSE=$(curl -s -X POST "$API_URL/pos/ventas" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -w "\nHTTP_STATUS:%{http_code}" \
        -d '{
            "sesionCajaId": '$SESION_ID',
            "empleadoId": 1,
            "metodoPago": "EFECTIVO",
            "montoEfectivo": 25.00,
            "detalles": [
                {
                    "productoId": 1,
                    "cantidad": 2,
                    "descuento": 0.00
                }
            ]
        }')

    HTTP_STATUS=$(echo "$RESPONSE" | grep -o 'HTTP_STATUS:[0-9]*' | cut -d: -f2)
    BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS:[0-9]*//')

    if [ "$HTTP_STATUS" = "201" ] || [ "$HTTP_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ Venta creada (HTTP $HTTP_STATUS)${NC}"
        NUMERO_TICKET=$(echo $BODY | grep -o '"numeroTicket":"[^"]*"' | cut -d'"' -f4)
        echo "Número de Ticket: $NUMERO_TICKET"
    else
        echo -e "${YELLOW}⚠️  Venta no creada (HTTP $HTTP_STATUS)${NC}"
        echo "Puede ser que no existan productos con ID 1"
        echo "Response: $BODY" | head -c 200
    fi
    echo ""
}

# Test 5: Cerrar sesión
test_cierre_caja() {
    echo "🔒 Test 6: Cierre de Caja..."

    if [ -z "$SESION_ID" ]; then
        echo -e "${YELLOW}⚠️  Saltando - No hay sesión para cerrar${NC}"
        echo ""
        return 0
    fi

    RESPONSE=$(curl -s -X POST "$API_URL/pos/sesiones-caja/$SESION_ID/cerrar" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -w "\nHTTP_STATUS:%{http_code}" \
        -d '{
            "empleadoCierreId": 1,
            "montoReal": 125.00,
            "observaciones": "Test de cierre automático"
        }')

    HTTP_STATUS=$(echo "$RESPONSE" | grep -o 'HTTP_STATUS:[0-9]*' | cut -d: -f2)
    BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS:[0-9]*//')

    if [ "$HTTP_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ Cierre exitoso (HTTP $HTTP_STATUS)${NC}"
        DIFERENCIA=$(echo $BODY | grep -o '"diferencia":[0-9.-]*' | cut -d: -f2)
        echo "Diferencia: €$DIFERENCIA"
    else
        echo -e "${RED}❌ Fallo al cerrar (HTTP $HTTP_STATUS)${NC}"
        echo "Response: $BODY"
    fi
    echo ""
}

# Ejecutar tests
main() {
    login
    test_apertura_caja
    test_sesiones_abiertas
    test_estadisticas_hoy
    test_crear_venta
    test_cierre_caja

    echo "=================================="
    echo "✅ Testing completado"
    echo "=================================="
}

main
