# Guía de Testing Manual - Sistema de Botellas VIP

## 🎯 Objetivo

Verificar que el sistema de Botellas VIP funciona correctamente en todos sus aspectos: backend API, frontend UI, y lógica de negocio.

---

## 📋 Pre-requisitos

### 1. Verificar Despliegue

**Backend API:**
```bash
curl https://club-manegament-production.up.railway.app/api/botellas-abiertas/ubicaciones
```

**Respuesta esperada:**
```json
["BARRA_PRINCIPAL", "BARRA_VIP", "COCTELERIA", "TERRAZA", "SALA_EVENTOS"]
```

### 2. Obtener Token de Autenticación

```bash
# Login
curl -X POST https://club-manegament-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Guardar el token** para los siguientes tests:
```bash
export TOKEN="eyJhbGciOiJIUzUxMiJ9..."
```

### 3. Verificar Migraciones

```bash
# Conectar a la BD de Railway
railway run psql $DATABASE_URL -c "SELECT version FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;"
```

**Debe mostrar:**
- V024__seed_botellas_vip_data
- V023__triggers_apertura_botellas
- V022__update_detalle_venta_for_botellas
- V021__create_botellas_abiertas_table
- V020__add_botellas_vip_fields

---

## 🧪 Tests del Backend (API REST)

### Test 1: Listar Ubicaciones Disponibles

**Endpoint:** `GET /api/botellas-abiertas/ubicaciones`

```bash
curl -X GET https://club-manegament-production.up.railway.app/api/botellas-abiertas/ubicaciones \
  -H "Authorization: Bearer $TOKEN"
```

✅ **Resultado esperado:** Lista de 5 ubicaciones

---

### Test 2: Verificar Productos Tipo Botella

**Endpoint:** `GET /api/productos`

```bash
curl -X GET https://club-manegament-production.up.railway.app/api/productos \
  -H "Authorization: Bearer $TOKEN" | jq '.[] | select(.esBotella == true) | {id, nombre, copasPorBotella, precioCopa, stockActual}'
```

✅ **Resultado esperado:**
- Al menos 1 producto con `esBotella = true`
- Tiene `copasPorBotella`, `precioCopa`, `precioBotellaVip`
- Stock > 0

**Si no hay productos tipo botella**, crearlos:
```bash
# Ver productos existentes
curl -X GET https://club-manegament-production.up.railway.app/api/productos \
  -H "Authorization: Bearer $TOKEN" | jq '.[] | {id, nombre, categoria}'
```

---

### Test 3: Abrir una Botella

**Endpoint:** `POST /api/botellas-abiertas/abrir`

```bash
curl -X POST https://club-manegament-production.up.railway.app/api/botellas-abiertas/abrir \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productoId": 1,
    "ubicacion": "BARRA_PRINCIPAL",
    "empleadoId": 1,
    "notas": "Test de apertura - Testing manual"
  }'
```

✅ **Resultado esperado:**
```json
{
  "id": 1,
  "productoId": 1,
  "productoNombre": "Vodka Absolut",
  "ubicacion": "BARRA_PRINCIPAL",
  "copasTotales": 25,
  "copasServidas": 0,
  "copasRestantes": 25,
  "estado": "ABIERTA",
  "ingresosGenerados": 0.00,
  "ingresosPotencialesPerdidos": 200.00
}
```

✅ **Verificar en BD:** Stock del producto debe haber bajado en 1

```bash
railway run psql $DATABASE_URL -c "SELECT id, nombre, stock_actual FROM productos WHERE id = 1;"
```

---

### Test 4: Listar Botellas Abiertas

**Endpoint:** `GET /api/botellas-abiertas`

```bash
curl -X GET https://club-manegament-production.up.railway.app/api/botellas-abiertas \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

✅ **Resultado esperado:** Lista con la botella recién abierta

---

### Test 5: Obtener Botellas por Ubicación

**Endpoint:** `GET /api/botellas-abiertas/ubicacion/BARRA_PRINCIPAL`

```bash
curl -X GET https://club-manegament-production.up.railway.app/api/botellas-abiertas/ubicacion/BARRA_PRINCIPAL \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

✅ **Resultado esperado:** Solo botellas en BARRA_PRINCIPAL

---

### Test 6: Calcular Copas Disponibles

**Endpoint:** `GET /api/botellas-abiertas/copas-disponibles/{productoId}`

```bash
curl -X GET https://club-manegament-production.up.railway.app/api/botellas-abiertas/copas-disponibles/1 \
  -H "Authorization: Bearer $TOKEN"
```

✅ **Resultado esperado:** Número (ej: 25)

---

### Test 7: Obtener Stock Total Consolidado

**Endpoint:** `GET /api/botellas-abiertas/stock-total`

```bash
curl -X GET https://club-manegament-production.up.railway.app/api/botellas-abiertas/stock-total \
  -H "Authorization: Bearer $TOKEN" | jq '.[] | select(.productoId == 1)'
