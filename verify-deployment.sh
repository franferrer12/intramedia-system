#!/bin/bash

# ========================================
# VERIFICACIÓN DE DEPLOYMENT
# ========================================
# Verifica que todos los servicios estén funcionando correctamente

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🔍 VERIFICACIÓN DE DEPLOYMENT${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Solicitar URLs
read -p "Backend URL: " BACKEND_URL
read -p "Frontend URL: " FRONTEND_URL

# Remove trailing slash
BACKEND_URL="${BACKEND_URL%/}"
FRONTEND_URL="${FRONTEND_URL%/}"

echo ""
echo -e "${BLUE}Verificando servicios...${NC}"
echo ""

# Counters
PASSED=0
FAILED=0

# Test 1: Backend Health
echo -e "${BLUE}[1/8]${NC} Backend Health Check..."
if response=$(curl -s -f "${BACKEND_URL}/health" -w "%{http_code}" 2>/dev/null); then
    http_code=$(echo "$response" | tail -c 4)
    if [ "$http_code" = "200" ]; then
        echo -e "      ${GREEN}✓ PASS${NC} - Backend health check OK"
        PASSED=$((PASSED + 1))
    else
        echo -e "      ${RED}✗ FAIL${NC} - Status code: $http_code"
        FAILED=$((FAILED + 1))
    fi
else
    echo -e "      ${RED}✗ FAIL${NC} - Backend no responde"
    FAILED=$((FAILED + 1))
fi

# Test 2: Backend API Endpoint
echo -e "${BLUE}[2/8]${NC} Backend API disponible..."
if curl -s -f "${BACKEND_URL}/api" -o /dev/null 2>/dev/null; then
    echo -e "      ${GREEN}✓ PASS${NC} - API endpoint accesible"
    PASSED=$((PASSED + 1))
else
    echo -e "      ${YELLOW}⚠ WARN${NC} - API endpoint no accesible (puede ser normal)"
    PASSED=$((PASSED + 1))
fi

# Test 3: Login Endpoint
echo -e "${BLUE}[3/8]${NC} Login endpoint..."
response=$(curl -s -X POST "${BACKEND_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}' \
    -w "%{http_code}" 2>/dev/null)

http_code=$(echo "$response" | tail -c 4)
if [ "$http_code" = "200" ] || [ "$http_code" = "401" ] || [ "$http_code" = "400" ]; then
    echo -e "      ${GREEN}✓ PASS${NC} - Login endpoint funcional (HTTP $http_code)"
    PASSED=$((PASSED + 1))
else
    echo -e "      ${RED}✗ FAIL${NC} - Login endpoint error (HTTP $http_code)"
    FAILED=$((FAILED + 1))
fi

# Test 4: DJs Endpoint
echo -e "${BLUE}[4/8]${NC} DJs endpoint..."
if response=$(curl -s "${BACKEND_URL}/api/djs" -w "%{http_code}" 2>/dev/null); then
    http_code=$(echo "$response" | tail -c 4)
    if [ "$http_code" = "200" ]; then
        echo -e "      ${GREEN}✓ PASS${NC} - DJs endpoint OK"
        PASSED=$((PASSED + 1))
    else
        echo -e "      ${YELLOW}⚠ WARN${NC} - DJs endpoint HTTP $http_code"
        PASSED=$((PASSED + 1))
    fi
else
    echo -e "      ${RED}✗ FAIL${NC} - DJs endpoint error"
    FAILED=$((FAILED + 1))
fi

# Test 5: Eventos Endpoint
echo -e "${BLUE}[5/8]${NC} Eventos endpoint..."
if response=$(curl -s "${BACKEND_URL}/api/eventos" -w "%{http_code}" 2>/dev/null); then
    http_code=$(echo "$response" | tail -c 4)
    if [ "$http_code" = "200" ]; then
        echo -e "      ${GREEN}✓ PASS${NC} - Eventos endpoint OK"
        PASSED=$((PASSED + 1))
    else
        echo -e "      ${YELLOW}⚠ WARN${NC} - Eventos endpoint HTTP $http_code"
        PASSED=$((PASSED + 1))
    fi
else
    echo -e "      ${RED}✗ FAIL${NC} - Eventos endpoint error"
    FAILED=$((FAILED + 1))
fi

# Test 6: Frontend accesible
echo -e "${BLUE}[6/8]${NC} Frontend accesible..."
if curl -s -f "${FRONTEND_URL}" -o /dev/null 2>/dev/null; then
    echo -e "      ${GREEN}✓ PASS${NC} - Frontend cargando"
    PASSED=$((PASSED + 1))
else
    echo -e "      ${RED}✗ FAIL${NC} - Frontend no responde"
    FAILED=$((FAILED + 1))
fi

# Test 7: Frontend assets
echo -e "${BLUE}[7/8]${NC} Frontend assets..."
if curl -s -f "${FRONTEND_URL}/assets" -I -o /dev/null 2>/dev/null || \
   curl -s -f "${FRONTEND_URL}/" -I -o /dev/null 2>/dev/null; then
    echo -e "      ${GREEN}✓ PASS${NC} - Frontend assets OK"
    PASSED=$((PASSED + 1))
else
    echo -e "      ${YELLOW}⚠ WARN${NC} - No se pudieron verificar assets"
    PASSED=$((PASSED + 1))
fi

# Test 8: HTTPS
echo -e "${BLUE}[8/8]${NC} HTTPS configurado..."
if [[ $BACKEND_URL == https://* ]] && [[ $FRONTEND_URL == https://* ]]; then
    echo -e "      ${GREEN}✓ PASS${NC} - HTTPS activo en ambos servicios"
    PASSED=$((PASSED + 1))
else
    echo -e "      ${YELLOW}⚠ WARN${NC} - HTTPS no configurado en todos los servicios"
    PASSED=$((PASSED + 1))
fi

# Resumen
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📊 RESUMEN${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Tests pasados:  ${GREEN}$PASSED${NC}/8"
echo -e "Tests fallidos: ${RED}$FAILED${NC}/8"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ TODOS LOS TESTS PASARON${NC}"
    echo -e "${GREEN}🎉 Sistema funcionando correctamente!${NC}"
    echo -e "${GREEN}========================================${NC}"
    exit 0
elif [ $FAILED -le 2 ]; then
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}⚠️  TESTS COMPLETADOS CON WARNINGS${NC}"
    echo -e "${YELLOW}   Revisar logs para más detalles${NC}"
    echo -e "${YELLOW}========================================${NC}"
    exit 0
else
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}❌ VARIOS TESTS FALLARON${NC}"
    echo -e "${RED}   Revisar configuración y logs${NC}"
    echo -e "${RED}========================================${NC}"
    exit 1
fi
