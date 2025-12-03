# Plan de Testing - Sistema POS Completo

## 📋 Resumen

Este documento describe el plan de testing completo para el sistema POS antes de desplegar a producción.

---

## 🔍 Fase 1: Verificación de Código (Pre-deployment)

### ✅ Backend - Checklist

#### Compilación
- [ ] Backend compila sin errores
- [ ] No hay warnings críticos
- [ ] Todas las dependencias resueltas

#### Entidades
- [x] `SesionCaja.java` - Creada ✅
- [x] `Venta.java` - Creada ✅
- [x] `DetalleVenta.java` - Creada ✅
- [ ] Relaciones JPA correctas
- [ ] Anotaciones de validación presentes

#### Repositorios
- [x] `SesionCajaRepository.java` - Creado ✅
- [x] `VentaRepository.java` - Creado ✅
- [x] `DetalleVentaRepository.java` - Creado ✅
- [ ] Queries custom sin errores de sintaxis
- [ ] Nombres de métodos siguen convención Spring

#### Servicios
- [x] `SesionCajaService.java` - Creado ✅
- [x] `VentaService.java` - Creado ✅
- [x] `POSEstadisticasService.java` - Creado ✅
- [ ] Anotación `@Transactional` presente
- [ ] Validaciones de negocio implementadas
- [ ] Manejo de excepciones adecuado

#### Controladores
- [x] `SesionCajaController.java` - Creado ✅
- [x] `VentaController.java` - Creado ✅
- [x] `POSEstadisticasController.java` - Creado ✅
- [ ] Anotaciones de seguridad `@PreAuthorize`
- [ ] Validación `@Valid` en requests
- [ ] Códigos HTTP correctos

#### DTOs
- [x] Request DTOs creados ✅
- [x] Response DTOs creados ✅
- [ ] Validaciones Jakarta presentes
- [ ] Campos opcionales marcados correctamente

### ✅ Frontend - Checklist

#### Compilación
- [ ] Frontend compila sin errores TypeScript
- [ ] No hay warnings de tipos
- [ ] Todas las dependencias instaladas

#### API Clients
- [x] `pos-sesiones-caja.api.ts` - Creado ✅
- [x] `pos-ventas.api.ts` - Creado ✅
- [x] `pos-estadisticas.api.ts` - Creado ✅
- [ ] Interfaces TypeScript correctas
- [ ] Paths de API correctos
- [ ] Manejo de errores

#### Componentes
- [x] `POSDashboardPage.tsx` - Creado ✅
- [ ] Sin errores de importación
- [ ] Tipos TypeScript correctos
- [ ] Hooks usados correctamente

#### Rutas
- [x] Ruta `/pos-dashboard` agregada ✅
- [x] Import en App.tsx ✅
- [x] Entrada en menú lateral ✅
- [ ] ProtectedRoute aplicado

---

## 🗄️ Fase 2: Base de Datos

### Migración V019

```sql
-- Verificar que existe
ls backend/src/main/resources/db/migration/V019__create_pos_tables.sql
```

**Contenido esperado**:
- [x] Tabla `sesiones_caja`
- [x] Tabla `ventas`
- [x] Tabla `detalle_venta`
- [x] Tabla `estadisticas_pos_cache`
- [x] Índices creados
- [x] Trigger `trigger_generar_numero_ticket`
- [x] Trigger `trigger_descontar_stock_venta`
- [x] Trigger `trigger_crear_transaccion_desde_venta`
- [x] Función `cerrar_sesion_caja()`

### Verificación en Producción

