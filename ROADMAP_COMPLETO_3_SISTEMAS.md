# 🎯 ROADMAP COMPLETO - Club Management System
## Arquitectura de 3 Sistemas Integrados

> **Visión General**: Sistema integral de gestión para discotecas con 3 módulos especializados: Back Office (RP), Point of Sale (POS) y Box Office (Taquilla)

**Versión:** 2.0
**Fecha:** Octubre 2025
**Estado:** RP 75% | POS 30% | Box Office 0%

---

## 🏗️ ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CLUB MANAGEMENT SYSTEM (RP Core)                      │
│                PostgreSQL Database (Centralizada)                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   BACK OFFICE    │       │    BOX OFFICE    │       │       POS        │
│      (RP)        │       │   (Taquilla)     │       │   (Barra/Caja)   │
│                  │       │                  │       │                  │
│   Gestión        │◄─────►│   Venta de       │◄─────►│   Ventas de      │
│   Administrativa │       │   Entradas       │       │   Consumo        │
│                  │       │                  │       │                  │
│ • Eventos        │       │ • Ticketing      │       │ • Sesiones caja  │
│ • Finanzas       │       │ • Check-in       │       │ • Registro ventas│
│ • Personal       │       │ • Listas         │       │ • Stock real-time│
│ • Inventario     │       │ • Promociones    │       │ • Botellas VIP   │
│ • Analytics      │       │ • Reportes       │       │ • Comandas       │
│ • Nóminas        │       │ • Integración    │       │ • Mesas/Reservas │
│                  │       │   Fourvenues     │       │ • Descuentos     │
└──────────────────┘       └──────────────────┘       └──────────────────┘
        │                           │                           │
        └───────────────────────────┴───────────────────────────┘
                                    │
                                    ▼
                          ┌──────────────────┐
                          │  REPORTES UNIFIC.│
                          │  • Dashboard exec│
                          │  • P&L consolidado│
                          │  • KPIs globales │
                          └──────────────────┘
