#!/bin/bash

# ============================================
# IntraMedia System - Stop Services
# ============================================

echo "🛑 Stopping IntraMedia System services..."

docker-compose down

echo "✅ All services stopped"
echo ""
echo "Data is preserved in Docker volumes."
echo "To completely remove all data, run: docker-compose down -v"
