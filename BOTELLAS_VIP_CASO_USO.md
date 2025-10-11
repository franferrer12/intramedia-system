# 🍾 Caso de Uso: Gestión de Botellas VIP

**Fecha**: 11 Octubre 2025
**Estado**: 📋 PENDIENTE DE IMPLEMENTACIÓN
**Prioridad**: 🔥 ALTA (Funcionalidad crítica para VIPs)

---

## 🎯 Problema Actual

### Limitaciones del Sistema Actual

**Inventario actual**:
- ❌ Una botella = 1 unidad de producto
- ❌ No se puede vender la botella completa Y copas sueltas de la misma botella
- ❌ No hay diferencia entre "botella cerrada" vs "botella en uso"

**POS actual**:
- ❌ No hay precios diferenciados (pack VIP vs copa individual)
- ❌ No se registra si una venta es de botella completa o copas
- ❌ No hay tracking de botellas abiertas

---

## 📝 Casos de Uso Real

### Caso 1: Botella Completa en Reservado
```
Reservado VIP Mesa 5:
- Compran 1 botella de Absolut Vodka (750ml)
- Precio VIP pack: 80€ (en barra individual sería 120€)
- Stock: Se descuenta 1 botella completa
- Registro: "Botella completa - Reservado VIP"
```

### Caso 2: Botellas Mixtas (Completa + Copas)
```
Reservado VIP Mesa 3:
- Compran 2 botellas de Gin Tanqueray completas
- Durante la noche piden 5 copas más de Tanqueray
- Las copas se sirven de otras botellas del bar

Stock:
- 2 botellas completas (para el reservado)
- ~0.5 botellas (5 copas del bar)
```

### Caso 3: Botella Abierta en Barra
```
Barra principal:
- Botella de Ron Barceló abierta
- Se sirven 15 copas durante la noche
- Al final de la noche quedan ~5 copas en la botella

Stock:
- Se descuenta proporcional (15 copas = 0.5 botellas aprox)
- La botella sigue "abierta" para la siguiente sesión
```

### Caso 4: Precios Diferenciados
```
Producto: Vodka Absolut 750ml

Precio botella completa en barra: 120€
Precio botella completa VIP: 80€ (pack descuento)
Precio copa individual: 8€
Copa en promoción 2x1: 4€ efectivo por copa

Capacidad: 750ml ≈ 25 copas de 30ml
```

---

## 🔧 Solución Propuesta

### Impacto en Inventario

**Problema actual en el módulo de inventario**:
- ❌ Stock muestra solo "10 botellas" pero no refleja botellas abiertas
- ❌ No se sabe cuántas botellas están en barra (abiertas) vs almacén (cerradas)
- ❌ Reportes de inventario no muestran el stock real disponible para venta
- ❌ Al hacer inventario físico, hay que contar botellas abiertas manualmente

**Solución: Stock Dual (Cerrado + Abierto)**:

```
Producto: Vodka Absolut 750ml

Stock Cerrado (almacén): 10 botellas
Stock Abierto (en barra): 3 botellas
  - Botella #1: 15 copas servidas, 10 copas restantes
  - Botella #2: 8 copas servidas, 17 copas restantes
  - Botella #3: 20 copas servidas, 5 copas restantes
  Total copas disponibles: 32 copas (≈ 1.28 botellas)

Stock Total Real: 10 + 1.28 = 11.28 botellas
Stock Disponible para Venta Inmediata: 32 copas + 10 botellas
```

**Vistas de Inventario Mejoradas**:

1. **Vista Almacén** (stock cerrado):
   - Botellas completas sin abrir
   - Para pedidos a proveedores
   - Para alertas de reabastecimiento

2. **Vista Barra** (stock abierto):
   - Botellas abiertas actualmente
   - Copas disponibles por botella
   - Ubicación (barra principal, barra VIP, coctelería)

3. **Vista Consolidada**:
   - Stock total (cerrado + equivalente abierto)
   - Stock disponible real
   - Valor del inventario por ubicación

### Opción A: Sistema de Unidades de Medida (RECOMENDADA)

#### 1. Modelo de Datos

**Agregar a tabla `productos`**:
```sql
ALTER TABLE productos
ADD COLUMN unidad_medida VARCHAR(20) DEFAULT 'UNIDAD',
ADD COLUMN capacidad_ml INTEGER,
ADD COLUMN copas_por_botella INTEGER,
ADD COLUMN precio_copa DECIMAL(10,2),
ADD COLUMN precio_botella_vip DECIMAL(10,2),
ADD COLUMN es_botella BOOLEAN DEFAULT FALSE;

-- Valores de unidad_medida: 'UNIDAD', 'BOTELLA', 'LITRO', 'COPA'
```

