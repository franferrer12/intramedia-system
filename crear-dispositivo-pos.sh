#!/bin/bash

# Script para crear un dispositivo POS de prueba
# Uso: ./crear-dispositivo-pos.sh

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          📱 Crear Dispositivo POS de Prueba                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# 1. Login para obtener token
echo "🔐 Obteniendo token de autenticación..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Error: No se pudo obtener el token de autenticación"
  echo "Respuesta: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Token obtenido"
echo ""

# 2. Crear dispositivo POS
echo "📱 Creando dispositivo POS..."
DEVICE_RESPONSE=$(curl -s -X POST http://localhost:8080/api/dispositivos-pos/registrar \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Terminal Test",
    "tipo": "MOVIL",
    "ubicacion": "Barra Principal",
    "pin": "1234",
    "modoTabletCompartida": false,
    "asignacionPermanente": false,
    "tieneLectorBarras": false,
    "tieneCajonDinero": false,
    "tienePantallaCliente": false
  }')

# Extraer datos del dispositivo
DEVICE_ID=$(echo $DEVICE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
DEVICE_UUID=$(echo $DEVICE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['uuid'])" 2>/dev/null)

if [ -z "$DEVICE_ID" ]; then
  echo "❌ Error: No se pudo crear el dispositivo"
  echo "Respuesta: $DEVICE_RESPONSE"
  exit 1
fi

echo "✅ Dispositivo creado exitosamente"
echo ""

# 3. Generar token de pairing
echo "🔗 Generando token de vinculación..."
PAIRING_RESPONSE=$(curl -s -X GET "http://localhost:8080/api/auth/device/${DEVICE_ID}/qr" \
  -H "Authorization: Bearer $TOKEN")

PAIRING_TOKEN=$(echo $PAIRING_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)
PAIRING_CODE=$(echo $PAIRING_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['pairingCode'])" 2>/dev/null)
DIRECT_LINK=$(echo $PAIRING_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['directLink'])" 2>/dev/null)

if [ -z "$PAIRING_TOKEN" ]; then
  echo "❌ Error: No se pudo generar el token de pairing"
  echo "Respuesta: $PAIRING_RESPONSE"
  # Aún así mostrar los datos del dispositivo
  echo ""
  echo "╔════════════════════════════════════════════════════════════════╗"
  echo "║               📱 Datos del Dispositivo                         ║"
  echo "╚════════════════════════════════════════════════════════════════╝"
  echo ""
  echo "  ID:           $DEVICE_ID"
  echo "  Nombre:       Terminal Test"
  echo "  UUID:         $DEVICE_UUID"
  echo "  PIN:          1234"
  echo ""
  echo "  ⚠️  No se pudo generar token automático"
  echo "  Puedes usar UUID y PIN para login manual:"
  echo "  👉 http://localhost:5173/pos-terminal/standalone"
  exit 0
fi

echo "✅ Token de vinculación generado"
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║               📱 Datos del Dispositivo                         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "  ID:           $DEVICE_ID"
echo "  Nombre:       Terminal Test"
echo "  UUID:         $DEVICE_UUID"
echo "  PIN:          1234"
echo "  Código:       $PAIRING_CODE"
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║               🔗 Enlaces de Vinculación                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "  📱 Vinculación Automática (RECOMENDADO):"
echo "  👉 ${DIRECT_LINK/production-url.com/localhost:5173}"
echo ""
echo "  📱 Vinculación Manual:"
echo "  👉 http://localhost:5173/pos-terminal/pair"
echo "     Código: $PAIRING_CODE"
echo ""
echo "  📱 Login Directo (UUID + PIN):"
echo "  👉 http://localhost:5173/pos-terminal/standalone"
echo "     UUID: $DEVICE_UUID"
echo "     PIN: 1234"
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║               📝 Instrucciones                                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "  OPCIÓN 1 - Vinculación Automática:"
echo "  1. Copia y abre el enlace de vinculación automática"
echo "  2. Se vinculará automáticamente"
echo ""
echo "  OPCIÓN 2 - Vinculación Manual:"
echo "  1. Abre http://localhost:5173/pos-terminal/pair"
echo "  2. Ingresa el código: $PAIRING_CODE"
echo "  3. Pulsa 'Vincular Terminal'"
echo ""
echo "  OPCIÓN 3 - Login Directo:"
echo "  1. Abre http://localhost:5173/pos-terminal/standalone"
echo "  2. UUID: $DEVICE_UUID"
echo "  3. PIN: 1234"
echo ""