```bash
# 1. Verificar migración aplicada
railway run -s club-manegament sh -c 'docker run --rm postgres:15-alpine psql "$DATABASE_PUBLIC_URL" -c "SELECT version, description, success FROM flyway_schema_history WHERE version = '"'"'019'"'"';"'

# 2. Verificar tablas creadas
railway run -s club-manegament sh -c 'docker run --rm postgres:15-alpine psql "$DATABASE_PUBLIC_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = '"'"'public'"'"' AND table_name IN ('"'"'sesiones_caja'"'"', '"'"'ventas'"'"', '"'"'detalle_venta'"'"') ORDER BY table_name;"'

# 3. Verificar triggers
railway run -s club-manegament sh -c 'docker run --rm postgres:15-alpine psql "$DATABASE_PUBLIC_URL" -c "SELECT trigger_name FROM information_schema.triggers WHERE trigger_schema = '"'"'public'"'"';"'
```

**Resultado esperado**:
```
version | description          | success
--------|----------------------|--------
019     | create pos tables    | t

table_name
-----------------
detalle_venta
sesiones_caja
ventas

trigger_name
----------------------------------
trigger_generar_numero_ticket
trigger_descontar_stock_venta
trigger_crear_transaccion_desde_venta
```

---

## 🧪 Fase 3: Testing de Integración

### Test 1: Apertura de Caja

**Endpoint**: `POST /api/pos/sesiones-caja/abrir`

**Request**:
```bash
curl -X POST https://club-manegament-production.up.railway.app/api/pos/sesiones-caja/abrir \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombreCaja": "Barra Test",
    "empleadoAperturaId": 1,
    "montoInicial": 100.00,
    "observaciones": "Test de apertura"
  }'
```

**Validaciones**:
- [ ] HTTP 201 Created
- [ ] Respuesta contiene `id` de sesión
- [ ] `estado` = "ABIERTA"
- [ ] `montoInicial` = 100.00
- [ ] `totalVentas` = 0
- [ ] `totalIngresos` = 0
- [ ] `fechaApertura` es timestamp actual

**Errores a probar**:
- [ ] Sin token → HTTP 401
- [ ] Empleado inexistente → HTTP 400/404
- [ ] Caja ya abierta → HTTP 400 con mensaje

### Test 2: Crear Venta

**Prerequisito**: Tener sesión de caja abierta (Test 1)

**Endpoint**: `POST /api/pos/ventas`

**Request**:
```bash
SESION_ID=1  # Del test anterior

curl -X POST https://club-manegament-production.up.railway.app/api/pos/ventas \
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
        "cantidad": 2,
        "descuento": 0.00
      },
      {
        "productoId": 2,
        "cantidad": 1,
        "descuento": 0.00
      }
    ]
  }'
```

**Validaciones**:
- [ ] HTTP 201 Created
- [ ] `numeroTicket` generado automáticamente (formato: VTA-YYYYMMDD-NNNN)
- [ ] `total` calculado correctamente
- [ ] `detalles` array poblado
- [ ] Stock de productos descontado (verificar en DB)
- [ ] Transacción financiera creada (verificar tabla `transacciones`)

**Verificar efectos secundarios**:
```sql
-- 1. Stock descontado
SELECT p.id, p.nombre, i.cantidad_actual
FROM productos p
JOIN inventario i ON i.producto_id = p.id
WHERE p.id IN (1, 2);

-- 2. Transacción creada
SELECT * FROM transacciones
WHERE concepto LIKE 'Venta VTA-%'
ORDER BY created_at DESC LIMIT 1;

-- 3. Movimiento de stock registrado
SELECT * FROM movimientos_stock
WHERE referencia LIKE 'Venta #VTA-%'
ORDER BY fecha DESC LIMIT 2;
```

**Errores a probar**:
- [ ] Sesión cerrada → HTTP 400
- [ ] Producto inexistente → HTTP 404
- [ ] Stock insuficiente → HTTP 400
- [ ] Monto insuficiente → HTTP 400
- [ ] Sin detalles → HTTP 400

### Test 3: Estadísticas Hoy

**Endpoint**: `GET /api/pos/estadisticas/hoy`

**Request**:
```bash
curl -X GET https://club-manegament-production.up.railway.app/api/pos/estadisticas/hoy \
  -H "Authorization: Bearer $TOKEN"
```

