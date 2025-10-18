#!/bin/bash
# Script para deployar a ALPHA (Staging)
# Uso: ./scripts/deploy-to-alpha.sh "mensaje del commit"

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Desplegando a ALPHA (Staging)...${NC}"
echo ""

# Verificar que estamos en develop
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "develop" ]; then
    echo -e "${RED}❌ Error: Debes estar en la rama develop${NC}"
    echo "Ejecuta: git checkout develop"
    exit 1
fi

# Verificar que hay cambios para commitear
if ! git diff-index --quiet HEAD --; then
    # Hay cambios sin commitear
    if [ -z "$1" ]; then
        echo -e "${RED}❌ Error: Debes proporcionar un mensaje de commit${NC}"
        echo "Uso: ./scripts/deploy-to-alpha.sh \"mensaje del commit\""
        exit 1
    fi

    echo -e "${YELLOW}📝 Commiteando cambios...${NC}"
    git add -A
    git commit -m "$1"
else
    echo -e "${GREEN}✓ No hay cambios nuevos para commitear${NC}"
fi

# Push a develop
echo -e "${YELLOW}📤 Pusheando a origin/develop...${NC}"
git push origin develop

echo ""
echo -e "${GREEN}✅ Deploy a ALPHA iniciado!${NC}"
echo ""
echo -e "${YELLOW}📊 Monitoreo:${NC}"
echo "   Dashboard: https://dashboard.render.com"
echo "   Busca: club-management-backend-alpha"
echo ""
echo -e "${YELLOW}🌐 URLs de ALPHA:${NC}"
echo "   Backend:  https://club-management-backend-alpha.onrender.com"
echo "   Frontend: https://club-management-frontend-alpha.onrender.com"
echo ""
echo -e "${YELLOW}⏱️  El deploy tomará ~5-8 minutos${NC}"
echo ""
echo -e "${YELLOW}💡 Siguiente paso:${NC}"
echo "   Cuando Alpha funcione correctamente, ejecuta:"
echo "   ./scripts/promote-to-production.sh"
echo ""
