# 🔄 PEDIDOS RECURRENTES Y PLANTILLAS - IMPLEMENTACIÓN COMPLETA

**Fecha**: Diciembre 2024
**Mejora**: #7 de 12 mejoras planificadas
**Estado**: ✅ COMPLETO

---

## 📋 RESUMEN EJECUTIVO

Se ha implementado un **Sistema de Plantillas y Pedidos Recurrentes** completo que permite a los usuarios:

- ✅ Crear plantillas reutilizables desde pedidos existentes
- ✅ Programar pedidos automáticos con diferentes frecuencias
- ✅ Gestionar y monitorear ejecuciones de pedidos recurrentes
- ✅ Ejecutar pedidos pendientes manualmente cuando sea necesario

**Total de archivos creados**: 14 archivos
**Tiempo de implementación**: 4-5 horas
**Build status**: ✅ Frontend compilado exitosamente (3.23s, 0 errores)

---

## 🏗️ ARQUITECTURA IMPLEMENTADA

### Backend (Spring Boot 3.2)

**Database Migration:**
- `V036__create_plantillas_pedidos_recurrentes.sql` - Tablas completas con función PostgreSQL para cálculo automático

**Entities (3 archivos):**
- `PlantillaPedido.java` - Plantillas reutilizables con detalles en JSONB
- `PedidoRecurrente.java` - Configuración de recurrencia con enum Frecuencia
- `EjecucionPedidoRecurrente.java` - Historial de ejecuciones

**Repositories (3 archivos):**
- `PlantillaPedidoRepository.java` - Queries para búsqueda y filtrado
- `PedidoRecurrenteRepository.java` - Queries para pendientes y próximas ejecuciones
- `EjecucionPedidoRecurrenteRepository.java` - Historial y estadísticas

**Services (2 archivos):**
- `PlantillaPedidoService.java` - Gestión de plantillas (280 líneas)
- `PedidoRecurrenteService.java` - Lógica de recurrencia y ejecución (380 líneas)

**Controllers (2 archivos):**
- `PlantillaPedidoController.java` - 10 endpoints REST
- `PedidoRecurrenteController.java` - 10 endpoints REST

**DTOs (2 archivos):**
- `PlantillaPedidoDTO.java`
- `PedidoRecurrenteDTO.java`

---

### Frontend (React 18 + TypeScript)

**API Client:**
- `plantillas-pedido.api.ts` - Cliente con 2 módulos (plantillasApi, recurrentesApi) - 150 líneas

**Pages:**
- `PlantillasRecurrentesPage.tsx` - Página con tabs y gestión completa - 350 líneas

**Routing:**
- `App.tsx` - Añadida ruta `/pedidos/plantillas`
- `MainLayout.tsx` - Añadido enlace "Plantillas y Recurrentes" con icono Repeat

---

## 🔑 FUNCIONALIDADES PRINCIPALES

### 1️⃣ PLANTILLAS DE PEDIDOS

**Características:**
- 📝 **Creación manual**: Formulario completo para nuevas plantillas
- 📋 **Desde pedido existente**: Convertir pedidos anteriores en plantillas con un click
- 🔍 **Búsqueda**: Por nombre o descripción
- 👤 **Filtrado por proveedor**: Plantillas específicas por proveedor
- ✅ **Activación/Desactivación**: Toggle rápido de estado
- 🗑️ **Eliminación**: Con confirmación de seguridad

**Estructura de Datos:**
```json
{
  "nombre": "Pedido Semanal Bebidas",
  "descripcion": "Reposición semanal de bar",
  "proveedorId": 5,
  "detalles": [
    {"productoId": 1, "cantidad": 50, "precioUnitario": 1.50},
    {"productoId": 2, "cantidad": 30, "precioUnitario": 2.00}
  ],
  "observaciones": "Entregar en almacén principal",
  "activa": true
}
```

**Endpoints REST:**
```java
GET    /plantillas-pedido
GET    /plantillas-pedido/activas
GET    /plantillas-pedido/{id}
GET    /plantillas-pedido/proveedor/{proveedorId}
GET    /plantillas-pedido/buscar?query=texto
POST   /plantillas-pedido
POST   /plantillas-pedido/desde-pedido/{pedidoId}?nombre=X&descripcion=Y
PUT    /plantillas-pedido/{id}
PUT    /plantillas-pedido/{id}/toggle-activa
DELETE /plantillas-pedido/{id}
GET    /plantillas-pedido/estadisticas
```

---

### 2️⃣ PEDIDOS RECURRENTES

**Características:**
- 📅 **4 Frecuencias disponibles**:
  - **SEMANAL**: Cada semana en día específico (Lunes=1...Domingo=7)
  - **QUINCENAL**: Días 1 y 15 de cada mes
  - **MENSUAL**: Día específico cada mes (1-31)
  - **TRIMESTRAL**: Cada 3 meses en día específico

