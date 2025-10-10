# 🧪 Testing Local del Sistema POS

## 🚀 Inicio Rápido

### Opción 1: Script Automático (Recomendado)

```bash
cd /Users/franferrer/workspace/club-management
./start-local.sh
```

**Qué hace**:
1. ✅ Levanta PostgreSQL en Docker
2. ✅ Compila y levanta Backend (Spring Boot)
3. ✅ Aplica migración V019 automáticamente
4. ✅ Levanta Frontend (Vite)
5. ✅ Ejecuta tests automáticos
6. ✅ Muestra todas las URLs

**Tiempo**: ~2-3 minutos

**Al finalizar verás**:
```
✅ Sistema LOCAL iniciado correctamente

📍 URLs disponibles:
   Frontend:  http://localhost:5173
   Backend:   http://localhost:8080
   Dashboard: http://localhost:5173/pos-dashboard

Presiona Ctrl+C para detener todos los servicios
```

### Opción 2: Manual (Paso a Paso)

#### 1. Levantar PostgreSQL

```bash
cd /Users/franferrer/workspace/club-management
docker-compose up -d postgres

# Verificar
docker-compose exec postgres pg_isready
```

#### 2. Levantar Backend

```bash
cd backend
export SPRING_PROFILES_ACTIVE=dev
export DB_URL=jdbc:postgresql://localhost:5432/club_management
export DB_USER=club_admin
export DB_PASSWORD=club_admin_password

# Si tienes mvnw
./mvnw spring-boot:run

# Si usas maven global
mvn spring-boot:run
```

**Esperar a ver**:
```
Started ClubManagementApplication in XX.XXX seconds
```

#### 3. Levantar Frontend

```bash
# Nueva terminal
cd frontend
npm run dev
```

**Abrir**: http://localhost:5173

---

## 🧪 Plan de Testing Local

### Test 1: Verificar Migración V019 ✅

```bash
docker-compose exec postgres psql -U club_admin -d club_management -c "
SELECT version, description, success
FROM flyway_schema_history
WHERE version = '019';
"
```

**Resultado esperado**:
```
version |    description     | success
--------|-------------------|--------
019     | create pos tables | t
```

### Test 2: Verificar Tablas POS ✅

```bash
docker-compose exec postgres psql -U club_admin -d club_management -c "
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('sesiones_caja', 'ventas', 'detalle_venta')
ORDER BY table_name;
"
```

**Resultado esperado**:
```
table_name
-----------------
detalle_venta
sesiones_caja
ventas
```

### Test 3: Login ✅

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Resultado esperado**: Token JWT

### Test 4: Abrir Sesión de Caja ✅

```bash
# Primero hacer login y guardar token
TOKEN="eyJhbGci..."

curl -X POST http://localhost:8080/api/pos/sesiones-caja/abrir \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombreCaja": "Barra Test Local",
    "empleadoAperturaId": 1,
    "montoInicial": 100.00,
    "observaciones": "Test local"
  }'
```

**Resultado esperado**: HTTP 201 con sesión creada

### Test 5: Crear Venta ✅

```bash
# Usar sesionCajaId del test anterior
SESION_ID=1

curl -X POST http://localhost:8080/api/pos/ventas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sesionCajaId": '$SESION_ID',
    "empleadoId": 1,
    "metodoPago": "EFECTIVO",
    "montoEfectivo": 25.00,
    "detalles": [
      {
        "productoId": 1,
        "cantidad": 2
      }
    ]
  }'
```

**Resultado esperado**: HTTP 201 con venta y número de ticket

### Test 6: Estadísticas POS ✅

```bash
curl -X GET http://localhost:8080/api/pos/estadisticas/hoy \
  -H "Authorization: Bearer $TOKEN"
```

**Resultado esperado**: JSON con estadísticas

### Test 7: Dashboard Frontend ✅

1. Abrir navegador: http://localhost:5173/pos-dashboard
2. Verificar que carga sin errores
3. Debe mostrar:
   - ✅ KPIs (Ingresos, Ventas, Ticket Promedio, Unidades)
   - ✅ Sesión abierta "Barra Test Local"
   - ✅ Venta creada en estadísticas
   - ✅ Gráficos renderizados