```

✅ **Resultado esperado:**
```json
{
  "productoId": 1,
  "productoNombre": "Vodka Absolut",
  "stockCerradoBotellas": 11.00,      // Stock en almacén
  "stockAbiertoBotellas": 1,           // Botellas abiertas
  "copasDisponibles": 25,              // Copas en botellas abiertas
  "stockAbiertoEquivalenteBotellas": 1.00,  // 25 copas = 1 botella
  "stockTotalEquivalente": 12.00,      // 11 cerradas + 1 abierta
  "nivelStock": "NORMAL"
}
```

---

### Test 8: Obtener Resumen por Producto

**Endpoint:** `GET /api/botellas-abiertas/resumen`

```bash
curl -X GET https://club-manegament-production.up.railway.app/api/botellas-abiertas/resumen \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

✅ **Resultado esperado:** Estadísticas agregadas por producto

---

### Test 9: Simular Venta de Copas (via BD)

```bash
# Insertar una venta de 3 copas
railway run psql $DATABASE_URL <<'EOF'
-- Obtener IDs necesarios
DO $$
DECLARE
  v_venta_id BIGINT;
  v_botella_id BIGINT;
  v_producto_id BIGINT := 1;
  v_empleado_id BIGINT := 1;
BEGIN
  -- Obtener botella abierta
  SELECT id INTO v_botella_id
  FROM botellas_abiertas
  WHERE producto_id = v_producto_id AND estado = 'ABIERTA'
  LIMIT 1;

  IF v_botella_id IS NULL THEN
    RAISE NOTICE 'No hay botella abierta del producto 1';
    RETURN;
  END IF;

  -- Crear venta
  INSERT INTO ventas (fecha, total, metodo_pago, estado, empleado_id)
  VALUES (NOW(), 24.00, 'EFECTIVO', 'COMPLETADA', v_empleado_id)
  RETURNING id INTO v_venta_id;

  -- Crear detalle de venta (3 copas a 8€ cada una)
  INSERT INTO detalle_venta (
    venta_id, producto_id, cantidad, precio_unitario, subtotal, total,
    tipo_venta, es_copa_individual, botella_abierta_id, copas_vendidas
  ) VALUES (
    v_venta_id, v_producto_id, 3, 8.00, 24.00, 24.00,
    'COPA_INDIVIDUAL', TRUE, v_botella_id, 3
  );

  RAISE NOTICE 'Venta creada: % copas de botella %', 3, v_botella_id;
END $$;
EOF
```

✅ **Verificar:** La botella debe tener ahora:
- `copas_servidas`: 3
- `copas_restantes`: 22

```bash
curl -X GET https://club-manegament-production.up.railway.app/api/botellas-abiertas \
  -H "Authorization: Bearer $TOKEN" | jq '.[] | {id, copasServidas, copasRestantes}'
```

---

### Test 10: Verificar Alertas

**Simular botella casi vacía:**
```bash
# Actualizar una botella para que tenga solo 2 copas
railway run psql $DATABASE_URL -c "
UPDATE botellas_abiertas
SET copas_servidas = 23, copas_restantes = 2
WHERE id = 1;
"
```

**Obtener alertas:**
```bash
curl -X GET https://club-manegament-production.up.railway.app/api/botellas-abiertas/alertas \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

✅ **Resultado esperado:** La botella debe aparecer con `alerta: "CASI_VACÍA"`

---

### Test 11: Cerrar Botella

**Endpoint:** `POST /api/botellas-abiertas/cerrar`

```bash
curl -X POST https://club-manegament-production.up.railway.app/api/botellas-abiertas/cerrar \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "botellaId": 1,
    "empleadoId": 1,
    "motivo": "CERRADA",
    "notas": "Test de cierre - Botella terminada"
  }'
