# 🛒 Sistema POS - Guía Completa de Usuario

> **Versión:** 1.0
> **Fecha:** 2025-10-11
> **Estado:** ✅ 100% Funcional

---

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Flujo de Trabajo](#flujo-de-trabajo)
3. [Pantallas del Sistema](#pantallas-del-sistema)
4. [Guía de Uso](#guía-de-uso)
5. [Casos de Uso](#casos-de-uso)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Visión General

El **Sistema POS (Punto de Venta)** es una solución completa para la gestión de ventas en tiempo real, diseñado específicamente para discotecas y clubes nocturnos.

### Características Principales

✅ **Gestión de Sesiones de Caja**
- Apertura/cierre de sesiones con control de cajero
- Asociación a eventos específicos
- Cuadre automático de caja

✅ **Registro de Ventas**
- Carrito de compra intuitivo
- 3 métodos de pago (Efectivo, Tarjeta, Mixto)
- Descuento automático de stock
- Generación automática de tickets

✅ **Interfaces Especializadas**
- **POS Principal**: Gestión completa con carrito
- **Terminal Táctil**: Interfaz fullscreen para tablets
- **Monitor en Tiempo Real**: Dashboard para gerentes

✅ **Estadísticas en Vivo**
- Auto-refresh cada 5 segundos
- KPIs en tiempo real
- Stream de ventas

---

## 🔄 Flujo de Trabajo

### 1. Apertura de Sesión
```
👤 Cajero → [Abrir Nueva Sesión] → Seleccionar Evento (opcional) → Confirmar
```

### 2. Registro de Ventas
```
📦 Seleccionar Productos → 🛒 Agregar al Carrito → Modificar Cantidades (si necesario) → 💰 Seleccionar Método de Pago → ✅ Cobrar
```

### 3. Cierre de Sesión
```
🔒 Cerrar Sesión → Verificar Resumen → Ingresar Observaciones (opcional) → Confirmar Cierre
```

---

## 📱 Pantallas del Sistema

### 1. POS Principal (`/pos`)

**Propósito:** Gestión completa de ventas con carrito

**Características:**
- Carrito visible en todo momento
- Grid de productos con búsqueda
- Botones de método de pago prominentes
- Información de sesión activa

**Usuarios:** Cajeros, Personal de barra

**Layout:**
```
┌─────────────┬─────────────────────────┐
│   SESIÓN    │                         │
│   ACTIVA    │                         │
│             │   GRID DE PRODUCTOS     │
│   CARRITO   │                         │
│   (sticky)  │   (con búsqueda y       │
│             │    categorías)          │
│   TOTAL     │                         │
│             │                         │
│ [💵 COBRAR] │                         │
│ [💳 COBRAR] │                         │
│ [💰 MIXTO]  │                         │
└─────────────┴─────────────────────────┘
```

---

### 2. Terminal Táctil (`/pos-terminal`)

**Propósito:** Interfaz optimizada para tablets en la barra

**Características:**
- **Fullscreen** (sin distracciones)
- Botones ENORMES (200x200px)
- Modo oscuro (perfecto para discotecas)
- Carrito en panel lateral
- Búsqueda rápida

**Usuarios:** Bartenders, Camareros (en tablets)

**Ventajas:**
- ⚡ Venta ultrarrápida (3 clicks)
- 👆 Optimizado para uso táctil
- 🌙 Alto contraste para ambientes oscuros
- 📊 Total visible en todo momento

**Layout:**
```
┌────────────────────────────────────────┬─────────────┐
│  🟢 Sesión | Items: 5 | Total: €45.00 │             │
├────────────────────────────────────────┤   CARRITO   │
│  [Buscar] [TODAS] [BEBIDAS] [COMIDA]  │             │
│                                        │   • Item 1  │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐│   • Item 2  │
│  │  🍺      │ │  🍹      │ │  🥤     ││   • Item 3  │
│  │ CERVEZA  │ │ MOJITO   │ │ REFRESCO││             │
│  │  €3.50   │ │  €8.00   │ │  €2.00  ││   TOTAL:    │
│  └──────────┘ └──────────┘ └─────────┘│   €45.00    │
│                                        │             │
│  (más productos...)                    │ [💵 EFECTIVO]│
│                                        │ [💳 TARJETA]│
│                                        │ [💰 MIXTO]  │
└────────────────────────────────────────┴─────────────┘
```

---

### 3. Monitor de Sesiones (`/pos-monitor`)

**Propósito:** Dashboard en tiempo real para gerentes

**Características:**
- Auto-refresh cada 5 segundos
- Vista de todas las sesiones activas
- Stream de últimas ventas (live)
- KPIs globales del día
- Toggle auto-refresh ON/OFF

**Usuarios:** Gerentes, Administradores

**Métricas Mostradas:**
- 💰 Ingresos totales del día
- 🛒 Número de ventas
- 📊 Ticket promedio
- 👥 Sesiones activas

**Vista por Sesión:**
- Cajero responsable
- Duración de la sesión
- Total de ventas
- Últimas 5 ventas en vivo

---

### 4. Dashboard POS (`/pos-dashboard`)

**Propósito:** Estadísticas y gráficos del POS

**Características:**
- Filtros por período (Hoy, 7 días, 30 días)
- Gráficos de métodos de pago
- Top 5 productos más vendidos
- Ventas por hora
- Refresh manual

---

### 5. Historial de Sesiones (`/sesiones`)

**Propósito:** Listado de todas las sesiones (abiertas y cerradas)

**Características:**
- Tabla con todas las sesiones
- Filtros por fecha y estado
- Detalles de cada sesión
- Exportación a Excel/PDF

---

## 📖 Guía de Uso

### 🔓 Abrir una Sesión

1. Navega a `/pos`
2. Click en **"Abrir Nueva Sesión"**
3. Completa el formulario:
   - **Nombre de sesión** (ej: "Caja 1 - Viernes Noche")
   - **Evento** (opcional) - Selecciona el evento asociado
   - **Empleado** (automático - usuario actual)
4. Click en **"Abrir Sesión"**
5. La sesión aparecerá como activa

### 🛒 Registrar una Venta

**Opción A: Desde POS Principal (`/pos`)**
1. Busca el producto en el grid (usa búsqueda o categorías)
2. Click en el producto para agregarlo al carrito
3. Modifica la cantidad si es necesario (botones +/-)
4. Verifica el total en el carrito
5. Selecciona el método de pago:
   - **💵 EFECTIVO** - Para pagos en efectivo
   - **💳 TARJETA** - Para pagos con tarjeta
   - **💰 MIXTO** - Para pagos combinados
6. Click en **"COBRAR"**
7. ✅ Venta registrada - Carrito se limpia automáticamente

**Opción B: Desde Terminal Táctil (`/pos-terminal`)**
1. Click en los productos (botones grandes)
2. Productos se agregan automáticamente al carrito lateral
3. Click en el método de pago
4. ✅ Venta registrada instantáneamente

### 🔒 Cerrar una Sesión

1. Asegúrate de que **no haya carrito pendiente**
2. Click en **"Cerrar Sesión"**
3. Revisa el resumen:
   - Total de ventas
   - Ingresos generados
   - Ticket promedio
   - Desglose por método de pago
4. Añade observaciones (opcional)
5. Click en **"Confirmar Cierre"**
6. La sesión se marca como CERRADA

**⚠️ Importante:**
- No puedes cerrar si hay carrito con items
- El cierre es irreversible
- Todas las ventas quedan registradas

### 📊 Monitorear Sesiones en Tiempo Real

1. Navega a `/pos-monitor`
2. Verifica que el **Auto-refresh esté ON** (indicador verde)
3. Observa:
   - KPIs globales en la parte superior
   - Tarjetas de sesiones activas
   - Stream de ventas en vivo (últimas 5 por sesión)
4. Usa **"Actualizar"** para refresh manual
5. Toggle **Auto-refresh OFF** para pausar actualizaciones

---

## 💡 Casos de Uso

### Caso 1: Noche de Evento (Flujo Completo)

**Escenario:** Viernes por la noche, evento de reggaeton, 2 barras activas

**Pasos:**

1. **Preparación (19:00)**
   - Gerente abre 2 sesiones desde `/pos`:
     - "Caja 1 - Barra Principal" (Juan)
     - "Caja 2 - Barra VIP" (María)
   - Asocia ambas al evento "Noche de Reggaeton"

2. **Durante el Evento (23:00 - 04:00)**
   - Bartenders usan **Terminal Táctil** (`/pos-terminal`) en tablets
   - Ventas ultrarrápidas: click producto → método pago → confirmar
   - Stock se descuenta automáticamente

3. **Monitoreo Gerencial (toda la noche)**
   - Gerente usa **Monitor** (`/pos-monitor`) desde oficina
   - Ve ventas en vivo de ambas barras
   - Verifica ingresos en tiempo real
   - Detecta productos más vendidos

4. **Cierre (04:30)**
   - Bartenders cierran sesiones desde `/pos`
   - Revisan cuadre
   - Confirman cierre
   - Gerente verifica totales desde `/pos-dashboard`

### Caso 2: Venta Rápida con Descuento de Stock

**Escenario:** Cliente pide 5 cervezas

**Flujo:**
1. Bartender en `/pos-terminal`
2. Click en **🍺 CERVEZA** (botón grande)
3. Click 5 veces O modificar cantidad a 5
4. Total: €17.50 (5 x €3.50)
5. Click **💵 EFECTIVO**
6. ✅ Venta registrada
7. 🔄 Stock de cerveza: 150 → 145 (automático)

### Caso 3: Pago Mixto

**Escenario:** Cliente paga €30 efectivo + €15 tarjeta

**Flujo:**
1. Total de venta: €45.00
2. Click **💰 MIXTO**
3. Sistema registra pago mixto
4. Backend calcula distribución
5. ✅ Venta completa

---

## 🔧 Troubleshooting

### Problema: No puedo abrir una sesión

**Posibles causas:**
- Ya tienes una sesión activa
- No tienes permisos (rol ENCARGADO mínimo)

**Solución:**
1. Verifica en `/sesiones` si tienes sesión abierta
2. Cierra la sesión anterior
3. Intenta nuevamente

---

### Problema: Error al registrar venta

**Posibles causas:**
- Producto sin stock
- Sesión cerrada
- Problemas de conexión

**Solución:**
1. Verifica stock del producto en `/inventario`
2. Confirma que la sesión esté ACTIVA
3. Revisa la consola del navegador

---

### Problema: No se descuenta el stock

**Posibles causas:**
- Trigger de BD desactivado
- Error en la transacción

**Solución:**
1. Verifica en BD: `SELECT * FROM movimientos_stock ORDER BY fecha_movimiento DESC LIMIT 10`
2. Revisa logs del backend
3. Contacta al administrador si persiste

---

### Problema: El auto-refresh no funciona

**Solución:**
1. Verifica que el toggle esté **ON** (verde)
2. Refrescar la página manualmente (F5)
3. Limpiar caché del navegador

---

## 📊 Métricas y KPIs

### KPIs Principales

1. **Ingresos Totales** - Suma de todas las ventas
2. **Total Ventas** - Número de transacciones
3. **Ticket Promedio** - Ingresos / Total Ventas
4. **Productos Vendidos** - Unidades totales

### Desglose por Método de Pago

- **Efectivo** - % del total
- **Tarjeta** - % del total
- **Mixto** - % del total

### Top Productos

- Ranking de productos más vendidos
- Cantidad vendida
- Ingresos generados

---

## 🚀 Mejores Prácticas

### Para Cajeros/Bartenders

✅ **DO:**
- Cerrar sesión al final del turno
- Verificar stock antes de vender
- Usar Terminal Táctil para velocidad
- Limpiar carrito si hay error

❌ **DON'T:**
- Dejar sesión abierta sin supervisión
- Cerrar con carrito pendiente
- Vender productos sin stock
- Modificar manualmente el stock

### Para Gerentes

✅ **DO:**
- Monitorear sesiones en tiempo real
- Revisar estadísticas diarias
- Verificar cuadres de caja
- Analizar productos más vendidos

❌ **DON'T:**
- Cerrar sesiones de otros sin verificar
- Ignorar diferencias en cuadres
- Olvidar revisar alertas de stock

---

## 📝 Notas Técnicas

### Actualizaciones Automáticas

- **Monitor de Sesiones**: 5 segundos
- **Dashboard POS**: 30 segundos
- **Sesiones Abiertas**: 10 segundos
- **Productos**: 15 segundos

### Flujo de Datos

```
Usuario → Frontend → Backend API → PostgreSQL
                                      ↓
                                   Triggers
                                      ↓
                            (Descuento Stock)
                            (Registro Transacción)
```

### Triggers Activos

1. **Descuento Automático de Stock** - Ejecuta al crear venta
2. **Generación de Número de Ticket** - Formato: `YYYY-MM-DD-XXXX`
3. **Registro en Finanzas** - Crea transacción automáticamente

---

## 🔗 Enlaces Rápidos

- [POS Principal](/pos)
- [Terminal Táctil](/pos-terminal)
- [Monitor en Tiempo Real](/pos-monitor)
- [Dashboard POS](/pos-dashboard)
- [Historial de Sesiones](/sesiones)

---

**✅ Sistema POS - 100% Funcional**

*Última actualización: 2025-10-11*
