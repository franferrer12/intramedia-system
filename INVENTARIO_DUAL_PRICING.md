# 🍾 Sistema de Inventario con Precio Dual (Copa + Botella VIP)

> **Feature Solicitada:** 12 Enero 2025
> **Estado:** 📋 PENDIENTE DE DESARROLLO
> **Prioridad:** ALTA
> **Sprint Objetivo:** 10.5 (Post-optimización)

---

## 🎯 Objetivo

Permitir que un mismo producto en inventario pueda venderse de **DOS formas diferentes** con precios y trazabilidad independientes:

1. **Venta por Copa Individual** (servicio de barra)
2. **Venta de Botella Completa VIP** (mesa VIP/reservado)

### Problema Actual

El sistema actual obliga a elegir **UN SOLO tipo de venta** por producto:
- Si configuras "Vodka Grey Goose" como COPA → solo puedes vender copas
- Si lo configuras como BOTELLA → solo puedes vender botellas completas
- **No hay forma de hacer ambas** con el mismo producto

Esto genera problemas:
- ❌ Duplicar productos ("Vodka Copa" + "Vodka VIP")
- ❌ Gestión de stock dividida manualmente
- ❌ Dificultad para calcular rentabilidad comparativa
- ❌ No se puede ver el valor real del inventario por escenario

---

## 📊 Caso de Uso Real

### Producto: Vodka Grey Goose 700ml

**Stock actual:** 10 botellas
**Precio de compra:** 45€ por botella
**Capacidad:** 700ml → 7 copas de 90ml (con 10% merma)

#### Escenario A: Vender en Copas (Barra Normal)
```
├─ Copas disponibles: 70 copas (10 botellas × 7 copas)
├─ Precio copa: 8€
├─ Ingreso potencial: 560€ (70 × 8€)
├─ Inversión: 450€ (10 × 45€)
└─ Beneficio potencial: 110€ (24.4% margen)
```

#### Escenario B: Vender en VIP (Reservados)
```
├─ Botellas disponibles: 10 botellas
├─ Precio botella VIP: 65€
├─ Ingreso potencial: 650€ (10 × 65€)
├─ Inversión: 450€ (10 × 45€)
└─ Beneficio potencial: 200€ (44.4% margen)
```

#### Escenario C: Mixto (Real en discoteca)
```
En la última semana vendí:
├─ 5 botellas VIP a 65€ = 325€
└─ 180 copas (≈ 25.7 botellas) a 8€ = 1,440€

Total vendido: 30.7 botellas
Total ingresos: 1,765€
Stock restante: 10 - 30.7 = déficit → Necesito reposición
```

---

## 🔍 Análisis del Sistema Actual

### ✅ Lo que YA EXISTE (80% implementado)

#### 1. Tabla `productos` - Campos VIP YA en BD
```sql
-- ✅ Estos campos YA EXISTEN en producción
copas_por_botella      | integer
precio_copa            | numeric(10,2)
precio_botella_vip     | numeric(10,2)
es_botella             | boolean

-- ✅ Estos campos también existen (modelo ocio nocturno)
capacidad_ml           | numeric(10,2)
tipo_venta             | varchar(20)  -- 'COPA', 'CHUPITO', 'BOTELLA'
ml_por_servicio        | numeric(10,2)
factor_merma           | numeric(5,2)
unidades_reales        | numeric(10,2)  -- Copas por botella calculadas
```

#### 2. Tabla `detalle_venta` - Registro Dual YA Funciona
```sql
-- ✅ Ya registra el tipo de venta
tipo_venta: 'NORMAL' | 'BOTELLA_COMPLETA' | 'COPA_INDIVIDUAL' | 'PACK_VIP'
precio_unitario: decimal  -- ✅ Captura el precio REAL de venta
es_copa_individual: boolean
copas_vendidas: integer
```

#### 3. Sistema de Triggers - Descuento Automático Funcional
```sql
-- ✅ Ya existen 3 triggers operativos
trigger_descontar_stock_venta
trigger_descontar_stock_botella_completa
trigger_actualizar_copas_servidas
```

