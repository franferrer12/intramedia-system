# Roadmap Sistema POS - Club Management

## Visión General

Evolución del sistema POS desde un registro básico de consumos hasta un sistema completo de gestión de ventas, caja, turnos y análisis en tiempo real.

---

## 🎯 Fase 0: MVP - Sistema Básico de Registro - ✅ **COMPLETADA**

**Objetivo**: Registrar consumos durante sesiones con gestión de pagos básica

**Duración real**: 5 días (2025-10-06 a 2025-10-11)

**Estado**: ✅ **COMPLETADA** - Desplegado en producción (Railway.app)

### Funcionalidades Completadas
- ✅ Abrir/cerrar sesiones de caja con efectivo inicial/final
- ✅ Registrar ventas con múltiples productos
- ✅ Descuento automático de stock vía trigger DB
- ✅ Generación automática de número de ticket (formato: TKT-YYYYMMDD-NNNN)
- ✅ Creación automática de transacción financiera por venta
- ✅ Totales en tiempo real (ventas, ingresos, ticket promedio)
- ✅ Historial de ventas por sesión
- ✅ Asociar sesión a empleado y/o evento
- ✅ Métodos de pago: EFECTIVO, TARJETA, MIXTO
- ✅ Estadísticas del día y por período
- ✅ Ranking de productos más vendidos
- ✅ Ventas por categoría de producto

### Entregables Completados
- ✅ **Base de datos**:
  - Migración V019: `sesiones_caja`, `ventas`, `detalle_venta`
  - 3 triggers: generación de tickets, descuento de stock, registro de transacciones
  - 3 funciones PL/pgSQL
- ✅ **Backend completo**:
  - 3 entidades JPA (SesionCaja, Venta, DetalleVenta)
  - 3 repositorios con queries JPQL custom
  - 5 servicios con lógica de negocio
  - 7 controladores REST
  - 24 endpoints REST operativos
- ✅ **Frontend básico**:
  - Dashboard POS con métricas en tiempo real
  - Gestión de sesiones de caja
  - Registro de ventas
  - Estadísticas y reportes
- ✅ **Documentación**:
  - POS_DEPLOYMENT_SUCCESS.md (deployment completo)
  - POS_ROADMAP.md (este archivo)
  - BUGFIXES.md (errores resueltos)
  - PROGRESS.md (actualizado)

### Deployment
- ✅ Backend desplegado en Railway.app
- ✅ Base de datos PostgreSQL 17.6 en Railway
- ✅ Health check: HTTP 200 ✅
- ✅ Endpoints POS: HTTP 200 ✅
- ✅ Migración V019 aplicada exitosamente
- ✅ Triggers y funciones operativos

### Bugs Resueltos Durante Deployment
1. ✅ Llamadas a `producto.getInventario()` inexistente → Eliminado
2. ✅ Método `isActivo()` vs `getActivo()` → Corregido (Lombok Boolean)
3. ✅ Acceso a `categoria.getNombre()` en String → Simplificado
4. ✅ Query JPQL con `p.categoria.nombre` → Cambiado a `p.categoria`

### URLs de Producción
- **Health**: https://club-manegament-production.up.railway.app/actuator/health
- **POS Stats Hoy**: https://club-manegament-production.up.railway.app/api/pos/estadisticas/hoy
- **Frontend Local**: http://localhost:3000/pos-dashboard

### Limitaciones de Fase 0 (Para fases futuras)
- ⏳ No hay impresión de tickets
- ⏳ No hay comandas para cocina/barra
- ⏳ Sin gestión de propinas
- ⏳ Sin descuentos o promociones
- ⏳ Sin gestión de mesas/reservas
- ⏳ Sin integración con TPV externo

**Fecha de Completado**: 11 de Octubre de 2025, 04:19 CEST
**Commits Principales**:
- `0e2cd67` - fix: Corregir errores de compilación en sistema POS
- `0d01faa` - fix: Corregir query HQL en DetalleVentaRepository

---

## 📊 Fase 1: Mejoras de UX y Analítica Básica

**Objetivo**: Mejorar la experiencia de usuario y agregar reportes básicos

**Duración estimada**: 3-5 días

### 1.1 Mejoras de Interfaz

#### Grid de Productos Mejorado
- [ ] Imágenes de productos
- [ ] Favoritos/productos destacados
- [ ] Búsqueda por código de barras
- [ ] Filtros rápidos por categoría
- [ ] Vista compacta vs vista detallada
- [ ] Botones de cantidad rápida (1, 2, 5, 10)

