#!/bin/bash

echo "=== TEST: Login y Export Excel ==="
echo ""

# 1. Login
echo "1. Probando login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

echo "Login response: $LOGIN_RESPONSE"
echo ""

# Extraer token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
  echo "ERROR: No se pudo obtener el token"
  exit 1
fi

echo "Token obtenido: ${TOKEN:0:50}..."
echo ""

# 2. Probar export sin token
echo "2. Probando export SIN token (debe fallar con 403)..."
curl -s -w "\nStatus: %{http_code}\n" \
  "http://localhost:8080/api/reportes/inventario/excel" \
  -o /dev/null
echo ""

# 3. Probar export CON token
echo "3. Probando export CON token (debe funcionar)..."
HTTP_CODE=$(curl -s -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/reportes/inventario/excel" \
  -o /tmp/test_inventario.xlsx)

echo "Status: $HTTP_CODE"

if [ "$HTTP_CODE" == "200" ]; then
  FILE_SIZE=$(stat -f%z /tmp/test_inventario.xlsx 2>/dev/null || stat -c%s /tmp/test_inventario.xlsx 2>/dev/null)
  echo "SUCCESS! Archivo descargado: $FILE_SIZE bytes"
  echo "Archivo guardado en: /tmp/test_inventario.xlsx"
else
  echo "FAILED! Status code: $HTTP_CODE"
  cat /tmp/test_inventario.xlsx
fi

echo ""
echo "=== FIN DEL TEST ==="
