# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# IntraMedia System - Makefile
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

.PHONY: help install dev test deploy clean backup health logs

# Default target
.DEFAULT_GOAL := help

# Colors
YELLOW := \033[1;33m
GREEN := \033[0;32m
NC := \033[0m

## help: Show this help message
help:
	@echo ""
	@echo "$(YELLOW)IntraMedia System - Available Commands$(NC)"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed -e 's/## //' | awk 'BEGIN {FS = ":"}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

## install: Install dependencies for backend and frontend
install:
	@echo "$(YELLOW)Installing backend dependencies...$(NC)"
	@cd backend && npm install
	@echo "$(GREEN)✓ Backend dependencies installed$(NC)"
	@echo ""
	@echo "$(YELLOW)Installing frontend dependencies...$(NC)"
	@cd frontend && npm install
	@echo "$(GREEN)✓ Frontend dependencies installed$(NC)"
	@echo ""
	@echo "$(YELLOW)Installing root dependencies...$(NC)"
	@npm install
	@echo "$(GREEN)✓ All dependencies installed$(NC)"

## dev: Start development servers (backend + frontend)
dev:
	@echo "$(YELLOW)Starting development servers...$(NC)"
	@trap 'kill 0' EXIT; \
	(cd backend && npm run dev) & \
	(cd frontend && npm run dev) & \
	wait

## test: Run all tests (backend unit + integration + E2E)
test:
	@echo "$(YELLOW)Running backend tests...$(NC)"
	@cd backend && npm test
	@echo ""
	@echo "$(YELLOW)Running E2E tests...$(NC)"
	@npx playwright test
	@echo ""
	@echo "$(GREEN)✓ All tests completed$(NC)"

## test-unit: Run unit tests only
test-unit:
	@cd backend && npm run test:unit

## test-e2e: Run E2E tests with Playwright
test-e2e:
	@npx playwright test

## test-load: Run load tests with Artillery (smoke test)
test-load:
	@echo "$(YELLOW)Running smoke test...$(NC)"
	@npx artillery run load-tests/config.smoke.yml

## test-load-full: Run full load test with Artillery
test-load-full:
	@echo "$(YELLOW)Running full load test...$(NC)"
	@npx artillery run load-tests/config.load.yml

## coverage: Generate test coverage report
coverage:
	@cd backend && npm run test:coverage

## build: Build Docker images
build:
	@echo "$(YELLOW)Building Docker images...$(NC)"
	@docker-compose build
	@echo "$(GREEN)✓ Build completed$(NC)"

## up: Start Docker containers
up:
	@echo "$(YELLOW)Starting containers...$(NC)"
	@docker-compose up -d
	@echo "$(GREEN)✓ Containers started$(NC)"
	@make health

## up-prod: Start Docker containers with production profile
up-prod:
	@echo "$(YELLOW)Starting containers (production)...$(NC)"
	@docker-compose --profile production up -d
	@echo "$(GREEN)✓ Containers started$(NC)"
	@make health

## down: Stop Docker containers
down:
	@echo "$(YELLOW)Stopping containers...$(NC)"
	@docker-compose down
	@echo "$(GREEN)✓ Containers stopped$(NC}"

## restart: Restart Docker containers
restart:
	@make down
	@make up

## deploy: Deploy to production
deploy:
	@./scripts/deploy.sh production

## deploy-dev: Deploy to development
deploy-dev:
	@./scripts/deploy.sh dev

## backup: Create database backup
backup:
	@./scripts/backup.sh

## health: Check system health
health:
	@./scripts/health-check.sh

## logs: Show logs from all containers
logs:
	@docker-compose logs -f

## logs-backend: Show backend logs
logs-backend:
	@docker-compose logs -f backend

## logs-frontend: Show frontend logs
logs-frontend:
	@docker-compose logs -f frontend

## logs-db: Show database logs
logs-db:
	@docker-compose logs -f database

## ps: Show running containers
ps:
	@docker-compose ps

## clean: Remove containers, volumes, and build artifacts
clean:
	@echo "$(YELLOW)Cleaning up...$(NC)"
	@docker-compose down -v
	@rm -rf backend/node_modules frontend/node_modules
	@rm -rf backend/coverage e2e-report
	@echo "$(GREEN)✓ Cleanup completed$(NC)"

## clean-logs: Remove log files
clean-logs:
	@echo "$(YELLOW)Removing log files...$(NC)"
	@rm -rf backend/logs/*
	@echo "$(GREEN)✓ Logs cleaned$(NC)"

## lint: Run linter on frontend
lint:
	@cd frontend && npm run lint

## format: Format code (if configured)
format:
	@echo "$(YELLOW)Formatting code...$(NC)"
	@cd backend && npx prettier --write "src/**/*.js"
	@cd frontend && npm run format || true
	@echo "$(GREEN)✓ Code formatted$(NC)"

## shell-backend: Open shell in backend container
shell-backend:
	@docker exec -it intramedia-backend sh

## shell-db: Open PostgreSQL shell
shell-db:
	@docker exec -it intramedia-db psql -U postgres -d intra_media_system

## migrations: Run database migrations
migrations:
	@echo "$(YELLOW)Running migrations...$(NC)"
	@cd backend && npm run db:migrate
	@echo "$(GREEN)✓ Migrations completed$(NC)"
