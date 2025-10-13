#!/bin/bash
set -e

echo "🚀 Starting Club Management Backend..."
echo "📂 Current directory: $(pwd)"

# Buscar el JAR file en diferentes ubicaciones posibles
JAR_FILE=""

if [ -f "backend/target/"*.jar ]; then
    JAR_FILE=$(find backend/target -name "*.jar" -type f | grep -v "original" | head -n 1)
elif [ -f "target/"*.jar ]; then
    JAR_FILE=$(find target -name "*.jar" -type f | grep -v "original" | head -n 1)
elif [ -f "../backend/target/"*.jar ]; then
    JAR_FILE=$(find ../backend/target -name "*.jar" -type f | grep -v "original" | head -n 1)
else
    # Búsqueda recursiva como último recurso
    JAR_FILE=$(find . -name "*.jar" -type f | grep -v "original" | grep target | head -n 1)
fi

if [ -z "$JAR_FILE" ]; then
    echo "❌ Error: No JAR file found!"
    echo "📂 Searching in: $(pwd)"
    echo "🔍 Available files:"
    find . -name "*.jar" -type f 2>/dev/null || echo "No JAR files found"
    exit 1
fi

echo "📦 Found JAR: $JAR_FILE"
echo "🌐 Server will start on port: ${PORT:-8080}"

# Iniciar la aplicación
java -Dserver.port=${PORT:-8080} \
     -Xmx512m \
     -Xms256m \
     -jar "$JAR_FILE"