#### Teclado Numérico
- [ ] Teclado numérico táctil para tablets
- [ ] Atajos de teclado para productos frecuentes
- [ ] Modo pantalla completa

#### Notificaciones
- [ ] Sonido al registrar consumo
- [ ] Alertas de stock bajo al seleccionar producto
- [ ] Confirmación visual de operaciones

### 1.2 Reportes y Estadísticas

#### Dashboard de Sesión
- [ ] Top 10 productos más vendidos en la sesión
- [ ] Gráfico de ventas por hora
- [ ] Comparativa con sesiones anteriores
- [ ] Velocidad de venta (items/hora)

#### Reportes de Cierre
- [ ] PDF de cierre de sesión
- [ ] Desglose por categoría de producto
- [ ] Estadísticas del empleado
- [ ] Exportar a Excel

#### Analytics en Tiempo Real
- [ ] Dashboard live con sesiones activas
- [ ] Monitor de ventas en tiempo real (pantalla grande)
- [ ] Alertas de bajo rendimiento
- [ ] KPIs por turno (mañana, tarde, noche)

### 1.3 Gestión de Sesiones

#### Múltiples Sesiones Simultáneas
- [ ] Permitir múltiples sesiones por ubicación/barra
- [ ] Selector de sesión activa
- [ ] Transferir consumos entre sesiones
- [ ] Vista consolidada de todas las sesiones

#### Pausar/Reanudar Sesiones
- [ ] Pausar sesión sin cerrarla
- [ ] Historial de pausas
- [ ] Motivos de pausa (descanso, cambio turno, etc.)

---

## 💰 Fase 2: Gestión de Caja (Sin Cobro Directo)

**Objetivo**: Registrar efectivo/TPV externo para cuadre de caja

**Duración estimada**: 5-7 días

### 2.1 Base de Datos

#### Nueva tabla: `movimientos_caja`
```sql
CREATE TABLE movimientos_caja (
    id BIGSERIAL PRIMARY KEY,
    sesion_id BIGINT REFERENCES sesiones_venta(id),
    tipo VARCHAR(20) NOT NULL, -- APERTURA, INGRESO, RETIRO, CIERRE
    metodo_pago VARCHAR(20), -- EFECTIVO, TARJETA, TRANSFERENCIA
    monto DECIMAL(10,2) NOT NULL,
    concepto TEXT,
    referencia VARCHAR(100),
    fecha_movimiento TIMESTAMP NOT NULL DEFAULT NOW(),
    empleado_id BIGINT REFERENCES empleados(id),

    CHECK (tipo IN ('APERTURA', 'INGRESO', 'RETIRO', 'CIERRE'))
);
```

#### Nueva tabla: `cuadres_caja`
```sql
CREATE TABLE cuadres_caja (
    id BIGSERIAL PRIMARY KEY,
    sesion_id BIGINT REFERENCES sesiones_venta(id),
    fecha_cuadre TIMESTAMP NOT NULL,

    -- Efectivo
    efectivo_inicial DECIMAL(10,2) DEFAULT 0.00,
    efectivo_ingresos DECIMAL(10,2) DEFAULT 0.00,
    efectivo_retiros DECIMAL(10,2) DEFAULT 0.00,
    efectivo_esperado DECIMAL(10,2) DEFAULT 0.00,
    efectivo_real DECIMAL(10,2) DEFAULT 0.00,
    diferencia_efectivo DECIMAL(10,2) DEFAULT 0.00,

    -- Tarjeta
    tarjeta_total DECIMAL(10,2) DEFAULT 0.00,

    -- Totales
    total_ingresos DECIMAL(10,2) DEFAULT 0.00,
    total_esperado DECIMAL(10,2) DEFAULT 0.00,
    total_real DECIMAL(10,2) DEFAULT 0.00,
    diferencia_total DECIMAL(10,2) DEFAULT 0.00,

    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    notas TEXT,

    CHECK (estado IN ('PENDIENTE', 'CUADRADO', 'CON_DIFERENCIA', 'REVISADO'))
);
```

### 2.2 Funcionalidades

#### Apertura de Caja
- [ ] Registrar efectivo inicial al abrir sesión
- [ ] Desglose de billetes y monedas
- [ ] Foto del efectivo inicial (opcional)