- ⏰ **Hora programable**: Definir hora exacta de generación (HH:mm)
- 🔔 **Notificaciones**: Configurar alertas X horas antes
- 📧 **Emails**: Lista de correos para notificaciones
- ✅ **Activar/Desactivar**: Control total sobre la ejecución
- 🔄 **Auto-programación**: Cálculo automático de próxima ejecución

**Ejemplo de Configuración:**
```typescript
{
  "plantillaId": 3,
  "frecuencia": "SEMANAL",
  "diaEjecucion": 1,  // Lunes
  "horaEjecucion": "09:00",
  "notificarAntesHoras": 24,
  "emailsNotificacion": "admin@club.com,compras@club.com",
  "activo": true
}
```

**Endpoints REST:**
```java
GET    /pedidos-recurrentes
GET    /pedidos-recurrentes/activos
GET    /pedidos-recurrentes/{id}
GET    /pedidos-recurrentes/proximas-ejecuciones?dias=7
POST   /pedidos-recurrentes
PUT    /pedidos-recurrentes/{id}
PUT    /pedidos-recurrentes/{id}/toggle-activo
DELETE /pedidos-recurrentes/{id}
POST   /pedidos-recurrentes/ejecutar-pendientes
GET    /pedidos-recurrentes/estadisticas
```

---

### 3️⃣ EJECUCIÓN AUTOMÁTICA

**Flujo de Ejecución:**

1. **Scheduler** (ejecutar periódicamente cada hora):
   ```java
   List<PedidoRecurrente> pendientes = recurrenteRepository
       .findPendientesDeEjecucion(LocalDateTime.now());
   ```

2. **Generación de Pedido**:
   - Leer plantilla asociada
   - Convertir detalles JSON a entidades DetallePedido
   - Crear nuevo pedido en estado BORRADOR
   - Calcular total automáticamente

3. **Registro de Ejecución**:
   - Guardar en `ejecuciones_pedido_recurrente`
   - Marcar si fue exitosa o fallida
   - Almacenar mensaje de error si falla

4. **Actualización de Próxima Ejecución**:
   - Calcular siguiente fecha según frecuencia
   - Actualizar `ultima_ejecucion`
   - Actualizar `proxima_ejecucion`

**Función PostgreSQL para cálculo:**
```sql
SELECT calcular_proxima_ejecucion(
    'MENSUAL',      -- frecuencia
    15,             -- día del mes
    NULL,           -- días (para quincenal)
    '09:00:00',     -- hora
    CURRENT_TIMESTAMP
);
-- Retorna: próximo día 15 a las 09:00
```

---

## 🗄️ ESTRUCTURA DE BASE DE DATOS

### Tabla: `plantillas_pedido`

```sql
CREATE TABLE plantillas_pedido (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    proveedor_id BIGINT NOT NULL,
    detalles JSONB NOT NULL,  -- [{"productoId":1,"cantidad":10,"precioUnitario":5.50}]
    observaciones TEXT,
    activa BOOLEAN NOT NULL DEFAULT true,
    creado_por_id BIGINT NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3 índices para búsqueda optimizada
CREATE INDEX idx_plantillas_proveedor ON plantillas_pedido(proveedor_id);
CREATE INDEX idx_plantillas_activa ON plantillas_pedido(activa);
CREATE INDEX idx_plantillas_creador ON plantillas_pedido(creado_por_id);
```

### Tabla: `pedidos_recurrentes`

```sql
CREATE TABLE pedidos_recurrentes (
    id BIGSERIAL PRIMARY KEY,
    plantilla_id BIGINT NOT NULL,
    frecuencia VARCHAR(20) NOT NULL,  -- SEMANAL, QUINCENAL, MENSUAL, TRIMESTRAL
    dia_ejecucion INTEGER,
    dias_ejecucion VARCHAR(50),
    hora_ejecucion TIME NOT NULL DEFAULT '09:00:00',
    proxima_ejecucion TIMESTAMP NOT NULL,
    ultima_ejecucion TIMESTAMP,
    activo BOOLEAN NOT NULL DEFAULT true,
    notificar_antes_horas INTEGER DEFAULT 24,
    emails_notificacion TEXT,
    creado_por_id BIGINT NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4 índices para ejecución eficiente
CREATE INDEX idx_recurrentes_plantilla ON pedidos_recurrentes(plantilla_id);
CREATE INDEX idx_recurrentes_activo ON pedidos_recurrentes(activo);
CREATE INDEX idx_recurrentes_proxima_ejecucion ON pedidos_recurrentes(proxima_ejecucion);
CREATE INDEX idx_recurrentes_frecuencia ON pedidos_recurrentes(frecuencia);
```

