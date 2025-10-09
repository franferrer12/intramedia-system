# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Club Management System** - A comprehensive nightclub management system built as a 100% autonomous solution without external integrations. The system handles events, finances, staff, inventory, analytics, and reporting.

## Tech Stack

### Backend
- **Spring Boot 3.2** with Java 17
- **PostgreSQL 15** database
- **Spring Security + JWT** for authentication
- **Flyway** for database migrations
- **JasperReports** for PDF generation
- **Apache POI** for Excel exports
- **MapStruct** for DTO mapping
- **Lombok** for boilerplate reduction

### Frontend
- **React 18 + TypeScript**
- **Vite** as build tool
- **TanStack Query** for server state management
- **Zustand** for client state management
- **TailwindCSS + Shadcn/ui** for styling
- **Recharts** for data visualization
- **React Router** for navigation
- **React Hook Form + Zod** for form validation

### DevOps
- **Docker + Docker Compose** for containerization
- **Maven** for backend builds
- **npm** for frontend builds

## Development Commands

### Backend (from `/backend`)

```bash
# Build the project
./mvnw clean install

# Run the backend
./mvnw spring-boot:run

# Run tests
./mvnw test

# Run tests with coverage
./mvnw verify

# Package for production
./mvnw clean package
```

### Frontend (from `/frontend`)

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui

# Lint code
npm run lint
```

### Docker

```bash
# Start all services (PostgreSQL + Backend + Frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Start only PostgreSQL for local development
docker-compose up -d postgres

# Connect to PostgreSQL container
docker exec -it club_postgres psql -U club_admin -d club_management

# Production build
docker-compose -f docker-compose.prod.yml up -d
```

### Database

```bash
# Connect to PostgreSQL (local)
psql -U club_admin -d club_management -h localhost

# Common queries
\dt                                                    # List tables
SELECT * FROM flyway_schema_history;                  # Check migrations
SELECT id, username, email, rol FROM usuarios;        # View users
```

## Architecture

### Backend Architecture

The backend follows a layered architecture:

```
controller → service → repository → entity
     ↓          ↓
   dto ←─── mapper
```

**Key packages:**
- `entity/` - JPA entities with database mappings
- `repository/` - Spring Data JPA repositories with custom queries
- `service/` - Business logic layer (transactional)
- `controller/` - REST API endpoints
- `dto/` - Data Transfer Objects (request/response)
- `security/` - JWT authentication and Spring Security config
- `config/` - Application configuration classes

### Frontend Architecture

```
pages/ → components/ → api/ → store/
             ↓
         hooks/ + utils/
