# 🛒 Sistema POS (Punto de Venta) - Especificación Detallada

> **Sprint 8:** Semanas 16-17 (10 días)
> **Prioridad:** Alta
> **Estado:** Pendiente

---

## 🎯 Objetivo

Sistema completo de punto de venta para registrar ventas en tiempo real durante eventos/fiestas, con control total de la sesión de caja, integración automática con inventario y cierre de caja con cuadre.

---

## 👤 Buyer Persona

**Usuario Principal:** Personal de barra/caja (camareros, bartenders, cajeros)
**Contexto de Uso:**
- Ambiente de discoteca con luz tenue
- Alta velocidad de transacciones (eventos con 200+ personas)
- Dispositivos táctiles (tablets, móviles)
- Conexión a internet variable

**Necesidades:**
- Interfaz rápida e intuitiva (venta en 3 clicks)
- Botones grandes y claros para ambiente oscuro
- Feedback visual inmediato de cada venta
- Ver estado de caja en tiempo real
- No perder ventas si hay corte de internet (modo offline)

---

## 🏗️ Arquitectura del Sistema POS

### 🎯 Separación de Interfaces

El sistema POS se divide en **DOS aplicaciones diferentes**:

#### 1. **POS Táctil** (Punto de Venta - Tablet/Terminal)
**Ubicación:** Barra del club (tablets, terminales táctiles)
**Usuarios:** Camareros, Bartenders, Cajeros
**Propósito:** Registrar ventas rápidamente durante el evento
**Características:**
- Interfaz simplificada y ultra-rápida (3 clicks por venta)
- Botones grandes para ambiente oscuro
- Solo funciones esenciales: seleccionar productos, cobrar
- Optimizado para velocidad (venta en <10 segundos)
- Modo portrait/landscape
- Sin distracciones ni información extra

#### 2. **Dashboard de Monitoreo** (Herramienta de Gestión - Web)
**Ubicación:** Oficina, manager's office, dispositivo del gerente
**Usuarios:** Gerente, Admin, Encargados
**Propósito:** Monitorear sesiones en tiempo real y gestionar
**Características:**
- Visualización completa de todas las sesiones activas
- Estadísticas en tiempo real (WebSocket)
- Detalle de cada venta
- Control de múltiples cajas simultáneas
- Reportes y análisis
- Abrir/cerrar sesiones remotamente

---

## 🏗️ Arquitectura del Sistema POS (Detallada)

### Entidades Backend

#### 1. **SesionCaja** (Nueva)
```java
@Entity
@Table(name = "sesiones_caja")
public class SesionCaja {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario; // Cajero/empleado

    @ManyToOne
    @JoinColumn(name = "evento_id")
    private Evento evento; // Opcional: evento asociado

    @Column(name = "fecha_apertura", nullable = false)
    private LocalDateTime fechaApertura;

    @Column(name = "fecha_cierre")
    private LocalDateTime fechaCierre;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoSesion estado; // ABIERTA, CERRADA

    @Column(name = "monto_inicial", precision = 10, scale = 2, nullable = false)
    private BigDecimal montoInicial; // Fondo de caja inicial

    @Column(name = "monto_esperado", precision = 10, scale = 2)
    private BigDecimal montoEsperado; // Calculado: inicial + total_ventas

    @Column(name = "monto_real", precision = 10, scale = 2)
    private BigDecimal montoReal; // Conteo físico al cerrar

    @Column(name = "diferencia", precision = 10, scale = 2)
    private BigDecimal diferencia; // monto_real - monto_esperado

    @Column(name = "total_ventas", precision = 10, scale = 2, nullable = false)
    private BigDecimal totalVentas = BigDecimal.ZERO;

    @Column(name = "cantidad_transacciones", nullable = false)
    private Integer cantidadTransacciones = 0;

    @Column(name = "observaciones", length = 500)
    private String observaciones;

    @OneToMany(mappedBy = "sesionCaja", cascade = CascadeType.ALL)
    private List<Consumo> consumos = new ArrayList<>();

    // Estadísticas en tiempo real
    @Transient
    private BigDecimal ventasEfectivo;

    @Transient
    private BigDecimal ventasTarjeta;

    @Transient
    private BigDecimal ventasTransferencia;
}
```

#### 2. **Consumo** (Nueva - Venta individual)
```java
@Entity
@Table(name = "consumos")
public class Consumo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "sesion_caja_id", nullable = false)
    private SesionCaja sesionCaja;

    @ManyToOne
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(name = "precio_unitario", precision = 10, scale = 2, nullable = false)
    private BigDecimal precioUnitario; // Precio al momento de la venta

    @Column(name = "subtotal", precision = 10, scale = 2, nullable = false)
    private BigDecimal subtotal; // cantidad * precio_unitario

    @Column(name = "descuento", precision = 10, scale = 2)
    private BigDecimal descuento = BigDecimal.ZERO;

    @Column(name = "total", precision = 10, scale = 2, nullable = false)
    private BigDecimal total; // subtotal - descuento

    @Enumerated(EnumType.STRING)
    @Column(name = "metodo_pago", nullable = false)
    private MetodoPago metodoPago; // EFECTIVO, TARJETA, TRANSFERENCIA

    @Column(name = "fecha_venta", nullable = false)
    private LocalDateTime fechaVenta;

    @Column(name = "observaciones")
    private String observaciones;

    @Column(name = "numero_ticket", unique = true)
    private String numeroTicket; // Ej: "SES001-0001"

    // Para tracking
    @Column(name = "stock_descontado", nullable = false)
    private Boolean stockDescontado = false;
}

enum MetodoPago {
    EFECTIVO,
    TARJETA,
    TRANSFERENCIA,
    MIXTO
}

enum EstadoSesion {
    ABIERTA,
    CERRADA,
    SUSPENDIDA // Por si necesitan pausar
}
```

