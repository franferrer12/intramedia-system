# API de Sistema de Botellas VIP

## Descripción General

Sistema completo para gestión de botellas abiertas en barra con tracking preciso de copas servidas y stock dual (almacén + barra).

**Beneficios clave:**
- ✅ Reducción de mermas hasta 30%
- ✅ Control preciso de stock abierto vs cerrado
- ✅ Precios diferenciados (copa, botella completa, pack VIP)
- ✅ Alertas automáticas de botellas casi vacías
- ✅ Análisis de rentabilidad por tipo de venta

---

## 📊 Arquitectura del Sistema

### Stack Tecnológico
- **Backend**: Spring Boot 3.2 + Java 17
- **Base de datos**: PostgreSQL 15
- **ORM**: JPA/Hibernate
- **Migraciones**: Flyway
- **Seguridad**: Spring Security + JWT

### Componentes

```
Database (PostgreSQL)
    ↓
Entities (JPA)
    ↓
Repositories (Spring Data)
    ↓
Services (Business Logic)
    ↓
Controllers (REST API)
    ↓
Frontend (React)
```

---

## 🗄️ Modelo de Datos

### Tabla: `botellas_abiertas`

```sql
CREATE TABLE botellas_abiertas (
    id BIGSERIAL PRIMARY KEY,
    producto_id BIGINT NOT NULL REFERENCES productos(id),
    sesion_caja_id BIGINT REFERENCES sesiones_caja(id),
    ubicacion VARCHAR(100) NOT NULL,
    copas_totales INTEGER NOT NULL,
    copas_servidas INTEGER DEFAULT 0 NOT NULL,
    copas_restantes INTEGER NOT NULL,
    fecha_apertura TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_cierre TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'ABIERTA' NOT NULL,
    abierta_por BIGINT REFERENCES empleados(id),
    cerrada_por BIGINT REFERENCES empleados(id),
    notas TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Campos en `productos` (nuevos)

```sql
ALTER TABLE productos ADD COLUMN
    copas_por_botella INTEGER,
    precio_copa DECIMAL(10,2),
    precio_botella_vip DECIMAL(10,2),
    es_botella BOOLEAN DEFAULT FALSE;
```

### Campos en `detalle_venta` (nuevos)

```sql
ALTER TABLE detalle_venta ADD COLUMN
    tipo_venta VARCHAR(20) DEFAULT 'NORMAL',
    es_copa_individual BOOLEAN DEFAULT FALSE,
    botella_abierta_id BIGINT REFERENCES botellas_abiertas(id),
    copas_vendidas INTEGER,
    descuento_pack_vip DECIMAL(10,2) DEFAULT 0,
    notas_venta TEXT;
