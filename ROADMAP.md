# 🗺️ ROADMAP - Club Management System

> **Hoja de ruta del proyecto** - Se actualiza continuamente con el progreso del desarrollo

---

## 📌 Visión General

**Objetivo:** Sistema integral de gestión para discotecas 100% autónomo, sin integraciones externas, optimizado para dueños de discotecas sin conocimientos técnicos.

**Duración Total:** 15 semanas
**Versión Actual:** 0.2.0
**Estado:** ✅ MVP funcional en producción

---

## 🎯 Buyer Persona

**Perfil:** Dueños de discotecas sin conocimientos técnicos
**Necesidades:**
- Lenguaje simple y conversacional
- Interfaz profesional pero accesible
- Responsive en móvil
- Sin términos técnicos complejos

**Principios UX:**
- ❌ NO usar jerga técnica (ej: "Analytics", "Dashboard")
- ✅ SÍ usar lenguaje natural (ej: "Análisis del Negocio", "Inicio")
- ❌ NO usar emojis excesivos ni multicolores
- ✅ SÍ mantener diseño limpio y profesional

---

## 📊 Progreso Global

```
✅ Sprint 0: Setup Inicial (100%)
✅ Sprint 1: Autenticación + Eventos (100%)
✅ Sprint 2: Gestión Financiera (100%)
✅ Sprint 3: Personal y Nóminas (100%)
✅ Sprint 4: Inventario Completo (100%)
✅ Sprint 5: Analytics y Reportes (100%)
✅ Sprint 6: UX Optimization (100%)
✅ Sprint 7: Mejoras Continuas + Sistema POS Backend (100%)
⏳ Sprint 8: Frontend POS + Mejoras UX (Pendiente)
⏳ Sprint 9-10: Funcionalidades Avanzadas (Pendiente)
```

**Progreso Total:** 80% (12/15 semanas)

---

## 🚀 Sprints Completados

### ✅ Sprint 0: Setup Inicial (Semana 1)
**Duración:** 5 días
**Estado:** COMPLETADO ✅

#### Objetivos Cumplidos
- ✅ Estructura base de backend (Spring Boot 3.2 + Java 17)
- ✅ Estructura base de frontend (React 18 + TypeScript + Vite)
- ✅ Configuración Docker Compose (PostgreSQL + Backend + Frontend)
- ✅ Primera migración Flyway con tablas base
- ✅ Usuario admin por defecto (admin/admin123)

#### Tecnologías Implementadas
**Backend:**
- Spring Boot 3.2, PostgreSQL 15, Spring Security + JWT
- JasperReports (PDF), Apache POI (Excel)

**Frontend:**
- React 18 + TypeScript, TanStack Query, Zustand
- TailwindCSS + Shadcn/ui, Recharts

**DevOps:**
- Docker + Docker Compose, GitHub Actions

#### Entregables
- 22 archivos creados (~1,150 líneas de código)
- README.md con instrucciones completas
- Docker Compose funcional

---

### ✅ Sprint 1: Autenticación + Eventos (Semanas 2-3)
**Duración:** 10 días
**Estado:** COMPLETADO ✅

#### Backend (Semana 2)
- ✅ Sistema de autenticación JWT completo
- ✅ Entidad Usuario con roles (ADMIN, GERENTE, RRHH, ENCARGADO, LECTURA)
- ✅ AuthenticationController (/login, /refresh, /me)
- ✅ SecurityConfig con endpoints protegidos
- ✅ Entidad Evento con estados (PLANIFICADO, EN_CURSO, FINALIZADO, CANCELADO)
- ✅ EventoRepository con queries custom
- ✅ EventoService con lógica de negocio
- ✅ EventoController REST completo
- ✅ Migración V002__create_eventos.sql
- ✅ Tests unitarios e integración

#### Frontend (Semana 3)
- ✅ LoginPage con formulario validado
- ✅ authService.ts (login, logout)
- ✅ authStore con Zustand
- ✅ ProtectedRoute component
- ✅ MainLayout con navbar y sidebar responsive
- ✅ EventosPage con lista, filtros y búsqueda
- ✅ EventoModal (crear/editar)
- ✅ eventosApi.ts con TanStack Query

#### Features Entregadas
- Login/logout con JWT
- Gestión completa de eventos (CRUD)
- Filtros por estado y búsqueda
- Layout responsive con sidebar móvil

