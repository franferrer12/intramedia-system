# Diseño de Módulos: Inversión Inicial y Finanzas Avanzadas

## 📊 MÓDULO 1: INVERSIÓN INICIAL Y ACTIVOS FIJOS

### Objetivo
Registrar y gestionar la inversión inicial del local, activos fijos, amortizaciones y calcular el retorno de inversión (ROI).

### Entidades Backend

#### 1.1 CategoriaActivo (Enum)
```java
public enum CategoriaActivo {
    INFRAESTRUCTURA,    // Reformas, decoración, pintura
    EQUIPAMIENTO,       // Barra, mesas, sillas, estanterías
    TECNOLOGIA,         // POS, cámaras, sistema sonido, iluminación
    MOBILIARIO,         // Decoración, cortinas, espejos
    LICENCIAS,          // Licencias de apertura, permisos
    STOCK_INICIAL,      // Inventario inicial de productos
    OTROS
}
```

#### 1.2 ActivoFijo (Entity)
```java
@Entity
@Table(name = "activos_fijos")
public class ActivoFijo {
    @Id @GeneratedValue
    private Long id;

    private String nombre;
    private String descripcion;

    @Enumerated(EnumType.STRING)
    private CategoriaActivo categoria;

    private BigDecimal valorInicial;        // Coste de adquisición
    private LocalDate fechaAdquisicion;
    private Integer vidaUtilAnios;          // Años de vida útil
    private BigDecimal valorResidual;       // Valor al final de vida útil

    // Calculados automáticamente
    private BigDecimal amortizacionAnual;   // (valorInicial - valorResidual) / vidaUtilAnios
    private BigDecimal amortizacionAcumulada;
    private BigDecimal valorNeto;           // valorInicial - amortizacionAcumulada

    private String proveedor;
    private String numeroFactura;
    private Boolean activo;

    @CreatedDate
    private LocalDateTime fechaCreacion;
}
```

#### 1.3 InversionInicial (Entity)
```java
@Entity
@Table(name = "inversion_inicial")
public class InversionInicial {
    @Id @GeneratedValue
    private Long id;

    private String concepto;
    private BigDecimal monto;

    @Enumerated(EnumType.STRING)
    private CategoriaActivo categoria;

    private LocalDate fecha;
    private String descripcion;
    private String documentoReferencia;

    @CreatedDate
    private LocalDateTime fechaCreacion;
}
```

### Funcionalidades

1. **CRUD de Activos Fijos:**
   - Registrar nuevo activo con sus datos
   - Editar información del activo
   - Marcar como inactivo (baja de activo)
   - Calcular automáticamente amortización

2. **Cálculo de Amortizaciones:**
   - Amortización lineal mensual/anual
   - Registro histórico de amortizaciones
   - Actualización automática del valor neto

3. **Dashboard de Inversiones:**
   - Total invertido por categoría
   - Valor actual de los activos
   - Amortización acumulada
   - Gráfico de distribución de inversión

4. **Reportes:**
   - Listado de activos con valores actuales
   - Histórico de amortizaciones
   - Proyección de amortizaciones futuras

---

## 💰 MÓDULO 2: FINANZAS Y ANALÍTICAS AVANZADAS

### 2.1 Dashboard Financiero Mejorado

#### KPIs Principales (Cards superiores)

1. **Ingresos del Período**
   - Valor total
   - Comparación con período anterior (%)
   - Tendencia (↑ ↓)

2. **Gastos del Período**
   - Valor total
   - Comparación con período anterior (%)
   - Desglose: fijos vs variables

3. **Beneficio Neto**
   - Ingresos - Gastos
   - Margen neto (%)
   - Tendencia

4. **EBITDA**
   - Earnings Before Interest, Taxes, Depreciation and Amortization
   - Indicador de rentabilidad operativa

5. **ROI (Return on Investment)**
   - (Beneficio Neto / Inversión Inicial) × 100
   - Días para recuperar inversión

6. **Punto de Equilibrio (Break-even)**
   - Ingresos necesarios para cubrir costes
   - % alcanzado del break-even
   - Proyección de días para alcanzar

7. **Ratio de Liquidez**
   - Activos líquidos / Pasivos corrientes
   - Indicador de salud financiera

8. **Cash Flow del Mes**
   - Entradas - Salidas
   - Saldo disponible
   - Proyección próximos 30 días

### 2.2 Gráficos y Visualizaciones

#### Gráfico 1: Evolución Ingresos vs Gastos
- Tipo: Líneas temporales
- Período: Últimos 6/12 meses
- Líneas: Ingresos (verde), Gastos (rojo), Beneficio (azul)

#### Gráfico 2: Distribución de Gastos
- Tipo: Pie Chart / Donut Chart
- Categorías: Nóminas, Inventario, Servicios, Proveedores, Otros
- Porcentaje de cada categoría