```

---

## 📊 ESTADO ACTUAL DEL PROYECTO

| Sistema | Progreso | Estado | Sprints Completados | Sprints Pendientes |
|---------|----------|--------|---------------------|-------------------|
| **Back Office (RP)** | 75% | 🟢 En producción | 8/11 | 3 |
| **Box Office** | 0% | ⚪ No iniciado | 0/5 | 5 |
| **POS** | 30% | 🟡 MVP básico | 1/10 | 9 |

**Progreso Global:** 35% (9/26 sprints totales)

---

## 🎨 MOCKUPS Y DISEÑO

### 1. Back Office (RP) - Vista Administrativa

```
┌────────────────────────────────────────────────────────────────┐
│  ☰  Club Management | Back Office              👤 Admin  [⚙]  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  📊 Dashboard Ejecutivo                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Ingresos │ │  Gastos  │ │ Balance  │ │ Eventos  │        │
│  │ €45,230  │ │ €28,450  │ │ €16,780  │ │    12    │        │
│  │  ▲ 12%   │ │  ▼ 5%    │ │  ▲ 23%   │ │  Este mes│        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│                                                                │
│  📈 Gráfico de Ingresos vs Gastos (últimos 6 meses)          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │     ▄▄▄                                                │  │
│  │    ▐███▌   ▄▄▄    ▄▄▄▄▄   ▄▄▄▄                       │  │
│  │   ▐████▌  ▐███▌  ▐█████▌ ▐████▌  ▄▄▄▄▄              │  │
│  │  ▐█████▌ ▐████▌ ▐██████▌▐█████▌ ▐█████▌             │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  🎉 Próximos Eventos                      📋 Tareas Pendientes│
│  • Halloween Party - 31 Oct              • Pagar nóminas     │
│  • Fiesta Privada - 2 Nov               • Pedido proveedores│
│  • DJ Internacional - 5 Nov             • Revisar stock     │
│                                                                │
│  Navegación:                                                   │
│  [📅 Eventos] [💰 Finanzas] [👥 Mi Equipo] [📦 Inventario]  │
│  [📊 Analytics] [💵 Sueldos] [⚙️ Configuración]              │
└────────────────────────────────────────────────────────────────┘
```

**Usuarios:** Admin, Gerente, RRHH
**Acceso:** Web (Desktop/Tablet)
**Características:**
- Dashboard ejecutivo con KPIs en tiempo real
- Gestión completa de eventos y fiestas
- Control financiero (P&L automático)
- Gestión de personal y nóminas
- Inventario con alertas
- Analytics avanzado

---

### 2. Box Office - Sistema de Taquilla

```
┌────────────────────────────────────────────────────────────────┐
│  🎫 Box Office | Taquilla Digital         👤 Taquillero  [⚙]  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  🎉 Evento Activo: Halloween Party - 31 Octubre 2025          │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Estado: VENTA ACTIVA  |  Aforo: 520/800 (65%)          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  💳 VENTA RÁPIDA DE ENTRADAS                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │   General   │ │  VIP Room   │ │  Early Bird │            │
│  │             │ │             │ │             │            │
│  │   €15.00    │ │   €35.00    │ │   €10.00    │            │
│  │             │ │             │ │             │            │
│  │  420/600    │ │   80/150    │ │  AGOTADO    │            │
│  │  [+ VENDER] │ │  [+ VENDER] │ │  [------]   │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
│                                                                │
│  🔍 CHECK-IN RÁPIDO                                           │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  [📷 Escanear QR]  o  [🔢 Código Manual: ________]      │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  📋 LISTA DE INVITADOS (15 personas)                          │
│  ☑ Juan Pérez - VIP  ✓ Check-in 22:45                       │
│  ☐ María García - General                                     │
│  ☐ Carlos López - VIP + 2                                     │
│  ☐ Ana Martínez - Prensa                                      │
│                                                                │
│  📊 Estadísticas del Evento:                                  │
│  Entradas vendidas hoy: 48  |  Total recaudado: €1,240       │
│  Check-ins realizados: 315   |  En local ahora: ~280          │
│                                                                │
│  [📊 Ver Reportes] [🎫 Historial] [⚙️ Config Evento]         │
└────────────────────────────────────────────────────────────────┘
```

**Usuarios:** Taquilleros, Personal de entrada
**Acceso:** Web (Desktop/Tablet) + App Móvil
**Características:**
- Venta de entradas rápida (física y online)
- Check-in con QR o código manual
- Gestión de listas de invitados
- Tipos de entrada (General, VIP, Early Bird)
- Códigos promocionales
- Control de aforo en tiempo real
- Integración opcional con Fourvenues

---

### 3. POS - Punto de Venta

```
┌────────────────────────────────────────────────────────────────┐
│  🍹 POS | Barra Principal            Sesión: #2845  [ABIERTA] │
│  👤 Bartender: Ana López                    Hora: 23:45        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  CARRITO ACTUAL - Mesa 12 (VIP)              Total: €85.50    │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  2x Gin Tonic                     €8.00  │  €16.00       │ │
│  │  1x Botella Absolut (ABIERTA)   €120.00 │  €120.00      │ │
│  │    ├─ Copas servidas: 8/20                              │ │
│  │  3x Coca-Cola                     €3.50  │  €10.50       │ │
│  │  ─────────────────────────────────────────────────────   │ │
│  │                              Subtotal:  €146.50          │ │
│  │                          Descuento 10%: -€14.65          │ │
│  │                                  TOTAL:  €131.85         │ │
│  │                                                           │ │
│  │  [💳 Tarjeta] [💵 Efectivo] [🔀 Mixto] [🗑️ Cancelar]    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  📦 PRODUCTOS RÁPIDOS                                         │
│  ┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐         │
│  │ 🍺 Cerveza│🍷 Vino  │🥃 Whisky│🍹 Cóctel│🍾 Botella│      │
│  │  €4.00  ││ €5.50  ││ €8.00  ││ €12.00 ││ €120.00 │         │
│  │ Stock:48││Stock:22││Stock:15││        ││ Stock: 8│         │
│  └────────┘└────────┘└────────┘└────────┘└────────┘         │
│                                                                │
│  🍾 BOTELLAS ABIERTAS (Barra Principal)                       │
│  • Absolut Vodka - Mesa 12 - 12/20 copas restantes           │
│  • Bacardi Ron - Barra VIP - 5/18 copas restantes            │
│  • Bombay Gin - Mesa 8 - 3/20 copas (⚠️ Cerrar pronto)       │
│                                                                │
│  📊 SESIÓN ACTUAL:                                            │
│  Ventas: €2,340  |  Transacciones: 87  |  Ticket medio: €26.90│
│  Efectivo: €850  |  Tarjeta: €1,490                           │
│                                                                │
│  [🍽️ Comandas] [🍾 Botellas] [🪑 Mesas] [🔚 Cerrar Sesión]  │
└────────────────────────────────────────────────────────────────┘
```

**Usuarios:** Bartenders, Camareros
**Acceso:** Web (Tablet/Touch) + App Móvil
**Características:**
- Registro de ventas táctil optimizado
- Gestión de sesiones de caja
- Sistema de botellas VIP (venta dual: botella/copas)
- Tracking de botellas abiertas
- Gestión de mesas y reservas
- Comandas para cocina/barra
- Descuentos y promociones
- Múltiples métodos de pago
- Descuento automático de stock

---

## 🗓️ ROADMAP POR SISTEMA

### 📘 BACK OFFICE (RP) - Gestión Administrativa

**Estado Actual:** 75% completado (8/11 sprints)

#### ✅ Sprints Completados

**Sprint 0: Setup Inicial** (Semana 1) ✅
- Arquitectura base Spring Boot + React
- Docker Compose configurado
- PostgreSQL 15 con Flyway
- Autenticación JWT

**Sprint 1: Autenticación + Eventos** (Semanas 2-3) ✅
- Sistema completo de login/logout
- CRUD de eventos con estados
- Filtros y búsqueda
- Calendario visual

**Sprint 2: Gestión Financiera** (Semanas 4-5) ✅
- Transacciones (Ingresos/Gastos)
- Categorías financieras
- Cálculo P&L automático
- Exportación Excel/PDF

**Sprint 3: Personal y Nóminas** (Semanas 6-8) ✅
- Gestión de empleados
- Registro de jornadas laborales
- Cálculo automático de nóminas
- Generación masiva de sueldos

**Sprint 4: Inventario Completo** (Semanas 9-11) ✅
- Catálogo de productos
- Control de stock
- Movimientos (entrada/salida/ajuste)
- Alertas de stock bajo
- Gestión de proveedores

**Sprint 5: Analytics y Reportes** (Semanas 12-13) ✅
- Dashboard ejecutivo con KPIs
- Auto-refresh cada 30s
- Gráficos con Recharts
- Exportación de reportes

**Sprint 6: UX Optimization** (Semana 14) ✅
- Adaptación de lenguaje para usuarios no técnicos
- Diseño responsive móvil
- Nomenclatura simplificada

**Sprint 7: Mejoras Continuas** (Semana 15) ✅
- Bugfixes en producción
- Optimización de rendimiento
- Documentación actualizada

#### 🔄 Sprints en Progreso

**Sprint 9: Sistema de Botellas VIP** (Semanas 17-18) 🔄
- **Duración:** 10-12 días
- **Impacto:** Alto - Afecta Inventario, POS y Finanzas
- **Prioridad:** ALTA

**Objetivos:**
- [ ] Venta dual: botella completa vs copas individuales
- [ ] Stock dual: almacén + barra (botellas abiertas)
- [ ] Tracking de copas servidas por botella
- [ ] Precios diferenciados automáticos
- [ ] Dashboard de botellas abiertas en tiempo real
- [ ] Reportes de rentabilidad por tipo de venta

**Entregables Técnicos:**
- 3 migraciones de BD (V020, V021, V022)
- 2 triggers (descuento inteligente + validación copas)
- 2 servicios nuevos (BotellaAbiertaService)
- 5 endpoints REST
- 2 páginas frontend actualizadas
- Tests >80% cobertura

#### ⏳ Sprints Pendientes

**Sprint 10: Activos Fijos y ROI** (Semanas 19-20) ⏳
- **Duración:** 10 días
- **Prioridad:** MEDIA (Opcional)

**Objetivos:**
- [ ] Gestión de activos fijos del club
- [ ] Seguimiento de inversiones
- [ ] Cálculo automático de ROI
- [ ] Dashboard de rentabilidad por activo
- [ ] Depreciación automática

**Sprint 11: Optimización Final** (Semana 21) ⏳
- **Duración:** 5 días
- **Prioridad:** CRÍTICA

**Objetivos:**
- [ ] Auditoría completa de seguridad
- [ ] Optimización de rendimiento (queries SQL, caching)
- [ ] Cobertura de tests >85%
- [ ] Documentación completa de API (Swagger)
- [ ] Guías de usuario final
- [ ] Plan de mantenimiento
- [ ] **Backup automático de base de datos**

---

### 🎫 BOX OFFICE - Sistema de Taquilla

**Estado Actual:** 0% (No iniciado)

#### ⏳ Roadmap Completo (5 sprints - 6-8 semanas)

**Sprint BO-1: Base de Ticketing** (Semana 1-2) ⏳
- **Duración:** 8-10 días
- **Prioridad:** ALTA

**Base de Datos:**
```sql
CREATE TABLE tipos_entrada (
    id, evento_id, nombre, precio, cantidad_total,
    cantidad_vendida, fecha_inicio_venta, fecha_fin_venta,
    activo, descripcion
);

