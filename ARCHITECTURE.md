# 🏗️ Arquitectura del Proyecto - Club Management System

> **Nombre del Proyecto:** RP - Resource Planning
> **Versión:** 0.2.0 (actualizándose a 0.3.0 con POS)

---

## 🎯 Concepto Principal

**RP (Resource Planning)** es el nombre del **proyecto completo** de gestión del club. El POS NO es un proyecto separado, sino un **módulo más dentro de RP**.

```
┌─────────────────────────────────────────────────────────────────┐
│                    RP - RESOURCE PLANNING                       │
│              (Sistema Completo de Gestión del Club)             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MÓDULOS DEL SISTEMA:                                          │
│                                                                 │
│  ✅ Autenticación y Seguridad                                  │
│  ✅ Eventos y Fiestas                                          │
│  ✅ Ingresos y Gastos (Finanzas)                               │
│  ✅ Mi Equipo (Personal y Nóminas)                             │
│  ✅ Productos y Stock (Inventario)                             │
│  ✅ Análisis del Negocio (Analytics)                           │
│  ✅ Proveedores                                                │
│  🔄 Punto de Venta (POS) ← NUEVO MÓDULO                       │
│  ⏳ Activos Fijos y ROI (Futuro)                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Estructura Correcta del Proyecto

### Club Management System = RP

```
RP (Resource Planning)
│
├── Módulo 1: Autenticación ✅
├── Módulo 2: Eventos ✅
├── Módulo 3: Finanzas ✅
├── Módulo 4: Personal ✅
├── Módulo 5: Inventario ✅
├── Módulo 6: Analytics ✅
├── Módulo 7: Proveedores ✅
├── Módulo 8: POS 🔄 ← En desarrollo
└── Módulo 9: ROI ⏳ ← Futuro
```

---

## 🛒 Módulo POS dentro de RP

El POS es un módulo del sistema RP que tiene **dos interfaces distintas**:

### 1. **Terminal Táctil POS**
- **Ruta:** `/pos` (dentro de la misma web de RP)
- **Ubicación física:** Tablet en la barra
- **Usuarios:** Camareros, Bartenders
- **Propósito:** Registrar ventas rápidamente
- **Características:** Interfaz fullscreen, botones grandes, optimizado para táctil

### 2. **Dashboard de Monitoreo POS**
- **Ruta:** `/sesiones` (dentro de la misma web de RP)
- **Ubicación física:** Oficina del gerente, cualquier dispositivo
- **Usuarios:** Gerente, Admin, Encargados
- **Propósito:** Monitorear sesiones de caja en tiempo real
- **Características:** WebSocket, gráficos, estadísticas

---

## 🏗️ Estructura de Código

### Backend (Mismo proyecto Spring Boot)

```
backend/
├── src/main/java/com/club/management/
│   ├── entity/
│   │   ├── Usuario.java ✅
│   │   ├── Evento.java ✅
│   │   ├── Transaccion.java ✅
│   │   ├── Empleado.java ✅
│   │   ├── Producto.java ✅
│   │   ├── SesionCaja.java 🔄 ← POS
│   │   └── Consumo.java 🔄 ← POS
│   │
│   ├── service/
│   │   ├── EventoService.java ✅
│   │   ├── TransaccionService.java ✅
│   │   ├── EmpleadoService.java ✅
│   │   ├── InventarioService.java ✅
│   │   ├── SesionCajaService.java 🔄 ← POS
│   │   └── ConsumoService.java 🔄 ← POS
│   │
│   └── controller/
│       ├── EventoController.java ✅
│       ├── TransaccionController.java ✅
│       ├── EmpleadoController.java ✅
│       ├── InventarioController.java ✅
│       ├── SesionCajaController.java 🔄 ← POS
│       └── ConsumoController.java 🔄 ← POS
```

### Frontend (Mismo proyecto React)

```
frontend/
├── src/
│   ├── pages/
│   │   ├── dashboard/ ✅
│   │   ├── eventos/ ✅
│   │   ├── transacciones/ ✅
│   │   ├── empleados/ ✅
│   │   ├── inventario/ ✅
│   │   ├── pos/ 🔄 ← Terminal Táctil POS
│   │   │   ├── POSPage.tsx
│   │   │   ├── LoginPOS.tsx
│   │   │   └── components/
│   │   │       ├── ProductoGrid.tsx
│   │   │       ├── TicketActual.tsx
│   │   │       └── BotonesMetodoPago.tsx
│   │   │
│   │   └── sesiones/ 🔄 ← Dashboard Monitoreo POS
│   │       ├── SesionesPage.tsx
│   │       ├── SesionDetallePage.tsx
│   │       └── components/
│   │           ├── SesionCard.tsx
│   │           ├── VentasLiveStream.tsx
│   │           └── EstadisticasSesion.tsx
│   │
│   ├── api/
│   │   ├── eventos.api.ts ✅
│   │   ├── transacciones.api.ts ✅
│   │   ├── empleados.api.ts ✅
│   │   ├── sesiones.api.ts 🔄 ← POS
│   │   └── consumos.api.ts 🔄 ← POS
│   │
│   └── store/
│       ├── authStore.ts ✅
│       └── posStore.ts 🔄 ← POS
```

---

## 🔄 Flujo de Integración POS con RP

### El POS se integra completamente con módulos existentes:

```
┌─────────────────────────────────────────────────────────────┐
│                     MÓDULO POS                              │
├─────────────────────────────────────────────────────────────┤
│  Terminal Táctil → Registra Venta (Consumo)                │
│         ↓                                                   │
│  1. Descuenta Stock Automático (Inventario) ✅             │
│  2. Registra Transacción (Finanzas) ✅                     │
│  3. Asigna a Empleado/Evento (Personal/Eventos) ✅         │
│  4. Actualiza Dashboard en Tiempo Real (Analytics) ✅       │
└─────────────────────────────────────────────────────────────┘
```

### Ejemplo de Venta:

```
Usuario hace venta en Terminal POS:
  - 2 Cervezas (€7.00)
  - 1 Mojito (€8.00)
  - Método: Efectivo
  ↓
