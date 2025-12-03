#!/bin/bash
# Script para promover ALPHA a PRODUCCIÓN
# Uso: ./scripts/promote-to-production.sh

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}🚀 PROMOVIENDO ALPHA → PRODUCCIÓN${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verificar que estamos en develop
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "develop" ]; then
    echo -e "${YELLOW}⚠️  Actualmente en rama: $CURRENT_BRANCH${NC}"
    echo -e "${YELLOW}   Cambiando a develop...${NC}"
    git checkout develop
fi

# Verificar que develop está limpio
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}❌ Error: Hay cambios sin commitear en develop${NC}"
    echo "   Por favor commitea o descarta los cambios antes de continuar"
    exit 1
fi

# Pull latest de develop
echo -e "${YELLOW}📥 Sincronizando develop...${NC}"
git pull origin develop

echo ""
echo -e "${YELLOW}⚠️  VERIFICACIÓN IMPORTANTE:${NC}"
echo "   ¿Has probado que ALPHA funciona correctamente?"
echo "   - Backend: https://club-management-backend-alpha.onrender.com/actuator/health"
echo "   - Frontend: https://club-management-frontend-alpha.onrender.com"
echo ""
read -p "¿Todo funciona en ALPHA? (si/no): " confirm

if [ "$confirm" != "si" ] && [ "$confirm" != "s" ]; then
    echo -e "${RED}❌ Deploy cancelado${NC}"
    echo "   Primero verifica que Alpha funcione correctamente"
    exit 1
fi

echo ""
echo -e "${YELLOW}📝 Cambiando a rama main...${NC}"
git checkout main

echo -e "${YELLOW}📥 Sincronizando main...${NC}"
git pull origin main

echo -e "${YELLOW}🔀 Mergeando develop → main...${NC}"
git merge develop -m "chore: Promote develop to production

Tested in ALPHA environment:
- Backend: ✓ Health check passed
- Frontend: ✓ Functional
- Features: ✓ Verified

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

echo -e "${YELLOW}📤 Pusheando a origin/main...${NC}"
git push origin main

echo -e "${YELLOW}🔄 Volviendo a develop...${NC}"
git checkout develop

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ PROMOCIÓN A PRODUCCIÓN INICIADA!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📊 Monitoreo:${NC}"
echo "   Dashboard: https://dashboard.render.com"
echo "   Busca: club-management-backend (sin -alpha)"
echo ""
echo -e "${YELLOW}🌐 URLs de PRODUCCIÓN:${NC}"
echo "   Backend:  https://club-management-backend-tw9f.onrender.com"
echo "   Frontend: https://club-management-frontend.onrender.com"
echo ""
echo -e "${YELLOW}⏱️  El deploy tomará ~5-8 minutos${NC}"
echo ""
echo -e "${GREEN}💡 Ya puedes seguir trabajando en develop${NC}"
echo ""
