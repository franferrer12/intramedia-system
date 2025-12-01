#!/bin/bash

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# IntraMedia System - Health Check Script
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
MAX_ATTEMPTS=30
SLEEP_INTERVAL=2
API_URL=${API_URL:-http://localhost:3001}

echo -e "${YELLOW}Checking system health...${NC}"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Check Database Container
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -n "Database container: "
if docker ps | grep -q intramedia-db; then
    if docker ps | grep intramedia-db | grep -q "healthy"; then
        echo -e "${GREEN}✓ Healthy${NC}"
    else
        echo -e "${YELLOW}⚠ Running but not healthy yet${NC}"
    fi
else
    echo -e "${RED}✗ Not running${NC}"
    exit 1
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Check Redis Container (optional)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -n "Redis container: "
if docker ps | grep -q intramedia-redis; then
    if docker ps | grep intramedia-redis | grep -q "healthy"; then
        echo -e "${GREEN}✓ Healthy${NC}"
    else
        echo -e "${YELLOW}⚠ Running but not healthy yet${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Not running (optional)${NC}"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Check Backend Container
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -n "Backend container: "
if docker ps | grep -q intramedia-backend; then
    if docker ps | grep intramedia-backend | grep -q "healthy"; then
        echo -e "${GREEN}✓ Healthy${NC}"
    else
        echo -e "${YELLOW}⚠ Running but not healthy yet${NC}"
    fi
else
    echo -e "${RED}✗ Not running${NC}"
    exit 1
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Check Frontend Container
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -n "Frontend container: "
if docker ps | grep -q intramedia-frontend; then
    if docker ps | grep intramedia-frontend | grep -q "healthy"; then
        echo -e "${GREEN}✓ Healthy${NC}"
    else
        echo -e "${YELLOW}⚠ Running but not healthy yet${NC}"
    fi
else
    echo -e "${RED}✗ Not running${NC}"
    exit 1
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Check API Health Endpoint
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -n "API health endpoint: "

for ((i=1; i<=MAX_ATTEMPTS; i++)); do
    if curl -s -f "$API_URL/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Responding${NC}"

        # Get health data
        HEALTH_DATA=$(curl -s "$API_URL/health")
        DB_STATUS=$(echo "$HEALTH_DATA" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)

        if [ "$DB_STATUS" == "connected" ]; then
            echo -e "Database connection: ${GREEN}✓ Connected${NC}"
        else
            echo -e "Database connection: ${RED}✗ Not connected${NC}"
            exit 1
        fi

        break
    else
        if [ $i -eq $MAX_ATTEMPTS ]; then
            echo -e "${RED}✗ Not responding after $MAX_ATTEMPTS attempts${NC}"
            exit 1
        fi
        sleep $SLEEP_INTERVAL
    fi
done

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Check API Root Endpoint
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -n "API root endpoint: "
if curl -s -f "$API_URL/" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Responding${NC}"

    # Get version
    VERSION=$(curl -s "$API_URL/" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
    if [ ! -z "$VERSION" ]; then
        echo -e "API Version: ${GREEN}$VERSION${NC}"
    fi
else
    echo -e "${RED}✗ Not responding${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ All health checks passed!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
