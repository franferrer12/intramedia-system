#!/bin/bash
set -e

echo "🚀 Starting Club Management Backend..."

# Encontrar el JAR file
JAR_FILE=$(find backend/target -name "*.jar" -type f | grep -v "original" | head -n 1)

if [ -z "$JAR_FILE" ]; then
    echo "❌ Error: No JAR file found in backend/target/"
    exit 1
fi

echo "📦 Found JAR: $JAR_FILE"

# Iniciar la aplicación
java -Dserver.port=${PORT:-8080} -jar "$JAR_FILE"