```

---

## 🔌 API REST Endpoints

### Base URL
```
http://localhost:8080/api/botellas-abiertas
```

### Autenticación
Todos los endpoints requieren autenticación JWT:
```
Authorization: Bearer {token}
```

---

### 1. Obtener botellas abiertas

**GET** `/api/botellas-abiertas`

**Permisos**: `ADMIN`, `GERENTE`, `ENCARGADO`, `LECTURA`

**Respuesta exitosa (200)**:
```json
[
  {
    "id": 1,
    "productoId": 5,
    "productoNombre": "Vodka Absolut",
    "productoCategoria": "BEBIDAS",
    "precioCopa": 8.00,
    "sesionCajaId": 12,
    "ubicacion": "BARRA_PRINCIPAL",
    "copasTotales": 25,
    "copasServidas": 12,
    "copasRestantes": 13,
    "porcentajeConsumido": 48.0,
    "fechaApertura": "2025-10-11T20:30:00",
    "fechaCierre": null,
    "horasAbierta": 3,
    "estado": "ABIERTA",
    "abiertaPorId": 2,
    "abiertaPorNombre": "Juan Pérez",
    "cerradaPorId": null,
    "cerradaPorNombre": null,
    "ingresosGenerados": 96.00,
    "ingresosPotencialesPerdidos": 104.00,
    "alerta": null,
    "notas": "Botella para turno noche",
    "createdAt": "2025-10-11T20:30:00",
    "updatedAt": "2025-10-11T23:15:00",
    "isCasiVacia": false,
    "isVacia": false,
    "isAbiertaMas24Horas": false
  }
]
```

---

### 2. Obtener todas las botellas (incluye cerradas)

**GET** `/api/botellas-abiertas/todas`

**Permisos**: `ADMIN`, `GERENTE`, `LECTURA`

**Respuesta**: Similar al endpoint anterior, incluye botellas con estado `CERRADA` y `DESPERDICIADA`.

---

### 3. Obtener botella por ID

**GET** `/api/botellas-abiertas/{id}`

**Permisos**: `ADMIN`, `GERENTE`, `ENCARGADO`, `LECTURA`

**Parámetros**:
- `id` (path): ID de la botella

**Respuesta exitosa (200)**: Objeto `BotellaAbiertaDTO`

**Error (404)**:
```json
{
  "error": "Botella no encontrada con ID: 999"
}
```

---

### 4. Filtrar por producto

**GET** `/api/botellas-abiertas/producto/{productoId}`

**Permisos**: `ADMIN`, `GERENTE`, `ENCARGADO`, `LECTURA`

**Parámetros**:
- `productoId` (path): ID del producto

**Respuesta**: Lista de botellas abiertas del producto especificado.

---

### 5. Filtrar por ubicación

**GET** `/api/botellas-abiertas/ubicacion/{ubicacion}`

**Permisos**: `ADMIN`, `GERENTE`, `ENCARGADO`

**Parámetros**:
- `ubicacion` (path): Ubicación (ej: `BARRA_PRINCIPAL`, `BARRA_VIP`)

**Ubicaciones disponibles**:
- `BARRA_PRINCIPAL`
- `BARRA_VIP`
- `COCTELERIA`
- `TERRAZA`
- `SALA_EVENTOS`

**Respuesta**: Lista de botellas abiertas en la ubicación especificada.

---

### 6. Obtener botellas con alertas

**GET** `/api/botellas-abiertas/alertas`

**Permisos**: `ADMIN`, `GERENTE`, `ENCARGADO`

**Alertas detectadas**:
- `VACÍA`: 0 copas restantes
- `CASI_VACÍA`: ≤ 3 copas restantes
- `ABIERTA_MAS_24H`: Abierta hace más de 24 horas

**Respuesta**: Lista de botellas con alertas activas.

---

### 7. Abrir nueva botella

**POST** `/api/botellas-abiertas/abrir`

**Permisos**: `ADMIN`, `GERENTE`, `ENCARGADO`

**Body**:
```json
{
  "productoId": 5,
  "ubicacion": "BARRA_PRINCIPAL",
  "empleadoId": 2,
  "sesionCajaId": 12,
  "notas": "Apertura de botella para turno noche"
}
```

**Campos**:
- `productoId` (required): ID del producto a abrir
- `ubicacion` (required): Ubicación donde se abrirá
- `empleadoId` (required): ID del empleado que abre
- `sesionCajaId` (optional): ID de la sesión de caja activa
- `notas` (optional): Notas adicionales

**Validaciones automáticas**:
- ✅ El producto debe ser tipo botella (`es_botella = true`)
- ✅ Debe tener stock disponible (≥ 1)
- ✅ Debe tener `copas_por_botella` configurado
- ✅ El empleado debe existir

**Comportamiento**:
- Descuenta automáticamente 1 botella del stock cerrado (trigger DB)
- Registra movimiento de stock tipo `SALIDA`
- Inicializa copas servidas = 0, copas restantes = copas_por_botella

**Respuesta exitosa (201)**:
```json
{
  "id": 15,
  "productoId": 5,
  "productoNombre": "Vodka Absolut",
  "ubicacion": "BARRA_PRINCIPAL",
  "copasTotales": 25,
  "copasServidas": 0,
  "copasRestantes": 25,
  "estado": "ABIERTA",
  "fechaApertura": "2025-10-11T20:30:00",
  ...
}
```

**Errores**:
```json
// 400 - Producto no es botella
{
  "error": "El producto 'Coca Cola' no es una botella"
}

// 400 - Sin stock
{
  "error": "No hay stock disponible de 'Vodka Absolut'. Stock actual: 0"
}