#### Registro de Ingresos
- [ ] Marcar consumos como pagados (efectivo/tarjeta)
- [ ] Registro manual de ingresos externos
- [ ] Cambio calculado automáticamente

#### Arqueo de Caja
- [ ] Contar efectivo en caja (desglose por denominación)
- [ ] Calcular diferencia automáticamente
- [ ] Justificar diferencias
- [ ] Generar reporte de cuadre

#### Retiros Parciales
- [ ] Retirar efectivo durante la sesión
- [ ] Registro de motivo y autorización
- [ ] Historial de retiros

### 2.3 Interfaz

#### Página de Caja
- [ ] Dashboard de caja actual
- [ ] Botón de "Registrar pago" en cada consumo
- [ ] Calculadora de cambio
- [ ] Vista rápida de totales por método de pago

#### Modal de Cuadre
- [ ] Desglose visual de billetes y monedas
- [ ] Cálculo automático de totales
- [ ] Comparativa esperado vs real
- [ ] Generación de PDF de cuadre

---

## 🎫 Fase 3: Tickets y Comandas

**Objetivo**: Generar tickets de consumo y comandas para cocina/barra

**Duración estimada**: 4-6 días

### 3.1 Base de Datos

#### Nueva tabla: `comandas`
```sql
CREATE TABLE comandas (
    id BIGSERIAL PRIMARY KEY,
    sesion_id BIGINT REFERENCES sesiones_venta(id),
    numero_comanda VARCHAR(20) NOT NULL,
    mesa VARCHAR(50),
    nombre_cliente VARCHAR(200),

    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    tipo VARCHAR(20) DEFAULT 'BARRA', -- BARRA, COCINA, MIXTO

    total DECIMAL(10,2) DEFAULT 0.00,
    pagado BOOLEAN DEFAULT FALSE,
    metodo_pago VARCHAR(20),

    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_entrega TIMESTAMP,
    fecha_pago TIMESTAMP,

    empleado_id BIGINT REFERENCES empleados(id),
    notas TEXT,

    CHECK (estado IN ('PENDIENTE', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO'))
);
```

#### Actualizar tabla: `consumos_sesion`
```sql
ALTER TABLE consumos_sesion
ADD COLUMN comanda_id BIGINT REFERENCES comandas(id);

ALTER TABLE consumos_sesion
ADD COLUMN estado_preparacion VARCHAR(20) DEFAULT 'PENDIENTE';

ALTER TABLE consumos_sesion
ADD CONSTRAINT chk_estado_preparacion
CHECK (estado_preparacion IN ('PENDIENTE', 'EN_PREPARACION', 'LISTO', 'ENTREGADO'));
```

### 3.2 Funcionalidades

#### Gestión de Comandas
- [ ] Crear comanda agrupando consumos
- [ ] Asignar mesa/ubicación
- [ ] Asignar nombre de cliente (opcional)
- [ ] Estado de comanda (pendiente, en preparación, lista)

#### Tickets de Venta
- [ ] Generar ticket de consumo
- [ ] Diseño personalizable
- [ ] QR con código de comanda
- [ ] Información de sesión y empleado
- [ ] Imprimir en impresora térmica (opcional)

#### Comandas de Cocina/Barra
- [ ] Separar items por tipo (barra vs cocina)
- [ ] Imprimir comanda simplificada
- [ ] Actualizar estado de preparación
- [ ] Notificaciones cuando está listo

#### Vista de Cocina/Barra
- [ ] Pantalla dedicada para cocina
- [ ] Lista de comandas pendientes
- [ ] Marcar items como listos
- [ ] Tiempo de espera por comanda

### 3.3 Impresión

#### Configuración de Impresoras
- [ ] Soporte para impresoras térmicas
- [ ] Múltiples impresoras (tickets, comandas, cocina)
- [ ] Configuración de plantillas
- [ ] Test de impresión

---

## 🏷️ Fase 4: Descuentos, Promociones y Propinas

**Objetivo**: Sistema flexible de descuentos y gestión de propinas

**Duración estimada**: 5-7 días

### 4.1 Base de Datos

