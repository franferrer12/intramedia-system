#!/bin/bash

echo "🔄 Monitoreando despliegue de Railway..."
echo ""

TOKEN="eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTc2MDEzNTAyMCwiZXhwIjoxNzYwMjIxNDIwfQ.9HhRnCjE9GiJaLHMX0B7KI0KPjYvmvbO0H73CMNSToDDkxxq2eRdICy-WFOXAUWkeSReDj7aW-UAOEJbYG5YfQ"

while true; do
    RESPONSE=$(curl -s "https://club-manegament-production.up.railway.app/api/pos/estadisticas/hoy" \
        -H "Authorization: Bearer $TOKEN" \
        -w "\nHTTP_STATUS:%{http_code}")

    STATUS=$(echo "$RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)

    echo "[$(date +%H:%M:%S)] Status: $STATUS"

    if [ "$STATUS" = "200" ]; then
        echo ""
        echo "🎉 ¡DESPLIEGUE COMPLETADO!"
        echo ""
        echo "Respuesta del endpoint:"
        echo "$RESPONSE" | grep -v "HTTP_STATUS"
        echo ""
        echo "✅ Dashboard POS disponible en: http://localhost:3000/pos-dashboard"
        break
    fi

    sleep 30
done