**Nueva tabla: `botellas_abiertas`**:
```sql
CREATE TABLE botellas_abiertas (
    id BIGSERIAL PRIMARY KEY,
    producto_id BIGINT NOT NULL REFERENCES productos(id),
    sesion_caja_id BIGINT REFERENCES sesiones_caja(id),
    ubicacion VARCHAR(100), -- 'BARRA_PRINCIPAL', 'BARRA_VIP', 'COCTELERIA'

    -- Capacidad
    copas_totales INTEGER NOT NULL,
    copas_servidas INTEGER DEFAULT 0,
    copas_restantes INTEGER NOT NULL,

    -- Control
    fecha_apertura TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_cierre TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'ABIERTA', -- ABIERTA, CERRADA, DESPERDICIADA

    -- Metadatos
    abierta_por BIGINT REFERENCES empleados(id),
    cerrada_por BIGINT REFERENCES empleados(id),
    notas TEXT,

    CHECK (estado IN ('ABIERTA', 'CERRADA', 'DESPERDICIADA')),
    CHECK (copas_restantes >= 0),
    CHECK (copas_servidas + copas_restantes = copas_totales)
);

CREATE INDEX idx_botellas_abiertas_estado ON botellas_abiertas(estado);
CREATE INDEX idx_botellas_abiertas_producto ON botellas_abiertas(producto_id);
CREATE INDEX idx_botellas_abiertas_sesion ON botellas_abiertas(sesion_caja_id);
```

**Actualizar tabla `detalle_venta`**:
```sql
ALTER TABLE detalle_venta
ADD COLUMN tipo_venta VARCHAR(20) DEFAULT 'UNIDAD',
ADD COLUMN es_botella_completa BOOLEAN DEFAULT FALSE,
ADD COLUMN botella_abierta_id BIGINT REFERENCES botellas_abiertas(id),
ADD COLUMN descuento_tipo VARCHAR(50), -- 'PACK_VIP', 'PROMOCION_2X1', 'HAPPY_HOUR'
ADD COLUMN notas_venta TEXT;

-- Valores de tipo_venta: 'UNIDAD', 'BOTELLA_COMPLETA', 'COPA', 'PACK_VIP'
```

#### 2. Lógica de Negocio

**ProductoService - Nuevos métodos**:
```java
// Configurar producto como botella
void configurarComoBottella(Long productoId,
    int capacidadMl,
    int copasPorBottella,
    BigDecimal precioCopa,
    BigDecimal precioBottellaVip);

// Calcular precio por tipo de venta
BigDecimal calcularPrecio(Long productoId, TipoVenta tipo, int cantidad);
```

**BotellaAbiertaService - Nuevo servicio**:
```java
@Service
public class BotellaAbiertaService {

    // Abrir nueva botella
    BotellaAbierta abrirBottella(Long productoId, String ubicacion, Long empleadoId);

    // Registrar copas servidas
    void registrarCopasServidas(Long botellaId, int cantidadCopas);

    // Cerrar botella (vacía o desperdiciada)
    void cerrarBottella(Long botellaId, String motivo);

    // Listar botellas abiertas activas
    List<BotellaAbierta> listarBottellasAbiertas(String ubicacion);

    // Inventario de botellas abiertas
    Map<Long, Integer> inventarioBottellasAbiertas();
}
```

**VentaService - Actualización**:
```java
// Crear venta con tipo específico
VentaDTO crearVentaBottella(VentaBottellaRequest request);

// Crear venta de copas desde botella abierta
VentaDTO crearVentaCopas(VentaCopasRequest request);

// Validar disponibilidad antes de vender
boolean validarDisponibilidadBottella(Long productoId, TipoVenta tipo, int cantidad);
```

#### 3. DTOs

**VentaBottellaRequest**:
```java
public class VentaBottellaRequest {
    private Long sesionCajaId;
    private Long empleadoId;
    private Long productoId;

    // Tipo de venta
    private TipoVenta tipo; // BOTELLA_COMPLETA, COPA, PACK_VIP
    private Integer cantidad;

    // Precios
    private BigDecimal precioUnitario; // Puede ser override para packs VIP
    private BigDecimal descuento;
    private String descuentoTipo; // PACK_VIP, PROMOCION_2X1

    // Si es copa, de qué botella abierta
    private Long botellaAbiertaId;

    // Metadatos
    private String ubicacion; // RESERVADO_VIP, BARRA, TERRAZA
    private String mesaNumero;
    private String notas;
}

public enum TipoVenta {
    UNIDAD,           // Productos normales (cerveza, refresco)
    BOTELLA_COMPLETA, // Botella cerrada completa
    COPA,             // Copa individual
    PACK_VIP          // Pack con descuento VIP
}
```

**BotellaAbiertaDTO**:
```java
public class BotellaAbiertaDTO {
    private Long id;
    private Long productoId;
    private String productoNombre;
    private String ubicacion;

    private Integer copasTotales;
    private Integer copasServidas;
    private Integer copasRestantes;
    private Double porcentajeRestante;

    private LocalDateTime fechaApertura;
    private String abriertaPor;
    private String estado;

    private String notas;
}
```