**Validaciones**:
- [ ] HTTP 200 OK
- [ ] `totalVentas` > 0 (si hay ventas)
- [ ] `totalIngresos` correcto
- [ ] `ticketPromedio` = totalIngresos / totalVentas
- [ ] `sesionesAbiertas` > 0 (si hay sesiones)
- [ ] `sesionesActivasDetalle` contiene sesión del Test 1
- [ ] `topProductos` ordenados por cantidad

**Verificar estructura**:
```json
{
  "totalVentas": 1,
  "totalIngresos": 25.00,
  "productosVendidos": 3,
  "ticketPromedio": 25.00,
  "totalEfectivo": 25.00,
  "totalTarjeta": 0.00,
  "totalMixto": 0.00,
  "topProductos": [...],
  "ventasPorHora": [...],
  "sesionesAbiertas": 1,
  "sesionesActivasDetalle": [...]
}
```

### Test 4: Cierre de Caja

**Endpoint**: `POST /api/pos/sesiones-caja/{id}/cerrar`

**Request**:
```bash
SESION_ID=1

curl -X POST https://club-manegament-production.up.railway.app/api/pos/sesiones-caja/$SESION_ID/cerrar \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "empleadoCierreId": 1,
    "montoReal": 124.50,
    "observaciones": "Cierre test OK"
  }'
```

**Validaciones**:
- [ ] HTTP 200 OK
- [ ] `estado` = "CERRADA"
- [ ] `fechaCierre` es timestamp actual
- [ ] `montoEsperado` = montoInicial + suma de ventas
- [ ] `diferencia` = montoReal - montoEsperado
- [ ] `empleadoCierreId` y nombre poblados

**Cálculo esperado**:
```
montoInicial: 100.00
ventas: 25.00
montoEsperado: 125.00
montoReal: 124.50
diferencia: -0.50 (faltante)
```

**Errores a probar**:
- [ ] Sesión ya cerrada → HTTP 400
- [ ] Sesión inexistente → HTTP 404

---

## 🌐 Fase 4: Testing de Frontend

### Dashboard POS en Navegador

**URL**: `https://[tu-dominio]/pos-dashboard`

#### Test Visual 1: Carga Inicial

**Pasos**:
1. Abrir `/pos-dashboard`
2. Verificar que aparece spinner de carga
3. Verificar que carga datos

**Validaciones**:
- [ ] No hay errores en consola (F12)
- [ ] KPIs muestran valores correctos
- [ ] Gráficos renderizan sin errores
- [ ] Sesiones abiertas se muestran (si existen)
- [ ] Top productos se muestran (si hay ventas)

#### Test Visual 2: Auto-refresh

**Pasos**:
1. Estar en `/pos-dashboard`
2. Esperar 30 segundos
3. Observar indicador de actualización

**Validaciones**:
- [ ] Aparece texto "(actualizando...)" en header
- [ ] Datos se refrescan automáticamente
- [ ] No hay flickering molesto
- [ ] Console sin errores

#### Test Visual 3: Filtros de Periodo

**Pasos**:
1. Click en "Hoy"
2. Verificar datos
3. Click en "7 Días"
4. Verificar que datos cambian
5. Click en "30 Días"

**Validaciones**:
- [ ] Botón activo tiene estilo azul
- [ ] Datos cambian al cambiar filtro
- [ ] Gráficos se actualizan
- [ ] Loading state durante cambio

#### Test Visual 4: Refresh Manual

**Pasos**:
1. Click en botón de refresh (icono ↻)
2. Observar animación

**Validaciones**:
- [ ] Icono hace spin
- [ ] Botón se deshabilita durante refresh
- [ ] Datos se actualizan
- [ ] Botón vuelve a habilitarse

#### Test Visual 5: Responsive