```

✅ **Resultado esperado:**
```json
{
  "id": 1,
  "estado": "CERRADA",
  "fechaCierre": "2025-10-11T23:45:00",
  "cerradaPorId": 1
}
```

---

## 🖥️ Tests del Frontend (UI)

### Pre-requisito: Acceder al Sistema

1. Abrir navegador: https://club-manegament-production.up.railway.app
2. Login: `admin` / `admin123`
3. **NOTA**: La página de Botellas Abiertas debe agregarse a la navegación

### Test 1: Vista Principal

**Ruta:** `/inventario/botellas-abiertas` (cuando se agregue al router)

✅ **Verificar:**
- [x] Se muestran 6 KPI cards
- [x] Total de botellas abiertas es correcto
- [x] Contador de alertas funciona
- [x] Ingresos generados se calculan bien

### Test 2: Filtro por Ubicación

✅ **Verificar:**
- [x] Dropdown muestra las 5 ubicaciones
- [x] Al seleccionar una ubicación, solo se muestran botellas de esa ubicación
- [x] "Todas" muestra todas las botellas

### Test 3: Filtro de Alertas

✅ **Verificar:**
- [x] Checkbox "Solo alertas" funciona
- [x] Muestra solo botellas con alertas activas
- [x] Contador entre paréntesis es correcto

### Test 4: Cards de Botellas

✅ **Verificar cada card:**
- [x] Muestra nombre del producto
- [x] Badge de alerta (si aplica)
- [x] Ubicación correcta
- [x] Horas abierta calculadas bien
- [x] Barra de progreso refleja consumo
- [x] Copas servidas/restantes es correcto
- [x] Ingresos generados/potenciales son correctos
- [x] Información de apertura (fecha y empleado)

### Test 5: Abrir Botella (Modal)

**Pasos:**
1. Click en "Abrir Botella"
2. Seleccionar producto tipo botella
3. Seleccionar ubicación
4. Seleccionar empleado
5. Agregar notas (opcional)
6. Click "Abrir Botella"

✅ **Verificar:**
- [x] Modal se abre correctamente
- [x] Dropdown de productos muestra solo botellas
- [x] Card de información del producto muestra datos correctos
- [x] Todas las ubicaciones están disponibles
- [x] Al enviar, muestra loading "Abriendo..."
- [x] Tras éxito, modal se cierra
- [x] Aparece notificación de éxito
- [x] Nueva botella aparece en la lista
- [x] KPIs se actualizan automáticamente

### Test 6: Cerrar Botella (Modal)

**Pasos:**
1. Click en "Cerrar Botella" en una card
2. Revisar información de la botella
3. Seleccionar motivo (CERRADA o DESPERDICIADA)
4. Seleccionar empleado
5. Agregar notas
6. Click "Cerrar Botella"

✅ **Verificar:**
- [x] Modal muestra información completa de la botella
- [x] Si tiene copas restantes, muestra warning amarillo
- [x] Radio buttons de motivo funcionan
- [x] Botón cambia color según motivo (rojo para DESPERDICIADA)
- [x] Al enviar, muestra loading
- [x] Tras éxito, botella desaparece de la lista
- [x] KPIs se actualizan

### Test 7: Auto-refresh

✅ **Verificar:**
- [x] Datos se actualizan cada 30 segundos automáticamente
- [x] No hay parpadeo al actualizar
- [x] Filtros se mantienen tras actualización

---

## 🔍 Tests de Integración

### Test 1: Flujo Completo - Apertura a Cierre

1. **Abrir botella** → Stock baja en 1
2. **Vender 20 copas** → Copas servidas: 20, restantes: 5
3. **Vender 3 copas más** → Alerta "CASI_VACÍA" se activa
4. **Vender 2 copas finales** → Botella se auto-cierra (trigger DB)
5. **Verificar:** Estado = CERRADA, fecha_cierre != null

### Test 2: Flujo de Desperdicio

1. Abrir botella (25 copas)
2. Vender 10 copas
3. Cerrar como DESPERDICIADA
4. **Verificar:**
   - Ingresos generados: 10 copas × precio
   - Ingresos perdidos: 15 copas × precio
   - Estado: DESPERDICIADA

### Test 3: Stock Dual - Validación

1. Producto con stock cerrado: 10 botellas
2. Abrir 3 botellas (cada una 25 copas)
3. Vender 40 copas de diferentes botellas
4. **Verificar stock total:**
   - Stock cerrado: 7 botellas
   - Stock abierto: 3 botellas con 35 copas restantes
   - Equivalente: 35/25 = 1.4 botellas
   - Total: 7 + 1.4 = 8.4 botellas

---

## 📊 Tests de Base de Datos

### Test 1: Verificar Triggers

**Trigger: Auto-cierre cuando se vacía**
```sql
-- Vaciar una botella
UPDATE botellas_abiertas
SET copas_servidas = 25, copas_restantes = 0
WHERE id = 1;

-- Verificar que se cerró automáticamente
SELECT id, estado, fecha_cierre FROM botellas_abiertas WHERE id = 1;
-- Esperado: estado = 'CERRADA', fecha_cierre IS NOT NULL
```

**Trigger: Descuento de stock al abrir**
```sql
-- Stock antes
SELECT id, nombre, stock_actual FROM productos WHERE id = 1;

-- Abrir botella (usar función)
SELECT abrir_botella(1, 'BARRA_VIP', 1, NULL, 'Test trigger');

