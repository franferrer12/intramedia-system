#!/bin/bash
set -e

echo "🔨 Building Club Management Backend..."

# Navegar al directorio backend
cd backend

# Dar permisos de ejecución a mvnw
chmod +x mvnw

# Ejecutar Maven build
./mvnw clean package -DskipTests

echo "✅ Build completed successfully!"