---

### ✅ Sprint 2: Gestión Financiera (Semanas 4-5)
**Duración:** 10 días
**Estado:** COMPLETADO ✅

#### Backend (Semana 4)
- ✅ Entidad Transaccion (INGRESO/GASTO)
- ✅ Entidad CategoriaTransaccion
- ✅ TransaccionRepository con queries por fecha y tipo
- ✅ TransaccionService con cálculo de P&L automático
- ✅ TransaccionController REST
- ✅ Migración V004__create_finanzas.sql
- ✅ Tests de cálculo de balance

#### Frontend (Semana 5)
- ✅ TransaccionesPage con resumen financiero
- ✅ Cards de Ingresos/Gastos/Balance
- ✅ Filtros por tipo y mes
- ✅ TransaccionModal con validación
- ✅ transaccionesApi.ts
- ✅ Formato de moneda (EUR)
- ✅ Gráficos con Recharts

#### Features Entregadas
- Registro de ingresos y gastos
- Cálculo automático de balance
- Filtros por tipo y fecha
- Visualización de P&L

---

### ✅ Sprint 3: Personal y Nóminas (Semanas 6-8)
**Duración:** 15 días
**Estado:** COMPLETADO ✅

#### Backend (Semanas 6-7)
- ✅ Entidad Empleado con información completa
- ✅ EmpleadoRepository con búsquedas
- ✅ EmpleadoService con lógica de activación/desactivación
- ✅ EmpleadoController REST
- ✅ Migración V005__create_empleados.sql
- ✅ Entidad JornadaTrabajo con cálculo automático de horas
- ✅ JornadaService con lógica de turnos overnight
- ✅ Entidad Nomina con relación a jornadas
- ✅ NominaService con cálculo automático de sueldos
- ✅ Generación masiva de nóminas
- ✅ Migraciones V006, V007, V008

#### Frontend (Semana 8)
- ✅ EmpleadosPage con resumen de personal
- ✅ EmpleadoModal (crear/editar)
- ✅ JornadasPage con registro de turnos
- ✅ JornadaModal con cálculo de horas automático
- ✅ NominasPage con gestión de sueldos
- ✅ NominaModal (crear/editar)
- ✅ Generación masiva de nóminas
- ✅ Filtros por estado y periodo

#### Features Entregadas
- Gestión completa de empleados
- Registro de jornadas laborales
- Cálculo automático de horas trabajadas
- Gestión de nóminas
- Generación masiva de sueldos

---

### ✅ Sprint 4: Inventario Completo (Semanas 9-11)
**Duración:** 15 días
**Estado:** COMPLETADO ✅

#### Backend (Semanas 9-10)
- ✅ Entidad Producto con categorías
- ✅ Entidad Inventario con stock actual
- ✅ Entidad MovimientoStock (ENTRADA/SALIDA/AJUSTE)
- ✅ Entidad AlertaStock con notificaciones automáticas
- ✅ ProductoRepository con búsquedas
- ✅ InventarioService con lógica de stock
- ✅ MovimientoStockService transaccional
- ✅ AlertaStockService con verificación automática
- ✅ Migración V009__create_inventory.sql
- ✅ Entidad Proveedor
- ✅ ProveedorRepository
- ✅ Migración V003__create_proveedores.sql

#### Frontend (Semana 11)
- ✅ ProductosPage con catálogo
- ✅ ProductoModal (crear/editar)
- ✅ InventarioPage con stock actual
- ✅ MovimientosPage con historial
- ✅ MovimientoModal (registrar entrada/salida)
- ✅ AlertasPage con notificaciones de stock bajo
- ✅ ProveedoresPage con gestión de empresas
- ✅ ProveedorModal (crear/editar)
- ✅ Filtros por categoría y estado

#### Features Entregadas
- Catálogo de productos completo
- Control de stock en tiempo real
- Historial de movimientos
- Alertas automáticas de stock bajo
- Gestión de proveedores

---

### ✅ Sprint 5: Analytics y Reportes (Semanas 12-13)
**Duración:** 10 días
**Estado:** COMPLETADO ✅

#### Backend (Semana 12)
- ✅ DashboardService con métricas en tiempo real
- ✅ AnalyticsService con agregaciones
- ✅ ExcelExportService (Apache POI)
- ✅ PdfExportService (JasperReports)
- ✅ ReportesController REST
- ✅ Cálculo de KPIs financieros
- ✅ Cálculo de rendimiento de empleados