#### Nueva tabla: `promociones`
```sql
CREATE TABLE promociones (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(20) NOT NULL, -- PORCENTAJE, MONTO_FIJO, 2X1, REGALO

    valor DECIMAL(10,2), -- Porcentaje o monto

    -- Condiciones
    productos_aplicables TEXT[], -- Array de IDs o categorías
    cantidad_minima INTEGER,
    monto_minimo DECIMAL(10,2),

    -- Vigencia
    fecha_inicio TIMESTAMP,
    fecha_fin TIMESTAMP,
    dias_semana INTEGER[], -- 0=Domingo, 6=Sábado
    hora_inicio TIME,
    hora_fin TIME,

    activo BOOLEAN DEFAULT TRUE,
    uso_maximo INTEGER,
    uso_actual INTEGER DEFAULT 0,

    CHECK (tipo IN ('PORCENTAJE', 'MONTO_FIJO', '2X1', '3X2', 'REGALO'))
);
```

#### Nueva tabla: `descuentos_aplicados`
```sql
CREATE TABLE descuentos_aplicados (
    id BIGSERIAL PRIMARY KEY,
    consumo_id BIGINT REFERENCES consumos_sesion(id),
    sesion_id BIGINT REFERENCES sesiones_venta(id),
    promocion_id BIGINT REFERENCES promociones(id),

    tipo VARCHAR(20) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    monto_descuento DECIMAL(10,2) NOT NULL,

    motivo TEXT,
    autorizado_por BIGINT REFERENCES empleados(id),
    fecha_aplicacion TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### Nueva tabla: `propinas`
```sql
CREATE TABLE propinas (
    id BIGSERIAL PRIMARY KEY,
    sesion_id BIGINT REFERENCES sesiones_venta(id),
    empleado_id BIGINT REFERENCES empleados(id),

    monto DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(20), -- EFECTIVO, TARJETA

    fecha_propina TIMESTAMP NOT NULL DEFAULT NOW(),
    notas TEXT
);
```

### 4.2 Funcionalidades

#### Descuentos
- [ ] Aplicar descuento por porcentaje
- [ ] Aplicar descuento por monto fijo
- [ ] Descuento por producto o por total
- [ ] Descuentos que requieren autorización
- [ ] Historial de descuentos aplicados

#### Promociones
- [ ] Sistema de promociones configurables
- [ ] 2x1, 3x2, happy hour
- [ ] Promociones por código
- [ ] Validación automática de condiciones
- [ ] Límite de usos por promoción

#### Propinas
- [ ] Registrar propinas por sesión
- [ ] Distribución de propinas entre empleados
- [ ] Propinas en efectivo vs tarjeta
- [ ] Reporte de propinas por empleado

---

## 📱 Fase 5: Reservados y Gestión de Mesas

**Objetivo**: Sistema para gestión de mesas y reservados VIP

**Duración estimada**: 7-10 días

### 5.1 Base de Datos

#### Nueva tabla: `areas`
```sql
CREATE TABLE areas (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(20) DEFAULT 'BARRA', -- BARRA, SALON, TERRAZA, VIP
    activo BOOLEAN DEFAULT TRUE
);
```

#### Nueva tabla: `mesas`
```sql
CREATE TABLE mesas (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    area_id BIGINT REFERENCES areas(id),

    capacidad INTEGER NOT NULL DEFAULT 4,
    tipo VARCHAR(20) DEFAULT 'ESTANDAR', -- ESTANDAR, VIP, BARRA

    estado VARCHAR(20) DEFAULT 'LIBRE',
    precio_consumo_minimo DECIMAL(10,2),

    activo BOOLEAN DEFAULT TRUE,

    CHECK (estado IN ('LIBRE', 'OCUPADA', 'RESERVADA', 'BLOQUEADA')),
    CHECK (tipo IN ('ESTANDAR', 'VIP', 'BARRA'))
);
```

#### Nueva tabla: `reservas`
```sql
CREATE TABLE reservas (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,

    -- Cliente
    nombre_cliente VARCHAR(200) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(200),
    num_personas INTEGER NOT NULL,

    -- Reserva
    fecha_reserva TIMESTAMP NOT NULL,
    duracion_horas INTEGER DEFAULT 2,
    mesa_id BIGINT REFERENCES mesas(id),
    area_id BIGINT REFERENCES areas(id),
    evento_id BIGINT REFERENCES eventos(id),

    -- Consumo
    consumo_minimo DECIMAL(10,2),
    seña DECIMAL(10,2),
    seña_pagada BOOLEAN DEFAULT FALSE,

    -- Estado
    estado VARCHAR(20) DEFAULT 'PENDIENTE',

    notas TEXT,
    creado_por BIGINT REFERENCES empleados(id),
    confirmado_por BIGINT REFERENCES empleados(id),

    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_confirmacion TIMESTAMP,
    fecha_cancelacion TIMESTAMP,
    motivo_cancelacion TEXT,

    CHECK (estado IN ('PENDIENTE', 'CONFIRMADA', 'OCUPADA', 'COMPLETADA', 'CANCELADA', 'NO_SHOW'))
);
```

#### Relacionar sesiones con mesas
```sql
ALTER TABLE sesiones_venta
ADD COLUMN mesa_id BIGINT REFERENCES mesas(id);

