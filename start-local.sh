#!/bin/bash
#
# Script para levantar el sistema completo en LOCAL
# Incluye: PostgreSQL + Backend + Frontend
#

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "=========================================="
echo "🚀 Iniciando Club Management System LOCAL"
echo "=========================================="
echo ""

# Función para matar procesos al salir
cleanup() {
    echo -e "\n${YELLOW}🛑 Deteniendo servicios...${NC}"

    # Matar backend si está corriendo
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo "  ✓ Backend detenido"
    fi

    # Matar frontend si está corriendo
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo "  ✓ Frontend detenido"
    fi

    # Detener Docker Compose
    docker-compose down 2>/dev/null || true
    echo "  ✓ PostgreSQL detenido"

    echo -e "${GREEN}✅ Sistema detenido${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Paso 1: Verificar Docker
echo -e "${BLUE}📦 Paso 1: Verificando Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker no está instalado${NC}"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker no está corriendo. Por favor, inicia Docker Desktop${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker listo${NC}"
echo ""

# Paso 2: Levantar PostgreSQL
echo -e "${BLUE}🐘 Paso 2: Iniciando PostgreSQL...${NC}"

# Detener cualquier contenedor previo
docker-compose down 2>/dev/null || true

# Iniciar solo PostgreSQL
docker-compose up -d postgres

# Esperar a que PostgreSQL esté listo
echo -n "  Esperando PostgreSQL"
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U club_admin -d club_management &>/dev/null; then
        echo ""
        echo -e "${GREEN}✅ PostgreSQL listo${NC}"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

# Verificar conexión
if ! docker-compose exec -T postgres pg_isready -U club_admin -d club_management &>/dev/null; then
    echo -e "${RED}❌ PostgreSQL no respondió a tiempo${NC}"
    exit 1
fi

# Paso 3: Verificar migración V019
echo -e "${BLUE}🗄️  Paso 3: Verificando migración V019...${NC}"

HAS_V019=$(docker-compose exec -T postgres psql -U club_admin -d club_management -tAc \
    "SELECT COUNT(*) FROM flyway_schema_history WHERE version = '019';" 2>/dev/null || echo "0")

if [ "$HAS_V019" = "0" ]; then
    echo -e "${YELLOW}⚠️  Migración V019 no aplicada (se aplicará al iniciar backend)${NC}"
else
    echo -e "${GREEN}✅ Migración V019 ya aplicada${NC}"
fi
echo ""

# Paso 4: Levantar Backend
echo -e "${BLUE}☕ Paso 4: Iniciando Backend Spring Boot...${NC}"

cd backend

# Verificar si existe mvnw
if [ ! -f "mvnw" ]; then
    if command -v mvn &> /dev/null; then
        echo "  Usando Maven global..."
        MAVEN_CMD="mvn"
    else
        echo -e "${RED}❌ No se encuentra Maven (mvn o mvnw)${NC}"
        exit 1
    fi
else
    MAVEN_CMD="./mvnw"
fi

# Configurar variables de entorno para local
export SPRING_PROFILES_ACTIVE=dev
export DB_URL=jdbc:postgresql://localhost:5432/club_management
export DB_USER=club_admin
export DB_PASSWORD=club_admin_password
export JWT_SECRET=mi-secreto-super-seguro-para-desarrollo-local-con-256-bits-minimo

# Limpiar y compilar
echo "  Compilando backend..."
$MAVEN_CMD clean package -DskipTests > /tmp/backend-build.log 2>&1 &
BUILD_PID=$!

# Mostrar progreso
echo -n "  "
while kill -0 $BUILD_PID 2>/dev/null; do
    echo -n "."
    sleep 2
done
wait $BUILD_PID
BUILD_STATUS=$?

if [ $BUILD_STATUS -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ Error al compilar backend${NC}"
    echo "Ver logs: tail -f /tmp/backend-build.log"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Backend compilado${NC}"

# Iniciar backend en background
echo "  Iniciando Spring Boot..."
$MAVEN_CMD spring-boot:run > /tmp/backend-run.log 2>&1 &
BACKEND_PID=$!

# Esperar a que backend esté listo
echo -n "  Esperando backend"
for i in {1..60}; do
    if curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
        echo ""
        echo -e "${GREEN}✅ Backend listo en http://localhost:8080${NC}"
        break
    fi
    echo -n "."
    sleep 2
done
echo ""

cd ..

# Verificar que backend esté arriba
if ! curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend no respondió a tiempo${NC}"
    echo "Ver logs: tail -f /tmp/backend-run.log"
    cleanup
fi

# Paso 5: Verificar migración V019 después de backend
echo -e "${BLUE}🔍 Paso 5: Verificando aplicación de V019...${NC}"
sleep 3

HAS_V019=$(docker-compose exec -T postgres psql -U club_admin -d club_management -tAc \
    "SELECT COUNT(*) FROM flyway_schema_history WHERE version = '019';" 2>/dev/null || echo "0")

if [ "$HAS_V019" = "1" ]; then
    echo -e "${GREEN}✅ Migración V019 aplicada correctamente${NC}"

    # Verificar tablas POS
    TABLES=$(docker-compose exec -T postgres psql -U club_admin -d club_management -tAc \
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('sesiones_caja', 'ventas', 'detalle_venta') ORDER BY table_name;" | tr '\n' ' ')
    echo "  Tablas POS creadas: $TABLES"
else
    echo -e "${YELLOW}⚠️  Migración V019 aún no aplicada${NC}"
fi
echo ""

# Paso 6: Levantar Frontend
echo -e "${BLUE}⚛️  Paso 6: Iniciando Frontend React...${NC}"

cd frontend

# Verificar node_modules
if [ ! -d "node_modules" ]; then
    echo "  Instalando dependencias..."
    npm install > /tmp/frontend-install.log 2>&1
fi

# Iniciar frontend en background
echo "  Iniciando Vite dev server..."
npm run dev > /tmp/frontend-run.log 2>&1 &
FRONTEND_PID=$!

# Esperar a que frontend esté listo
echo -n "  Esperando frontend"
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo ""
        echo -e "${GREEN}✅ Frontend listo en http://localhost:5173${NC}"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

cd ..

# Verificar que frontend esté arriba
if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Frontend no respondió (puede tardar un poco más)${NC}"
    echo "Ver logs: tail -f /tmp/frontend-run.log"
fi

# Paso 7: Ejecutar tests
echo ""
echo -e "${BLUE}🧪 Paso 7: Ejecutando tests automáticos...${NC}"
sleep 2

# Cambiar URL del script de test a local
export API_URL="http://localhost:8080/api"

if [ -f "scripts/test-pos-api.sh" ]; then
    bash scripts/test-pos-api.sh
else
    echo -e "${YELLOW}⚠️  Script de test no encontrado${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Sistema LOCAL iniciado correctamente${NC}"
echo "=========================================="
echo ""
echo "📍 URLs disponibles:"
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:8080"
echo "   API Docs:  http://localhost:8080/swagger-ui/index.html"
echo "   PostgreSQL: localhost:5432"
echo ""
echo "🔑 Credenciales:"
echo "   Usuario: admin"
echo "   Password: admin123"
echo ""
echo "📊 Dashboard POS:"
echo "   http://localhost:5173/pos-dashboard"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f /tmp/backend-run.log"
echo "   Frontend: tail -f /tmp/frontend-run.log"
echo ""
echo -e "${YELLOW}Presiona Ctrl+C para detener todos los servicios${NC}"
echo ""

# Mantener el script corriendo
while true; do
    sleep 1
done