---

## 🎨 Diseño de las Interfaces

---

## 📱 INTERFAZ 1: POS TÁCTIL (Terminal de Venta)

### Pantalla de Login Simple

```
╔═══════════════════════════════════════╗
║                                       ║
║         🛒 PUNTO DE VENTA            ║
║                                       ║
║         Club Management              ║
║                                       ║
║  ┌─────────────────────────────────┐ ║
║  │  👤 SELECCIONA TU USUARIO       │ ║
║  ├─────────────────────────────────┤ ║
║  │                                 │ ║
║  │   [👤 Juan Pérez]               │ ║
║  │                                 │ ║
║  │   [👤 María García]             │ ║
║  │                                 │ ║
║  │   [👤 Carlos López]             │ ║
║  │                                 │ ║
║  └─────────────────────────────────┘ ║
║                                       ║
║  Ingresa tu PIN: [____]              ║
║                                       ║
║  [ 1 ] [ 2 ] [ 3 ]                   ║
║  [ 4 ] [ 5 ] [ 6 ]                   ║
║  [ 7 ] [ 8 ] [ 9 ]                   ║
║  [ ⬅️ ] [ 0 ] [ ✓ ]                  ║
║                                       ║
╚═══════════════════════════════════════╝
```

### Pantalla Principal: Grid de Productos (Fullscreen)

```
╔════════════════════════════════════════════════════════════════╗
║  SES#042 | Juan | €847.50 | 28 ventas | 🟢 23:15      [❌ Salir] ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  ┌─────────────┬─────────────┬─────────────┬─────────────┐   ║
║  │   🍺        │   🍹        │   🥤        │   🍷        │   ║
║  │  CERVEZA    │   MOJITO    │  REFRESCO   │   VINO      │   ║
║  │   €3.50     │   €8.00     │   €2.00     │   €5.50     │   ║
║  │  Stock: 145 │  Stock: 67  │  Stock: 234 │  Stock: 89  │   ║
║  └─────────────┴─────────────┴─────────────┴─────────────┘   ║
║                                                                ║
║  ┌─────────────┬─────────────┬─────────────┬─────────────┐   ║
║  │   🍾        │   🍸        │   🥃        │   🧃        │   ║
║  │ CHAMPAGNE   │   GIN-TON   │  WHISKY     │   AGUA      │   ║
║  │  €45.00     │   €9.00     │  €12.00     │   €1.50     │   ║
║  │  Stock: 12  │  Stock: 45  │  Stock: 31  │  Stock: 180 │   ║
║  └─────────────┴─────────────┴─────────────┴─────────────┘   ║
║                                                                ║
║  ┌─────────────┬─────────────┬─────────────┬─────────────┐   ║
║  │   🍟        │   🍕        │   🌭        │   🍿        │   ║
║  │   PAPAS     │   PIZZA     │   HOT DOG   │  PALOMITAS  │   ║
║  │   €4.00     │  €12.00     │   €6.00     │   €3.00     │   ║
║  │  Stock: 50  │  Stock: 15  │  Stock: 25  │  Stock: 67  │   ║
║  └─────────────┴─────────────┴─────────────┴─────────────┘   ║
║                                                                ║
║  [🔍 Buscar]  [📋 Ver Más]  [⏮️ Anterior]  [⏭️ Siguiente]     ║
║                                                                ║
╠════════════════════════════════════════════════════════════════╣
║  🧾 TICKET ACTUAL:                              TOTAL: €21.00  ║
║  • Cerveza x2 ..................... €7.00                     ║
║  • Mojito x1 ...................... €8.00                     ║
║  • Refresco x3 .................... €6.00          [🗑️ Limpiar] ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  ┌──────────────┬──────────────┬──────────────┬──────────────┐║
║  │              │              │              │              │║
║  │  💵 EFECTIVO │  💳 TARJETA  │ 📱 TRANSFER. │   🔄 MIXTO   │║
║  │              │              │              │              │║
║  │  [ COBRAR ]  │  [ COBRAR ]  │  [ COBRAR ]  │  [ COBRAR ]  │║
║  │              │              │              │              │║
║  └──────────────┴──────────────┴──────────────┴──────────────┘║
╚════════════════════════════════════════════════════════════════╝
```