CREATE TABLE entradas (
    id, codigo_qr, tipo_entrada_id, evento_id,
    nombre_comprador, email, telefono, dni,
    precio_pagado, metodo_pago, estado,
    fecha_venta, fecha_check_in, vendedor_id,
    notas
);

CREATE TABLE listas_invitados (
    id, evento_id, nombre, email, telefono,
    tipo_lista, check_in, fecha_check_in,
    plus_acompañantes, notas
);
```

**Backend:**
- [ ] Entidades JPA: TipoEntrada, Entrada, ListaInvitado
- [ ] Repositorios con queries custom
- [ ] TipoEntradaService (CRUD, validación stock)
- [ ] EntradaService (venta, generación QR, cancelación)
- [ ] ListaInvitadoService (importación CSV, validación)
- [ ] BoxOfficeController con endpoints REST
- [ ] Migración V023__create_box_office.sql

**Frontend:**
- [ ] BoxOfficePage con dashboard de taquilla
- [ ] VentaEntradaModal (formulario de venta)
- [ ] ConfiguracionEventoPage (tipos de entrada)
- [ ] boxOfficeApi.ts con TanStack Query

**Entregables:**
- Venta básica de entradas (General, VIP)
- Generación de código QR único por entrada
- Validación de stock disponible
- Listado de ventas del día

---

**Sprint BO-2: Check-In y Control de Acceso** (Semana 3) ⏳
- **Duración:** 5-7 días
- **Prioridad:** ALTA

**Objetivos:**
- [ ] Lector de QR integrado (cámara web/móvil)
- [ ] Check-in manual por código
- [ ] Validación de entradas (duplicadas, canceladas)
- [ ] Control de aforo en tiempo real
- [ ] Lista de personas en el local
- [ ] Re-entry (salida temporal con validación)
- [ ] App móvil para personal de entrada (PWA)

**Backend:**
- [ ] CheckInService con validación de QR
- [ ] AfocroService (cálculo en tiempo real)
- [ ] Logs de entrada/salida
- [ ] Endpoint WebSocket para aforo live

**Frontend:**
- [ ] CheckInPage con scanner QR
- [ ] Dashboard de aforo en tiempo real
- [ ] Vista móvil optimizada (PWA)
- [ ] Historial de check-ins

---

**Sprint BO-3: Gestión de Listas** (Semana 4) ⏳
- **Duración:** 5 días
- **Prioridad:** MEDIA

**Objetivos:**
- [ ] Gestión completa de listas de invitados
- [ ] Tipos de lista: Gratis, Descuento, VIP, Prensa
- [ ] Importación masiva desde CSV/Excel
- [ ] Check-in de lista (sin entrada previa)
- [ ] Invitado + acompañantes
- [ ] Reportes de listas por evento

**Backend:**
- [ ] ListaInvitadoService con importación CSV
- [ ] Validación de email/teléfono
- [ ] Conversión automática a entrada al check-in

**Frontend:**
- [ ] ListasPage con tabla filtrable
- [ ] ImportarListaModal (upload CSV)
- [ ] Template CSV descargable

---

**Sprint BO-4: Promociones y Descuentos** (Semana 5) ⏳
- **Duración:** 5-7 días
- **Prioridad:** MEDIA

**Base de Datos:**
```sql
CREATE TABLE codigos_promocionales (
    id, codigo, evento_id, tipo_descuento,
    valor_descuento, usos_maximos, usos_actuales,
    fecha_inicio, fecha_fin, activo, descripcion
);

