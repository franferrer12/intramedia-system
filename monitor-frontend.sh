#!/bin/bash

# Script para monitorear el despliegue del frontend en Render
# Uso: ./monitor-frontend.sh

FRONTEND_URL="https://club-management-frontend.onrender.com"
BACKEND_URL="https://club-management-backend-tw9f.onrender.com/actuator/health"
MAX_ATTEMPTS=20
WAIT_TIME=15

echo "🔍 Monitoreando despliegue del frontend en Render..."
echo "URL: $FRONTEND_URL"
echo "Esperando hasta $((MAX_ATTEMPTS * WAIT_TIME / 60)) minutos..."
echo ""

# Verificar backend primero
echo "1️⃣ Verificando que el backend esté activo..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL")
if [ "$BACKEND_STATUS" = "200" ]; then
    echo "✅ Backend está activo (HTTP $BACKEND_STATUS)"
else
    echo "⚠️ Backend retorna HTTP $BACKEND_STATUS"
fi
echo ""

# Monitorear frontend
echo "2️⃣ Monitoreando frontend..."
for i in $(seq 1 $MAX_ATTEMPTS); do
    echo "[$i/$MAX_ATTEMPTS] $(date '+%H:%M:%S') - Verificando..."

    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")

    if [ "$STATUS" = "200" ]; then
        echo ""
        echo "✅ ¡Frontend desplegado exitosamente!"
        echo "🌐 Accede a: $FRONTEND_URL"
        echo ""

        # Verificar que carga el HTML
        CONTENT=$(curl -s "$FRONTEND_URL" | head -5)
        if echo "$CONTENT" | grep -q "<!DOCTYPE html>"; then
            echo "✅ La página HTML se está sirviendo correctamente"
        else
            echo "⚠️ El servidor responde pero el contenido podría no ser correcto"
        fi
        exit 0
    elif [ "$STATUS" = "404" ]; then
        echo "    Estado: 404 - Servicio no disponible (posiblemente en build/deploy)"
    elif [ "$STATUS" = "503" ]; then
        echo "    Estado: 503 - Servicio temporalmente no disponible"
    else
        echo "    Estado: $STATUS"
    fi

    if [ $i -lt $MAX_ATTEMPTS ]; then
        echo "    Esperando ${WAIT_TIME}s..."
        sleep $WAIT_TIME
    fi
done

echo ""
echo "❌ El frontend no respondió después de $((MAX_ATTEMPTS * WAIT_TIME / 60)) minutos"
echo ""
echo "🔧 Pasos para verificar manualmente:"
echo "1. Accede a: https://dashboard.render.com"
echo "2. Busca el servicio 'club-management-frontend'"
echo "3. Verifica el estado y revisa los logs"
echo ""
echo "📋 Posibles problemas:"
echo "- El servicio no existe en Render (necesita crearse manualmente)"
echo "- Error en el build (revisa los logs)"
echo "- Configuración incorrecta de variables de entorno"
echo ""