-- Stock después (debe haber bajado en 1)
SELECT id, nombre, stock_actual FROM productos WHERE id = 1;
```

### Test 2: Verificar Constraints

**Constraint: Copas coherentes**
```sql
-- Esto debe FALLAR
UPDATE botellas_abiertas
SET copas_servidas = 20, copas_restantes = 10, copas_totales = 25
WHERE id = 1;
-- Error: copas_servidas + copas_restantes != copas_totales
```

**Constraint: Estado válido**
```sql
-- Esto debe FALLAR
UPDATE botellas_abiertas SET estado = 'INVALIDO' WHERE id = 1;
-- Error: estado no válido
```

### Test 3: Verificar Vistas

**Vista: v_botellas_abiertas_detalle**
```sql
SELECT * FROM v_botellas_abiertas_detalle
WHERE producto_id = 1;
-- Debe mostrar: alerta, porcentaje_consumido, ingresos_generados, etc.
```

**Vista: v_stock_total_botellas**
```sql
SELECT * FROM v_stock_total_botellas
WHERE producto_id = 1;
-- Debe mostrar: stock_cerrado, stock_abierto, nivel_stock, etc.
```

---

## ⚠️ Tests de Errores (Manejo de Excepciones)

### Test 1: Abrir Botella sin Stock

```bash
# Poner stock en 0
railway run psql $DATABASE_URL -c "UPDATE productos SET stock_actual = 0 WHERE id = 1;"

# Intentar abrir
curl -X POST https://club-manegament-production.up.railway.app/api/botellas-abiertas/abrir \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productoId": 1, "ubicacion": "BARRA_PRINCIPAL", "empleadoId": 1}'
```

✅ **Resultado esperado:** Error 400 con mensaje "No hay stock disponible"

### Test 2: Cerrar Botella Ya Cerrada

```bash
# Cerrar una botella
curl -X POST .../cerrar -d '{"botellaId": 1, "empleadoId": 1, "motivo": "CERRADA"}'

# Intentar cerrar de nuevo
curl -X POST .../cerrar -d '{"botellaId": 1, "empleadoId": 1, "motivo": "CERRADA"}'
```

✅ **Resultado esperado:** Error 400 "La botella ya está cerrada"

### Test 3: Abrir Producto que No es Botella

```bash
curl -X POST .../abrir \
  -d '{"productoId": 999, "ubicacion": "BARRA_PRINCIPAL", "empleadoId": 1}'
```

✅ **Resultado esperado:** Error 400 "El producto no es una botella"

---

## 📝 Checklist Final de Testing

### Backend API
- [ ] GET /ubicaciones - OK
- [ ] GET /botellas-abiertas - OK
- [ ] GET /botellas-abiertas/{id} - OK
- [ ] GET /producto/{id} - OK
- [ ] GET /ubicacion/{ubicacion} - OK
- [ ] GET /alertas - OK
- [ ] POST /abrir - OK (+ validaciones)
- [ ] POST /cerrar - OK (+ validaciones)
- [ ] GET /resumen - OK
- [ ] GET /copas-disponibles/{id} - OK
- [ ] GET /stock-total - OK

### Frontend UI
- [ ] Página principal carga correctamente
- [ ] 6 KPIs se muestran con datos reales
- [ ] Filtro por ubicación funciona
- [ ] Filtro de alertas funciona
- [ ] Cards de botellas muestran info completa
- [ ] Modal abrir botella funciona
- [ ] Modal cerrar botella funciona
- [ ] Notificaciones toast aparecen
- [ ] Auto-refresh (30s) funciona
- [ ] Responsive (mobile/tablet/desktop)

### Base de Datos
- [ ] Trigger auto-cierre funciona
- [ ] Trigger descuento stock funciona
- [ ] Constraints validan datos
- [ ] Vistas devuelven datos correctos
- [ ] Funciones auxiliares funcionan

### Integración
- [ ] Flujo completo apertura → venta → cierre
- [ ] Stock dual se calcula correctamente
- [ ] Alertas se activan en el momento correcto
- [ ] Auditoría (empleados) se registra

---

## 🐛 Reporte de Bugs

**Formato para reportar:**
```markdown
### Bug: [Título]
**Fecha:** YYYY-MM-DD
**Severidad:** Critical / High / Medium / Low
**Componente:** Backend / Frontend / BD
**Pasos para reproducir:**
1. ...
2. ...
**Resultado esperado:** ...
**Resultado actual:** ...
**Logs/Screenshots:** ...
```

---

## ✅ Criterios de Aceptación

El sistema se considera **APROBADO** si:

1. ✅ Todos los endpoints del backend responden correctamente
2. ✅ La UI muestra datos en tiempo real sin errores
3. ✅ Los triggers de BD ejecutan correctamente
4. ✅ El stock dual se calcula con precisión
5. ✅ Las alertas se activan cuando corresponde
6. ✅ No hay errores en consola del navegador
7. ✅ No hay errores en logs del backend
8. ✅ La experiencia de usuario es fluida

---

**Última actualización:** 11 Octubre 2025
**Versión del sistema:** 1.0.0