#### Gráfico 3: Análisis por Categoría de Producto
- Tipo: Barras horizontales
- Métricas: Ingresos, Margen bruto, Unidades vendidas
- Orden: Por rentabilidad

#### Gráfico 4: Ingresos por Día de Semana
- Tipo: Barras agrupadas
- Comparación: Semana actual vs promedio
- Identificar días más rentables

#### Gráfico 5: Tendencia de Eventos
- Tipo: Líneas + puntos
- Métricas: Asistencia, Ingresos por evento, Ratio ingresos/asistencia
- Identificar eventos más rentables

#### Gráfico 6: Cash Flow Proyectado
- Tipo: Área apilada
- Componentes: Ingresos proyectados, Gastos fijos, Gastos variables
- Período: Próximos 90 días

### 2.3 Análisis de Rentabilidad

#### Por Producto
```typescript
interface RentabilidadProducto {
  nombre: string;
  categoria: string;
  unidadesVendidas: number;
  ingresosTotal: BigDecimal;
  costesTotal: BigDecimal;
  margenBruto: BigDecimal;          // ingresos - costes
  margenBrutoPorc: number;          // (margen / ingresos) * 100
  contribucionTotal: BigDecimal;    // margen × unidades
  ranking: number;                  // Posición por rentabilidad
}
```

#### Por Evento
```typescript
interface RentabilidadEvento {
  nombreEvento: string;
  fecha: Date;
  tipoEvento: string;
  asistencia: number;
  ingresosTotales: BigDecimal;
  costesTotales: BigDecimal;
  beneficioNeto: BigDecimal;
  margenNeto: number;
  ingresoPorAsistente: BigDecimal;
  costePorAsistente: BigDecimal;
}
```

#### Por Período Temporal
- Comparación día a día
- Análisis semanal
- Evolución mensual
- Comparativa año actual vs anterior

### 2.4 Análisis de Cash Flow

#### Componentes

1. **Ingresos Operativos:**
   - Ventas de productos
   - Entradas de eventos
   - Servicios adicionales

2. **Gastos Operativos:**
   - Nóminas
   - Compras de inventario
   - Servicios (luz, agua, internet)
   - Proveedores

3. **Inversiones:**
   - Compra de activos fijos
   - Mejoras en el local

4. **Financiación:**
   - Préstamos recibidos
   - Devoluciones de préstamos

#### Proyecciones
- Basadas en histórico
- Gastos fijos confirmados (nóminas)
- Eventos planificados
- Tendencias estacionales

### 2.5 Métricas de Negocio

1. **Ticket Promedio:**
   - Ingresos totales / Número de transacciones
   - Evolución temporal
   - Por día de semana

2. **Ocupación del Local:**
   - Asistentes por evento / Aforo máximo
   - Porcentaje de ocupación promedio
   - Eventos con mayor ocupación

3. **Frecuencia de Compra:**
   - Transacciones por producto
   - Productos más solicitados
   - Combinaciones populares

4. **Eficiencia de Personal:**
   - Ingresos generados / Coste de nóminas
   - Ratio de productividad

### 2.6 Reportes Avanzados PDF

#### Estado de Resultados (P&L) Detallado
```
INGRESOS
├── Ventas de Bebidas
│   ├── Alcoholes      €X,XXX
│   ├── Refrescos      €X,XXX
│   └── Otros          €X,XXX
├── Entradas Eventos   €X,XXX
└── Otros Ingresos     €X,XXX
                    TOTAL: €XX,XXX

COSTES DIRECTOS
├── Coste de Ventas   (€X,XXX)
└── Personal Eventos  (€X,XXX)
                    SUBTOTAL: (€X,XXX)

MARGEN BRUTO          €XX,XXX (XX%)

GASTOS OPERATIVOS
├── Nóminas           (€X,XXX)
├── Alquiler          (€X,XXX)
├── Servicios         (€X,XXX)
├── Marketing         (€X,XXX)
└── Otros             (€X,XXX)
                    SUBTOTAL: (€X,XXX)

EBITDA                €XX,XXX (XX%)

AMORTIZACIONES        (€X,XXX)

BENEFICIO NETO        €XX,XXX (XX%)
```

#### Balance General
```
ACTIVO
├── Activo Corriente
│   ├── Caja y Bancos     €X,XXX
│   └── Inventario        €X,XXX
├── Activo No Corriente
│   └── Activos Fijos     €X,XXX
                    TOTAL: €XX,XXX

PASIVO
├── Pasivo Corriente
│   ├── Proveedores       €X,XXX
│   └── Nóminas por pagar €X,XXX
├── Pasivo No Corriente
│   └── Préstamos         €X,XXX
                    TOTAL: €X,XXX

PATRIMONIO
└── Capital + Resultados  €XX,XXX

TOTAL PASIVO + PATRIMONIO: €XX,XXX
```