**Características del POS Táctil:**
- ✅ Botones de 150x150px mínimo (fácil de pulsar)
- ✅ Colores altos en contraste (blanco/negro para leer en oscuro)
- ✅ Feedback visual inmediato (vibración, sonido)
- ✅ Header minimalista con info esencial
- ✅ Ticket visible pero no invasivo
- ✅ Botones de cobrar ENORMES (200x100px)
- ✅ Sin scroll si es posible (todo visible)
- ✅ Navegación por categorías (tabs superiores)

---

## 💻 INTERFAZ 2: DASHBOARD DE MONITOREO (Herramienta Web)

### Pantalla Principal: Monitor de Sesiones Activas

```
╔════════════════════════════════════════════════════════════════════════════╗
║  📊 SESIONES DE CAJA - Monitor en Tiempo Real                    🟢 LIVE   ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  [🔓 Abrir Nueva Sesión]  [📊 Reportes]  [🔍 Buscar...]  [📅 Hoy ▼]      ║
║                                                                            ║
║  ┌────────────────────────────────────────────────────────────────────┐   ║
║  │  🟢 SESIÓN #0042 - ACTIVA              Auto-refresh en 5s... ⟳   │   ║
║  ├────────────────────────────────────────────────────────────────────┤   ║
║  │  👤 Juan Pérez | 🎉 Noche de Reggaeton | ⏰ Abierta hace 2h 15min │   ║
║  │                                                                    │   ║
║  │  💰 Fondo: €200.00  │  💵 Ventas: €1,847.50  │  🎯 Total: €2,047.50│   ║
║  │  📊 47 ventas       │  🧾 Ticket: €39.31      │  [Ver Detalle 🔍]  │   ║
║  │                                                                    │   ║
║  │  ┌──────────────────────────────────────────────────────────────┐ │   ║
║  │  │  ÚLTIMAS VENTAS (Live Stream):                               │ │   ║
║  │  │  • Hace 2min   | €21.00 | 💵 Efectivo | Cerveza x2, Mojito  │ │   ║
║  │  │  • Hace 5min   | €45.00 | 💳 Tarjeta  | Champagne x1        │ │   ║
║  │  │  • Hace 8min   | €9.50  | 💵 Efectivo | Refresco x3         │ │   ║
║  │  └──────────────────────────────────────────────────────────────┘ │   ║
║  │                                                                    │   ║
║  │  [📈 Ver Gráficos]  [📋 Todas las Ventas]  [🔒 Cerrar Sesión]    │   ║
║  └────────────────────────────────────────────────────────────────────┘   ║
║                                                                            ║
║  ┌────────────────────────────────────────────────────────────────────┐   ║
║  │  🟢 SESIÓN #0041 - ACTIVA                              ⟳ Live      │   ║
║  ├────────────────────────────────────────────────────────────────────┤   ║
║  │  👤 María García | 🎉 Noche de Reggaeton | ⏰ Abierta hace 2h 20min│   ║
║  │                                                                    │   ║
║  │  💰 Fondo: €150.00  │  💵 Ventas: €2,134.00  │  🎯 Total: €2,284.00│   ║
║  │  📊 63 ventas       │  🧾 Ticket: €33.87      │  [Ver Detalle 🔍]  │   ║
║  │                                                                    │   ║
║  │  ┌──────────────────────────────────────────────────────────────┐ │   ║
║  │  │  ÚLTIMAS VENTAS (Live Stream):                               │ │   ║
║  │  │  • Hace 1min   | €16.00 | 📱 Transfer. | Mojito x2           │ │   ║
║  │  │  • Hace 3min   | €12.50 | 💳 Tarjeta   | Pizza x1, Refresco  │ │   ║
║  │  │  • Hace 6min   | €24.00 | 💵 Efectivo  | Cerveza x6, Agua    │ │   ║
║  │  └──────────────────────────────────────────────────────────────┘ │   ║
║  │                                                                    │   ║
║  │  [📈 Ver Gráficos]  [📋 Todas las Ventas]  [🔒 Cerrar Sesión]    │   ║
║  └────────────────────────────────────────────────────────────────────┘   ║
║                                                                            ║
║  ┌────────────────────────────────────────────────────────────────────┐   ║
║  │  ⚪ SESIÓN #0040 - CERRADA                   🕐 Cerrada hace 1h    │   ║
║  ├────────────────────────────────────────────────────────────────────┤   ║
║  │  👤 Carlos López | 🎉 Noche de Reggaeton | ⏱️ Duración: 3h 45min  │   ║
║  │                                                                    │   ║
║  │  💰 Fondo: €200.00  │  💵 Ventas: €3,456.00  │  🎯 Total: €3,656.00│   ║
║  │  📊 98 ventas       │  🧾 Ticket: €35.27      │  ✅ Cuadrado        │   ║
║  │                                                                    │   ║
║  │  [📄 Ver Reporte]  [📊 Estadísticas]  [📥 Descargar PDF]          │   ║
║  └────────────────────────────────────────────────────────────────────┘   ║
╚════════════════════════════════════════════════════════════════════════════╝
```

### Detalle de Sesión Activa (Modal/Página)