CREATE TABLE descuentos_aplicados (
    id, entrada_id, codigo_id, monto_descuento,
    fecha_aplicacion
);
```

**Objetivos:**
- [ ] Códigos promocionales configurables
- [ ] Tipos: % descuento, monto fijo, 2x1
- [ ] Límite de usos por código
- [ ] Validación automática al vender
- [ ] Reportes de promociones utilizadas
- [ ] Early Bird automático (precio por fecha)

**Entregables:**
- Sistema completo de promociones
- Dashboard de uso de códigos
- Validación en tiempo real

---

**Sprint BO-5: Integración y Reportes** (Semana 6) ⏳
- **Duración:** 5-7 días
- **Prioridad:** ALTA

**Objetivos:**
- [ ] Integración con Fourvenues (API opcional)
- [ ] Sincronización de ventas online
- [ ] Reportes consolidados de taquilla
- [ ] Dashboard ejecutivo Box Office
- [ ] Exportación de reportes (PDF/Excel)
- [ ] Integración con módulo Finanzas (RP)
- [ ] Registro automático de ingresos por entradas

**Backend:**
- [ ] FourvenuesService (API integration opcional)
- [ ] Sincronización bidireccional de ventas
- [ ] BoxOfficeReportService
- [ ] Integración con TransaccionService (RP)

**Frontend:**
- [ ] ReportesBoxOfficePage
- [ ] Dashboard ejecutivo con KPIs
- [ ] Gráficos de ventas por tipo de entrada
- [ ] Comparativas entre eventos

---

### 🍹 POS - Punto de Venta

**Estado Actual:** 30% completado (Fase 0 MVP básico)

#### ✅ Fase 0: MVP Básico (COMPLETADO)

**Sprint POS-0: Sistema Básico** (Semana 16) ✅
- Sesiones de caja (abrir/cerrar)
- Registro de ventas con productos
- Descuento automático de stock (trigger DB)
- Generación de tickets (TKT-YYYYMMDD-NNNN)
- Transacciones financieras automáticas
- Métodos de pago: EFECTIVO, TARJETA, MIXTO
- 24 endpoints REST operativos
- Dashboard POS básico

#### 🔄 Roadmap Restante (9 fases - 8-12 semanas)

**Fase 1: UX Mejorado y Analytics** (Semana 17-18) 🔄
- **Duración:** 5-7 días
- **Prioridad:** ALTA
- **Estado:** EN PROGRESO (archivos frontend ya creados)

**Objetivos:**
- [ ] Grid de productos mejorado (imágenes, favoritos)
- [ ] Búsqueda por código de barras
- [ ] Teclado numérico táctil
- [ ] Notificaciones y alertas
- [ ] Dashboard de sesión mejorado
- [ ] Top 10 productos más vendidos
- [ ] Gráfico de ventas por hora
- [ ] Reportes de cierre de sesión (PDF)

---

**Fase 2: Gestión de Caja** (Semana 19) ⏳
- **Duración:** 5-7 días
- **Prioridad:** ALTA

**Base de Datos:**
```sql
CREATE TABLE movimientos_caja (
    id, sesion_id, tipo, metodo_pago, monto,
    concepto, referencia, fecha_movimiento, empleado_id
);

