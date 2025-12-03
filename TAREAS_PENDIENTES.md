# 📋 Tareas Pendientes - Club Management System

**Última actualización**: 11 Octubre 2025
**Estado del proyecto**: v0.3.0 (75% completado)

---

## 🔥 PRIORIDAD ALTA - Próxima Sesión

### 🍾 Feature: Sistema de Botellas VIP y Gestión por Copas

**Documento de diseño**: `BOTELLAS_VIP_CASO_USO.md`

**Estimación**: 8-12 días (2 sprints)

**Descripción**:
Implementar sistema dual de venta de botellas:
- Venta de botella completa (cerrada) a precio VIP con descuento
- Venta de copas individuales desde botellas abiertas
- Tracking de botellas abiertas en barra con copas restantes
- Actualización del módulo de inventario para reflejar stock dual (cerrado + abierto)
- Precios diferenciados: botella completa, pack VIP, copa individual

**Impacto en módulos**:
- ✅ **POS**: Venta con tipos (BOTELLA_COMPLETA, COPA, PACK_VIP)
- ✅ **Inventario**: Vista dual (almacén vs barra), botellas abiertas, conteo físico
- ✅ **Finanzas**: Registro automático con tipo de venta
- ✅ **Reportes**: Rentabilidad por tipo de venta, desperdicio de botellas

**Checklist de implementación**:

#### Fase 1: Base de Datos (1-2 días)
- [ ] Migración V020: Agregar columnas a tabla `productos`
  - `unidad_medida`, `capacidad_ml`, `copas_por_botella`
  - `precio_copa`, `precio_botella_vip`, `es_botella`
- [ ] Migración V021: Crear tabla `botellas_abiertas`
  - Control de botellas abiertas por ubicación
  - Tracking de copas servidas/restantes
  - Estado (ABIERTA, CERRADA, DESPERDICIADA)
- [ ] Migración V022: Actualizar tabla `detalle_venta`
  - `tipo_venta`, `es_botella_completa`, `botella_abierta_id`
  - `descuento_tipo`, `notas_venta`
- [ ] Crear trigger `descontar_stock_botellas()`
  - Lógica diferenciada por tipo de venta
  - Descuento proporcional para copas
  - Actualización de botellas abiertas
- [ ] Crear trigger `validar_copas_disponibles()`
- [ ] Poblar datos de prueba con 10+ productos configurados como botellas

#### Fase 2: Backend (2-3 días)
- [ ] Crear enum `TipoVenta` (UNIDAD, BOTELLA_COMPLETA, COPA, PACK_VIP)
- [ ] Actualizar entidad `Producto` con nuevos campos
- [ ] Crear entidad `BotellaAbierta` con JPA
- [ ] Crear `BotellaAbiertaRepository` con queries:
  - `findByEstadoAndUbicacion()`
  - `findByProductoIdAndEstado()`
  - `countCopasDisponiblesByProducto()`
- [ ] Crear `BotellaAbiertaService`:
  - `abrirBottella()`, `registrarCopasServidas()`, `cerrarBottella()`
  - `listarBottellasAbiertas()`, `inventarioBottellasAbiertas()`
- [ ] Actualizar `VentaService`:
  - `crearVentaBottella()`, `crearVentaCopas()`
  - `validarDisponibilidadBottella()`
- [ ] Actualizar `ProductoService`:
  - `configurarComoBottella()`, `calcularPrecio()`
- [ ] Crear DTOs:
  - `BotellaAbiertaDTO`, `VentaBottellaRequest`, `VentaCopasRequest`
  - `AbrirBottellaRequest`, `ServirCopasRequest`
- [ ] Crear `BotellaAbiertaController` con endpoints:
  - `POST /api/botellas-abiertas/abrir`
  - `GET /api/botellas-abiertas/activas`
  - `POST /api/botellas-abiertas/{id}/servir-copas`
  - `PUT /api/botellas-abiertas/{id}/cerrar`
  - `GET /api/botellas-abiertas/inventario`
- [ ] Actualizar `POSController`:
  - `POST /api/pos/ventas/botella-completa`
  - `POST /api/pos/ventas/copas`
  - `GET /api/pos/productos/{id}/precios`
- [ ] Actualizar `InventarioService`:
  - `obtenerInventarioConsolidado()` (stock cerrado + abierto)
  - `obtenerInventarioBarra()` (solo botellas abiertas)
- [ ] Tests unitarios (80%+ cobertura):
  - `BotellaAbiertaServiceTest`
  - `VentaServiceTest` (escenarios de botellas)
  - Validación de stock y copas disponibles

#### Fase 3: Frontend POS (1.5-2 días)
- [ ] Crear página `/pos/botellas-abiertas`
  - Lista de botellas abiertas por ubicación
  - Filtros por producto y ubicación
  - Acciones: servir copas, cerrar botella
- [ ] Crear componente `BotellaAbiertaCard`
  - Barra de progreso visual de copas restantes
  - Botones de acción (servir, cerrar)