#### 4. Endpoints REST

**BotellaAbiertaController**:
```java
@RestController
@RequestMapping("/api/botellas-abiertas")
public class BotellaAbiertaController {

    // Abrir nueva botella
    @PostMapping("/abrir")
    BotellaAbiertaDTO abrirBottella(@RequestBody AbrirBottellaRequest request);

    // Listar botellas abiertas
    @GetMapping("/activas")
    List<BotellaAbiertaDTO> listarBottellasAbiertas(
        @RequestParam(required = false) String ubicacion,
        @RequestParam(required = false) Long sesionCajaId
    );

    // Registrar copas servidas
    @PostMapping("/{id}/servir-copas")
    BotellaAbiertaDTO servirCopas(
        @PathVariable Long id,
        @RequestBody ServirCopasRequest request
    );

    // Cerrar botella
    @PutMapping("/{id}/cerrar")
    void cerrarBottella(
        @PathVariable Long id,
        @RequestBody CerrarBottellaRequest request
    );

    // Inventario de botellas abiertas
    @GetMapping("/inventario")
    Map<String, Object> inventarioBottellasAbiertas();
}
```

**POS Endpoints - Actualización**:
```java
// Vender botella completa
@PostMapping("/api/pos/ventas/botella-completa")
VentaDTO venderBottellaCompleta(@RequestBody VentaBottellaRequest request);

// Vender copas
@PostMapping("/api/pos/ventas/copas")
VentaDTO venderCopas(@RequestBody VentaCopasRequest request);

// Obtener precios de producto (botella vs copa)
@GetMapping("/api/pos/productos/{id}/precios")
PreciosProductoDTO obtenerPrecios(@PathVariable Long id);
```

#### 5. Triggers de Base de Datos

**Descuento de stock inteligente**:
```sql
CREATE OR REPLACE FUNCTION descontar_stock_botellas()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tipo_venta = 'BOTELLA_COMPLETA' OR NEW.tipo_venta = 'PACK_VIP' THEN
        -- Descontar botellas completas
        UPDATE productos
        SET stock = stock - NEW.cantidad
        WHERE id = NEW.producto_id;

    ELSIF NEW.tipo_venta = 'COPA' THEN
        -- Si es copa y hay botella abierta asociada
        IF NEW.botella_abierta_id IS NOT NULL THEN
            -- Actualizar copas servidas en botella abierta
            UPDATE botellas_abiertas
            SET copas_servidas = copas_servidas + NEW.cantidad,
                copas_restantes = copas_restantes - NEW.cantidad
            WHERE id = NEW.botella_abierta_id;

            -- Si botella quedó vacía, cerrarla automáticamente
            UPDATE botellas_abiertas
            SET estado = 'CERRADA',
                fecha_cierre = NOW()
            WHERE id = NEW.botella_abierta_id
            AND copas_restantes = 0;
        ELSE
            -- Copa sin botella abierta específica, descontar proporcional
            -- Ejemplo: 1 copa = 1/25 de botella
            UPDATE productos
            SET stock = stock - (NEW.cantidad::DECIMAL / copas_por_botella)
            WHERE id = NEW.producto_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_descontar_stock_botellas
AFTER INSERT ON detalle_venta
FOR EACH ROW
EXECUTE FUNCTION descontar_stock_botellas();
```

**Validación de copas disponibles**:
```sql
CREATE OR REPLACE FUNCTION validar_copas_disponibles()
RETURNS TRIGGER AS $$
DECLARE
    copas_disponibles INTEGER;
BEGIN
    IF NEW.tipo_venta = 'COPA' AND NEW.botella_abierta_id IS NOT NULL THEN
        SELECT copas_restantes INTO copas_disponibles
        FROM botellas_abiertas
        WHERE id = NEW.botella_abierta_id;

        IF copas_disponibles < NEW.cantidad THEN
            RAISE EXCEPTION 'No hay suficientes copas disponibles en la botella abierta (disponibles: %, solicitadas: %)',
                copas_disponibles, NEW.cantidad;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_copas_disponibles
BEFORE INSERT ON detalle_venta
FOR EACH ROW
EXECUTE FUNCTION validar_copas_disponibles();
```

---

## 🎨 Frontend - Interfaz de Usuario

### 1. Módulo "Botellas Abiertas"

**Nueva página: `/pos/botellas-abiertas`**