```
╔════════════════════════════════════════════════════════════════════════════╗
║  📊 DETALLE DE SESIÓN #0042                              🟢 ACTIVA  [✖️]   ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  ┌────────────────────────────────────────────────────────────────────┐   ║
║  │  📋 INFORMACIÓN GENERAL                                           │   ║
║  ├────────────────────────────────────────────────────────────────────┤   ║
║  │  👤 Cajero: Juan Pérez                   📅 10/10/2025 23:00     │   ║
║  │  🎉 Evento: Noche de Reggaeton           ⏰ Duración: 2h 15min    │   ║
║  │  💰 Fondo Inicial: €200.00               🆔 Terminal: POS-01      │   ║
║  └────────────────────────────────────────────────────────────────────┘   ║
║                                                                            ║
║  ┌────────────────────┬────────────────────┬────────────────────┐         ║
║  │  💰 TOTAL VENTAS   │  📊 TRANSACCIONES  │  🧾 TICKET PROMEDIO│         ║
║  │     €1,847.50      │         47         │      €39.31        │         ║
║  └────────────────────┴────────────────────┴────────────────────┘         ║
║                                                                            ║
║  ┌───────────────────────────────────────────────────────────────────┐    ║
║  │  📊 DESGLOSE POR MÉTODO DE PAGO                       [Gráfico 📈]│    ║
║  ├───────────────────────────────────────────────────────────────────┤    ║
║  │                                                                   │    ║
║  │  💵 EFECTIVO     €847.50 (45.9%)   ████████████████░░░░░░   28   │    ║
║  │  💳 TARJETA      €650.00 (35.2%)   ████████████░░░░░░░░░░░   12   │    ║
║  │  📱 TRANSFERENCIA €350.00 (18.9%)  ██████░░░░░░░░░░░░░░░░░    7   │    ║
║  │                                                                   │    ║
║  └───────────────────────────────────────────────────────────────────┘    ║
║                                                                            ║
║  ┌───────────────────────────────────────────────────────────────────┐    ║
║  │  🏆 TOP 5 PRODUCTOS MÁS VENDIDOS                                 │    ║
║  ├─────┬──────────────────────────┬──────────┬─────────┬───────────┤    ║
║  │  #  │  Producto                │  Cant.   │  Total  │  % Ventas │    ║
║  ├─────┼──────────────────────────┼──────────┼─────────┼───────────┤    ║
║  │  1  │  🍺 Cerveza Heineken     │    85    │ €297.50 │   16.1%   │    ║
║  │  2  │  🍹 Mojito               │    34    │ €272.00 │   14.7%   │    ║
║  │  3  │  🥤 Refresco Coca-Cola   │    67    │ €134.00 │    7.3%   │    ║
║  │  4  │  🍷 Vino Tinto           │    23    │ €126.50 │    6.8%   │    ║
║  │  5  │  🍾 Champagne            │     3    │ €135.00 │    7.3%   │    ║
║  └─────┴──────────────────────────┴──────────┴─────────┴───────────┘    ║
║                                                                            ║
║  ┌───────────────────────────────────────────────────────────────────┐    ║
║  │  🕐 VENTAS POR HORA                                    [Gráfico 📊]│    ║
║  ├───────────────────────────────────────────────────────────────────┤    ║
║  │                                                                   │    ║
║  │  23:00-00:00   €234.00 (8 ventas)   █████░░░░░░░░░░░░░░░░░░     │    ║
║  │  00:00-01:00   €567.50 (18 ventas)  ████████████░░░░░░░░░░░     │    ║
║  │  01:00-02:00   €846.00 (21 ventas)  ████████████████████░░░     │    ║
║  │  02:00-03:00   €200.00 (0 ventas)   ░░░░░░░░░░░░░░░░░░░░░░░     │    ║
║  │                                                                   │    ║
║  └───────────────────────────────────────────────────────────────────┘    ║
║                                                                            ║
║  ┌───────────────────────────────────────────────────────────────────┐    ║
║  │  🧾 ÚLTIMAS 20 VENTAS (Auto-refresh: 5s ⟳)            [Ver Todas]│    ║
║  ├───────┬─────────┬──────────────────────────────┬─────────┬────────┤    ║
║  │ Ticket│  Hora   │  Productos                   │  Total  │ Método │    ║
║  ├───────┼─────────┼──────────────────────────────┼─────────┼────────┤    ║
║  │ #0047 │ 01:13   │ Cerveza x2, Mojito x1       │ €15.00  │ 💵     │    ║
║  │ #0046 │ 01:10   │ Champagne x1                │ €45.00  │ 💳     │    ║
║  │ #0045 │ 01:08   │ Refresco x3, Cerveza x1     │  €9.50  │ 💵     │    ║
║  │ #0044 │ 01:05   │ Mojito x2                   │ €16.00  │ 📱     │    ║
║  │ #0043 │ 01:02   │ Pizza x1, Vino x1           │ €17.50  │ 💳     │    ║
║  │  ...  │   ...   │ ...                         │   ...   │  ...   │    ║
║  └───────┴─────────┴──────────────────────────────┴─────────┴────────┘    ║
║                                                                            ║
║  [📥 Exportar Excel]  [📄 Reporte PDF]  [🔒 Cerrar Sesión]                ║
╚════════════════════════════════════════════════════════════════════════════╝
```