4. Esperar 30 segundos → verificar auto-refresh

5. Cambiar filtro de "Hoy" a "7 Días" → verificar que cambian datos

---

## 🔍 Testing de Triggers

### Trigger 1: Número de Ticket Auto-generado ✅

Después de crear venta (Test 5), verificar:

```bash
docker-compose exec postgres psql -U club_admin -d club_management -c "
SELECT id, numero_ticket, total
FROM ventas
ORDER BY id DESC LIMIT 1;
"
```

**Verificar**: `numero_ticket` tiene formato `VTA-YYYYMMDD-NNNN`

### Trigger 2: Stock Descontado Automáticamente ✅

Antes de crear venta:
```sql
SELECT p.id, p.nombre, i.cantidad_actual
FROM productos p
JOIN inventario i ON i.producto_id = p.id
WHERE p.id = 1;
```

Después de crear venta (Test 5):
```sql
-- Mismo query
```

**Verificar**: `cantidad_actual` se redujo en 2 unidades

### Trigger 3: Transacción Financiera Creada ✅

```bash
docker-compose exec postgres psql -U club_admin -d club_management -c "
SELECT tipo, concepto, monto
FROM transacciones
WHERE concepto LIKE 'Venta VTA-%'
ORDER BY created_at DESC LIMIT 1;
"
```

**Verificar**:
- `tipo` = 'INGRESO'
- `monto` = total de la venta

### Trigger 4: Movimiento de Stock Registrado ✅

```bash
docker-compose exec postgres psql -U club_admin -d club_management -c "
SELECT tipo, cantidad, motivo, referencia
FROM movimientos_stock
WHERE referencia LIKE 'Venta #VTA-%'
ORDER BY fecha DESC LIMIT 1;
"
```

**Verificar**:
- `tipo` = 'SALIDA'
- `cantidad` = cantidad vendida
- `motivo` = 'Venta POS'

---

## 🎯 Checklist de Testing Local

### Backend API
- [ ] Migración V019 aplicada
- [ ] Tablas POS creadas
- [ ] Login funciona
- [ ] `POST /api/pos/sesiones-caja/abrir` → HTTP 201
- [ ] `POST /api/pos/ventas` → HTTP 201
- [ ] `GET /api/pos/estadisticas/hoy` → HTTP 200
- [ ] `POST /api/pos/sesiones-caja/{id}/cerrar` → HTTP 200

### Triggers Automáticos
- [ ] Número de ticket auto-generado
- [ ] Stock descontado automáticamente
- [ ] Transacción financiera creada
- [ ] Movimiento de stock registrado

### Frontend Dashboard
- [ ] `/pos-dashboard` carga sin errores
- [ ] KPIs muestran valores correctos
- [ ] Sesiones abiertas se visualizan
- [ ] Auto-refresh funciona (30s)
- [ ] Filtros cambian datos (Hoy/Semana/Mes)
- [ ] Gráficos renderizan (Pie + Bar)
- [ ] Top productos se muestran

### Flujo Completo
- [ ] Abrir sesión → crear venta → ver en dashboard → cerrar sesión
- [ ] Diferencia de caja calculada correctamente
- [ ] Múltiples ventas acumulan correctamente

---

## 🐛 Troubleshooting Local

### Problema 1: Backend no inicia

**Error**: "Port 8080 already in use"

**Solución**:
```bash
# Ver qué proceso usa el puerto
lsof -i :8080

# Matar proceso
kill -9 [PID]

# O cambiar puerto
export SERVER_PORT=8081
mvn spring-boot:run
```

### Problema 2: PostgreSQL no conecta

**Error**: "Connection refused"

**Solución**:
```bash
# Verificar que Docker está corriendo
docker ps

# Si no hay contenedor postgres
docker-compose up -d postgres

# Verificar logs
docker-compose logs postgres
```

### Problema 3: Migración V019 no se aplica

**Causa**: Flyway ya tiene V019 marcada como fallida