#### Frontend (Semana 13)
- ✅ DashboardPage con auto-refresh (30s)
- ✅ Cards de métricas clave
- ✅ Gráficos de ingresos/gastos (Recharts)
- ✅ AnalyticsPage con análisis detallado
- ✅ Exportación a Excel
- ✅ Exportación a PDF
- ✅ reportesApi.ts

#### Features Entregadas
- Dashboard ejecutivo con datos reales
- Auto-refresh cada 30 segundos
- Reportes PDF/Excel de transacciones
- Análisis financiero detallado

---

### ✅ Sprint 6: UX Optimization (Semana 14)
**Duración:** 5 días
**Estado:** COMPLETADO ✅

#### Objetivos Cumplidos
- ✅ Adaptación de textos para buyer persona (dueños no técnicos)
- ✅ Lenguaje simplificado y conversacional
- ✅ Diseño limpio y profesional mantenido
- ✅ Fix de scroll en sidebar móvil
- ✅ Pruebas en dispositivos móviles

#### Cambios de Nomenclatura
| Antes | Después | Razón |
|-------|---------|-------|
| Dashboard | Inicio | Más simple y directo |
| Gestión de recursos humanos | Personas que trabajan contigo | Conversacional |
| Finanzas | Ingresos y Gastos | Más claro |
| Nóminas | Sueldos | Lenguaje común |
| Inventario de Productos | Productos y Stock | Más descriptivo |
| Analytics | Análisis del Negocio | Sin anglicismos |
| Gestión de eventos | Todas tus fiestas y eventos | Cercano al usuario |

#### Archivos Modificados
- `frontend/src/pages/dashboard/DashboardPage.tsx`
- `frontend/src/pages/eventos/EventosPage.tsx`
- `frontend/src/pages/empleados/EmpleadosPage.tsx`
- `frontend/src/pages/transacciones/TransaccionesPage.tsx`
- `frontend/src/pages/proveedores/ProveedoresPage.tsx`
- `frontend/src/pages/productos/ProductosPage.tsx`
- `frontend/src/pages/nominas/NominasPage.tsx`
- `frontend/src/pages/analytics/AnalyticsPage.tsx`
- `frontend/src/components/layout/MainLayout.tsx` (bugfix scroll)

#### Bugfixes
- ✅ Sidebar móvil sin scroll → agregado `overflow-y-auto` en `MainLayout.tsx:83`

---

## 🔄 Sprint Actual

### Sprint 7: Mejoras Continuas + Sistema POS (Semanas 15-17)
**Duración:** 15 días
**Estado:** COMPLETADO ✅
**Progreso:** 100%

#### Objetivos Cumplidos
- ✅ Documentación actualizada (README.md, ROADMAP.md, PROGRESS.md)
- ✅ Testing exhaustivo en producción Railway
- ✅ **Sistema POS completamente funcional**
- ✅ Migraciones V015-V018 aplicadas exitosamente
- ✅ Trigger automático de descuento de stock operativo
- ✅ Optimización de rendimiento (BCrypt strength 4 en producción)

#### Sistema POS Implementado
**Backend:**
- ✅ Tablas sesiones_venta y consumos_sesion (V016)
- ✅ Función descontar_stock_consumo() con stock_anterior/stock_nuevo (V017)
- ✅ Trigger descontar_stock_consumo_trigger (V018)
- ✅ SesionVentaController con endpoints REST completos
- ✅ ConsumoService con integración a movimientos de stock

**Endpoints Funcionando:**
- ✅ POST /api/sesiones-venta - Crear sesión
- ✅ GET /api/sesiones-venta/abiertas - Listar sesiones abiertas
- ✅ GET /api/sesiones-venta/{id} - Obtener detalles
- ✅ POST /api/sesiones-venta/{id}/consumos - Registrar consumo (con trigger)
- ✅ GET /api/sesiones-venta/{id}/consumos - Listar consumos
- ✅ POST /api/sesiones-venta/{id}/cerrar - Cerrar sesión

**Trigger de Stock:**
- ✅ Descuenta automáticamente stock al registrar consumos
- ✅ Registra movimientos con stock_anterior y stock_nuevo
- ✅ Soporta venta por BOTELLA, COPA, CHUPITO
- ✅ Convierte copas/chupitos a botellas automáticamente

