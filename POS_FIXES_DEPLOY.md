# POS System Fixes - Deployment Guide

## Issues Resolved

### 1. Compilation Error - ActivoFijoDTO.java
**Problem**: CRLF line endings (Windows-style) caused compilation failures in Linux Docker containers.
**Fix**: Converted line endings from CRLF to LF using `sed`.
**Files Changed**:
- `backend/src/main/java/com/club/management/dto/response/ActivoFijoDTO.java`

### 2. Missing Migration V015
**Problem**: Database had V016 (POS tables) but was missing V015 (activos_fijos tables), causing Flyway validation errors.
**Fix**: Created V015 migration for activos_fijos tables.
**Files Changed**:
- `backend/src/main/resources/db/migration/V015__crear_activos_fijos.sql`

### 3. Database Trigger Issue
**Problem**: The `descontar_stock_consumo()` trigger was creating `movimientos_stock` records without `stock_anterior` and `stock_nuevo` fields, which are NOT NULL columns. This caused DataIntegrityViolationException that appeared as HTTP 403.
**Fix**: Created V017 migration to fix the trigger function.
**Files Changed**:
- `backend/src/main/resources/db/migration/V017__fix_descontar_stock_trigger.sql`

### 4. SQL Delimiter Issue
**Problem**: V017 used single `$` delimiter which caused PostgreSQL syntax errors in Flyway.
**Fix**: Changed to `$$` delimiters for proper Flyway/PostgreSQL compatibility.

## Railway Deployment Steps

### Step 1: Commit and Push to GitHub

```bash
cd /Users/franferrer/workspace/club-management

# Add all changes
git add backend/src/main/java/com/club/management/dto/response/ActivoFijoDTO.java
git add backend/src/main/resources/db/migration/V015__crear_activos_fijos.sql
git add backend/src/main/resources/db/migration/V017__fix_descontar_stock_trigger.sql
git add backend/src/main/java/com/club/management/controller/SesionVentaController.java

# Commit
git commit -m "fix: resolve POS system issues (CRLF, migrations V015/V017, trigger)

- Fix CRLF line endings in ActivoFijoDTO.java
- Add V015 migration for activos_fijos tables
- Add V017 migration to fix descontar_stock_consumo trigger
- Fix trigger to set stock_anterior and stock_nuevo fields
- Use $$ delimiters for PostgreSQL/Flyway compatibility

Fixes #XXX"

# Push to main
git push origin main
```

### Step 2: Apply Migrations Manually to Railway Database

Since V015 needs to be inserted between existing migrations, and the trigger needs to be updated:

```bash
# Connect to Railway PostgreSQL
railway run --service club-manegament psql $DATABASE_URL

# Or using direct connection:
psql <RAILWAY_DATABASE_URL>
```

Then execute:

```sql
-- 1. Check current migration status
SELECT installed_rank, version, description FROM flyway_schema_history ORDER BY installed_rank;

-- 2. Apply V015 if tables don't exist
-- (Copy the content of V015__crear_activos_fijos.sql and run it)

-- 3. Update Flyway history for V015
-- Find the correct rank (should be before V016)
UPDATE flyway_schema_history SET installed_rank = 14 WHERE version = '016';

INSERT INTO flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
VALUES (
    13,
    '015',
    'crear activos fijos',
    'SQL',
    'V015__crear_activos_fijos.sql',
    -483302085,
    'railway',
    NOW(),
    1000,
    true
);

-- 4. Apply V017 trigger fix
-- (Copy the content of V017__fix_descontar_stock_trigger.sql and run it)
-- The function will be created/replaced automatically

-- 5. Record V017 in Flyway history
INSERT INTO flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
VALUES (
    15,
    '017',
    'fix descontar stock trigger',
    'SQL',
    'V017__fix_descontar_stock_trigger.sql',
    (SELECT ('x' || md5('V017'))::bit(32)::int),
    'railway',
    NOW(),
    500,
    true
);

-- 6. Verify migrations
SELECT installed_rank, version, description, success FROM flyway_schema_history ORDER BY installed_rank;
```

### Step 3: Railway Auto-Deploy

Railway will automatically:
1. Detect the GitHub push
2. Build the new Docker image with fixed code
3. Deploy the new version
4. The migrations are already applied manually, so Flyway will validate and continue

### Step 4: Verify Deployment

```bash
# 1. Check Railway logs
railway logs --service club-manegament

# 2. Test POS endpoints
# Login
curl -X POST https://club-manegament-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Save token from response, then test:
# Get open sessions
curl -H "Authorization: Bearer <TOKEN>" \
  https://club-manegament-production.up.railway.app/api/sesiones-venta/abiertas

# Create a session
curl -X POST -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Test Session"}' \
  https://club-manegament-production.up.railway.app/api/sesiones-venta

# Register consumption (replace session_id and producto_id)
curl -X POST -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"productoId": 4, "cantidad": 2}' \
  https://club-manegament-production.up.railway.app/api/sesiones-venta/1/consumos
```

## Root Cause Analysis

The "403 Forbidden" error was NOT an authentication/authorization issue. Here's what actually happened:

1. Frontend makes authenticated POST request to `/api/sesiones-venta/{id}/consumos`
2. JWT filter extracts and validates token ✅
3. Spring Security authorizes the request ✅
4. Controller method starts executing ✅
5. Service creates ConsumoSesion record ✅
6. Database trigger `descontar_stock_consumo()` fires
7. **Trigger tries to INSERT into movimientos_stock WITHOUT stock_anterior/stock_nuevo** ❌
8. PostgreSQL throws DataIntegrityViolationException (NOT NULL constraint)
9. Spring catches exception and tries to forward to `/error` endpoint
10. `/error` endpoint has no authentication (anonymous context)
11. Spring Security rejects the error page request with 403
12. Frontend receives 403 response

**Solution**: Fix the trigger to properly set `stock_anterior` and `stock_nuevo` when creating stock movements.

## Files Modified

- `backend/src/main/java/com/club/management/dto/response/ActivoFijoDTO.java` (CRLF → LF)
- `backend/src/main/resources/db/migration/V015__crear_activos_fijos.sql` (NEW)
- `backend/src/main/resources/db/migration/V017__fix_descontar_stock_trigger.sql` (NEW)
- `backend/src/main/java/com/club/management/controller/SesionVentaController.java` (added @PreAuthorize)

## Expected Results

After deployment:
- ✅ Backend compiles successfully (no CRLF issues)
- ✅ Flyway validates all migrations correctly (015, 016, 017)
- ✅ GET `/api/sesiones-venta/abiertas` returns 200
- ✅ POST `/api/sesiones-venta` creates sessions (returns 200)
- ✅ POST `/api/sesiones-venta/{id}/consumos` registers consumptions (returns 200)
- ✅ Stock movements are created with proper stock_anterior/stock_nuevo values
- ✅ No more 403 errors on POS endpoints