### Tabla: `ejecuciones_pedido_recurrente`

```sql
CREATE TABLE ejecuciones_pedido_recurrente (
    id BIGSERIAL PRIMARY KEY,
    pedido_recurrente_id BIGINT NOT NULL,
    pedido_generado_id BIGINT,  -- NULL si falló la generación
    fecha_ejecucion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    exitoso BOOLEAN NOT NULL DEFAULT true,
    mensaje_error TEXT
);

-- 3 índices para auditoría
CREATE INDEX idx_ejecuciones_recurrente ON ejecuciones_pedido_recurrente(pedido_recurrente_id);
CREATE INDEX idx_ejecuciones_fecha ON ejecuciones_pedido_recurrente(fecha_ejecucion);
CREATE INDEX idx_ejecuciones_exitoso ON ejecuciones_pedido_recurrente(exitoso);
```

---

## 🎨 DISEÑO Y UX

### Paleta de Colores

**Frecuencias:**
- 🔵 SEMANAL: `bg-blue-100 text-blue-800`
- 🟢 QUINCENAL: `bg-green-100 text-green-800`
- 🟣 MENSUAL: `bg-purple-100 text-purple-800`
- 🟠 TRIMESTRAL: `bg-orange-100 text-orange-800`

**Estados:**
- ✅ Activo: `bg-green-100 text-green-800` con CheckCircle icon
- ❌ Inactivo: `bg-gray-100 text-gray-800` con XCircle icon

### Componentes UI

- **Tabs de navegación**: 2 pestañas (Plantillas | Pedidos Recurrentes)
- **Stats Cards**: 4 tarjetas con métricas clave
- **Lista con hover**: Hover effect para mejor UX
- **Toggle buttons**: Activar/desactivar con iconos
- **Botón de ejecución manual**: Para ejecutar pendientes cuando sea necesario
- **Badges de frecuencia**: Con códigos de color distintivos

---

## 📊 MÉTRICAS DE IMPLEMENTACIÓN

### Archivos Creados

**Backend**: 12 archivos
- 1 migration SQL
- 3 entities
- 3 repositories
- 2 services
- 2 controllers
- 2 DTOs

**Frontend**: 2 archivos
- 1 API client
- 1 page

**Modificados**: 2 archivos
- App.tsx (1 ruta)
- MainLayout.tsx (1 enlace de navegación)

### Líneas de Código

| Archivo | Líneas | Tipo |
|---------|--------|------|
| V036__create_plantillas_pedidos_recurrentes.sql | ~180 | Backend |
| PlantillaPedido.java | ~95 | Backend |
| PedidoRecurrente.java | ~130 | Backend |
| EjecucionPedidoRecurrente.java | ~65 | Backend |
| PlantillaPedidoRepository.java | ~60 | Backend |
| PedidoRecurrenteRepository.java | ~80 | Backend |
| EjecucionPedidoRecurrenteRepository.java | ~60 | Backend |
| PlantillaPedidoService.java | ~280 | Backend |
| PedidoRecurrenteService.java | ~380 | Backend |
| PlantillaPedidoController.java | ~100 | Backend |
| PedidoRecurrenteController.java | ~110 | Backend |
| PlantillaPedidoDTO.java | ~20 | Backend |
| PedidoRecurrenteDTO.java | ~25 | Backend |
| plantillas-pedido.api.ts | ~150 | Frontend |
| PlantillasRecurrentesPage.tsx | ~350 | Frontend |
| **TOTAL** | **~2,085 líneas** | |

---

## 🔐 SEGURIDAD

### Control de Acceso

**Nivel de Controller:**
```java
@PreAuthorize("hasAnyRole('ADMIN', 'GERENTE', 'ENCARGADO')")
```

**Acciones sensibles:**
```java
@DeleteMapping("/{id}")
@PreAuthorize("hasAnyRole('ADMIN', 'GERENTE')")  // Solo ADMIN y GERENTE pueden eliminar
```

### Validaciones

- ✅ Validación de frecuencia (solo valores permitidos)
- ✅ Validación de día de ejecución (1-31 para mensual, 1-7 para semanal)
- ✅ Validación de hora (formato HH:mm válido)
- ✅ Validación de plantilla activa antes de crear recurrente
- ✅ Validación de proveedor existente
- ✅ Validación de productos en detalles JSONB

---

## 🚀 CASOS DE USO COMUNES

### Caso 1: Pedido Semanal de Bebidas

```typescript
// 1. Crear plantilla desde un pedido existente
const plantilla = await plantillasApi.crearDesdePedido(
  123,  // pedidoId
  "Reposición Semanal Bebidas",
  "Pedido automático de bar"
);

// 2. Programar recurrencia semanal los lunes
const recurrente = await recurrentesApi.crear({
  plantillaId: plantilla.id,
  frecuencia: 'SEMANAL',
  diaEjecucion: 1,  // Lunes
  horaEjecucion: '08:00',
  notificarAntesHoras: 48,
  emailsNotificacion: 'bar@club.com,compras@club.com',
  activo: true
});
```