**Características del Dashboard de Monitoreo:**
- ✅ WebSocket para actualizaciones en tiempo real (cada 5s)
- ✅ Vista de múltiples sesiones simultáneas
- ✅ Stream de ventas en vivo (últimas 3-5 ventas)
- ✅ Indicadores visuales de estado (🟢 activa, ⚪ cerrada)
- ✅ Métricas clave siempre visibles
- ✅ Gráficos interactivos (Chart.js o Recharts)
- ✅ Filtros por fecha, cajero, evento
- ✅ Detalle completo con estadísticas profundas
- ✅ Exportación a Excel/PDF
- ✅ Alertas de discrepancias (cuando diferencia > €10)
- ✅ Control remoto de sesiones (abrir/cerrar)
║                                                                            ║
║  ┌─────────────────────────────────────────────────────────────────────┐  ║
║  │  📊 SESIÓN ACTIVA #0042                              🟢 ABIERTA      │  ║
║  ├─────────────────────────────────────────────────────────────────────┤  ║
║  │  👤 Cajero: Juan Pérez                    ⏰ Abierta hace: 2h 15min  │  ║
║  │  🎉 Evento: Noche de Reggaeton             📅 10/10/2025 23:00      │  ║
║  │                                                                       │  ║
║  │  💰 Fondo Inicial: €200.00     │  💳 Ventas: €1,847.50  (47 ventas) │  ║
║  │  🎯 Esperado: €2,047.50        │  ⚡ Última venta: hace 2 min       │  ║
║  └─────────────────────────────────────────────────────────────────────┘  ║
║                                                                            ║
║  ┌──────────────────────────────┬─────────────────────────────────────┐  ║
║  │  📦 PRODUCTOS (GRID)          │  🧾 VENTA ACTUAL                    │  ║
║  ├──────────────────────────────┤                                      │  ║
║  │                              │  ┌─────────────────────────────────┐ │  ║
║  │  🍺 Cerveza        €3.50 🔵  │  │ 🍺 Cerveza x2      €7.00        │ │  ║
║  │     Stock: 145               │  │ 🍹 Mojito x1       €8.00        │ │  ║
║  │                              │  │ 🥤 Refresco x3     €6.00        │ │  ║
║  │  🍹 Mojito         €8.00 🟢  │  │                                 │ │  ║
║  │     Stock: 67                │  │ ─────────────────────────────── │ │  ║
║  │                              │  │ SUBTOTAL:          €21.00       │ │  ║
║  │  🥤 Refresco       €2.00 🟢  │  │ Descuento:         €0.00        │ │  ║
║  │     Stock: 234               │  │ ═══════════════════════════════ │ │  ║
║  │                              │  │ TOTAL:             €21.00       │ │  ║
║  │  🍷 Vino           €5.50 🔵  │  └─────────────────────────────────┘ │  ║
║  │     Stock: 89                │                                      │  ║
║  │                              │  [💵 EFECTIVO]   [💳 TARJETA]       │  ║
║  │  🍾 Champagne     €45.00 🟡  │  [📱 TRANSFER.]  [🔄 MIXTO]         │  ║
║  │     Stock: 12                │                                      │  ║
║  │                              │  [🗑️ LIMPIAR]   [✅ COBRAR]         │  ║
║  │  [🔍 Buscar Producto...]     │                                      │  ║
║  │                              │                                      │  ║
║  │  [Ver Más Productos... 📋]   │                                      │  ║
║  └──────────────────────────────┴─────────────────────────────────────┘  ║
║                                                                            ║
║  ┌─────────────────────────────────────────────────────────────────────┐  ║
║  │  📈 RESUMEN EN TIEMPO REAL                                          │  ║
║  ├─────────────────────────────────────────────────────────────────────┤  ║
║  │  💵 Efectivo: €847.50 (28)  │  💳 Tarjeta: €650.00 (12)           │  ║
║  │  📱 Transfer.: €350.00 (7)  │  🎯 Ticket Promedio: €39.31         │  ║
║  └─────────────────────────────────────────────────────────────────────┘  ║
║                                                                            ║
║  [📋 Ver Todas las Ventas]  [📊 Estadísticas]  [🔒 Cerrar Caja]         ║
╚════════════════════════════════════════════════════════════════════════════╝
```

### Características Visuales:

**1. Header de Sesión (Always Visible)**
- 🟢 Indicador de estado (verde = abierta)
- Número de sesión único
- Cajero actual
- Evento asociado (si aplica)
- Tiempo transcurrido desde apertura
- Métricas clave: Fondo inicial, Ventas actuales, Total esperado

**2. Grid de Productos (Left)**
- Botones grandes (min 120x120px) para táctil
- Imagen del producto
- Nombre claro
- Precio grande
- Indicador de stock con colores:
  - 🟢 Verde: Stock alto (>50)
  - 🔵 Azul: Stock medio (20-50)
  - 🟡 Amarillo: Stock bajo (10-20)
  - 🔴 Rojo: Stock crítico (<10)
- Búsqueda rápida por nombre/código
- Paginación o scroll infinito
- Categorías rápidas (Bebidas, Comida, etc.)

**3. Ticket Actual (Right)**
- Lista de productos agregados
- Editable (cantidad, eliminar item)
- Cálculo automático de subtotal
- Campo de descuento (opcional)
- Total destacado en grande
- Botones de método de pago grandes y claros
- Botón COBRAR destacado (verde, grande)

**4. Resumen en Tiempo Real (Bottom)**
- Ventas por método de pago
- Cantidad de transacciones
- Ticket promedio
- Auto-actualización cada 5 segundos

---

## 🔄 Flujo de Operación

### 1. **Abrir Sesión de Caja**

```
Usuario: Cajero (Juan)
Pantalla: "Abrir Nueva Sesión"