// 404 - Producto no encontrado
{
  "error": "Producto no encontrado con ID: 999"
}
```

---

### 8. Cerrar botella

**POST** `/api/botellas-abiertas/cerrar`

**Permisos**: `ADMIN`, `GERENTE`, `ENCARGADO`

**Body**:
```json
{
  "botellaId": 15,
  "empleadoId": 2,
  "motivo": "CERRADA",
  "notas": "Botella terminada correctamente"
}
```

**Campos**:
- `botellaId` (required): ID de la botella a cerrar
- `empleadoId` (required): ID del empleado que cierra
- `motivo` (required): `CERRADA` o `DESPERDICIADA`
- `notas` (optional): Motivo del cierre

**Motivos de cierre**:
- `CERRADA`: Botella terminada normalmente
- `DESPERDICIADA`: Botella rota, derramada o desperdiciada

**Validaciones**:
- ✅ La botella debe existir
- ✅ Debe estar en estado `ABIERTA`
- ✅ El empleado debe existir

**Respuesta exitosa (200)**:
```json
{
  "id": 15,
  "estado": "CERRADA",
  "fechaCierre": "2025-10-12T02:15:00",
  "cerradaPorId": 2,
  "cerradaPorNombre": "Juan Pérez",
  "copasServidas": 25,
  "copasRestantes": 0,
  ...
}
```

---

### 9. Resumen por producto

**GET** `/api/botellas-abiertas/resumen`

**Permisos**: `ADMIN`, `GERENTE`, `LECTURA`

**Respuesta**:
```json
[
  {
    "productoId": 5,
    "productoNombre": "Vodka Absolut",
    "categoria": "BEBIDAS",
    "totalBotellasAbiertas": 3,
    "totalCopasServidas": 42,
    "totalCopasDisponibles": 33,
    "equivalenteBotellas": 1.32,
    "ubicaciones": ["BARRA_PRINCIPAL", "BARRA_VIP"],
    "botellaMasAntigua": "2025-10-10T18:00:00",
    "botellaMasReciente": "2025-10-11T22:30:00",
    "tieneAlertaCasiVacia": true,
    "tieneAlertaMas24h": false,
    "botellasConAlertas": 1
  }
]
```

---

### 10. Copas disponibles

**GET** `/api/botellas-abiertas/copas-disponibles/{productoId}`

**Permisos**: `ADMIN`, `GERENTE`, `ENCARGADO`, `LECTURA`

**Respuesta**:
```json
33
```

**Descripción**: Suma de `copas_restantes` de todas las botellas abiertas del producto.

---

### 11. Stock total consolidado

**GET** `/api/botellas-abiertas/stock-total`

**Permisos**: `ADMIN`, `GERENTE`, `LECTURA`

**Respuesta**:
```json
[
  {
    "productoId": 5,
    "productoNombre": "Vodka Absolut",
    "categoria": "BEBIDAS",
    "stockCerradoBotellas": 12.00,
    "stockAbiertoBotellas": 3,
    "copasDisponibles": 33,
    "stockAbiertoEquivalenteBotellas": 1.32,
    "stockTotalEquivalente": 13.32,
    "stockMinimo": 5.00,
    "stockMaximo": 30.00,
    "nivelStock": "NORMAL",
    "ubicacionesBotellas": ["BARRA_PRINCIPAL", "BARRA_VIP"]
  }
]
```

**Niveles de stock**:
- `BAJO`: stock_total ≤ stock_minimo
- `NORMAL`: stock_minimo < stock_total < stock_maximo
- `ALTO`: stock_total ≥ stock_maximo

---

### 12. Ubicaciones predefinidas

**GET** `/api/botellas-abiertas/ubicaciones`

**Permisos**: `ADMIN`, `GERENTE`, `ENCARGADO`

**Respuesta**:
```json
[
  "BARRA_PRINCIPAL",
  "BARRA_VIP",
  "COCTELERIA",
  "TERRAZA",
  "SALA_EVENTOS"
]
```

---

## 🔄 Flujo de Trabajo Típico

### Apertura de Turno

1. **Inventario inicial**
   ```bash
   GET /api/botellas-abiertas/stock-total
   ```

2. **Abrir botellas necesarias**
   ```bash
   POST /api/botellas-abiertas/abrir
   {
     "productoId": 5,
     "ubicacion": "BARRA_PRINCIPAL",
     "empleadoId": 2,
     "sesionCajaId": 12
   }
   ```

### Durante el Turno

3. **Verificar alertas periódicamente**
   ```bash
   GET /api/botellas-abiertas/alertas
   ```

4. **Consultar copas disponibles**
   ```bash
   GET /api/botellas-abiertas/copas-disponibles/5
   ```

5. **Vender copas** (desde POS)
   - El sistema actualiza automáticamente `copas_servidas` y `copas_restantes`
   - Trigger DB sincroniza con `detalle_venta`

### Cierre de Turno

6. **Revisar botellas abiertas**
   ```bash
   GET /api/botellas-abiertas
   ```

7. **Cerrar botellas vacías**
   ```bash
   POST /api/botellas-abiertas/cerrar
   {
     "botellaId": 15,
     "empleadoId": 2,
     "motivo": "CERRADA"
   }
   ```

8. **Generar reporte**
   ```bash
   GET /api/botellas-abiertas/resumen
   ```

---

## 🎯 Casos de Uso

### Caso 1: Venta de Copas Individuales

**Escenario**: Cliente pide 2 gin-tonics

1. Frontend POS muestra botellas disponibles
2. Bartender selecciona producto y cantidad
3. Sistema valida copas disponibles
4. Se crea `detalle_venta`:
   ```json
   {
     "productoId": 5,
     "cantidad": 2,
     "precioUnitario": 8.00,
     "tipoVenta": "COPA_INDIVIDUAL",
     "esCopaIndividual": true,
     "botellaAbiertaId": 15,
     "copasVendidas": 2
   }
   ```
5. Trigger DB actualiza `botellas_abiertas`:
   - `copas_servidas`: 12 → 14
   - `copas_restantes`: 13 → 11

### Caso 2: Pack VIP (Botella Completa)

**Escenario**: Mesa VIP compra botella completa

1. Se crea `detalle_venta`:
   ```json
   {
     "productoId": 5,
     "cantidad": 1,
     "precioUnitario": 180.00,
     "tipoVenta": "PACK_VIP",
     "descuentoPackVip": 20.00
   }
   ```
2. Trigger DB descuenta 1 del stock cerrado
3. NO se abre automáticamente (opcional después)

### Caso 3: Alerta de Botella Casi Vacía

**Escenario**: Botella con ≤ 3 copas restantes

1. Sistema detecta alerta: `CASI_VACÍA`
2. Frontend muestra notificación
3. Opciones:
   - Abrir nueva botella del mismo producto
   - Esperar a que se termine
   - Cerrar manualmente si está dañada

---

## 🛡️ Seguridad y Permisos

### Matriz de Permisos

| Endpoint | ADMIN | GERENTE | ENCARGADO | LECTURA |
|----------|-------|---------|-----------|---------|
| GET /botellas-abiertas | ✅ | ✅ | ✅ | ✅ |
| GET /botellas-abiertas/todas | ✅ | ✅ | ❌ | ✅ |
| GET /{id} | ✅ | ✅ | ✅ | ✅ |
| POST /abrir | ✅ | ✅ | ✅ | ❌ |
| POST /cerrar | ✅ | ✅ | ✅ | ❌ |
| GET /resumen | ✅ | ✅ | ❌ | ✅ |
| GET /stock-total | ✅ | ✅ | ❌ | ✅ |
| GET /alertas | ✅ | ✅ | ✅ | ❌ |

---

## 📈 Métricas y KPIs

### Disponibles en `/resumen`

1. **Eficiencia de Uso**
   ```
   Eficiencia = (copas_servidas / copas_totales) × 100
   ```

2. **Desperdicio**
   ```
   Desperdicio = copas_restantes × precio_copa (en botellas DESPERDICIADA)
   ```

3. **Ingresos Potenciales**
   ```
   Ingresos = copas_restantes × precio_copa (en botellas ABIERTA)
   ```

4. **Ratio Stock Abierto/Cerrado**
   ```
   Ratio = stock_abierto_equivalente / stock_cerrado
   ```

---

## 🧪 Testing

### Ejemplos con cURL

```bash
# 1. Obtener token de autenticación
TOKEN=$(curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.token')

# 2. Listar botellas abiertas
curl -X GET http://localhost:8080/api/botellas-abiertas \
  -H "Authorization: Bearer $TOKEN"

# 3. Abrir nueva botella
curl -X POST http://localhost:8080/api/botellas-abiertas/abrir \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productoId": 5,
    "ubicacion": "BARRA_PRINCIPAL",
    "empleadoId": 1,
    "notas": "Test de apertura"
  }'