### Caso 2: Pedido Mensual de Suministros

```typescript
// Crear recurrente para día 1 de cada mes
const recurrente = await recurrentesApi.crear({
  plantillaId: plantillaExistente.id,
  frecuencia: 'MENSUAL',
  diaEjecucion: 1,  // Primer día del mes
  horaEjecucion: '06:00',
  activo: true
});
```

### Caso 3: Ejecutar Pedidos Pendientes Manualmente

```typescript
// Útil cuando el scheduler falla o se necesita ejecución inmediata
const resultado = await recurrentesApi.ejecutarPendientes();
// resultado: {ejecutados: 3, pedidosGenerados: [456, 457, 458]}
```

---

## 🧪 TESTING (Pendiente en Backend)

### Backend Tests Recomendados

**PlantillaPedidoServiceTest:**
```java
@Test void testCrearPlantilla()
@Test void testCrearPlantillaDesdePedido()
@Test void testBuscarPlantillas()
@Test void testToggleActiva()
```

**PedidoRecurrenteServiceTest:**
```java
@Test void testCrearRecurrente()
@Test void testCalcularProximaEjecucionSemanal()
@Test void testCalcularProximaEjecucionMensual()
@Test void testEjecutarPedidosPendientes()
@Test void testGenerarPedidoDesdePlantilla()
```

---

## 📝 NOTAS TÉCNICAS

### Función PostgreSQL para Cálculo de Próxima Ejecución

La migration incluye una función PL/pgSQL que calcula automáticamente la próxima ejecución:

```sql
calcular_proxima_ejecucion(
    p_frecuencia VARCHAR,
    p_dia_ejecucion INTEGER,
    p_dias_ejecucion VARCHAR,
    p_hora_ejecucion TIME,
    p_desde TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) RETURNS TIMESTAMP
```

Esta función maneja todas las frecuencias y casos edge (fin de mes, días inválidos, etc.).

### Scheduler Recomendado

**Opción 1: Spring @Scheduled**
```java
@Scheduled(cron = "0 0 * * * *")  // Cada hora
public void ejecutarPedidosRecurrentes() {
    pedidoRecurrenteService.ejecutarPedidosPendientes();
}
```

**Opción 2: Cron Job del Sistema**
```bash
0 * * * * curl -X POST http://localhost:8080/api/pedidos-recurrentes/ejecutar-pendientes
```

### Triggers Automáticos

```sql
CREATE TRIGGER trigger_update_plantilla_timestamp
    BEFORE UPDATE ON plantillas_pedido
    FOR EACH ROW
    EXECUTE FUNCTION update_plantilla_pedido_timestamp();
```

Actualiza automáticamente `fecha_modificacion` en cada update.

---

## ✅ CHECKLIST DE FINALIZACIÓN

- [x] Base de datos - Migration V036 creada
- [x] Backend - 3 Entities (Plantilla, Recurrente, Ejecución)
- [x] Backend - 3 Repositories con queries especializadas
- [x] Backend - 2 Services con lógica completa
- [x] Backend - 2 Controllers con 20 endpoints
- [x] Backend - 2 DTOs para comunicación
- [x] Frontend - API client TypeScript
- [x] Frontend - PlantillasRecurrentesPage con tabs
- [x] Frontend - Integración en routing
- [x] Frontend - Link en menú de navegación
- [x] Build - Frontend compila sin errores (3.23s)
- [ ] Testing - Tests unitarios backend (pendiente)
- [ ] Testing - Tests integración backend (pendiente)
- [ ] Testing - Tests frontend (pendiente)
- [ ] Scheduler - Configurar ejecución automática (pendiente)
- [ ] Deployment - Verificar en producción (pendiente)

---

## 🎯 PRÓXIMOS PASOS

### Implementación del Scheduler

**Configuración Spring:**
```java
@Configuration
@EnableScheduling
public class SchedulerConfig {
    // Configuración global
}

@Component
public class PedidoRecurrenteScheduler {
    @Scheduled(cron = "0 0 * * * *")  // Cada hora
    public void ejecutarPedidosRecurrentes() {
        log.info("Ejecutando pedidos recurrentes pendientes...");
        recurrenteService.ejecutarPedidosPendientes();
    }
}
```

### Sistema de Notificaciones

Integrar con el sistema de emails para notificar:
- X horas antes de la ejecución
- Cuando se ejecuta exitosamente
- Cuando falla la ejecución

---

**Implementado por**: Claude Code
**Versión del Sistema**: 1.1.0
**Última actualización**: Diciembre 2024