┌─────────────────────────────────────────────────────┐
│  🔓 ABRIR SESIÓN DE CAJA                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  👤 Cajero: Juan Pérez [automático]                │
│                                                     │
│  🎉 Evento (opcional):                             │
│     [Seleccionar Evento ▼] Noche de Reggaeton     │
│                                                     │
│  💰 Fondo Inicial:                                 │
│     [€ _____] (monto en efectivo para cambio)     │
│                                                     │
│  📝 Observaciones:                                 │
│     [________________________________]              │
│                                                     │
│  [❌ Cancelar]        [✅ ABRIR SESIÓN]            │
└─────────────────────────────────────────────────────┘

Backend:
POST /api/sesiones-caja/abrir
{
  "usuarioId": 5,
  "eventoId": 12,
  "montoInicial": 200.00,
  "observaciones": "Sesión noche de reggaeton"
}

Response:
{
  "id": 42,
  "numeroSesion": "SES-0042",
  "estado": "ABIERTA",
  "fechaApertura": "2025-10-10T23:00:00",
  "montoInicial": 200.00,
  "totalVentas": 0.00,
  "cantidadTransacciones": 0
}
```

### 2. **Registrar Venta (Flujo Rápido - 3 Clicks)**

```
Click 1: Seleccionar producto(s) del grid
  → Se agrega a ticket actual con cantidad 1
  → Click adicional en mismo producto incrementa cantidad

Click 2: Seleccionar método de pago
  → Botón grande y claro

Click 3: Confirmar venta (COBRAR)
  → Descuento automático de stock
  → Registro en consumos
  → Actualización de totales de sesión
  → Imprimir/enviar ticket (opcional)
  → Limpiar ticket para siguiente venta

Backend:
POST /api/sesiones-caja/{sesionId}/consumos
{
  "items": [
    {
      "productoId": 15,
      "cantidad": 2,
      "precioUnitario": 3.50
    },
    {
      "productoId": 23,
      "cantidad": 1,
      "precioUnitario": 8.00
    }
  ],
  "metodoPago": "EFECTIVO",
  "descuento": 0.00
}

Response:
{
  "id": 234,
  "numeroTicket": "SES042-0001",
  "total": 15.00,
  "metodoPago": "EFECTIVO",
  "fechaVenta": "2025-10-10T23:15:00",
  "items": [...],
  "sesion": {
    "totalVentas": 15.00,
    "cantidadTransacciones": 1
  }
}

Proceso Automático:
1. ✅ Validar stock disponible
2. ✅ Registrar consumo en BD
3. ✅ Descontar stock de inventario (MovimientoStock tipo SALIDA)
4. ✅ Actualizar totales de sesión
5. ✅ Generar número de ticket único
6. ✅ Retornar confirmación
```

### 3. **Ver Detalle de Sesión en Tiempo Real**

```
GET /api/sesiones-caja/{sesionId}/detalle

Response:
{
  "id": 42,
  "numeroSesion": "SES-0042",
  "estado": "ABIERTA",
  "usuario": {
    "id": 5,
    "nombre": "Juan Pérez"
  },
  "evento": {
    "id": 12,
    "nombre": "Noche de Reggaeton"
  },
  "fechaApertura": "2025-10-10T23:00:00",
  "tiempoAbierto": "2h 15min",
  "montoInicial": 200.00,
  "totalVentas": 1847.50,
  "montoEsperado": 2047.50,
  "cantidadTransacciones": 47,
  "ticketPromedio": 39.31,

  // Desglose por método de pago
  "ventasPorMetodo": {
    "EFECTIVO": {
      "monto": 847.50,
      "cantidad": 28
    },
    "TARJETA": {
      "monto": 650.00,
      "cantidad": 12
    },
    "TRANSFERENCIA": {
      "monto": 350.00,
      "cantidad": 7
    }
  },

  // Productos más vendidos
  "topProductos": [
    {
      "producto": "Cerveza Heineken",
      "cantidad": 85,
      "total": 297.50
    },
    {
      "producto": "Mojito",
      "cantidad": 34,
      "total": 272.00
    }
  ],

  // Últimas ventas
  "ultimasVentas": [
    {
      "id": 234,
      "numeroTicket": "SES042-0047",
      "total": 21.00,
      "metodoPago": "EFECTIVO",
      "fechaVenta": "2025-10-11T01:13:00",
      "tiempoRelativo": "hace 2 min"
    }
  ]
}
```

### 4. **Cerrar Sesión de Caja (Con Cuadre)**

```
Usuario: Gerente o Cajero
Pantalla: "Cerrar Sesión de Caja"