# 4. Obtener stock total
curl -X GET http://localhost:8080/api/botellas-abiertas/stock-total \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🐛 Troubleshooting

### Error: "El producto no es una botella"

**Causa**: El producto no tiene `es_botella = true`

**Solución**: Actualizar producto:
```sql
UPDATE productos
SET es_botella = TRUE,
    copas_por_botella = 25,
    precio_copa = 8.00,
    precio_botella_vip = 180.00
WHERE id = 5;
```

### Error: "No hay stock disponible"

**Causa**: `stock_actual < 1`

**Solución**: Registrar entrada de stock:
```sql
UPDATE productos SET stock_actual = stock_actual + 10 WHERE id = 5;
```

### Error: "Botella ya está cerrada"

**Causa**: Intentando cerrar una botella con estado `CERRADA` o `DESPERDICIADA`

**Solución**: Verificar estado antes de cerrar.

---

## 📚 Referencias

- [Caso de Uso Original](../BOTELLAS_VIP_CASO_USO.md)
- [Migraciones de BD](../backend/src/main/resources/db/migration/)
- [Entidad BotellaAbierta](../backend/src/main/java/com/club/management/entity/BotellaAbierta.java)
- [Servicio](../backend/src/main/java/com/club/management/service/BotellaAbiertaService.java)
- [Controller](../backend/src/main/java/com/club/management/controller/BotellaAbiertaController.java)

---

**Versión**: 1.0.0
**Fecha**: 11 Octubre 2025
**Autor**: Sistema Club Management