**Desktop** (> 1024px):
- [ ] 4 columnas en KPIs
- [ ] 3 columnas en cajas abiertas
- [ ] 2 columnas en gráficos
- [ ] Todo visible sin scroll horizontal

**Tablet** (640px - 1024px):
- [ ] 2 columnas en KPIs
- [ ] 2 columnas en cajas
- [ ] 1 columna en gráficos
- [ ] Menu lateral colapsa

**Mobile** (< 640px):
- [ ] 1 columna en todo
- [ ] Menu hamburguesa funciona
- [ ] Gráficos legibles
- [ ] Touch targets adecuados (44px min)

#### Test Visual 6: Estados Vacíos

**Pasos**:
1. Asegurarse de no tener ventas hoy
2. Visitar dashboard

**Validaciones**:
- [ ] KPIs muestran 0 o €0.00
- [ ] Mensaje "No hay ventas registradas"
- [ ] No hay errores de rendering
- [ ] Gráficos ocultos o vacíos (no crash)

---

## 🔄 Fase 5: Testing de Flujo Completo

### Escenario Completo: Noche en el Club

**Personas**:
- Gerente: Observa dashboard
- Cajero Barra 1: Opera POS
- Cajero Barra 2: Opera POS

**Timeline**:

#### 22:00 - Apertura
```bash
# Cajero 1 abre Barra Principal
POST /api/pos/sesiones-caja/abrir
{
  "nombreCaja": "Barra Principal",
  "empleadoAperturaId": 1,
  "montoInicial": 200.00
}

# Cajero 2 abre Barra VIP
POST /api/pos/sesiones-caja/abrir
{
  "nombreCaja": "Barra VIP",
  "empleadoAperturaId": 2,
  "montoInicial": 300.00
}
```

**Validaciones Gerente**:
- [ ] Dashboard muestra 2 cajas abiertas
- [ ] Total ingresos = €0.00
- [ ] Total ventas = 0

#### 22:30 - Primeras Ventas
```bash
# Barra Principal - Venta 1
POST /api/pos/ventas
{
  "sesionCajaId": 1,
  "metodoPago": "EFECTIVO",
  "montoEfectivo": 35.00,
  "detalles": [
    {"productoId": 1, "cantidad": 3}  // 3 cervezas
  ]
}

# Barra VIP - Venta 1
POST /api/pos/ventas
{
  "sesionCajaId": 2,
  "metodoPago": "TARJETA",
  "montoTarjeta": 120.00,
  "detalles": [
    {"productoId": 5, "cantidad": 2}  // 2 botellas
  ]
}
```

**Validaciones Gerente** (esperar 30s o refresh):
- [ ] Total ingresos = €155.00
- [ ] Total ventas = 2
- [ ] Ticket promedio = €77.50
- [ ] Barra Principal: €35.00
- [ ] Barra VIP: €120.00
- [ ] Efectivo = €35.00, Tarjeta = €120.00

#### 01:00 - Hora Pico
```bash
# Simular 10 ventas rápidas
for i in {1..10}; do
  curl -X POST .../ventas \
    -d '{"sesionCajaId": 1, "metodoPago": "EFECTIVO", "montoEfectivo": 20.00, ...}'
done
```

**Validaciones**:
- [ ] Dashboard actualiza contadores
- [ ] Gráfico por hora muestra pico en 01:00
- [ ] Top productos se actualiza

#### 04:00 - Cierre
```bash
# Cerrar Barra Principal
POST /api/pos/sesiones-caja/1/cerrar
{
  "empleadoCierreId": 1,
  "montoReal": 435.00
}

# Cerrar Barra VIP
POST /api/pos/sesiones-caja/2/cerrar
{
  "empleadoCierreId": 2,
  "montoReal": 720.00
}
```

**Validaciones**:
- [ ] Dashboard muestra 0 cajas abiertas
- [ ] Totales finales correctos
- [ ] Diferencias calculadas correctamente
- [ ] Sesiones en estado CERRADA