```

**Key directories:**
- `pages/` - Page-level components mapped to routes
- `components/` - Reusable UI components (organized by feature)
- `api/` - API client functions (using axios)
- `store/` - Zustand state management stores
- `hooks/` - Custom React hooks
- `types/` - TypeScript type definitions
- `utils/` - Utility functions

### Authentication Flow

1. **Login**: User submits credentials → Backend validates and returns JWT token
2. **Token Storage**: Frontend stores token in `localStorage`
3. **API Requests**: Axios interceptor adds `Authorization: Bearer {token}` header
4. **Token Validation**: Backend validates JWT on protected endpoints
5. **Auto-logout**: 401 responses trigger automatic logout and redirect to `/login`

**Key files:**
- Backend: `JwtTokenProvider.java`, `JwtAuthenticationFilter.java`, `SecurityConfig.java`
- Frontend: `authStore.ts`, `axios.ts`, `ProtectedRoute.tsx`

### Database Migrations

Migrations are managed by **Flyway** and located in `backend/src/main/resources/db/migration/`.

**Migration naming convention**: `V{number}__{description}.sql`

Existing migrations:
- V001: Base tables (usuarios, categorias_producto)
- V002: Eventos table
- V003: Proveedores table
- V004: Finanzas tables (transacciones, categorias_transaccion)
- V005: Empleados table
- V006: Nominas table
- V007: Jornadas trabajo table
- V008: Add nomina relation to jornadas
- V009: Inventory tables (productos, inventario, movimientos_stock, alertas_stock)

**Important**: Never modify existing migrations. Always create new migrations for schema changes.

### State Management

**Backend**: Stateless REST API, JWT tokens for session management

**Frontend**:
- **Zustand** for global state (auth, user preferences)
- **TanStack Query** for server state (caching, refetching, mutations)
- **React Hook Form** for form state

### API Communication

All API calls use the centralized axios instance (`frontend/src/api/axios.ts`) which:
- Automatically adds JWT token to requests
- Handles 401 errors (auto-logout)
- Provides consistent error handling

**API files pattern**: `{feature}.api.ts` (e.g., `eventos.api.ts`, `empleados.api.ts`)

## Important Conventions

### Backend

1. **Entity naming**: Singular Spanish names (Usuario, Evento, Empleado)
2. **Table naming**: Plural snake_case (usuarios, eventos, empleados)
3. **DTO naming**: `{Entity}DTO` for responses, `{Entity}Request` for inputs
4. **Service methods**: Must be `@Transactional` for write operations
5. **Security**: Use `@PreAuthorize` annotations for role-based access control
6. **Validation**: Use Jakarta validation annotations (`@NotNull`, `@Size`, etc.)
7. **Decimal precision**: Use `BigDecimal` with scale 2 for monetary values

### Frontend

1. **Component naming**: PascalCase with descriptive names (EmpleadoModal, TransaccionesPage)
2. **File organization**: Group by feature (eventos/, empleados/, transacciones/)
3. **API calls**: Always use TanStack Query hooks (`useQuery`, `useMutation`)
4. **Forms**: Use React Hook Form + Zod schema validation
5. **Styling**: Use Tailwind utility classes, avoid inline styles
6. **Error handling**: Display user-friendly error messages with Sonner toast notifications

### Code Organization

**Backend controllers** should be thin - delegate business logic to services:
```java
@PostMapping
public ResponseEntity<EventoDTO> create(@Valid @RequestBody EventoRequest request) {
    return ResponseEntity.ok(eventoService.create(request));
}
```

**Frontend API calls** should use TanStack Query:
```typescript
const { data, isLoading, error } = useQuery({
    queryKey: ['eventos'],
    queryFn: eventosApi.getAll
});
```

## Key Features & Implementation Notes

### Jornadas de Trabajo (Work Shifts)

Complex business logic for employee shift tracking:
- **Automatic hour calculation**: Handles overnight shifts (e.g., 23:00 to 03:00 = 4 hours)
- **Automatic payment calculation**: `total_pago = horas_trabajadas * precio_hora`
- **Default hourly rate**: If not specified, uses `salario_base / 160`
- **Batch payment**: Can pay multiple shifts in one transaction

See `backend/JORNADAS_TRABAJO_API.md` for detailed API documentation.

### Analytics & Reports

The analytics module aggregates data from multiple tables:
- **Dashboard**: Real-time metrics with auto-refresh every 30 seconds
- **P&L calculations**: Automatic profit/loss computation from transactions
- **Employee performance**: Tracks hours worked, shifts, and payments
- **Inventory alerts**: Automatic low-stock notifications

**Key services**: `AnalyticsService.java`, `DashboardService.java`, `ExcelExportService.java`

### Security & Authorization

Role hierarchy (from most to least privileged):
1. **ADMIN** - Full system access
2. **GERENTE** (Manager) - Most operations except system config
3. **RRHH** (HR) - Staff and payroll management
4. **ENCARGADO** (Supervisor) - Limited staff operations
5. **LECTURA** (Read-only) - View-only access

**Important**: Always verify role requirements when adding new endpoints.

### Inventory Management

Three-tier inventory system:
1. **Productos**: Product catalog with categories
2. **Inventario**: Current stock levels
3. **MovimientoStock**: Stock movements (entrada/salida)
4. **AlertaStock**: Automated low-stock alerts

Stock updates are transactional and automatically trigger alert checks.

## Testing

### Backend Tests

- Located in `backend/src/test/java/`
- Use **TestContainers** for integration tests with PostgreSQL
- Run with `./mvnw test` or `./mvnw verify` for coverage
- Coverage reports: `backend/target/site/jacoco/index.html`

### Frontend Tests

- Located in `frontend/src/**/__tests__/` or next to components as `.test.tsx`
- Use **Vitest + React Testing Library**
- Run with `npm test` or `npm run test:coverage`
- Coverage reports: `frontend/coverage/`

## Environment Configuration

### Backend

Configuration is in `backend/src/main/resources/application.yml` with three profiles:
- **dev** (default): Development with SQL logging
- **prod**: Production optimized
- **test**: TestContainers configuration

Environment variables:
- `SPRING_PROFILES_ACTIVE`: Active profile (dev/prod/test)
- `DB_URL`: Database JDBC URL
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `JWT_SECRET`: JWT signing secret (must be 256+ bits for production)

### Frontend

Environment variables (`.env` or build-time):
- `VITE_API_URL`: Backend API URL (default: http://localhost:8080/api)

## Default Credentials

**Username**: `admin`
**Password**: `admin123`

⚠️ **CRITICAL**: Change default credentials in production. The admin user is created by migration V001.

## Common Issues & Solutions

### "Connection refused" on backend startup
- Ensure PostgreSQL is running: `docker-compose up -d postgres`

### "Table doesn't exist" errors
- Check Flyway migrations ran: `SELECT * FROM flyway_schema_history;`
- Verify `spring.jpa.hibernate.ddl-auto` is set to `validate` (not `create` or `update`)

### JWT token errors
- Verify `JWT_SECRET` environment variable is set and matches between restarts
- Check token hasn't expired (24-hour default)

### CORS errors on frontend
- Verify `app.cors.allowed-origins` in `application.yml` includes frontend URL
- For production, update with actual domain

### Port conflicts
- Backend uses port 8080
- Frontend dev server uses port 5173 (Vite default) or 3000
- PostgreSQL uses port 5432

## Useful Endpoints

- Backend API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui/index.html
- Health check: http://localhost:8080/actuator/health
- Frontend: http://localhost:5173 (dev) or http://localhost:3000 (Docker)

## Documentation Files

- `README.md` - Project overview and quick start
- `TESTING.md` - Testing guide with credentials
- `DEPLOY.md` - Docker deployment guide
- `RAILWAY_DEPLOY.md` - Railway.app deployment guide
- `PROGRESS.md` - Development progress tracker
- `BUGFIXES.md` - Bug fixes log
- `backend/JORNADAS_TRABAJO_API.md` - Work shifts API documentation
- `backend/JORNADAS_EJEMPLOS_CALCULO.md` - Shift calculation examples

## Project Status

**Version**: 0.1.0
**Status**: First production-ready version

Completed features:
- ✅ Authentication & Authorization (JWT)
- ✅ Event Management
- ✅ Financial Transactions & P&L
- ✅ Employee Management
- ✅ Work Shifts (Jornadas) with automatic calculations
- ✅ Payroll (Nóminas)
- ✅ Inventory Management
- ✅ Analytics Dashboard with auto-refresh
- ✅ PDF/Excel Export
- ✅ Docker deployment configuration
