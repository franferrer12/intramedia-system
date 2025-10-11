#!/bin/bash

# Script de testing para features nuevas en local
# Sistema POS y Sistema de Ayuda

BASE_URL="http://localhost:8080/api"
FRONTEND_URL="http://localhost:3000"

echo "=================================================="
echo "Testing Club Management - New Features"
echo "=================================================="
echo ""

# 1. Login
echo "1. Testing Authentication..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

if [ $? -eq 0 ]; then
  echo "✅ Login successful"
  TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)
  echo "Token: ${TOKEN:0:50}..."
else
  echo "❌ Login failed"
  exit 1
fi

echo ""
echo "=================================================="
echo "2. Testing Sistema POS Endpoints"
echo "=================================================="
echo ""

# 2.1 Estadísticas de hoy
echo "2.1. GET /api/pos/estadisticas/hoy"
RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$BASE_URL/pos/estadisticas/hoy")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" == "200" ]; then
  echo "✅ Status: $HTTP_CODE"
  echo "$BODY" | python3 -m json.tool 2>/dev/null | head -20
elif [ "$HTTP_CODE" == "403" ]; then
  echo "⚠️  Status: $HTTP_CODE (Forbidden - verificar roles)"
else
  echo "❌ Status: $HTTP_CODE"
  echo "$BODY"
fi

echo ""

# 2.2 Productos top
echo "2.2. GET /api/pos/estadisticas/top-productos"
FECHA_INICIO=$(date -u -v-7d +"%Y-%m-%dT00:00:00" 2>/dev/null || date -u -d '7 days ago' +"%Y-%m-%dT00:00:00")
FECHA_FIN=$(date -u +"%Y-%m-%dT23:59:59")
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/pos/estadisticas/top-productos?fechaInicio=$FECHA_INICIO&fechaFin=$FECHA_FIN&limit=5")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" == "200" ]; then
  echo "✅ Status: $HTTP_CODE"
elif [ "$HTTP_CODE" == "403" ]; then
  echo "⚠️  Status: $HTTP_CODE (Forbidden)"
else
  echo "❌ Status: $HTTP_CODE"
fi

echo ""

# 2.3 Sesiones de caja
echo "2.3. GET /api/pos/sesiones"
RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$BASE_URL/pos/sesiones")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" == "200" ]; then
  echo "✅ Status: $HTTP_CODE"
elif [ "$HTTP_CODE" == "403" ]; then
  echo "⚠️  Status: $HTTP_CODE (Forbidden)"
elif [ "$HTTP_CODE" == "404" ]; then
  echo "⚠️  Status: $HTTP_CODE (Endpoint not found - verificar ruta)"
else
  echo "❌ Status: $HTTP_CODE"
fi

echo ""
echo "=================================================="
echo "3. Testing Sistema de Ayuda Endpoints"
echo "=================================================="
echo ""

# 3.1 Health check
echo "3.1. GET /actuator/health"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/../actuator/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" == "200" ]; then
  echo "✅ Status: $HTTP_CODE"
  echo "$(echo "$RESPONSE" | head -n-1)" | python3 -m json.tool 2>/dev/null
else
  echo "❌ Status: $HTTP_CODE"
fi

echo ""
echo "=================================================="
echo "4. Testing Frontend"
echo "=================================================="
echo ""

# 4.1 Frontend cargando
echo "4.1. Checking frontend availability..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$FRONTEND_URL")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" == "200" ]; then
  echo "✅ Frontend running at $FRONTEND_URL"
  echo "   Open browser: open $FRONTEND_URL"
else
  echo "❌ Frontend not responding (HTTP $HTTP_CODE)"
fi

echo ""
echo "=================================================="
echo "5. Manual Testing Checklist"
echo "=================================================="
echo ""
echo "Por favor, verificar manualmente en el navegador:"
echo ""
echo "✓ Login con admin/admin123"
echo "✓ Dashboard principal carga correctamente"
echo "✓ Módulo POS:"
echo "  - Vista de productos"
echo "  - Crear venta"
echo "  - Gestión de sesiones de caja"
echo "  - Estadísticas en tiempo real"
echo "✓ Sistema de Ayuda:"
echo "  - Onboarding inicial"
echo "  - Tooltips en campos"
echo "  - Guías contextuales"
echo "  - Centro de ayuda"
echo ""
echo "=================================================="
echo "Testing Complete!"
echo "=================================================="
echo ""
echo "Frontend: $FRONTEND_URL"
echo "Backend API: $BASE_URL"
echo "Health: http://localhost:8080/actuator/health"
echo ""