ALTER TABLE sesiones_venta
ADD COLUMN reserva_id BIGINT REFERENCES reservas(id);
```

### 5.2 Funcionalidades

#### Gestión de Mesas
- [ ] Mapa visual de mesas
- [ ] Estados: libre, ocupada, reservada
- [ ] Asignar sesión a mesa
- [ ] Cambiar mesa durante servicio
- [ ] Unir/dividir mesas

#### Reservas
- [ ] Crear reserva con datos del cliente
- [ ] Calendario de reservas
- [ ] Confirmación automática (SMS/email)
- [ ] Gestión de señas
- [ ] Check-in de reservas

#### Reservados VIP
- [ ] Consumo mínimo por mesa
- [ ] Servicio de botellas (botellero)
- [ ] Tracking de consumo vs mínimo
- [ ] Facturación especial

---

## 🔗 Fase 6: Integraciones Externas

**Objetivo**: Integrar con sistemas de pago y hardware externo

**Duración estimada**: 10-15 días

### 6.1 Integraciones de Pago

#### TPV/Datáfono
- [ ] Integración con Redsys
- [ ] Integración con Stripe Terminal
- [ ] Integración con SumUp
- [ ] Callback de confirmación de pago
- [ ] Conciliación automática

#### Pagos Móviles
- [ ] Bizum
- [ ] Apple Pay / Google Pay
- [ ] QR de pago

### 6.2 Hardware

#### Impresoras
- [ ] Driver para impresoras térmicas
- [ ] Impresión directa desde navegador
- [ ] Cola de impresión
- [ ] Reimpresión de tickets

#### Lectores de Código de Barras
- [ ] Búsqueda de producto por código de barras
- [ ] Registro rápido de consumos

#### Cajones Portamonedas
- [ ] Apertura automática al cobrar
- [ ] Integración con impresora

#### Pantallas Cliente
- [ ] Display secundario con totales
- [ ] Mostrar productos agregados
- [ ] Mensajes publicitarios

### 6.3 Otras Integraciones

#### Contabilidad
- [ ] Exportar movimientos a Contasimple
- [ ] Exportar a A3
- [ ] Formato CSV para importación

#### CRM
- [ ] Sincronizar clientes con CRM
- [ ] Historial de consumos por cliente
- [ ] Programa de fidelización

---

## 📊 Fase 7: Business Intelligence y Analytics Avanzado

**Objetivo**: Análisis profundo de datos de venta

**Duración estimada**: 8-12 días

### 7.1 Reportes Avanzados

#### Análisis de Ventas
- [ ] Ventas por producto (ranking, tendencias)
- [ ] Ventas por categoría
- [ ] Ventas por hora/día/mes
- [ ] Comparativas período anterior
- [ ] Estacionalidad

#### Análisis de Empleados
- [ ] Rendimiento por empleado
- [ ] Ticket promedio por empleado
- [ ] Velocidad de servicio
- [ ] Propinas acumuladas

#### Análisis de Clientes
- [ ] Clientes frecuentes
- [ ] Ticket promedio por cliente
- [ ] Productos favoritos por cliente
- [ ] Segmentación de clientes

### 7.2 Dashboards Interactivos

#### Dashboard Gerencial
- [ ] KPIs principales en tiempo real
- [ ] Gráficos interactivos
- [ ] Filtros dinámicos
- [ ] Exportar a PDF/Excel

#### Dashboard Operacional
- [ ] Monitor de sesiones activas
- [ ] Alertas en tiempo real
- [ ] Problemas y excepciones
- [ ] Stock crítico

### 7.3 Predicciones y Recomendaciones

#### Machine Learning
- [ ] Predicción de demanda por producto
- [ ] Recomendación de pedidos a proveedores
- [ ] Detección de anomalías
- [ ] Productos complementarios (cross-selling)

---

## 📱 Fase 8: Aplicación Móvil

**Objetivo**: App nativa o PWA para camareros

**Duración estimada**: 15-20 días

### 8.1 Funcionalidades Móvil

#### Toma de Pedidos
- [ ] Interface optimizada para móvil/tablet
- [ ] Modo offline (sync posterior)
- [ ] Gestión de mesas desde el móvil
- [ ] Envío de comandas a cocina/barra

#### Gestión Personal
- [ ] Ver mis sesiones
- [ ] Ver mis propinas
- [ ] Estadísticas personales
- [ ] Fichas de entrada/salida

### 8.2 Tecnología

#### PWA (Progressive Web App)
- [ ] Instalable en dispositivos
- [ ] Push notifications
- [ ] Funciona offline
- [ ] Sincronización en background

#### App Nativa (Opcional)
- [ ] React Native / Flutter
- [ ] iOS y Android
- [ ] Mejor rendimiento
- [ ] Integración con hardware del dispositivo

---

## 🔐 Fase 9: Seguridad y Auditoría Avanzada

**Objetivo**: Reforzar seguridad y trazabilidad

**Duración estimada**: 5-7 días

### 9.1 Auditoría

#### Log de Operaciones
- [ ] Registro completo de todas las operaciones
- [ ] Quién, qué, cuándo, desde dónde
- [ ] Cambios en precios
- [ ] Descuentos aplicados
- [ ] Cancelaciones

#### Trazabilidad
- [ ] Seguimiento completo de cada consumo
- [ ] Cadena de eventos
- [ ] Versioning de cambios

### 9.2 Seguridad

#### Autenticación Reforzada
- [ ] 2FA para operaciones críticas
- [ ] PIN para empleados
- [ ] Biometría (huella, rostro)

#### Permisos Granulares
- [ ] Control por operación
- [ ] Límites por rol (ej: descuentos máx 10%)
- [ ] Operaciones que requieren autorización

#### Prevención de Fraude
- [ ] Detección de patrones sospechosos
- [ ] Alertas automáticas
- [ ] Bloqueo temporal de operaciones

---

## 🌐 Fase 10: Multi-Local y Franquicia

**Objetivo**: Soporte para múltiples locales

**Duración estimada**: 10-15 días

### 10.1 Base de Datos

#### Nueva tabla: `locales`
```sql
CREATE TABLE locales (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(20),

    -- Configuración
    zona_horaria VARCHAR(50),
    moneda VARCHAR(3) DEFAULT 'EUR',

    activo BOOLEAN DEFAULT TRUE,
    fecha_apertura DATE
);
```

#### Agregar local_id a todas las tablas principales
```sql
ALTER TABLE sesiones_venta ADD COLUMN local_id BIGINT REFERENCES locales(id);
ALTER TABLE empleados ADD COLUMN local_id BIGINT REFERENCES locales(id);
ALTER TABLE productos ADD COLUMN local_id BIGINT REFERENCES locales(id);
-- etc...
```

### 10.2 Funcionalidades

#### Multi-Local
- [ ] Selector de local al iniciar sesión
- [ ] Datos aislados por local
- [ ] Transferencias entre locales
- [ ] Reportes consolidados

#### Dashboard Corporativo
- [ ] Vista de todos los locales
- [ ] Comparativas entre locales
- [ ] Rankings
- [ ] Consolidación de inventarios

---

## 🎁 Funcionalidades Extra / Nice-to-Have

### Gamificación
- [ ] Badges para empleados (mejor vendedor, etc.)
- [ ] Retos semanales
- [ ] Tabla de clasificación

### Clientes / Fidelización
- [ ] Programa de puntos
- [ ] Tarjetas de fidelidad
- [ ] Cupones digitales
- [ ] Cumpleaños y ocasiones especiales

### Gestión de Eventos
- [ ] Lista de invitados
- [ ] Venta de entradas
- [ ] Control de acceso
- [ ] Consumo por evento

### Delivery
- [ ] Pedidos para llevar
- [ ] Integración con plataformas (Uber Eats, Glovo)
- [ ] Gestión de repartidores

---

## 📅 Cronograma Estimado

| Fase | Duración | Acumulado |
|------|----------|-----------|
| Fase 0: MVP | 2-3 días | 3 días |
| Fase 1: UX + Analytics | 3-5 días | 8 días |
| Fase 2: Gestión Caja | 5-7 días | 15 días |
| Fase 3: Tickets | 4-6 días | 21 días |
| Fase 4: Descuentos | 5-7 días | 28 días |
| Fase 5: Mesas | 7-10 días | 38 días |
| Fase 6: Integraciones | 10-15 días | 53 días |
| Fase 7: BI | 8-12 días | 65 días |
| Fase 8: Móvil | 15-20 días | 85 días |
| Fase 9: Seguridad | 5-7 días | 92 días |
| Fase 10: Multi-Local | 10-15 días | 107 días |

**Total: ~3-4 meses** para un sistema POS completo de nivel profesional

---

## 🎯 Priorización Recomendada

### Prioridad Alta (Esenciales)
1. ✅ **Fase 0**: MVP - Registro básico
2. 🔥 **Fase 1**: UX mejorado
3. 🔥 **Fase 2**: Gestión de caja
4. 🔥 **Fase 3**: Tickets y comandas

### Prioridad Media (Importantes)
5. **Fase 4**: Descuentos y promociones
6. **Fase 5**: Mesas y reservas
7. **Fase 7**: Analytics avanzado

### Prioridad Baja (Opcionales)
8. **Fase 6**: Integraciones externas
9. **Fase 8**: App móvil
10. **Fase 9**: Seguridad avanzada
11. **Fase 10**: Multi-local

---

## 📊 Métricas de Éxito

### KPIs Técnicos
- Tiempo de respuesta < 500ms
- Disponibilidad > 99.5%
- Tasa de errores < 0.1%
- Cobertura de tests > 80%

### KPIs de Negocio
- Reducción tiempo de registro: -50%
- Errores de stock: -70%
- Satisfacción empleados: +40%
- Cuadres de caja correctos: >95%

### KPIs de Usuario
- Tiempo de formación: < 30 min
- Clicks para registrar consumo: < 3
- Tiempo de cierre de sesión: < 2 min

---

## 🔄 Metodología de Desarrollo

### Sprint Planning (2 semanas)
- Sprint 1-2: Fase 0 + Fase 1
- Sprint 3-4: Fase 2
- Sprint 5-6: Fase 3
- Y así sucesivamente...

### Proceso por Feature
1. Diseño de base de datos
2. Backend (entidades, repos, servicios)
3. API (controllers, docs)
4. Tests backend
5. Frontend (componentes, páginas)
6. Tests frontend
7. Documentación
8. Deploy a staging
9. QA y ajustes
10. Deploy a producción

---

## 📚 Recursos Necesarios

### Equipo
- 1 Backend Developer (Java/Spring Boot)
- 1 Frontend Developer (React/TypeScript)
- 1 QA Tester (parcial)
- 1 Product Owner (tú)

### Herramientas
- GitHub / GitLab para código
- Figma para diseños
- Jira / Trello para gestión
- Postman para tests de API
- Sentry para monitoreo de errores

### Infraestructura
- Servidor para staging
- Servidor para producción
- Base de datos PostgreSQL
- CDN para assets estáticos
- Backup automático diario

---

## 🚀 Quick Wins (Resultados Rápidos)

Después de cada fase, tendrás:

**Post Fase 0**:
- ✅ Sistema funcional de registro de consumos
- ✅ Control de stock automático
- ✅ Reportes básicos de sesión

**Post Fase 1**:
- ✅ Interface intuitiva y rápida
- ✅ Reportes visuales atractivos
- ✅ Empleados más productivos

**Post Fase 2**:
- ✅ Control total de caja
- ✅ Cuadres automáticos
- ✅ Reducción de diferencias de caja

**Post Fase 3**:
- ✅ Tickets profesionales
- ✅ Coordinación cocina-barra mejorada
- ✅ Mejor experiencia de cliente

---

## 📞 Soporte y Mantenimiento

### Post-Lanzamiento
- Soporte 24/7 primeras 2 semanas
- Hotfixes críticos < 4 horas
- Actualizaciones menores semanales
- Actualizaciones mayores mensuales

### Formación
- Manual de usuario completo
- Videos tutoriales
- Sesiones de formación presencial
- Soporte telefónico/chat

---

**Versión**: 1.0
**Fecha**: 2025-10-09
**Próxima revisión**: Post Fase 0
