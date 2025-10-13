#!/bin/bash
set -e

echo "🔨 Building Club Management Backend..."
echo "📂 Current directory: $(pwd)"
echo "📋 Files here: $(ls -la)"

# Buscar dónde está el directorio backend
if [ -d "backend" ]; then
    echo "✅ Found backend directory"
    cd backend
elif [ -d "../backend" ]; then
    echo "✅ Found backend directory (one level up)"
    cd ../backend
else
    echo "❌ Cannot find backend directory!"
    echo "📂 Current location: $(pwd)"
    echo "📋 Available directories: $(ls -d */)"
    exit 1
fi

echo "📂 Now in: $(pwd)"

# Dar permisos de ejecución a mvnw
chmod +x mvnw

# Ejecutar Maven build
./mvnw clean package -DskipTests

echo "✅ Build completed successfully!"
echo "📦 JAR files created:"
find target -name "*.jar" -type f