```tsx
// BotellaAbiertaCard.tsx
interface BotellaAbiertaCardProps {
  botella: BotellaAbiertaDTO;
  onServirCopas: (id: number, cantidad: number) => void;
  onCerrar: (id: number) => void;
}

const BotellaAbiertaCard: React.FC<BotellaAbiertaCardProps> = ({
  botella,
  onServirCopas,
  onCerrar
}) => {
  const porcentajeRestante = (botella.copasRestantes / botella.copasTotales) * 100;

  return (
    <Card>
      <CardHeader>
        <h3>{botella.productoNombre}</h3>
        <Badge>{botella.ubicacion}</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Barra de progreso visual */}
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full"
              style={{ width: `${porcentajeRestante}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Servidas:</span>
              <p className="font-semibold">{botella.copasServidas}</p>
            </div>
            <div>
              <span className="text-gray-500">Restantes:</span>
              <p className="font-semibold">{botella.copasRestantes}</p>
            </div>
            <div>
              <span className="text-gray-500">Total:</span>
              <p className="font-semibold">{botella.copasTotales}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => onServirCopas(botella.id, 1)}>
              Servir 1 Copa
            </Button>
            <Button variant="outline" onClick={() => onCerrar(botella.id)}>
              Cerrar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

### 2. Actualización del POS Dashboard

**Selector de tipo de venta**:
```tsx
// VentaRapidaForm.tsx
const VentaRapidaForm = () => {
  const [tipoVenta, setTipoVenta] = useState<TipoVenta>('UNIDAD');
  const [botellaAbierta, setBotellaAbierta] = useState<number | null>(null);

  return (
    <div>
      {/* Selector de tipo de venta */}
      <RadioGroup value={tipoVenta} onValueChange={setTipoVenta}>
        <RadioGroupItem value="UNIDAD">Unidad</RadioGroupItem>
        <RadioGroupItem value="BOTELLA_COMPLETA">Botella Completa</RadioGroupItem>
        <RadioGroupItem value="COPA">Copa Individual</RadioGroupItem>
        <RadioGroupItem value="PACK_VIP">Pack VIP</RadioGroupItem>
      </RadioGroup>

      {/* Si es copa, seleccionar botella abierta */}
      {tipoVenta === 'COPA' && (
        <Select value={botellaAbierta} onValueChange={setBotellaAbierta}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar botella abierta" />
          </SelectTrigger>
          <SelectContent>
            {botellasAbiertas.map(b => (
              <SelectItem key={b.id} value={b.id}>
                {b.productoNombre} - {b.copasRestantes} copas
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Mostrar precio según tipo */}
      <div className="text-lg font-semibold">
        Precio: {calcularPrecio(producto, tipoVenta)} €
      </div>
    </div>
  );
};
```

### 3. Modal de Configuración de Producto

**Nueva sección para botellas**:
```tsx
// ProductoBottellaConfig.tsx
const ProductoBottellaConfig = ({ producto }) => {
  return (
    <div className="space-y-4">
      <Checkbox
        checked={producto.esBotella}
        onCheckedChange={(checked) => setEsBotella(checked)}
      >
        Este producto es una botella
      </Checkbox>

      {producto.esBotella && (
        <>
          <Input
            label="Capacidad (ml)"
            type="number"
            value={producto.capacidadMl}
            onChange={e => setCapacidadMl(e.target.value)}
          />

          <Input
            label="Copas por botella"
            type="number"
            value={producto.copasPorBottella}
            onChange={e => setCopasPorBottella(e.target.value)}
          />

          <Input
            label="Precio por copa"
            type="number"
            step="0.01"
            value={producto.precioCopa}
            onChange={e => setPrecioCopa(e.target.value)}
          />

          <Input
            label="Precio botella VIP (pack)"
            type="number"
            step="0.01"
            value={producto.precioBotellaVip}
            onChange={e => setPrecioBotellaVip(e.target.value)}
          />
        </>
      )}
    </div>
  );
};
```

---

## 📊 Reportes y Analytics

### 1. Dashboard de Botellas

**Métricas clave**:
- Total botellas abiertas actualmente
- Total copas servidas hoy
- Botellas más vendidas (completas vs copas)
- Ratio copas/botella por producto
- Desperdicio de botellas (cerradas sin terminar)

### 2. Inventario - Página Actualizada

**Nueva vista de inventario con botellas**:

```tsx
// InventarioPage.tsx - Actualizado
const InventarioPage = () => {
  const [vistaInventario, setVistaInventario] = useState<'CONSOLIDADA' | 'ALMACEN' | 'BARRA'>('CONSOLIDADA');

  return (
    <div>
      {/* Selector de vista */}
      <Tabs value={vistaInventario} onValueChange={setVistaInventario}>
        <TabsList>
          <TabsTrigger value="CONSOLIDADA">Vista Consolidada</TabsTrigger>
          <TabsTrigger value="ALMACEN">Almacén</TabsTrigger>
          <TabsTrigger value="BARRA">Barra (Abiertas)</TabsTrigger>
        </TabsList>

        {/* Vista Consolidada */}
        <TabsContent value="CONSOLIDADA">
          <InventarioConsolidado />
        </TabsContent>

        {/* Vista Almacén (stock cerrado) */}
        <TabsContent value="ALMACEN">
          <InventarioAlmacen />
        </TabsContent>

        {/* Vista Barra (botellas abiertas) */}
        <TabsContent value="BARRA">
          <InventarioBarra />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Tabla de inventario consolidado
interface InventarioConsolidadoRow {
  productoId: number;
  nombre: string;
  categoria: string;

  // Stock cerrado
  stockCerrado: number; // Botellas completas en almacén

  // Stock abierto
  botellasAbiertas: number; // Cantidad de botellas abiertas
  copasDisponibles: number; // Total copas disponibles en botellas abiertas
  equivalenteBotellas: number; // copasDisponibles / copasPorBotella

  // Totales
  stockTotal: number; // stockCerrado + equivalenteBotellas
  valorInventario: number; // stockTotal * precioCosto

  // Estado
  estadoAlerta: 'CRITICO' | 'BAJO' | 'NORMAL' | 'ALTO';
}
```