**Solución**:
```sql
-- Ver estado de migraciones
SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC;

-- Si V019 está con success=false, eliminarla
DELETE FROM flyway_schema_history WHERE version = '019';

-- Reiniciar backend para que la aplique de nuevo
```

### Problema 4: Frontend da error 404 en API

**Error**: `GET /api/pos/estadisticas/hoy → 404`

**Causa**: Frontend apunta a producción

**Solución**:
```typescript
// frontend/src/api/axios.ts
baseURL: process.env.NODE_ENV === 'development'
  ? 'http://localhost:8080/api'
  : 'https://club-manegament-production.up.railway.app/api'
```

### Problema 5: CORS Error en navegador

**Error**: "CORS policy: No 'Access-Control-Allow-Origin'"

**Solución**:
```yaml
# backend/src/main/resources/application-dev.yml
app:
  cors:
    allowed-origins: http://localhost:5173
```

---

## 📊 Datos de Prueba

### Crear Productos de Prueba

```sql
-- Si no hay productos
INSERT INTO productos (nombre, precio_venta, categoria_id, activo)
VALUES
  ('Cerveza', 5.00, 1, true),
  ('Cuba Libre', 8.00, 1, true),
  ('Ron Cola', 7.50, 1, true);

-- Crear inventario
INSERT INTO inventario (producto_id, cantidad_actual, cantidad_minima)
VALUES
  (1, 100, 10),
  (2, 50, 5),
  (3, 75, 10);
```

### Crear Empleado de Prueba

```sql
-- Si no hay empleado con ID 1
INSERT INTO empleados (nombre, cargo, salario_base, activo)
VALUES
  ('Cajero Test', 'CAJERO', 1200.00, true);
```

---

## 🎉 Resultado Esperado Final

Después de ejecutar todos los tests, deberías ver:

### En Terminal
```
✅ Login successful
✅ Apertura exitosa (HTTP 201)
✅ Sesiones obtenidas
✅ Estadísticas obtenidas
✅ Venta creada (Ticket: VTA-20251010-0001)
✅ Cierre exitoso (Diferencia: €0.00)
```

### En Dashboard (http://localhost:5173/pos-dashboard)
```
📊 Dashboard POS - Tiempo Real

💚 Ingresos: €25.00
💙 Ventas: 1
💜 Ticket Promedio: €25.00
💛 Unidades: 2

✅ CAJAS ABIERTAS (1)
┌─────────────────┐
│ Barra Test Local│
│ Cajero Test     │
│ 1 ventas        │
│ €25.00          │
└─────────────────┘

🥇 Top Productos
1. Cerveza - 2 unidades - €10.00
```

---

## 🚀 Después del Testing Local

### Si todo funciona ✅

```bash
# Detener local
Ctrl+C en el terminal con start-local.sh

# Desplegar a producción
cd backend
railway up

cd ../frontend
npm run build
# Desplegar dist/ a hosting
```

### Si hay errores ❌

1. Revisar logs:
   - Backend: `/tmp/backend-run.log`
   - Frontend: `/tmp/frontend-run.log`

2. Verificar base de datos:
   ```bash
   docker-compose exec postgres psql -U club_admin -d club_management
   ```

3. Revisar migración V019:
   ```sql
   SELECT * FROM flyway_schema_history WHERE version = '019';
   ```

---

## 📝 Comandos Útiles

```bash
# Ver logs backend en tiempo real
tail -f /tmp/backend-run.log

# Ver logs frontend en tiempo real
tail -f /tmp/frontend-run.log

# Conectar a PostgreSQL
docker-compose exec postgres psql -U club_admin -d club_management

# Ver procesos Java
jps -l

# Matar backend manualmente
pkill -f spring-boot

# Ver puertos en uso
lsof -i :8080
lsof -i :5173
lsof -i :5432

# Reiniciar solo backend
cd backend
mvn spring-boot:run

# Reiniciar solo frontend
cd frontend
npm run dev
```

---

**¡Listo para testear! 🚀**

Ejecuta: `./start-local.sh` y en 2-3 minutos tendrás todo funcionando.