- [ ] Actualizar `VentaRapidaForm`:
  - RadioGroup para tipo de venta
  - Selector de botella abierta (si tipo = COPA)
  - Mostrar precio según tipo seleccionado
- [ ] Crear modal `AbrirBotellaModal`
  - Seleccionar producto
  - Elegir ubicación (BARRA_PRINCIPAL, BARRA_VIP, COCTELERIA)
  - Confirmar copas totales
- [ ] Crear modal `ServirCopasModal`
  - Input cantidad de copas
  - Mostrar copas disponibles/restantes
  - Validación en tiempo real
- [ ] Actualizar `ProductoForm`:
  - Checkbox "Es botella"
  - Campos: capacidad, copas por botella, precios diferenciados
- [ ] Crear `botellasAbiertas.api.ts`:
  - `abrirBottella()`, `listarBottellasAbiertas()`
  - `servirCopas()`, `cerrarBottella()`
- [ ] Crear hooks personalizados:
  - `useBottellasAbiertas()`, `useAbrirBottella()`
  - `useServirCopas()`, `useCerrarBottella()`
- [ ] Actualizar POS Dashboard:
  - Card "Botellas Abiertas" con cantidad
  - Card "Copas Disponibles"
  - Enlace rápido a gestión de botellas

#### Fase 3.5: Frontend Inventario (1-1.5 días)
- [ ] Actualizar `InventarioPage`:
  - Tabs: Vista Consolidada, Almacén, Barra
  - Dashboard con estadísticas de botellas abiertas
- [ ] Crear `InventarioConsolidadoTable`:
  - Columnas: Almacén, En Barra, Copas Disponibles, Total
  - Expansión de fila para ver detalle de botellas abiertas
- [ ] Crear `InventarioBarraView`:
  - Filtro por ubicación
  - Lista de todas las botellas abiertas
  - Acciones: ver detalle, cerrar
- [ ] Crear `InventarioAlmacenView`:
  - Stock cerrado únicamente
  - Para pedidos a proveedores
- [ ] Actualizar `ConteoFisicoForm`:
  - Input para botellas completas
  - Sección para agregar botellas abiertas con copas estimadas
  - Cálculo automático de diferencia
- [ ] Agregar estadísticas a dashboard:
  - Total botellas abiertas
  - Total copas disponibles
  - Valor en barra
  - Desperdicio del mes
- [ ] Crear indicador visual "Copas disponibles":
  - Tooltip con detalle de botellas
  - Color según disponibilidad
- [ ] Agregar filtro de ubicación

#### Fase 4: Testing & QA (1 día)
- [ ] **Tests de integración**:
  - Vender botella completa → Stock disminuye correctamente
  - Vender copas → Botella abierta se actualiza
  - Cerrar botella vacía → Se marca automáticamente como cerrada
  - Validación: No se pueden vender más copas que disponibles
  - Precio VIP se aplica correctamente a packs
  - Descuento proporcional de stock para copas funciona
- [ ] **Tests de inventario**:
  - Inventario consolidado muestra stock dual correctamente
  - Vista de barra lista botellas abiertas con copas
  - Conteo físico con botellas abiertas calcula diferencia bien
- [ ] **Tests end-to-end**:
  - Flujo completo: Abrir botella → Servir copas → Cerrar botella
  - Flujo VIP: Vender pack con descuento → Transacción correcta
  - Cierre de sesión con botellas abiertas
- [ ] **Tests de performance**:
  - Dashboard con 100+ botellas abiertas carga en < 1s
  - Venta registrada en < 500ms
  - Sin race conditions en stock concurrente

#### Fase 5: Documentación (0.5 días)
- [ ] Actualizar README.md con feature de botellas
- [ ] Crear `BOTELLAS_VIP_GUIA_USUARIO.md`:
  - Cómo configurar productos como botellas
  - Cómo abrir y cerrar botellas
  - Cómo vender packs VIP vs copas
  - Cómo interpretar el inventario dual
- [ ] Actualizar Swagger/OpenAPI docs
- [ ] Crear colección de Postman con ejemplos
- [ ] Documentar casos edge:
  - Botella casi vacía (< 3 copas)
  - Devolución de botella
  - Botella rota/desperdiciada
  - Política de trasvase (NO permitido)

---

## 📊 Métricas de Éxito para Botellas VIP

Validar después de implementación:

**Funcionales**:
- [ ] ✅ Se pueden vender botellas completas con stock correcto
- [ ] ✅ Se pueden vender copas individuales desde botellas abiertas
- [ ] ✅ Precios VIP se aplican automáticamente
- [ ] ✅ Stock dual (cerrado + abierto) se muestra correctamente
- [ ] ✅ Botellas se cierran automáticamente cuando se vacían

**Performance**:
- [ ] ✅ Dashboard de botellas carga en < 1 segundo
- [ ] ✅ Venta de copa registrada en < 500ms
- [ ] ✅ No hay race conditions en descuento de stock

**Negocio**:
- [ ] ✅ Reducción de 30% en desperdicio de botellas
- [ ] ✅ Mayor margen con venta de copas vs botellas completas
- [ ] ✅ Control preciso de inventario en barra