Backend POS procesa:
  1. Crea Consumo en sesiones_caja
  2. Descuenta stock: Inventario.cantidad -= 2 (Cerveza)
  3. Descuenta stock: Inventario.cantidad -= 1 (Mojito)
  4. Crea MovimientoStock tipo SALIDA
  5. Actualiza SesionCaja.totalVentas += €15.00
  6. WebSocket notifica al Dashboard
  7. Al cerrar sesión → Crea Transaccion tipo INGRESO
```

---

## 📱 Rutas de la Aplicación

### Existentes (RP Modules)
```
/login                    - Login
/dashboard                - Inicio (Resumen del club)
/eventos                  - Eventos y Fiestas
/finanzas                 - Ingresos y Gastos
/personal                 - Mi Equipo
/turnos                   - Jornadas de Trabajo
/nominas                  - Sueldos
/inventario               - Productos y Stock
/movimientos-stock        - Movimientos de Inventario
/alertas-stock            - Alertas de Stock Bajo
/analytics                - Análisis del Negocio
/proveedores              - Proveedores
```

### Nuevas (POS Module)
```
/pos                      - 🛒 Terminal Táctil POS (Fullscreen)
/sesiones                 - 📊 Dashboard de Sesiones de Caja
/sesiones/:id             - 📊 Detalle de Sesión
```

---

## 🗄️ Base de Datos

### Todas las tablas están en la misma BD PostgreSQL:

```sql
-- RP Existing Tables ✅
usuarios
eventos
transacciones
categorias_transaccion
empleados
nominas
jornadas_trabajo
productos
inventario
movimientos_stock
alertas_stock
proveedores
categorias_producto

-- POS New Tables 🔄
sesiones_caja         ← Nueva (Sprint 8)
consumos              ← Nueva (Sprint 8)
```

### Relaciones POS con RP:

```sql
sesiones_caja
  - usuario_id → usuarios (cajero)
  - evento_id → eventos (opcional)

consumos
  - sesion_caja_id → sesiones_caja
  - producto_id → productos
  - (descuenta de inventario automáticamente)

-- Al cerrar sesión:
sesiones_caja.cerrar() → crea → transacciones (tipo INGRESO)
```

---

## 🎯 Roles y Permisos

### Mismo sistema de roles de RP:

| Rol | Acceso POS Terminal | Acceso Dashboard Sesiones |
|-----|-------------------|--------------------------|
| **ADMIN** | ✅ Sí | ✅ Todas las sesiones |
| **GERENTE** | ✅ Sí | ✅ Todas las sesiones |
| **ENCARGADO** | ✅ Sí | ✅ Solo sus sesiones |
| **CAJERO** | ✅ Sí | ❌ No (solo terminal) |
| **RRHH** | ❌ No | ✅ Ver sesiones (read-only) |
| **LECTURA** | ❌ No | ✅ Ver sesiones (read-only) |

---

## 🚀 Deployment

### Todo en el mismo deployment de RP:

```
Railway.app
├── Backend (Spring Boot)
│   ├── Módulos RP existentes ✅
│   └── Módulos POS nuevos 🔄
│
├── Frontend (React SPA)
│   ├── Páginas RP existentes ✅
│   └── Páginas POS nuevas 🔄
│
└── Database (PostgreSQL 15)
    ├── Tablas RP existentes ✅
    └── Tablas POS nuevas 🔄
```

**NO hay servers separados, NO hay bases de datos separadas.**

---

## 📦 Versioning

### Versiones del Proyecto RP:

- **v0.1.0** - Setup inicial + Auth + Eventos
- **v0.2.0** - Finanzas + Personal + Inventario + Analytics + UX optimization (ACTUAL)
- **v0.3.0** - POS Module (Terminal + Dashboard) (PRÓXIMA)
- **v0.4.0** - ROI + Activos Fijos
- **v1.0.0** - Release completo

---

## 🔧 Variables de Entorno

### Mismo `.env` para todo el proyecto:

```bash
# Backend
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:postgresql://...
DB_USER=club_admin
DB_PASSWORD=***
JWT_SECRET=***

# Frontend
VITE_API_URL=https://club-management-backend.railway.app/api
VITE_WS_URL=wss://club-management-backend.railway.app/ws  ← Para POS WebSocket
```

---

## 📊 Métricas del Proyecto RP (Completo)

| Métrica | Actual (v0.2.0) | Con POS (v0.3.0) |
|---------|----------------|------------------|
| Módulos | 7 | 8 |
| Líneas de Código | ~33,500 | ~41,500 |
| Archivos | ~245 | ~295 |
| Migraciones | 9 | 10 |
| Endpoints API | ~60 | ~72 |
| Componentes React | ~50 | ~65 |
| Páginas React | ~12 | ~14 |

---

## 🎓 Resumen

**CORRECTO:**
- ✅ RP es el nombre del proyecto completo
- ✅ POS es un módulo dentro de RP
- ✅ Todo en el mismo repo, backend, frontend y BD
- ✅ POS se integra con módulos existentes (Inventario, Finanzas, etc.)

**INCORRECTO:**
- ❌ POS NO es un proyecto separado
- ❌ POS NO tiene su propia base de datos
- ❌ POS NO se deploya en otro servidor

---

**Última actualización:** 2025-10-10
**Versión del documento:** 1.0