#### 4. Backend - Entidad Producto
```java
// ❌ CAMPOS COMENTADOS (pero BD sí los tiene)
// Archivo: Producto.java:94-108
/*
@Column(name = "copas_por_botella")
private Integer copasPorBotella;

@Column(name = "precio_copa", precision = 10, scale = 2)
private BigDecimal precioCopa;

@Column(name = "precio_botella_vip", precision = 10, scale = 2)
private BigDecimal precioBotellaVip;

@Column(name = "es_botella", nullable = false)
private Boolean esBotella = false;
*/
```

---

## 🛠️ Solución Propuesta: Modelo Híbrido de 3 Niveles

### **NIVEL 1: INVENTARIO (Stock físico)**

```java
// Producto.java - Configuración híbrida
@Column(name = "es_venta_dual")
private Boolean esVentaDual = false;  // ← NUEVO CAMPO

// Configuración física (ya existe)
capacidadMl: 700ml
mlPorServicioCopa: 90ml
factorMerma: 10%
copasPorBotella: 7 (calculado automáticamente)

// Economía base (ya existe)
precioCompra: 45€

// Precios duales (descomentar campos existentes)
precioCopa: 8€                    // Precio por copa en barra
precioBotellaVip: 65€              // Precio por botella en VIP
```

**Cálculo de valor de inventario:**
```sql
SELECT
  codigo,
  nombre,
  stock_actual,

  -- Inversión actual
  (stock_actual * precio_compra) as capital_invertido,

  -- Escenario Copa
  (stock_actual * copas_por_botella) as copas_disponibles,
  (stock_actual * copas_por_botella * precio_copa) as valor_potencial_copas,

  -- Escenario VIP
  (stock_actual * precio_botella_vip) as valor_potencial_vip,

  -- Mejor opción
  CASE
    WHEN (stock_actual * copas_por_botella * precio_copa) > (stock_actual * precio_botella_vip)
      THEN 'Mejor vender en COPAS'
    ELSE 'Mejor vender en VIP'
  END as recomendacion_venta
FROM productos
WHERE es_venta_dual = true AND stock_actual > 0;
```

### **NIVEL 2: PUNTO DE VENTA (Selección dinámica)**

```typescript
// POS - Al momento de vender
interface OpcionVenta {
  tipo: 'COPA' | 'BOTELLA_VIP';
  producto: Producto;
  precioUnitario: number;
  cantidadDisponible: number;
}

function getOpcionesVenta(producto: Producto): OpcionVenta[] {
  if (!producto.esVentaDual) {
    // Venta normal (comportamiento actual)
    return [{
      tipo: 'NORMAL',
      precioUnitario: producto.precioVenta
    }];
  }

  // Venta dual
  return [
    {
      tipo: 'COPA',
      precioUnitario: producto.precioCopa,
      cantidadDisponible: producto.stockActual * producto.copasPorBotella,
      descripcion: `Copa (${producto.mlPorServicio}ml)`
    },
    {
      tipo: 'BOTELLA_VIP',
      precioUnitario: producto.precioBotellaVip,
      cantidadDisponible: producto.stockActual,
      descripcion: 'Botella completa VIP'
    }
  ];
}
```

### **NIVEL 3: TRAZABILIDAD (Registro exacto)**

```sql
-- detalle_venta registra EXACTAMENTE lo vendido
INSERT INTO detalle_venta (
  venta_id,
  producto_id,
  tipo_venta,          -- 'COPA_INDIVIDUAL' o 'BOTELLA_COMPLETA'
  cantidad,            -- 3 copas o 1 botella
  precio_unitario,     -- 8€ o 65€ (el precio REAL aplicado)
  subtotal,
  total
) VALUES (...);

-- Trigger descuenta stock automáticamente
-- Si es COPA_INDIVIDUAL: descuenta cantidad/copas_por_botella botellas
-- Si es BOTELLA_COMPLETA: descuenta cantidad botellas
```

---

## 📈 Reportes y Dashboards

### 1. Valor Actual del Inventario