**Columnas de la tabla de inventario**:
```
| Producto          | Almacén | En Barra | Copas Disp. | Total  | Valor   | Estado |
|-------------------|---------|----------|-------------|--------|---------|--------|
| Vodka Absolut     | 10 bot. | 3 bot.   | 32 copas    | 11.3   | 452€    | ⚠️ Bajo |
| Gin Tanqueray     | 15 bot. | 1 bot.   | 18 copas    | 15.7   | 628€    | ✅ Normal |
| Ron Barceló       | 5 bot.  | 2 bot.   | 40 copas    | 6.6    | 264€    | 🔴 Crítico |
| Whisky Ballantine | 20 bot. | 0 bot.   | 0 copas     | 20.0   | 800€    | ✅ Alto |
```

**Detalle expandible por producto**:
```tsx
<ExpansionPanel>
  <h4>Vodka Absolut - Detalle de Botellas Abiertas</h4>

  <Table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Ubicación</th>
        <th>Abierta</th>
        <th>Servidas</th>
        <th>Restantes</th>
        <th>%</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>#123</td>
        <td>Barra Principal</td>
        <td>20:30</td>
        <td>15 copas</td>
        <td>10 copas</td>
        <td>40%</td>
        <td><Button>Cerrar</Button></td>
      </tr>
      <tr>
        <td>#124</td>
        <td>Barra VIP</td>
        <td>22:15</td>
        <td>8 copas</td>
        <td>17 copas</td>
        <td>68%</td>
        <td><Button>Cerrar</Button></td>
      </tr>
      <tr>
        <td>#125</td>
        <td>Coctelería</td>
        <td>23:00</td>
        <td>20 copas</td>
        <td>5 copas</td>
        <td>20%</td>
        <td><Button>Cerrar</Button></td>
      </tr>
    </tbody>
  </Table>
</ExpansionPanel>
```

**Estadísticas adicionales en dashboard de inventario**:
```tsx
<div className="grid grid-cols-4 gap-4">
  <Card>
    <CardHeader>Total Botellas Abiertas</CardHeader>
    <CardContent>
      <h2 className="text-3xl font-bold">18</h2>
      <p className="text-sm text-gray-500">En 3 ubicaciones</p>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>Copas Disponibles</CardHeader>
    <CardContent>
      <h2 className="text-3xl font-bold">287</h2>
      <p className="text-sm text-gray-500">≈ 11.5 botellas</p>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>Valor en Barra</CardHeader>
    <CardContent>
      <h2 className="text-3xl font-bold">1,250€</h2>
      <p className="text-sm text-gray-500">Stock abierto</p>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>Desperdicio del Mes</CardHeader>
    <CardContent>
      <h2 className="text-3xl font-bold text-red-600">3.2 bot.</h2>
      <p className="text-sm text-gray-500">≈ 128€</p>
    </CardContent>
  </Card>
</div>
```

### 3. Reporte de Inventario Físico

**Nueva funcionalidad: Conteo Físico con Botellas Abiertas**

Cuando se hace inventario físico mensual, ahora incluye:

```tsx
// ConteoFisicoForm.tsx
const ConteoFisicoForm = ({ producto }) => {
  const [botellasCompletas, setBotellasCompletas] = useState(0);
  const [botellasAbiertas, setBottellasAbiertas] = useState([]);

  return (
    <div>
      <h3>{producto.nombre}</h3>

      {/* Contar botellas completas (almacén) */}
      <Input
        label="Botellas completas en almacén"
        type="number"
        value={botellasCompletas}
        onChange={e => setBotellasCompletas(parseInt(e.target.value))}
      />

      {/* Contar botellas abiertas */}
      <div>
        <h4>Botellas Abiertas</h4>
        <Button onClick={() => agregarBotellaAbierta()}>
          + Agregar Botella Abierta
        </Button>

        {botellasAbiertas.map((botella, index) => (
          <div key={index} className="flex gap-2 items-center">
            <Select
              value={botella.ubicacion}
              onChange={e => actualizarUbicacion(index, e.target.value)}
            >
              <option value="BARRA_PRINCIPAL">Barra Principal</option>
              <option value="BARRA_VIP">Barra VIP</option>
              <option value="COCTELERIA">Coctelería</option>
            </Select>

            <Input
              label="Copas restantes (estimado)"
              type="number"
              value={botella.copasRestantes}
              onChange={e => actualizarCopas(index, parseInt(e.target.value))}
            />

            <Button variant="ghost" onClick={() => eliminarBottella(index)}>
              🗑️
            </Button>
          </div>
        ))}
      </div>

      {/* Resumen */}
      <div className="bg-gray-100 p-4 rounded mt-4">
        <h4>Resumen del Conteo</h4>
        <p>Botellas completas: {botellasCompletas}</p>
        <p>Botellas abiertas: {botellasAbiertas.length}</p>
        <p>
          Copas disponibles: {botellasAbiertas.reduce((sum, b) => sum + b.copasRestantes, 0)}
          (≈ {calcularEquivalenteBotellas()} botellas)
        </p>
        <p className="font-bold mt-2">
          Stock Total: {botellasCompletas + calcularEquivalenteBotellas()} botellas
        </p>

        {/* Diferencia con sistema */}
        {mostrarDiferencia && (
          <div className={diferencia > 0 ? 'text-green-600' : 'text-red-600'}>
            <p>Diferencia: {diferencia > 0 ? '+' : ''}{diferencia.toFixed(2)} botellas</p>
            <p className="text-sm">
              {diferencia > 0 ? 'Sobrante' : 'Faltante'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
```

### 4. Reporte de Rentabilidad

**Análisis de rentabilidad por tipo de venta**:
```
Producto: Vodka Absolut 750ml

Venta como botella completa:
- Precio: 120€
- Costo: 40€
- Margen: 80€ (66%)

Venta como copas (25 copas):
- Precio: 25 copas × 8€ = 200€
- Costo: 40€
- Margen: 160€ (80%)

Venta como pack VIP:
- Precio: 80€
- Costo: 40€
- Margen: 40€ (50%)

Recomendación: Maximizar venta de copas individuales
```

---

## 🔄 Flujos de Trabajo

### Flujo 1: Venta de Botella Completa VIP

```
1. Encargado VIP recibe pedido en Mesa 5
   ↓
2. Abre POS → Selecciona "Vodka Absolut"
   ↓
3. Selecciona tipo: "Pack VIP"
   ↓
4. Sistema aplica precio VIP: 80€ (en lugar de 120€)
   ↓
5. Confirma venta
   ↓
6. Sistema:
   - Descuenta 1 botella del stock
   - Registra venta con descuento_tipo = 'PACK_VIP'
   - Crea transacción financiera por 80€
   - NO abre la botella (va cerrada al reservado)
```

### Flujo 2: Servir Copas desde Botella Abierta

```
1. Barman necesita servir 3 copas de Ron
   ↓
2. Consulta botellas abiertas de Ron
   ↓
3. Selecciona botella abierta (ID: 123)
   ↓
4. Si no hay botella abierta → Abre nueva botella
   ↓
5. Registra venta de 3 copas
   ↓
6. Sistema:
   - Actualiza botella_abierta_id=123
   - copas_servidas = 15 + 3 = 18
   - copas_restantes = 25 - 18 = 7
   - Registra venta por 3 × 8€ = 24€
   - Si copas_restantes = 0 → Cierra botella automáticamente
```

### Flujo 3: Cierre de Sesión con Botellas Abiertas

```
1. Encargado cierra sesión de caja
   ↓
2. Sistema lista todas las botellas abiertas de esa sesión
   ↓
3. Encargado decide por cada botella:
   - Cerrar y desechar (desperdicio)
   - Transferir a próxima sesión
   - Cerrar y contar como merma
   ↓
4. Sistema actualiza:
   - Estado de botellas
   - Inventario con mermas
   - Reporte de desperdicio
```

---

## 📐 Cálculos Importantes

### 1. Conversión Copa ↔ Botella

```java
// Calcular cuántas botellas se necesitan para X copas
public int calcularBotellasNecesarias(int copas, int copasPorBotella) {
    return (int) Math.ceil((double) copas / copasPorBotella);
}

// Calcular descuento proporcional de stock
public double calcularDescuentoStock(int copasVendidas, int copasPorBotella) {
    return (double) copasVendidas / copasPorBotella;
}

// Ejemplo:
// 7 copas vendidas, 25 copas por botella
// Descuento = 7/25 = 0.28 botellas
```

### 2. Margen de Ganancia