CREATE TABLE cuadres_caja (
    id, sesion_id, fecha_cuadre,
    efectivo_inicial, efectivo_ingresos, efectivo_retiros,
    efectivo_esperado, efectivo_real, diferencia_efectivo,
    tarjeta_total, total_ingresos, total_esperado,
    total_real, diferencia_total, estado, notas
);
```

**Objetivos:**
- [ ] Registrar efectivo inicial al abrir sesión
- [ ] Desglose de billetes y monedas
- [ ] Retiros parciales durante la sesión
- [ ] Arqueo de caja (cierre con conteo)
- [ ] Calculadora de diferencias automática
- [ ] Justificación de diferencias
- [ ] Reporte de cuadre (PDF)

---

**Fase 3: Tickets y Comandas** (Semana 20) ⏳
- **Duración:** 4-6 días
- **Prioridad:** MEDIA

**Base de Datos:**
```sql
CREATE TABLE comandas (
    id, sesion_id, numero_comanda, mesa, nombre_cliente,
    estado, tipo, total, pagado, metodo_pago,
    fecha_creacion, fecha_entrega, fecha_pago,
    empleado_id, notas
);

ALTER TABLE detalle_venta ADD COLUMN comanda_id;
ALTER TABLE detalle_venta ADD COLUMN estado_preparacion;
```

**Objetivos:**
- [ ] Crear comanda agrupando productos
- [ ] Asignar mesa/ubicación
- [ ] Ticket de venta (imprimible)
- [ ] Comanda para cocina/barra separada
- [ ] Vista de cocina (pantalla dedicada)
- [ ] Estado de preparación
- [ ] QR code en ticket
- [ ] Impresión en impresora térmica (opcional)

---

**Fase 4: Botellas VIP** (Semana 21-22) ⏳
- **Duración:** 8-10 días
- **Prioridad:** ALTA
- **Nota:** Ya planificado en Sprint 9 del Back Office

**Integrado con Back Office - Ver Sprint 9 para detalles completos**

---

**Fase 5: Descuentos y Promociones** (Semana 23) ⏳
- **Duración:** 5-7 días
- **Prioridad:** MEDIA

**Objetivos:**
- [ ] Aplicar descuento por % o monto fijo
- [ ] Descuentos que requieren autorización
- [ ] Sistema de promociones (2x1, 3x2, happy hour)
- [ ] Validación automática de condiciones
- [ ] Límite de usos por promoción
- [ ] Registro de propinas
- [ ] Distribución de propinas entre empleados

---

**Fase 6: Mesas y Reservas VIP** (Semana 24-25) ⏳
- **Duración:** 7-10 días
- **Prioridad:** ALTA

**Base de Datos:**
```sql
CREATE TABLE areas (
    id, nombre, descripcion, tipo, activo
);