```sql
-- Vista: valor_inventario_dual
CREATE VIEW valor_inventario_dual AS
SELECT
  p.id,
  p.codigo,
  p.nombre,
  p.stock_actual,

  -- Inversión
  p.precio_compra,
  (p.stock_actual * p.precio_compra) as capital_invertido,

  -- Opción Copa
  p.copas_por_botella,
  p.precio_copa,
  (p.stock_actual * p.copas_por_botella) as copas_totales,
  (p.stock_actual * p.copas_por_botella * p.precio_copa) as valor_copas,
  ((p.stock_actual * p.copas_por_botella * p.precio_copa) - (p.stock_actual * p.precio_compra)) as beneficio_copas,

  -- Opción VIP
  p.precio_botella_vip,
  (p.stock_actual * p.precio_botella_vip) as valor_vip,
  ((p.stock_actual * p.precio_botella_vip) - (p.stock_actual * p.precio_compra)) as beneficio_vip,

  -- Mejor opción
  CASE
    WHEN (p.stock_actual * p.copas_por_botella * p.precio_copa) > (p.stock_actual * p.precio_botella_vip)
      THEN 'COPA'
    ELSE 'VIP'
  END as mejor_opcion,

  -- Diferencia de beneficio
  ABS(
    ((p.stock_actual * p.copas_por_botella * p.precio_copa) - (p.stock_actual * p.precio_compra)) -
    ((p.stock_actual * p.precio_botella_vip) - (p.stock_actual * p.precio_compra))
  ) as diferencia_beneficio

FROM productos p
WHERE p.es_venta_dual = true AND p.stock_actual > 0;
```

**Resultado visual:**
```
Vodka Grey Goose (10 botellas)
├─ 💰 Inversión: 450€
│
├─ 📊 Opción A - Vender en Copas
│  ├─ Copas disponibles: 70
│  ├─ Valor potencial: 560€
│  ├─ Beneficio: 110€
│  └─ Margen: 24.4%
│
├─ 📊 Opción B - Vender en VIP
│  ├─ Botellas: 10
│  ├─ Valor potencial: 650€
│  ├─ Beneficio: 200€
│  └─ Margen: 44.4%
│
└─ ✅ Recomendación: Vender en VIP (90€ más beneficio)
```

### 2. Análisis de Ventas Reales

```sql
-- ¿Cuánto vendí en copas vs VIP?
SELECT
  p.nombre,

  -- Ventas en Copa
  COUNT(CASE WHEN dv.tipo_venta = 'COPA_INDIVIDUAL' THEN 1 END) as num_ventas_copa,
  SUM(CASE WHEN dv.tipo_venta = 'COPA_INDIVIDUAL' THEN dv.cantidad ELSE 0 END) as copas_vendidas,
  SUM(CASE WHEN dv.tipo_venta = 'COPA_INDIVIDUAL' THEN dv.total ELSE 0 END) as ingresos_copa,

  -- Ventas en VIP
  COUNT(CASE WHEN dv.tipo_venta = 'BOTELLA_COMPLETA' THEN 1 END) as num_ventas_vip,
  SUM(CASE WHEN dv.tipo_venta = 'BOTELLA_COMPLETA' THEN dv.cantidad ELSE 0 END) as botellas_vip_vendidas,
  SUM(CASE WHEN dv.tipo_venta = 'BOTELLA_COMPLETA' THEN dv.total ELSE 0 END) as ingresos_vip,

  -- Total
  SUM(dv.total) as ingresos_totales

FROM detalle_venta dv
JOIN productos p ON p.id = dv.producto_id
WHERE p.es_venta_dual = true
  AND dv.created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY p.nombre
ORDER BY ingresos_totales DESC;
```

**Resultado visual:**
```
Vodka Grey Goose - Octubre 2025
├─ Ventas en Copa:
│  ├─ 45 transacciones
│  ├─ 180 copas vendidas
│  ├─ Ingresos: 1,440€
│  └─ Promedio: 8€/copa
│
├─ Ventas en VIP:
│  ├─ 8 transacciones
│  ├─ 8 botellas vendidas
│  ├─ Ingresos: 520€
│  └─ Promedio: 65€/botella
│
└─ 📊 Total mes: 1,960€
```