---

## 🐛 Fase 6: Testing de Errores

### Errores de Red

**Simular**:
1. Apagar backend
2. Intentar acceder a dashboard

**Validación**:
- [ ] Mensaje de error amigable
- [ ] Opción de reintentar
- [ ] No crash de aplicación

### Errores de Autenticación

**Simular**:
1. Token expirado
2. Acceder a dashboard

**Validación**:
- [ ] Redirect a /login
- [ ] Mensaje de sesión expirada

### Errores de Validación

**Request inválido**:
```bash
POST /api/pos/ventas
{
  "sesionCajaId": 999,  // No existe
  "metodoPago": "EFECTIVO",
  "detalles": []  // Vacío - inválido
}
```

**Validación**:
- [ ] HTTP 400 Bad Request
- [ ] Mensaje de error claro
- [ ] Frontend muestra toast de error

---

## 📊 Fase 7: Testing de Performance

### Carga de Datos

**Crear ventas masivas**:
```sql
-- Insertar 1000 ventas de prueba
-- (Script SQL para poblar)
```

**Validaciones**:
- [ ] Dashboard carga en < 3 segundos
- [ ] Gráficos renderizan suavemente
- [ ] Auto-refresh no causa lag
- [ ] Paginación si es necesario

### Concurrencia

**Simular**:
- 3 usuarios en dashboard simultáneamente
- 2 cajeros creando ventas al mismo tiempo

**Validaciones**:
- [ ] No hay race conditions
- [ ] Datos consistentes
- [ ] No deadlocks en DB

---

## ✅ Checklist Final Pre-Producción

### Código
- [ ] Backend compila sin errores
- [ ] Frontend compila sin errores TypeScript
- [ ] No hay warnings críticos
- [ ] Linter pasa sin errores

### Base de Datos
- [ ] Migración V019 aplicada
- [ ] Tablas creadas correctamente
- [ ] Triggers funcionando
- [ ] Índices creados

### API
- [ ] Todos los endpoints responden
- [ ] Seguridad (JWT) funcionando
- [ ] Validaciones activas
- [ ] Manejo de errores correcto

### Frontend
- [ ] Dashboard carga correctamente
- [ ] Auto-refresh funciona
- [ ] Gráficos renderizan
- [ ] Responsive en móvil
- [ ] No hay errores de consola

### Integración
- [ ] Flujo completo funciona end-to-end
- [ ] Stock se descuenta automáticamente
- [ ] Transacciones se crean automáticamente
- [ ] Números de ticket únicos

### Documentación
- [ ] README actualizado
- [ ] API documentada
- [ ] Guía de usuario creada
- [ ] Plan de rollback definido

---

## 🚀 Próximos Pasos

1. **Ejecutar tests** siguiendo este documento
2. **Documentar resultados** (✅ o ❌ para cada item)
3. **Fix de bugs** encontrados
4. **Re-test** después de fixes
5. **Deployment** cuando todo esté ✅

---

## 📝 Registro de Resultados

### Fecha: _____________
### Tester: _____________

| Fase | Test | Resultado | Notas |
|------|------|-----------|-------|
| 1 | Backend compila | ⬜ | |
| 1 | Frontend compila | ⬜ | |
| 2 | Migración V019 | ⬜ | |
| 3 | Apertura caja | ⬜ | |
| 3 | Crear venta | ⬜ | |
| 3 | Estadísticas | ⬜ | |
| 3 | Cierre caja | ⬜ | |
| 4 | Dashboard carga | ⬜ | |
| 4 | Auto-refresh | ⬜ | |
| 4 | Filtros | ⬜ | |
| 5 | Flujo completo | ⬜ | |
| 6 | Manejo errores | ⬜ | |
| 7 | Performance | ⬜ | |

**Resultado Final**: ⬜ APROBADO / ⬜ RECHAZADO

**Próxima Acción**: _________________________