CREATE TABLE mesas (
    id, codigo, nombre, area_id, capacidad, tipo,
    estado, precio_consumo_minimo, activo
);

CREATE TABLE reservas (
    id, codigo, nombre_cliente, telefono, email,
    num_personas, fecha_reserva, duracion_horas,
    mesa_id, area_id, evento_id, consumo_minimo,
    seña, seña_pagada, estado, notas, creado_por,
    fecha_creacion, fecha_confirmacion
);

ALTER TABLE sesiones_caja ADD COLUMN mesa_id;
ALTER TABLE sesiones_caja ADD COLUMN reserva_id;
```

**Objetivos:**
- [ ] Mapa visual de mesas
- [ ] Estados: libre, ocupada, reservada
- [ ] Asignar sesión POS a mesa
- [ ] Cambiar mesa durante servicio
- [ ] Crear reservas con datos del cliente
- [ ] Calendario de reservas
- [ ] Confirmación automática (SMS/email)
- [ ] Gestión de señas
- [ ] Check-in de reservas
- [ ] Consumo mínimo por mesa VIP
- [ ] Tracking consumo vs mínimo

---

**Fase 7: Integraciones Externas** (Semana 26-27) ⏳
- **Duración:** 10-15 días
- **Prioridad:** BAJA (Opcional)

**Objetivos:**
- [ ] Integración con Redsys/Stripe Terminal (TPV)
- [ ] Bizum, Apple Pay, Google Pay
- [ ] QR de pago
- [ ] Impresoras térmicas (driver)
- [ ] Lector de código de barras
- [ ] Cajón portamonedas automático
- [ ] Pantalla secundaria cliente
- [ ] Exportar a Contasimple/A3

---

**Fase 8: Business Intelligence** (Semana 28-29) ⏳
- **Duración:** 8-12 días
- **Prioridad:** MEDIA

**Objetivos:**
- [ ] Análisis de ventas por producto
- [ ] Ventas por hora/día/mes
- [ ] Comparativas período anterior
- [ ] Rendimiento por empleado
- [ ] Ticket promedio por empleado
- [ ] Dashboard gerencial interactivo
- [ ] Dashboard operacional (monitor en vivo)
- [ ] Predicción de demanda (ML básico)
- [ ] Detección de anomalías

---

**Fase 9: App Móvil** (Semana 30-33) ⏳
- **Duración:** 15-20 días
- **Prioridad:** BAJA (Opcional)

**Objetivos:**
- [ ] PWA instalable en dispositivos
- [ ] Toma de pedidos móvil
- [ ] Modo offline con sync posterior
- [ ] Gestión de mesas desde móvil
- [ ] Envío de comandas a cocina/barra
- [ ] Vista personal (mis sesiones, mis propinas)
- [ ] Push notifications
- [ ] App nativa iOS/Android (React Native/Flutter)

---

## 📅 CRONOGRAMA CONSOLIDADO

### Timeline Completo (26 sprints - 35-40 semanas)

```
BACK OFFICE (RP)                 ████████████████░░░ 75% (8/11 sprints)
├─ Sprint 0-7      ✅ Completados
├─ Sprint 9        🔄 En progreso (Botellas VIP)
├─ Sprint 10       ⏳ Pendiente (Activos Fijos)
└─ Sprint 11       ⏳ Pendiente (Optimización)