### 3. Rentabilidad Real por Tipo de Venta

```sql
-- Comparación de rentabilidad REAL
SELECT
  p.nombre,
  dv.tipo_venta,

  -- Coste unitario
  CASE
    WHEN dv.tipo_venta = 'COPA_INDIVIDUAL'
      THEN p.precio_compra / p.copas_por_botella  -- Coste por copa
    ELSE p.precio_compra  -- Coste por botella
  END as coste_unitario,

  -- Precio de venta REAL
  AVG(dv.precio_unitario) as precio_venta_promedio,

  -- Beneficio unitario
  AVG(dv.precio_unitario) - (
    CASE
      WHEN dv.tipo_venta = 'COPA_INDIVIDUAL'
        THEN p.precio_compra / p.copas_por_botella
      ELSE p.precio_compra
    END
  ) as beneficio_unitario,

  -- Margen %
  ((AVG(dv.precio_unitario) - (
    CASE
      WHEN dv.tipo_venta = 'COPA_INDIVIDUAL'
        THEN p.precio_compra / p.copas_por_botella
      ELSE p.precio_compra
    END
  )) / (
    CASE
      WHEN dv.tipo_venta = 'COPA_INDIVIDUAL'
        THEN p.precio_compra / p.copas_por_botella
      ELSE p.precio_compra
    END
  )) * 100 as margen_porcentaje,

  -- Totales
  SUM(dv.cantidad) as unidades_vendidas,
  SUM(dv.total) as ingresos_totales

FROM detalle_venta dv
JOIN productos p ON p.id = dv.producto_id
WHERE p.es_venta_dual = true
GROUP BY p.nombre, p.precio_compra, p.copas_por_botella, dv.tipo_venta
ORDER BY margen_porcentaje DESC;
```

**Resultado visual:**
```
Rentabilidad Comparativa - Vodka Grey Goose

Copa Individual:
├─ Coste: 6.43€/copa (45€ / 7 copas)
├─ Precio venta: 8€/copa
├─ Beneficio: 1.57€/copa
├─ Margen: 24.4%
└─ Ingresos totales: 1,440€

Botella VIP:
├─ Coste: 45€/botella
├─ Precio venta: 65€/botella
├─ Beneficio: 20€/botella
├─ Margen: 44.4%
└─ Ingresos totales: 520€

📊 Análisis:
- VIP es 20 puntos más rentable por unidad
- Copa genera más volumen total (1,440€ vs 520€)
- Estrategia óptima: Promover VIP en reservados, Copa en barra
```

---

## 🔧 Cambios Técnicos Requeridos

### Paso 1: Backend - Habilitar Campos VIP ✅ (BD ya los tiene)

**Archivo:** `backend/src/main/java/com/club/management/entity/Producto.java`

```java
// Descomentar líneas 94-108
@Column(name = "copas_por_botella")
private Integer copasPorBotella;

@Column(name = "precio_copa", precision = 10, scale = 2)
private BigDecimal precioCopa;

@Column(name = "precio_botella_vip", precision = 10, scale = 2)
private BigDecimal precioBotellaVip;

@Column(name = "es_botella", nullable = false)
private Boolean esBotella = false;

// NUEVO - Flag para habilitar venta dual
@Column(name = "es_venta_dual")
private Boolean esVentaDual = false;
```

### Paso 2: Migración - Agregar Flag Dual

**Archivo:** `backend/src/main/resources/db/migration/V020__add_venta_dual.sql`

```sql
-- Agregar campo para identificar productos de venta dual
ALTER TABLE productos
    ADD COLUMN es_venta_dual BOOLEAN DEFAULT false;

-- Índice para búsquedas rápidas
CREATE INDEX idx_productos_venta_dual ON productos(es_venta_dual)
WHERE es_venta_dual = true;

-- Actualizar productos existentes que tengan ambos precios configurados
UPDATE productos
SET es_venta_dual = true
WHERE precio_copa IS NOT NULL
  AND precio_botella_vip IS NOT NULL
  AND copas_por_botella IS NOT NULL;

-- Comentario
COMMENT ON COLUMN productos.es_venta_dual IS
'Indica si el producto puede venderse tanto en copas como en botellas VIP';
```