```java
public BigDecimal calcularMargen(Producto producto, TipoVenta tipo, int cantidad) {
    BigDecimal precioVenta = calcularPrecioVenta(producto, tipo, cantidad);
    BigDecimal costoProducto = producto.getPrecioCosto();

    if (tipo == TipoVenta.COPA) {
        // Costo proporcional de la botella
        costoProducto = costoProducto.divide(
            BigDecimal.valueOf(producto.getCopasPorBotella()),
            2,
            RoundingMode.HALF_UP
        );
    }

    BigDecimal margen = precioVenta.subtract(costoProducto);
    BigDecimal margenPorcentaje = margen
        .divide(precioVenta, 4, RoundingMode.HALF_UP)
        .multiply(BigDecimal.valueOf(100));

    return margenPorcentaje;
}
```

---

## ⚠️ Validaciones y Restricciones

### 1. Validaciones de Negocio

```java
// No se puede vender una botella como copa si no está configurada
if (tipo == TipoVenta.COPA && !producto.getEsBotella()) {
    throw new BusinessException("Este producto no se vende por copas");
}

// No se puede servir más copas de las disponibles en botella abierta
if (botellaAbierta.getCopasRestantes() < cantidadSolicitada) {
    throw new BusinessException(
        "Solo quedan " + botellaAbierta.getCopasRestantes() + " copas en esta botella"
    );
}

// Pack VIP solo se puede aplicar a botellas completas
if (tipo == TipoVenta.PACK_VIP && cantidad < 1) {
    throw new BusinessException("El pack VIP requiere al menos 1 botella");
}

// No se pueden abrir más botellas si ya hay suficientes abiertas
int botellasAbiertas = botellaAbiertaRepository.countByProductoAndEstado(productoId, "ABIERTA");
int copasTotalesDisponibles = botellasAbiertas * producto.getCopasPorBotella();
if (copasTotalesDisponibles > UMBRAL_COPAS_MINIMO) {
    throw new BusinessException("Ya hay suficientes botellas abiertas de este producto");
}
```

### 2. Permisos por Rol

```java
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_ENCARGADO_VIP')")
public VentaDTO venderPackVIP(VentaBottellaRequest request) {
    // Solo ADMIN y ENCARGADO_VIP pueden aplicar precios VIP
}

@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_GERENTE')")
public void cerrarBottellaConDesperdicio(Long botellaId, String motivo) {
    // Solo roles superiores pueden registrar desperdicios
}
```

---

## 🎯 Casos Edge (Situaciones Especiales)

### 1. Botella Casi Vacía
```
Problema: Quedan 2 copas, cliente pide 5 copas

Solución:
1. Servir las 2 copas de la botella abierta
2. Cerrar esa botella automáticamente
3. Abrir nueva botella
4. Servir las 3 copas restantes de la nueva botella
5. Registrar como una sola venta de 5 copas
```

### 2. Devolución de Botella
```
Problema: Cliente VIP devuelve botella sin abrir

Solución:
1. Cancelar la venta original
2. Reembolsar dinero
3. Reincorporar botella al stock
4. Registrar transacción de devolución
```

### 3. Botella Rota/Desperdiciada
```
Problema: Botella se cae y se rompe

Solución:
1. Marcar botella como DESPERDICIADA
2. Registrar merma en inventario
3. Crear registro de incidencia
4. Actualizar stock sin crear transacción de venta
```

### 4. Trasvase de Botellas
```
Problema: Mezclar restos de varias botellas

Política: NO PERMITIDO
Razón: Dificulta el tracking de stock y puede afectar calidad

Alternativa:
- Cerrar botellas con pocas copas
- Registrar merma
- Abrir botellas nuevas
```

---

## 📋 Checklist de Implementación

### Fase 1: Base de Datos (1-2 días)
- [ ] Crear migración V020 para nuevas columnas en `productos`
- [ ] Crear migración V021 para tabla `botellas_abiertas`
- [ ] Actualizar migración para columnas en `detalle_venta`
- [ ] Crear triggers de descuento de stock inteligente
- [ ] Crear función de validación de copas disponibles
- [ ] Poblar datos de ejemplo (botellas con capacidades)

### Fase 2: Backend (2-3 días)
- [ ] Crear enum `TipoVenta`
- [ ] Actualizar entidad `Producto` con campos de botella
- [ ] Crear entidad `BotellaAbierta`
- [ ] Crear `BotellaAbiertaRepository` con queries custom
- [ ] Crear `BotellaAbiertaService` con lógica completa
- [ ] Actualizar `VentaService` para soportar tipos de venta
- [ ] Crear DTOs: `BotellaAbiertaDTO`, `VentaBottellaRequest`, etc.
- [ ] Crear `BotellaAbiertaController` con endpoints REST
- [ ] Actualizar `POSEstadisticasService` para incluir botellas
- [ ] Tests unitarios (mínimo 80% cobertura)

### Fase 3: Frontend POS (1.5-2 días)
- [ ] Crear página `/pos/botellas-abiertas`
- [ ] Crear componente `BotellaAbiertaCard`
- [ ] Actualizar `VentaRapidaForm` con selector de tipo
- [ ] Crear modal `AbrirBotellaModal`
- [ ] Crear modal `ServirCopasModal`
- [ ] Actualizar `ProductoForm` con config de botella
- [ ] Crear API client: `botellasAbiertas.api.ts`
- [ ] Crear hooks: `useBottellasAbiertas`, `useAbrirBottella`
- [ ] Actualizar POS dashboard con resumen de botellas
- [ ] Tests con Vitest + React Testing Library