BOX OFFICE                       ░░░░░░░░░░░░░░░░░░░  0% (0/5 sprints)
├─ Sprint BO-1     ⏳ Base Ticketing
├─ Sprint BO-2     ⏳ Check-In
├─ Sprint BO-3     ⏳ Listas
├─ Sprint BO-4     ⏳ Promociones
└─ Sprint BO-5     ⏳ Integración

POS                              ███████░░░░░░░░░░░░ 30% (1/10 fases)
├─ Fase 0          ✅ MVP Básico
├─ Fase 1          🔄 UX Mejorado
├─ Fase 2-9        ⏳ Pendientes
```

### Estimación por Sistema

| Sistema | Semanas Restantes | Dificultad | Prioridad |
|---------|-------------------|------------|-----------|
| **Back Office** | 3-4 semanas | Media | ⭐⭐⭐⭐⭐ CRÍTICA |
| **Box Office** | 6-8 semanas | Media | ⭐⭐⭐⭐ ALTA |
| **POS Completo** | 10-14 semanas | Alta | ⭐⭐⭐⭐⭐ CRÍTICA |

**Total Estimado:** 19-26 semanas adicionales para sistema 100% completo

---

## 🎯 ESTRATEGIAS DE IMPLEMENTACIÓN

### Opción A: Secuencial - Completar sistema por sistema
**Duración:** 19-26 semanas

```
Semanas 1-4:   Completar Back Office al 100% ✅
Semanas 5-12:  Implementar Box Office completo
Semanas 13-26: Completar POS con todas las fases
```

**Ventajas:**
- Menor complejidad de coordinación
- Cada sistema 100% funcional antes de continuar
- Enfoque total en un módulo a la vez

**Desventajas:**
- Tiempo total más largo
- ROI se demora más

---

### Opción B: Paralelo - Múltiples equipos
**Duración:** 12-16 semanas

```
Equipo Backend (1):     Back Office + Box Office Backend
Equipo Frontend (1):    Box Office + POS Frontend
Equipo Fullstack (1):   POS Backend + Integraciones
```

**Ventajas:**
- Mucho más rápido
- ROI más temprano
- Sistemas disponibles en paralelo

**Desventajas:**
- Requiere 2-3 desarrolladores
- Coordinación de BD compartida
- Mayor complejidad

---

### Opción C: Iterativo MVP - Features críticas primero
**Duración:** 14-18 semanas

```
Sprint 1-2:   Back Office 100%
Sprint 3-4:   Box Office MVP (Ticketing + Check-in)
Sprint 5-6:   POS MVP avanzado (Botellas + Caja)
Sprint 7-8:   Box Office completo (Promociones + Reportes)
Sprint 9-14:  POS completo (Mesas, Comandas, etc.)
```

**Ventajas:**
- Balance entre velocidad y funcionalidad
- Cada sprint entrega valor
- Feedback continuo del usuario

**Desventajas:**
- Cambios de contexto frecuentes
- Testing más complejo

---

## 🚀 RECOMENDACIÓN FINAL

### **Estrategia Recomendada: Opción C - Iterativo MVP**

**Próximos 5 sprints (10 semanas):**

1. **Sprint 9-10: Completar Back Office** (3 semanas)
   - Botellas VIP + Activos Fijos + Optimización
   - **Resultado:** Back Office 100% production-ready

2. **Sprint BO-1 y BO-2: Box Office MVP** (2-3 semanas)
   - Ticketing básico + Check-In
   - **Resultado:** Taquilla funcional operativa

3. **Sprint POS Fase 1-2: POS Esencial** (3 semanas)
   - UX mejorado + Gestión de Caja completa
   - **Resultado:** POS al 50% con funciones críticas

4. **Sprint BO-3 y BO-4: Box Office Avanzado** (2 semanas)
   - Listas + Promociones
   - **Resultado:** Box Office al 80%

5. **Sprint POS Fase 4-5: POS Avanzado** (2 semanas)
   - Botellas VIP (integrado) + Descuentos
   - **Resultado:** POS al 70%

**Resultado en 10 semanas:**
- ✅ Back Office: 100%
- ✅ Box Office: 80%
- ✅ POS: 70%
- ✅ **Sistema completamente usable en producción**

---

## 📊 MÉTRICAS DE ÉXITO

### KPIs por Sistema

**Back Office (RP):**
- ✅ 100% de módulos operativos
- ✅ Backup automático funcionando
- ✅ >85% cobertura de tests
- ✅ <500ms tiempo de respuesta promedio
- ✅ 0 errores críticos en producción

**Box Office:**
- ✅ >200 entradas vendidas/evento sin errores
- ✅ Check-in promedio <10 segundos
- ✅ 0 entradas duplicadas
- ✅ Aforo en tiempo real preciso (±5 personas)
- ✅ >95% satisfacción de taquilleros

**POS:**
- ✅ Venta registrada en <500ms
- ✅ Cierre de sesión en <2 minutos
- ✅ Cuadre de caja correcto >95%
- ✅ Stock sincronizado en tiempo real
- ✅ <3 clicks para registrar venta

### Métricas de Negocio

- 📈 Reducción 50% en tiempo de operaciones
- 📈 Incremento 30% en precisión de inventario
- 📈 Reducción 70% en errores de caja
- 📈 Incremento 40% en ventas por empleado eficiente
- 📈 ROI del sistema en <6 meses

---

## 🔧 STACK TECNOLÓGICO

### Backend
- Spring Boot 3.2 + Java 17
- PostgreSQL 15 (Database centralizada)
- Spring Security + JWT
- Flyway (Migraciones)
- JasperReports (PDFs)
- Apache POI (Excel)
- WebSockets (para datos en tiempo real)

### Frontend
- React 18 + TypeScript
- Vite (Build tool)
- TanStack Query (Server state)
- Zustand (Client state)
- TailwindCSS + Shadcn/ui
- Recharts (Gráficos)
- React Hook Form + Zod

### DevOps
- Docker + Docker Compose
- Railway.app (Producción)
- GitHub Actions (CI/CD)
- Sentry (Monitoring)

### Integraciones Opcionales
- Fourvenues API (Box Office)
- Redsys/Stripe (Pagos)
- Twilio (SMS para reservas)
- SendGrid (Emails)

---

## 📚 DOCUMENTACIÓN Y RECURSOS

### Documentos Técnicos
- `ARCHITECTURE.md` - Arquitectura detallada
- `CLAUDE.md` - Guía para desarrollo con Claude Code
- `BOTELLAS_VIP_CASO_USO.md` - Diseño sistema botellas
- `TAREAS_PENDIENTES.md` - Tareas detalladas Sprint 9
- `POS_ROADMAP.md` - Roadmap detallado POS
- `BUGFIXES.md` - Historial de bugs resueltos

### Deployment
- `DEPLOY.md` - Despliegue con Docker
- `RAILWAY_DEPLOY.md` - Despliegue en Railway.app
- `TROUBLESHOOTING.md` - Solución de problemas

### Testing
- `TESTING.md` - Guía de testing
- `PLAN_TESTING_POS.md` - Plan de testing POS

---

## 📞 CONTACTO Y SOPORTE

**Versión del Documento:** 2.0
**Fecha de Creación:** Octubre 2025
**Última Actualización:** Octubre 2025
**Próxima Revisión:** Después de Sprint 9

---

## 🎉 CONCLUSIÓN

Este roadmap proporciona una **visión completa y clara** de los 3 sistemas integrados:

1. **Back Office (RP)** - El cerebro administrativo (75% completo)
2. **Box Office** - La entrada del negocio (0% - listo para empezar)
3. **POS** - El corazón de las operaciones (30% completo)

**Próximo paso inmediato:** Completar Sprint 9 - Sistema de Botellas VIP

¿Listos para continuar? 🚀