### Paso 3: Frontend - ProductoModal (Formulario)

**Archivo:** `frontend/src/components/productos/ProductoModal.tsx`

```typescript
// Agregar al formulario (después de línea 61)
const [formData, setFormData] = useState<ProductoFormData>({
  // ... campos existentes ...

  // Nuevos campos VIP
  esVentaDual: false,
  precioCopa: undefined,
  precioBotellaVip: undefined,
  copasPorBotella: undefined,
});

// En el JSX, agregar sección VIP (después de línea 556)
{/* === SECCIÓN VENTA DUAL (COPA + VIP) === */}
{mostrarOcioNocturno && (
  <div className="border-t pt-4 mt-4">
    <div className="flex items-center gap-2 mb-4">
      <Wine className="w-5 h-5 text-indigo-600" />
      <h4 className="font-semibold text-gray-900">Configuración Dual (Copa + VIP)</h4>
    </div>

    {/* Checkbox para habilitar venta dual */}
    <div className="flex items-center mb-4">
      <input
        type="checkbox"
        id="esVentaDual"
        checked={formData.esVentaDual}
        onChange={(e) => setFormData({ ...formData, esVentaDual: e.target.checked })}
        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
      />
      <label htmlFor="esVentaDual" className="ml-2 block text-sm text-gray-700">
        Este producto se vende tanto en <strong>copas</strong> como en <strong>botella VIP</strong>
      </label>
    </div>

    {/* Campos de precio dual */}
    {formData.esVentaDual && (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio Copa (€) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.precioCopa || ''}
            onChange={(e) => setFormData({ ...formData, precioCopa: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-500 mt-1">Precio por copa en barra</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio Botella VIP (€) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.precioBotellaVip || ''}
            onChange={(e) => setFormData({ ...formData, precioBotellaVip: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-500 mt-1">Precio botella completa VIP</p>
        </div>
      </div>
    )}

    {/* Panel de comparación (si está habilitado) */}
    {formData.esVentaDual && formData.precioCopa && formData.precioBotellaVip && (
      <div className="mt-4 bg-indigo-50 rounded-lg p-4">
        <h5 className="text-sm font-semibold text-indigo-900 mb-3">Comparación de Rentabilidad</h5>

        <div className="grid grid-cols-2 gap-3">
          {/* Opción Copa */}
          <div className="bg-white rounded p-3 shadow-sm">
            <div className="text-xs text-gray-500 mb-1">Venta en Copas</div>
            <div className="text-lg font-bold text-gray-900">
              {((formData.copasPorBotella || 7) * formData.precioCopa).toFixed(2)}€
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {formData.copasPorBotella || 7} copas × {formData.precioCopa}€
            </div>
            <div className="text-xs text-green-600 font-medium mt-2">
              Margen: {
                (((formData.copasPorBotella || 7) * formData.precioCopa - formData.precioCompra)
                / formData.precioCompra * 100).toFixed(1)
              }%
            </div>
          </div>

          {/* Opción VIP */}
          <div className="bg-white rounded p-3 shadow-sm">
            <div className="text-xs text-gray-500 mb-1">Venta en VIP</div>
            <div className="text-lg font-bold text-gray-900">
              {formData.precioBotellaVip.toFixed(2)}€
            </div>
            <div className="text-xs text-gray-600 mt-1">
              1 botella × {formData.precioBotellaVip}€
            </div>
            <div className="text-xs text-green-600 font-medium mt-2">
              Margen: {
                ((formData.precioBotellaVip - formData.precioCompra)
                / formData.precioCompra * 100).toFixed(1)
              }%
            </div>
          </div>
        </div>

        {/* Recomendación */}
        <div className="mt-3 text-center text-sm">
          {((formData.copasPorBotella || 7) * formData.precioCopa > formData.precioBotellaVip) ? (
            <span className="text-indigo-700 font-medium">
              💡 Vender en copas genera más ingresos (+{
                (((formData.copasPorBotella || 7) * formData.precioCopa) - formData.precioBotellaVip).toFixed(2)
              }€)
            </span>
          ) : (
            <span className="text-indigo-700 font-medium">
              💡 Vender en VIP es más rentable (+{
                (formData.precioBotellaVip - ((formData.copasPorBotella || 7) * formData.precioCopa)).toFixed(2)
              }€)
            </span>
          )}
        </div>
      </div>
    )}
  </div>
)}
```