**Problemas Resueltos:**
- ✅ PasswordMigrationRunner deshabilitado (causaba crashes)
- ✅ SecurityConfig optimizado para permitir /api/auth/**
- ✅ Trigger faltante en V017 → solucionado con V018
- ✅ Validaciones de DTOs corregidas
- ✅ CORS configurado para producción

#### Documentación Creada
- ✅ `POS_SISTEMA_COMPLETO.md` - Documentación exhaustiva del sistema POS
- ✅ `POS_FIXES_DEPLOY.md` - Historial de fixes aplicados
- ✅ Actualización de CLAUDE.md con guías del proyecto

---

## ⏳ Sprints Futuros

### Sprint 8: Frontend POS + Mejoras UX (Semanas 18-19)
**Duración:** 10 días
**Estado:** PENDIENTE ⏳

#### Objetivos
- [ ] Interfaz POS completa en React
- [ ] Grid de productos táctil optimizado
- [ ] Carrito de compra en tiempo real
- [ ] Integración con endpoints POS backend
- [ ] Responsive móvil y tablet
- [ ] Mejoras UX generales

#### Frontend POS
- [ ] POSPage con diseño táctil
- [ ] ProductGrid con selección rápida
- [ ] Carrito con cálculo automático de totales
- [ ] SesionVentaModal (abrir/cerrar)
- [ ] ConsumoList con historial de sesión
- [ ] posApi.ts con integración backend

#### Mejoras UX
- [ ] Optimización de formularios
- [ ] Feedback visual mejorado
- [ ] Animaciones suaves
- [ ] Mensajes de error claros
- [ ] Loading states consistentes

---

### Sprint 9: Activos Fijos y ROI (Semanas 18-19)
**Duración:** 10 días
**Estado:** PENDIENTE ⏳

#### Objetivos
- [ ] Gestión de activos fijos del club
- [ ] Seguimiento de inversiones
- [ ] Cálculo automático de ROI
- [ ] Dashboard de rentabilidad
- [ ] Depreciación de activos

#### Backend
- [ ] Entidad ActivoFijo
- [ ] Entidad Inversion
- [ ] ActivoFijoService con cálculo de depreciación
- [ ] InversionService con cálculo de ROI
- [ ] Migración V0XX__create_activos.sql

#### Frontend
- [ ] ActivosFijosPage con catálogo de activos
- [ ] InversionesPage con seguimiento
- [ ] ROIDashboard con métricas financieras
- [ ] Gráficos de rentabilidad

---

### Sprint 10: Optimización Final y Producción (Semana 20)
**Duración:** 5 días
**Estado:** PENDIENTE ⏳

#### Objetivos
- [ ] Auditoría completa de seguridad
- [ ] Optimización de rendimiento final
- [ ] Documentación completa de API (Swagger)
- [ ] Guías de usuario final
- [ ] Plan de mantenimiento
- [ ] Backup automático de base de datos

---

## 🎯 Features por Módulo

### ✅ Autenticación y Seguridad
- ✅ Login con JWT
- ✅ Roles jerárquicos (ADMIN, GERENTE, RRHH, ENCARGADO, LECTURA)
- ✅ Protección de rutas
- ✅ Refresh token
- ✅ Logout seguro
- ⏳ 2FA (futuro)

### ✅ Eventos
- ✅ CRUD completo
- ✅ Estados (PLANIFICADO, EN_CURSO, FINALIZADO, CANCELADO)
- ✅ Filtros y búsqueda
- ✅ Validaciones

### ✅ Finanzas
- ✅ Registro de ingresos/gastos
- ✅ Categorías de transacciones
- ✅ Cálculo de P&L automático
- ✅ Filtros por fecha y tipo
- ✅ Exportación Excel/PDF

### ✅ Personal
- ✅ Gestión de empleados
- ✅ Registro de jornadas laborales
- ✅ Cálculo automático de horas
- ✅ Gestión de nóminas
- ✅ Generación masiva de sueldos

### ✅ Inventario
- ✅ Catálogo de productos
- ✅ Control de stock
- ✅ Movimientos (ENTRADA/SALIDA/AJUSTE)
- ✅ Alertas de stock bajo
- ✅ Gestión de proveedores

### ✅ Analytics
- ✅ Dashboard con auto-refresh
- ✅ KPIs financieros
- ✅ Gráficos de ingresos/gastos
- ✅ Reportes exportables

### ✅ POS (Punto de Venta)
- ✅ Sesiones de venta (ABIERTA/CERRADA/CANCELADA)
- ✅ Registro de consumos con producto, cantidad, precio
- ✅ Descuento automático de stock via trigger
- ✅ Cierre de sesión con cálculo de valor total
- ✅ Historial de consumos por sesión
- ✅ Integración completa con inventario
- ⏳ Interfaz frontend (pendiente)

### ⏳ ROI (Futuro)
- ⏳ Gestión de activos fijos
- ⏳ Seguimiento de inversiones
- ⏳ Cálculo de ROI
- ⏳ Dashboard de rentabilidad

---

## 📈 Métricas del Proyecto

### Líneas de Código (Estimado)
- **Backend:** ~15,000 líneas
- **Frontend:** ~12,000 líneas
- **Configuración:** ~2,000 líneas
- **SQL:** ~1,500 líneas
- **Tests:** ~3,000 líneas
- **Total:** ~33,500 líneas

### Archivos
- **Backend:** ~120 archivos
- **Frontend:** ~90 archivos
- **Infraestructura:** ~20 archivos
- **Documentación:** ~15 archivos
- **Total:** ~245 archivos

### Tiempo Invertido
- **Sprint 0-6:** ~10.5 semanas
- **Restante estimado:** ~4.5 semanas
- **Total estimado:** ~15 semanas

---

## 🚀 Próximos Pasos Inmediatos

### Esta Semana (Completado ✅)
1. ✅ Actualizar documentación completa
2. ✅ Testing exhaustivo en producción
3. ✅ Sistema POS Backend completamente operativo
4. ✅ Trigger de stock funcionando perfectamente

### Próxima Semana
1. Diseñar interfaz frontend POS táctil
2. Implementar ProductGrid con selección rápida
3. Crear componente de carrito en tiempo real
4. Integrar frontend con endpoints POS backend
5. Testing en móvil y tablet

---

## 📊 Estado de Deployment

### ✅ Railway.app (Producción)
- **Frontend:** https://club-management-frontend.railway.app
- **Backend:** https://club-management-backend.railway.app
- **Estado:** 🟢 ONLINE
- **Última actualización:** 2025-10-10

### Ambientes
- ✅ Producción (Railway)
- ✅ Desarrollo Local (Docker Compose)
- ⏳ Staging (futuro)

---

## 🎓 Aprendizajes Clave

### UX para Usuarios No Técnicos
- El lenguaje simple es crucial para la adopción
- Los términos técnicos alejan al buyer persona
- El diseño profesional no necesita ser complejo
- La accesibilidad móvil es fundamental

### Arquitectura
- Spring Boot + React es una combinación sólida
- TanStack Query simplifica el manejo de estado del servidor
- Flyway garantiza migraciones consistentes
- Docker Compose facilita el desarrollo local
- **PostgreSQL triggers** son ideales para lógica automática de base de datos

### Base de Datos
- Los **triggers** requieren AMBOS: `CREATE FUNCTION` + `CREATE TRIGGER`
- Los campos NOT NULL deben estar en **todas** las inserciones desde el primer día
- Las migraciones deben incluir checks de idempotencia (`IF NOT EXISTS`)
- El checksum de Flyway valida la integridad de migraciones aplicadas

### Despliegue
- Railway.app es excelente para MVPs rápidos
- El monitoreo continuo es esencial
- Los healthchecks previenen downtime
- **BCrypt strength 4** para producción (10 para desarrollo)
- CORS con `allowCredentials: true` requiere orígenes específicos (no `*`)

### Debugging en Producción
- Los logs estructurados son cruciales para diagnóstico
- HTTP 403 puede ser causado por validación de datos (no solo seguridad)
- Las excepciones de BD pueden propagarse como 403 si no se manejan
- `@ControllerAdvice` es esencial para manejo consistente de errores

---

## 🤝 Contribuciones

Este es un proyecto privado. Para contribuir:
1. Consultar `CLAUDE.md` para guías técnicas
2. Seguir los principios UX del buyer persona
3. Mantener el diseño limpio y profesional
4. Probar en móvil antes de commitear

---

**Última actualización:** 2025-10-10
**Versión del documento:** 1.0
**Mantenido por:** Equipo de desarrollo