┌─────────────────────────────────────────────────────────────┐
│  🔒 CERRAR SESIÓN #0042                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 RESUMEN DE LA SESIÓN                                   │
│  ─────────────────────────────────────────────────────────  │
│  ⏰ Duración: 3h 45min                                      │
│  💵 Ventas Totales: €1,847.50 (47 transacciones)           │
│  💰 Fondo Inicial: €200.00                                 │
│  ═══════════════════════════════════════════════════════   │
│  🎯 MONTO ESPERADO EN CAJA: €2,047.50                      │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  💰 CONTEO FÍSICO DE CAJA:                                 │
│                                                             │
│  💵 Efectivo Real:        [€ _______]                      │
│  💳 TPV/Tarjeta:          [€ _______]  (referencia)        │
│  📱 Transferencias:       [€ _______]  (referencia)        │
│                                                             │
│  ═══════════════════════════════════════════════════════   │
│  🎯 TOTAL CONTADO: €0.00                                   │
│  📊 DIFERENCIA: €0.00                                      │
│                                                             │
│  📝 Observaciones:                                         │
│     [_____________________________________________]          │
│                                                             │
│  [❌ Cancelar]            [✅ CERRAR SESIÓN]               │
└─────────────────────────────────────────────────────────────┘

Backend:
POST /api/sesiones-caja/{sesionId}/cerrar
{
  "montoReal": 2045.00,
  "observaciones": "Faltaron 2.50 EUR, posible error en cambio"
}

Response:
{
  "id": 42,
  "estado": "CERRADA",
  "fechaCierre": "2025-10-11T02:45:00",
  "montoInicial": 200.00,
  "totalVentas": 1847.50,
  "montoEsperado": 2047.50,
  "montoReal": 2045.00,
  "diferencia": -2.50,
  "cuadrado": false,
  "observaciones": "Faltaron 2.50 EUR, posible error en cambio"
}

Proceso Automático:
1. ✅ Validar que no haya ventas pendientes
2. ✅ Calcular diferencia (montoReal - montoEsperado)
3. ✅ Marcar sesión como CERRADA
4. ✅ Generar reporte de cierre (PDF)
5. ✅ Registrar transacción en Finanzas (ingreso)
6. ✅ Notificar si hay diferencia significativa (>€10)
```

---

## 📊 Pantallas Adicionales

### A. **Ver Todas las Ventas de la Sesión**

```
┌─────────────────────────────────────────────────────────────────────┐
│  📋 VENTAS DE LA SESIÓN #0042                        [🔍 Buscar...]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Filtros: [Todas ▼] [Efectivo] [Tarjeta] [Transfer.] [📅 Hoy]     │
│                                                                     │
│  #      Hora    Productos                    Total      Método     │
│  ───────────────────────────────────────────────────────────────   │
│  0047   01:13   Cerveza x2, Mojito x1       €15.00    💵 Efectivo  │
│  0046   01:10   Champagne x1                €45.00    💳 Tarjeta   │
│  0045   01:08   Refresco x3, Cerveza x1     €9.50     💵 Efectivo  │
│  0044   01:05   Mojito x2                   €16.00    📱 Transfer. │
│  ...                                                                │
│                                                                     │
│  [⬅️ Anterior]  Página 1 de 3  [➡️ Siguiente]                      │
└─────────────────────────────────────────────────────────────────────┘
```

### B. **Estadísticas de la Sesión**

```
┌─────────────────────────────────────────────────────────────────┐
│  📊 ESTADÍSTICAS - SESIÓN #0042                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📈 Ventas por Hora:                                           │
│     [Gráfico de Barras]                                        │
│                                                                 │
│  🏆 Top 5 Productos:                                           │
│     1. Cerveza Heineken      85 uds    €297.50                │
│     2. Mojito                34 uds    €272.00                │
│     3. Refresco Coca-Cola    67 uds    €134.00                │
│     4. Vino Tinto            23 uds    €126.50                │
│     5. Champagne              3 uds    €135.00                │
│                                                                 │
│  💳 Métodos de Pago:                                           │
│     [Gráfico Circular]                                         │
│     Efectivo: 45.9% (€847.50)                                 │
│     Tarjeta: 35.2% (€650.00)                                  │
│     Transferencia: 18.9% (€350.00)                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Backend - Endpoints API

### Sesiones de Caja

```
POST   /api/sesiones-caja/abrir
GET    /api/sesiones-caja/activa              // Sesión activa del usuario
GET    /api/sesiones-caja/{id}
GET    /api/sesiones-caja/{id}/detalle        // Con estadísticas
POST   /api/sesiones-caja/{id}/cerrar
GET    /api/sesiones-caja                     // Lista paginada (filtros)
GET    /api/sesiones-caja/{id}/reporte-pdf    // Reporte de cierre
```

### Consumos (Ventas)

```
POST   /api/sesiones-caja/{sesionId}/consumos
GET    /api/sesiones-caja/{sesionId}/consumos
GET    /api/consumos/{id}
DELETE /api/consumos/{id}                     // Anular venta (solo gerente)
GET    /api/consumos/{id}/ticket-pdf          // Ticket de compra
```