### Paso 4: Frontend - POS Terminal (Selección de Tipo de Venta)

**Archivo:** `frontend/src/pages/pos/POSTerminalPage.tsx`

```typescript
// Al agregar producto al carrito, mostrar modal si es venta dual
function handleAddToCart(producto: Producto) {
  if (producto.esVentaDual) {
    // Mostrar modal de selección
    setProductoSeleccionado(producto);
    setModalTipoVentaOpen(true);
  } else {
    // Agregar directo con precio normal
    addToCart(producto, 'NORMAL', producto.precioVenta);
  }
}

// Modal de selección de tipo de venta
<ModalTipoVenta
  isOpen={modalTipoVentaOpen}
  onClose={() => setModalTipoVentaOpen(false)}
  producto={productoSeleccionado}
  onSelect={(tipo, precio) => {
    addToCart(productoSeleccionado, tipo, precio);
    setModalTipoVentaOpen(false);
  }}
/>
```

**Archivo NUEVO:** `frontend/src/components/pos/ModalTipoVenta.tsx`

```typescript
interface ModalTipoVentaProps {
  isOpen: boolean;
  onClose: () => void;
  producto: Producto;
  onSelect: (tipo: 'COPA' | 'BOTELLA_VIP', precio: number) => void;
}

export const ModalTipoVenta: FC<ModalTipoVentaProps> = ({
  isOpen,
  onClose,
  producto,
  onSelect
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          {producto.nombre}
        </h3>

        <p className="text-sm text-gray-600 mb-6">
          ¿Cómo quieres vender este producto?
        </p>

        <div className="grid grid-cols-2 gap-4">
          {/* Opción Copa */}
          <button
            onClick={() => onSelect('COPA', producto.precioCopa!)}
            className="flex flex-col items-center p-6 border-2 border-blue-500 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Wine className="w-12 h-12 text-blue-600 mb-3" />
            <div className="text-lg font-bold text-gray-900">Copa</div>
            <div className="text-2xl font-bold text-blue-600 mt-2">
              {producto.precioCopa?.toFixed(2)}€
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {producto.mlPorServicio}ml por servicio
            </div>
          </button>

          {/* Opción Botella VIP */}
          <button
            onClick={() => onSelect('BOTELLA_VIP', producto.precioBotellaVip!)}
            className="flex flex-col items-center p-6 border-2 border-purple-500 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <Sparkles className="w-12 h-12 text-purple-600 mb-3" />
            <div className="text-lg font-bold text-gray-900">Botella VIP</div>
            <div className="text-2xl font-bold text-purple-600 mt-2">
              {producto.precioBotellaVip?.toFixed(2)}€
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Botella completa {producto.capacidadMl}ml
            </div>
          </button>
        </div>

        {/* Comparación rápida */}
        <div className="mt-6 pt-4 border-t text-center text-sm text-gray-600">
          <div>Vender en copas: {producto.copasPorBotella} × {producto.precioCopa}€ = <strong>{(producto.copasPorBotella! * producto.precioCopa!).toFixed(2)}€</strong></div>
          <div className="mt-1">Vender VIP: <strong>{producto.precioBotellaVip?.toFixed(2)}€</strong></div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};
```

### Paso 5: Dashboard - Valor de Inventario

**Archivo NUEVO:** `frontend/src/pages/inventario/ValorInventarioPage.tsx`