### Fase 3.5: Frontend Inventario (1-1.5 días)
- [ ] Actualizar `InventarioPage` con vista de botellas abiertas
- [ ] Crear componente `InventarioConsolidadoTable` con columnas de stock dual
- [ ] Crear componente `InventarioBarraView` (botellas abiertas por ubicación)
- [ ] Crear componente `InventarioAlmacenView` (stock cerrado)
- [ ] Crear expansión de detalle por producto con botellas abiertas
- [ ] Actualizar `ConteoFisicoForm` para incluir botellas abiertas
- [ ] Crear estadísticas de botellas abiertas en dashboard
- [ ] Agregar indicador visual de "copas disponibles"
- [ ] Crear filtro por ubicación (almacén/barra principal/barra VIP)
- [ ] Tests de componentes de inventario

### Fase 4: Testing & QA (1 día)
- [ ] Test: Vender botella completa descuenta stock correcto
- [ ] Test: Vender copas actualiza botella abierta
- [ ] Test: Cerrar botella vacía automáticamente
- [ ] Test: No se pueden servir más copas que las disponibles
- [ ] Test: Precio VIP se aplica correctamente
- [ ] Test: Descuento proporcional de stock para copas
- [ ] Test: Inventario refleja botellas abiertas
- [ ] Test: Cierre de sesión con botellas abiertas
- [ ] Test end-to-end de flujo completo VIP
- [ ] Test de rendimiento con 100+ botellas abiertas

### Fase 5: Documentación (0.5 días)
- [ ] Actualizar README.md con feature de botellas
- [ ] Crear BOTELLAS_VIP_GUIDE.md con guía de usuario
- [ ] Actualizar API docs (Swagger)
- [ ] Crear ejemplos de uso en Postman
- [ ] Documentar casos edge y cómo manejarlos

---

## 🚀 Estimación de Esfuerzo

**Total: 8-12 días de desarrollo**

- Base de Datos: 1-2 días
- Backend: 2-3 días
- Frontend POS: 1.5-2 días
- Frontend Inventario: 1-1.5 días
- Testing & QA: 1 día
- Documentación: 0.5 días
- Buffer (bugs, ajustes): 1-2 días

**Desglose realista por sprint (2 semanas)**:
- Sprint 1 (Semana 1): Base de datos + Backend completo + Tests unitarios
- Sprint 2 (Semana 2): Frontend POS + Frontend Inventario + Tests E2E + Documentación

---

## 🎯 Métricas de Éxito

Después de implementar, validar:

1. **Funcional**:
   - ✅ Se pueden vender botellas completas
   - ✅ Se pueden vender copas individuales
   - ✅ Precios VIP se aplican correctamente
   - ✅ Stock se descuenta correctamente en todos los casos
   - ✅ Botellas abiertas se rastrean con precisión

2. **Performance**:
   - ✅ Venta registrada en < 500ms
   - ✅ Dashboard de botellas carga en < 1s
   - ✅ No hay race conditions en stock

3. **Negocio**:
   - ✅ Reducción de desperdicio de botellas en 30%
   - ✅ Mayor margen con venta de copas vs botellas
   - ✅ Control preciso de inventario VIP

---

## 📝 Notas Adicionales

### Consideraciones Futuras (Post-MVP)

1. **Códigos QR en Botellas**:
   - Imprimir QR en cada botella abierta
   - Escanear QR para servir copas
   - Tracking completo de trazabilidad

2. **App Móvil para Encargados VIP**:
   - Registrar ventas desde tablet en la mesa
   - Ver botellas del reservado en tiempo real
   - Solicitar más botellas al almacén

3. **Sistema de Reposición Inteligente**:
   - Alertas cuando quedan pocas botellas cerradas
   - Predicción de demanda por día de semana
   - Sugerencias de pedido a proveedores

4. **Integración con Dispensadores Automáticos**:
   - Dispensadores con medición exacta de ml
   - Sincronización automática de copas servidas
   - Eliminación de error humano

5. **Análisis de Rentabilidad por Producto**:
   - ¿Qué productos es mejor vender por copa?
   - ¿Qué botellas tienen más desperdicio?
   - ¿Cuál es el ratio ideal copa/botella por producto?

---

**Próximos Pasos:**
1. Revisar y validar este diseño con el equipo
2. Priorizar features (MVP vs futuro)
3. Crear tasks en Jira/Trello
4. Comenzar con Fase 1 (Base de Datos)

---

**Autor**: Sistema de gestión
**Fecha**: 11 Octubre 2025
**Versión**: 1.0
**Estado**: 📋 Listo para implementación