### Dashboard POS

```
GET    /api/pos/productos-disponibles         // Grid de productos con stock
GET    /api/pos/sesion-actual-stats           // Stats en tiempo real
```

---

## 🔐 Permisos y Roles

```
ADMIN, GERENTE:
  ✅ Abrir sesiones para cualquier usuario
  ✅ Ver todas las sesiones
  ✅ Cerrar cualquier sesión
  ✅ Anular ventas
  ✅ Ver reportes completos

ENCARGADO, CAJERO:
  ✅ Abrir su propia sesión
  ✅ Registrar ventas
  ✅ Ver solo sus sesiones
  ✅ Cerrar su propia sesión
  ❌ NO puede anular ventas

LECTURA:
  ✅ Ver sesiones (read-only)
  ❌ NO puede operar POS
```

---

## 📱 Modo Offline (Futuro - Opcional)

Para garantizar ventas sin internet:

1. **PWA (Progressive Web App)**
   - Service Worker para cache
   - IndexedDB local para ventas pendientes
   - Sincronización automática al recuperar conexión

2. **Estrategia de Sync**
   - Guardar ventas localmente con timestamp
   - Cola de sincronización
   - Resolución de conflictos por timestamp

---

## ⚡ Optimizaciones de Performance

1. **WebSocket para Tiempo Real**
   - Actualización de stock en vivo
   - Notificaciones de otras sesiones
   - Dashboard actualizado sin refresh

2. **Caché de Productos**
   - Pre-cargar productos frecuentes
   - Lazy loading para catálogo completo
   - Imágenes optimizadas (WebP, 200x200px)

3. **Búsqueda Rápida**
   - Índices en base de datos
   - Búsqueda por código de barras (futuro)
   - Autocompletado con debounce

---

## 🧪 Casos de Prueba

### Test Cases

1. **Abrir Sesión**
   - ✅ Con evento asociado
   - ✅ Sin evento asociado
   - ✅ Con fondo inicial €0
   - ✅ Con fondo inicial €500
   - ❌ Sin sesión cerrada previa (error)

2. **Registrar Venta**
   - ✅ 1 producto, cantidad 1
   - ✅ Múltiples productos
   - ✅ Cantidad > 1
   - ❌ Stock insuficiente (error)
   - ❌ Producto sin stock (error)
   - ✅ Con descuento
   - ✅ Cada método de pago

3. **Cerrar Sesión**
   - ✅ Cuadre perfecto (diferencia = 0)
   - ✅ Sobra dinero (diferencia > 0)
   - ✅ Falta dinero (diferencia < 0)
   - ❌ Sin conteo físico (error)

4. **Integración con Inventario**
   - ✅ Stock descontado correctamente
   - ✅ Movimiento de stock registrado
   - ✅ Alerta de stock bajo activada
   - ❌ Rollback si falla venta

---

## 📋 Checklist de Implementación

### Backend (5 días)
- [ ] Migración V010: Tablas sesiones_caja y consumos
- [ ] Entity: SesionCaja con validaciones
- [ ] Entity: Consumo con relaciones
- [ ] Repository: SesionCajaRepository con queries custom
- [ ] Repository: ConsumoRepository
- [ ] Service: SesionCajaService (abrir, cerrar, stats)
- [ ] Service: ConsumoService (registrar venta, descuento stock)
- [ ] Controller: SesionCajaController REST
- [ ] Controller: ConsumoController REST
- [ ] Tests unitarios de servicios
- [ ] Tests de integración completos
- [ ] Generación de PDF de cierre

### Frontend (5 días)
- [ ] API client: sesionesApi.ts
- [ ] API client: consumosApi.ts
- [ ] Store: posStore (Zustand) para estado POS
- [ ] Page: POSPage con grid de productos
- [ ] Component: AbrirSesionModal
- [ ] Component: SesionActiva (header stats)
- [ ] Component: ProductoGrid (botones táctiles)
- [ ] Component: TicketActual (carrito)
- [ ] Component: ConsumosList (historial ventas)
- [ ] Component: CerrarSesionModal (cuadre)
- [ ] Component: EstadisticasSesion
- [ ] Hook: useSesionActiva (polling cada 5s)
- [ ] Responsive: Optimizado para tablet
- [ ] Testing: E2E con Cypress

---

## 🚀 Roadmap de Features Futuras

### Sprint 8 (MVP)
- ✅ Abrir/cerrar sesión
- ✅ Registrar ventas básicas
- ✅ Descuento automático de stock
- ✅ Detalle en tiempo real
- ✅ Cierre con cuadre

### Post-MVP (Sprint 11)
- ⏳ Lector de código de barras
- ⏳ Impresora de tickets térmica
- ⏳ Descuentos y promociones
- ⏳ Propinas
- ⏳ División de cuenta
- ⏳ Modo offline (PWA)
- ⏳ Integración con TPV físico

---

**Última actualización:** 2025-10-10
**Autor:** Equipo de Desarrollo
**Versión del documento:** 1.0