```typescript
export const ValorInventarioPage: FC = () => {
  const { data: productos = [], isLoading } = useQuery({
    queryKey: ['productos-valor-dual'],
    queryFn: () => productosApi.getProductosDuales(),
    refetchInterval: 30000, // Auto-refresh cada 30s
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Valor del Inventario - Análisis Dual
      </h1>

      {/* Resumen General */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>Capital Invertido</CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {calcularCapitalTotal(productos).toFixed(2)}€
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>Valor Potencial (Copas)</CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {calcularValorCopas(productos).toFixed(2)}€
            </div>
            <div className="text-sm text-gray-600 mt-1">
              +{((calcularValorCopas(productos) / calcularCapitalTotal(productos) - 1) * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>Valor Potencial (VIP)</CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {calcularValorVIP(productos).toFixed(2)}€
            </div>
            <div className="text-sm text-gray-600 mt-1">
              +{((calcularValorVIP(productos) / calcularCapitalTotal(productos) - 1) * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Inversión</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor Copas</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor VIP</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Mejor Opción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {productos.map(producto => (
              <ProductoValorRow key={producto.id} producto={producto} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

---

## 📅 Plan de Implementación

### Sprint 10.5: Inventario Dual (Post-Optimización)
**Duración:** 5 días
**Prioridad:** ALTA

#### Día 1: Backend (2-3 horas)
- ✅ Descomentar campos VIP en `Producto.java`
- ✅ Crear migración `V020__add_venta_dual.sql`
- ✅ Actualizar `ProductoDTO` con nuevos campos
- ✅ Modificar `ProductoService` para validar venta dual
- ✅ Tests unitarios

#### Día 2: Frontend - Formulario (3-4 horas)
- ✅ Actualizar `ProductoModal.tsx` con campos dual
- ✅ Panel de comparación en tiempo real
- ✅ Validaciones de campos obligatorios
- ✅ Actualizar `ProductoFormData` types

#### Día 3: Frontend - POS (3-4 horas)
- ✅ Crear `ModalTipoVenta.tsx`
- ✅ Actualizar `POSTerminalPage.tsx` con selección
- ✅ Modificar lógica de carrito para tipo de venta
- ✅ Actualizar descuento de stock según tipo

#### Día 4: Dashboard Valor Inventario (4-5 horas)
- ✅ Crear `ValorInventarioPage.tsx`
- ✅ API endpoint `/api/productos/valor-dual`
- ✅ Cards de resumen (capital, valor copas, valor VIP)
- ✅ Tabla comparativa por producto
- ✅ Gráficos de rentabilidad (Recharts)

#### Día 5: Testing y Documentación (2-3 horas)
- ✅ Tests de integración backend
- ✅ Tests E2E del flujo completo
- ✅ Actualizar ROADMAP.md
- ✅ Crear guía de usuario en Centro de Ayuda
- ✅ Deploy a producción Railway

---

## 🎯 Criterios de Éxito

### Funcionalidad
- ✅ Un producto puede tener precio_copa Y precio_botella_vip simultáneamente
- ✅ En POS, el vendedor puede elegir cómo vender (copa o VIP)
- ✅ El stock se descuenta correctamente según tipo de venta
- ✅ El sistema registra en `detalle_venta` el tipo_venta y precio_unitario real

### Reportes
- ✅ Dashboard muestra valor de inventario por escenario (copas vs VIP)
- ✅ Reporte de ventas separa ingresos por copa vs VIP
- ✅ Análisis de rentabilidad compara margen por tipo de venta
- ✅ Recomendaciones automáticas de venta óptima

### UX
- ✅ Formulario de producto intuitivo para configurar precios duales
- ✅ Modal de selección en POS claro y rápido (< 2 segundos)
- ✅ Dashboard visual con comparación lado a lado
- ✅ Indicadores de rentabilidad fáciles de entender

---

## 📊 Métricas de Impacto

### Antes (Sistema Actual)
- ❌ Productos duplicados: "Vodka Copa" + "Vodka VIP"
- ❌ Stock dividido manualmente
- ❌ No se puede calcular valor real de inventario
- ❌ Decisiones de venta sin datos

### Después (Con Inventario Dual)
- ✅ Producto único con doble opción de venta
- ✅ Stock unificado, descuento automático
- ✅ Valor de inventario en tiempo real por escenario
- ✅ Recomendaciones basadas en rentabilidad real

---

## 📝 Notas Técnicas

### Validaciones Requeridas

```java
// ProductoService.java
public void validarVentaDual(ProductoFormData data) {
    if (data.getEsVentaDual()) {
        if (data.getPrecioCopa() == null || data.getPrecioCopa().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Precio copa es obligatorio para venta dual");
        }
        if (data.getPrecioBotellaVip() == null || data.getPrecioBotellaVip().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Precio botella VIP es obligatorio para venta dual");
        }
        if (data.getCopasPorBotella() == null || data.getCopasPorBotella() <= 0) {
            throw new IllegalArgumentException("Copas por botella debe ser > 0 para venta dual");
        }
        if (data.getCapacidadMl() == null) {
            throw new IllegalArgumentException("Capacidad ML es obligatoria para venta dual");
        }
    }
}
```

### Triggers de Stock

```sql
-- Modificar trigger existente para manejar descuento según tipo
CREATE OR REPLACE FUNCTION descontar_stock_venta()
RETURNS TRIGGER AS $$
DECLARE
    v_producto RECORD;
    v_botellas_a_descontar DECIMAL(10,2);