---

## ⏳ PRIORIDAD MEDIA

### 1. Mejoras de UX/UI
- [ ] Modo oscuro (dark mode)
- [ ] Accesibilidad (ARIA labels, keyboard navigation)
- [ ] PWA (Progressive Web App) para instalación en tablet
- [ ] Optimización de imágenes con lazy loading

### 2. Reportes Avanzados
- [ ] Dashboard de comparativa año anterior
- [ ] Exportación de reportes programada (diaria/semanal)
- [ ] Predicción de ventas con ML básico
- [ ] Alertas automáticas por email

### 3. Integraciones
- [ ] API pública con rate limiting
- [ ] Webhooks para eventos importantes
- [ ] Integración con Stripe/Redsys (pagos)
- [ ] Integración con Mailchimp/SendGrid (email marketing)

---

## 🔵 PRIORIDAD BAJA

### 1. Funcionalidades Futuras del POS
- [ ] Impresión de tickets (impresora térmica)
- [ ] Comandas para cocina
- [ ] Gestión de mesas y reservas
- [ ] Sistema de propinas distribuidas
- [ ] Descuentos y promociones automáticas

### 2. Activos Fijos y ROI
- [ ] Gestión de activos fijos del club
- [ ] Depreciación automática
- [ ] Cálculo de ROI por inversión
- [ ] Dashboard de rentabilidad por área

### 3. CRM y Fidelización
- [ ] Base de datos de clientes
- [ ] Programa de puntos
- [ ] Cupones digitales
- [ ] Historial de consumos por cliente

---

## 🐛 BUGS CONOCIDOS

**Ninguno reportado actualmente** ✅

---

## 🔧 DEUDA TÉCNICA

### Backend
- [ ] Agregar cache con Redis para endpoints frecuentes
- [ ] Implementar paginación en todos los endpoints de listado
- [ ] Mejorar manejo de excepciones (custom exception hierarchy)
- [ ] Agregar rate limiting por IP
- [ ] Implementar soft delete en lugar de hard delete

### Frontend
- [ ] Migrar de axios a TanStack Query v5
- [ ] Implementar internacionalización (i18n)
- [ ] Agregar error boundary en todas las páginas
- [ ] Optimizar bundle size (code splitting)
- [ ] Implementar service worker para offline support

### Base de Datos
- [ ] Revisar índices no utilizados
- [ ] Agregar particionamiento a tablas grandes
- [ ] Implementar backup automático incremental
- [ ] Optimizar queries con N+1 problem
- [ ] Agregar full-text search con PostgreSQL

---

## 📅 Roadmap de Sprints

### Sprint Actual: Sprint 8 (Sistema POS - COMPLETADO ✅)
- **Duración**: Semana 16 (5 días)
- **Estado**: ✅ COMPLETADO (11 Oct 2025)
- **Entregables**: 24 endpoints POS, dashboard en tiempo real, integración con inventario

### Próximo Sprint: Sprint 9 (Botellas VIP)
- **Duración**: Semanas 17-18 (2 semanas / 10 días)
- **Estado**: 📋 PLANIFICADO
- **Objetivo**: Sistema completo de botellas con stock dual y precios diferenciados
- **Entregables**:
  - 3 migraciones de BD
  - 2 nuevos servicios
  - 5 nuevos endpoints
  - 2 páginas frontend actualizadas
  - Documentación completa

### Sprint 10: Optimización y Estabilización
- **Duración**: Semana 19 (5 días)
- **Objetivo**: Resolver deuda técnica, optimizar performance, mejorar testing
- **Entregables**:
  - Cobertura de tests > 85%
  - Performance mejorado 30%
  - Documentación de API completa
  - Guías de usuario finales

### Sprint 11: Activos Fijos y ROI (Opcional)
- **Duración**: Semanas 20-21 (2 semanas)
- **Estado**: ⏳ OPCIONAL
- **Objetivo**: Sistema de gestión de activos fijos e inversiones

---

## 🎯 Objetivo para Final de Octubre 2025

**Meta**: Versión 0.4.0 con Sistema de Botellas VIP completo

**Checklist**:
- [x] Sistema POS básico funcionando (v0.3.0)
- [ ] Sistema de Botellas VIP implementado
- [ ] Inventario dual (almacén + barra)
- [ ] Precios diferenciados automáticos
- [ ] Testing exhaustivo (>80% cobertura)
- [ ] Documentación de usuario completa
- [ ] Deploy a Railway con cero downtime

---

## 📝 Notas

- **Priorizar siempre funcionalidades de negocio sobre features técnicas**
- **Mantener cobertura de tests > 80% en todo momento**
- **Documentar TODO antes de marcar como completo**
- **Hacer deploy incremental (no esperar a tenerlo todo)**
- **Pedir feedback del usuario después de cada sprint**

---

**Responsable**: Equipo de desarrollo
**Revisión**: Semanal (cada lunes)
**Última actualización**: 11 Octubre 2025