#### Análisis de Punto de Equilibrio
- Costes fijos totales
- Margen de contribución promedio
- Ventas necesarias para break-even
- Días necesarios (proyección)
- Gráfico visual del punto de equilibrio

---

## 🎯 PLAN DE IMPLEMENTACIÓN

### FASE A: Módulo de Inversión Inicial (3-4 días)

**Día 1: Backend**
- [ ] Crear entidades: ActivoFijo, InversionInicial, CategoriaActivo
- [ ] Crear repositorios y servicios
- [ ] Implementar cálculo de amortizaciones
- [ ] Crear endpoints REST

**Día 2: Frontend**
- [ ] Crear página de Activos Fijos
- [ ] Formulario para registrar activos
- [ ] Lista con tabla de activos
- [ ] Dashboard de inversiones

**Día 3: Cálculos y Reportes**
- [ ] Implementar servicio de amortizaciones automáticas
- [ ] Crear job para calcular amortizaciones mensuales
- [ ] Generar reportes PDF de activos

**Día 4: Testing e Integración**
- [ ] Pruebas de cálculos
- [ ] Integración con Dashboard principal
- [ ] Validaciones y casos extremos

### FASE B: Dashboard Financiero Avanzado (4-5 días)

**Día 1: KPIs Backend**
- [ ] Crear servicio de métricas financieras
- [ ] Implementar cálculos: ROI, EBITDA, Break-even, Ratios
- [ ] Crear endpoints para obtener KPIs

**Día 2: KPIs Frontend**
- [ ] Rediseñar Dashboard principal
- [ ] Implementar cards de KPIs con comparativas
- [ ] Añadir indicadores de tendencia

**Día 3: Gráficos (Parte 1)**
- [ ] Instalar librería de gráficos (Recharts o Chart.js)
- [ ] Implementar gráfico de evolución temporal
- [ ] Implementar gráfico de distribución de gastos

**Día 4: Gráficos (Parte 2)**
- [ ] Implementar análisis por categoría
- [ ] Implementar ingresos por día de semana
- [ ] Implementar cash flow proyectado

**Día 5: Análisis de Rentabilidad**
- [ ] Crear servicio de análisis por producto
- [ ] Crear servicio de análisis por evento
- [ ] Implementar vistas de rentabilidad

### FASE C: Cash Flow y Proyecciones (2-3 días)

**Día 1: Backend Cash Flow**
- [ ] Crear servicio de Cash Flow
- [ ] Implementar proyecciones basadas en histórico
- [ ] Crear endpoints

**Día 2: Frontend Cash Flow**
- [ ] Crear página de Cash Flow
- [ ] Visualización de flujos de entrada/salida
- [ ] Gráfico de proyecciones

**Día 3: Reportes Avanzados**
- [ ] Estado de Resultados detallado (PDF)
- [ ] Balance General (PDF)
- [ ] Análisis de Break-even (PDF)

### FASE D: Métricas de Negocio (1-2 días)

**Día 1: Backend**
- [ ] Crear servicio de métricas de negocio
- [ ] Calcular: Ticket promedio, ocupación, frecuencia

**Día 2: Frontend**
- [ ] Integrar métricas en Dashboard
- [ ] Crear sección de métricas de negocio
- [ ] Gráficos de métricas

---

## 📋 RESUMEN DE MEJORAS

### Nuevas Entidades
- ActivoFijo
- InversionInicial
- (Posiblemente) CashFlowEntry

### Nuevos Servicios Backend
- ActivoFijoService
- AmortizacionService
- MetricasFinancierasService
- RentabilidadService
- CashFlowService
- ProyeccionService

### Nuevas Páginas Frontend
- `/inversiones` - Gestión de inversión inicial
- `/activos` - Gestión de activos fijos
- `/dashboard-financiero` - Dashboard mejorado
- `/analisis-rentabilidad` - Análisis detallado
- `/cash-flow` - Gestión de flujo de caja

### Librerías Nuevas
- **Recharts** o **Chart.js**: Para gráficos avanzados
- Posible: **date-fns**: Para cálculos de fechas complejos

---

## 💡 BENEFICIOS

1. **Visibilidad Total:** Control completo de la salud financiera del negocio
2. **Toma de Decisiones:** Datos para decisiones estratégicas informadas
3. **Proyecciones:** Anticipar problemas de liquidez
4. **Rentabilidad:** Identificar productos/eventos más rentables
5. **ROI:** Saber cuándo se recupera la inversión
6. **Profesionalización:** Reportes financieros de nivel empresarial

---

## ❓ PREGUNTAS PARA EL USUARIO

1. ¿Quieres empezar con el módulo de Inversión Inicial o con el Dashboard Financiero Avanzado?
2. ¿Prefieres Recharts o Chart.js para los gráficos?
3. ¿Hay alguna métrica específica que te interese especialmente?
4. ¿Quieres integración con contabilidad externa o es solo gestión interna?
5. ¿Necesitas múltiples monedas o solo EUR?