BEGIN
    -- Obtener configuración del producto
    SELECT * INTO v_producto FROM productos WHERE id = NEW.producto_id;

    -- Calcular botellas a descontar según tipo de venta
    IF NEW.tipo_venta = 'COPA_INDIVIDUAL' THEN
        -- Descontar fracción de botella
        v_botellas_a_descontar := NEW.cantidad / v_producto.copas_por_botella;
    ELSIF NEW.tipo_venta IN ('BOTELLA_COMPLETA', 'PACK_VIP') THEN
        -- Descontar botellas completas
        v_botellas_a_descontar := NEW.cantidad;
    ELSE
        -- Venta normal (NORMAL)
        v_botellas_a_descontar := NEW.cantidad;
    END IF;

    -- Verificar stock disponible
    IF v_producto.stock_actual < v_botellas_a_descontar THEN
        RAISE EXCEPTION 'Stock insuficiente. Disponible: %, Requerido: %',
            v_producto.stock_actual, v_botellas_a_descontar;
    END IF;

    -- Descontar stock
    UPDATE productos
    SET stock_actual = stock_actual - v_botellas_a_descontar
    WHERE id = NEW.producto_id;

    -- Registrar movimiento
    INSERT INTO movimientos_stock (
        producto_id,
        tipo_movimiento,
        cantidad,
        stock_anterior,
        stock_nuevo,
        motivo,
        referencia
    ) VALUES (
        NEW.producto_id,
        'SALIDA',
        v_botellas_a_descontar,
        v_producto.stock_actual,
        v_producto.stock_actual - v_botellas_a_descontar,
        CASE
            WHEN NEW.tipo_venta = 'COPA_INDIVIDUAL' THEN 'Venta de copa'
            WHEN NEW.tipo_venta IN ('BOTELLA_COMPLETA', 'PACK_VIP') THEN 'Venta botella VIP'
            ELSE 'Venta POS'
        END,
        'VENTA_' || NEW.venta_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔗 Referencias

### Archivos Relacionados
- Backend:
  - `backend/src/main/java/com/club/management/entity/Producto.java:94-108` (campos comentados)
  - `backend/src/main/java/com/club/management/entity/DetalleVenta.java:52-76` (tipo_venta)
  - `backend/src/main/resources/db/migration/V011__add_nightclub_pricing_fields.sql`

- Frontend:
  - `frontend/src/components/productos/ProductoModal.tsx`
  - `frontend/src/pages/pos/POSTerminalPage.tsx`
  - `frontend/src/types/index.ts:396-457` (ProductoFormData)

### Documentación Relacionada
- `BOTELLAS_VIP_IMPLEMENTACION.md` - Sistema de botellas VIP actual
- `POS_SISTEMA_COMPLETO.md` - Documentación del POS
- `CLAUDE.md` - Guía técnica del proyecto

---

**Fecha de creación:** 12 Enero 2025
**Última actualización:** 12 Enero 2025
**Versión:** 1.0
**Autor:** Equipo de desarrollo
