# 💰 Sistema Financiero Agencia-DJ

## Estructura de Datos

### 1. Transacciones
```sql
CREATE TABLE agency_transactions (
  id SERIAL PRIMARY KEY,
  agency_id INTEGER REFERENCES usuarios(id),
  dj_id INTEGER REFERENCES usuarios(id),
  evento_id INTEGER REFERENCES eventos(id),

  -- Tipo de transacción
  tipo VARCHAR(50) NOT NULL, -- 'pago_cliente', 'pago_dj', 'fee_agencia', 'alquiler_equipo', 'anticipo'

  -- Montos
  monto_total DECIMAL(10,2),
  monto_agencia DECIMAL(10,2), -- Comisión/Fee de agencia
  monto_dj DECIMAL(10,2), -- Pago al DJ
  monto_alquiler DECIMAL(10,2), -- Alquiler equipos

  -- Control de estado
  estado VARCHAR(50) DEFAULT 'pendiente', -- 'pendiente', 'pagado', 'parcial'
  pagado_por VARCHAR(50), -- 'cliente', 'agencia', 'dj'
  pagado_a VARCHAR(50), -- 'agencia', 'dj'

  -- Detalles
  descripcion TEXT,
  concepto VARCHAR(255),
  metodo_pago VARCHAR(50), -- 'transferencia', 'efectivo', 'tarjeta', 'bizum'

  -- Equipos alquilados
  equipos_alquilados JSONB, -- [{tipo: 'altavoces', modelo: 'JBL PRX', cantidad: 2, precio: 150}]

  -- Fechas
  fecha_transaccion TIMESTAMP DEFAULT NOW(),
  fecha_vencimiento DATE,
  fecha_pago TIMESTAMP,

  -- Auditoría
  creado_por INTEGER REFERENCES usuarios(id),
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP DEFAULT NOW()
);
```

### 2. Disponibilidad DJ
```sql
CREATE TABLE dj_availability (
  id SERIAL PRIMARY KEY,
  dj_id INTEGER REFERENCES usuarios(id) NOT NULL,

  -- Fecha/Hora
  fecha DATE NOT NULL,
  hora_inicio TIME,
  hora_fin TIME,

  -- Estado
  estado VARCHAR(50) DEFAULT 'disponible', -- 'disponible', 'reservado', 'no_disponible', 'ocupado'

  -- Si está reservado
  evento_id INTEGER REFERENCES eventos(id),
  motivo VARCHAR(255), -- 'evento', 'vacaciones', 'personal', 'otro_trabajo'

  -- Notas
  notas TEXT,

  -- Auditoría
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP DEFAULT NOW(),

  UNIQUE(dj_id, fecha, hora_inicio)
);

-- Índices
CREATE INDEX idx_dj_availability_fecha ON dj_availability(dj_id, fecha);
CREATE INDEX idx_dj_availability_estado ON dj_availability(dj_id, estado);
```

### 3. Equipos de la Agencia
```sql
CREATE TABLE agency_equipment (
  id SERIAL PRIMARY KEY,
  agency_id INTEGER REFERENCES usuarios(id),

  -- Detalles del equipo
  tipo VARCHAR(100) NOT NULL, -- 'altavoces', 'luces', 'microfono', 'mixer', 'controlador'
  marca VARCHAR(100),
  modelo VARCHAR(100),
  cantidad INTEGER DEFAULT 1,

  -- Precios
  precio_compra DECIMAL(10,2),
  precio_alquiler_dia DECIMAL(10,2),
  precio_alquiler_evento DECIMAL(10,2),

  -- Estado
  estado VARCHAR(50) DEFAULT 'disponible', -- 'disponible', 'alquilado', 'mantenimiento', 'averiado'

  -- Info adicional
  descripcion TEXT,
  foto_url VARCHAR(500),
  numero_serie VARCHAR(100),

  -- Auditoría
  fecha_compra DATE,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP DEFAULT NOW()
);
```

## Flujos de Trabajo

### Flujo 1: Cliente paga a Agencia
```
1. Cliente paga €500 a Agencia por evento
   → Transacción: tipo='pago_cliente', monto_total=500, pagado_a='agencia'

2. Agencia debe pagar €350 al DJ (70%)
   → Balance: Agencia debe €350 al DJ

3. Agencia se queda €150 (30% comisión)
   → Balance: Fee agencia = €150
```

### Flujo 2: DJ cobra directo + Alquiler equipos
```
1. DJ cobra €400 directo del cliente
   → Transacción: tipo='pago_cliente', monto_total=400, pagado_a='dj'

2. DJ debe €60 fee a agencia (15%)
   → Balance: DJ debe €60 a Agencia

3. DJ alquiló altavoces de agencia por €80
   → Balance: DJ debe €140 a Agencia (€60 + €80)
```

### Flujo 3: Anticipo/Reserva
```
1. Cliente paga anticipo de €200 para reservar fecha
   → Transacción: tipo='anticipo', monto_total=200, estado='pagado'

2. Fecha del evento: paga resto €300
   → Transacción: tipo='pago_cliente', monto_total=300
   → Total evento = €500
```

## Dashboard Financiero

### Métricas Principales
```javascript
{
  // Agencia → DJs (lo que debemos)
  "deuda_a_djs": {
    "total": 3500,
    "pendientes": [
      { dj: "Juan DJ", monto: 1200, eventos: 3 },
      { dj: "María DJ", monto: 2300, eventos: 5 }
    ]
  },

  // DJs → Agencia (lo que nos deben)
  "deuda_de_djs": {
    "total": 890,
    "pendientes": [
      { dj: "Pedro DJ", concepto: "Fees", monto: 450 },
      { dj: "Pedro DJ", concepto: "Alquiler", monto: 120 },
      { dj: "Ana DJ", concepto: "Fees", monto: 320 }
    ]
  },

  // Equipos alquilados
  "ingresos_equipos": {
    "total_mes": 1200,
    "por_equipo": [
      { tipo: "Altavoces JBL", veces: 8, total: 800 },
      { tipo: "Luces LED", veces: 5, total: 400 }
    ]
  },

  // Balance neto
  "balance_neto": -2610 // Negativo = debemos más de lo que nos deben
}
```

## Componentes Frontend

### 1. DJAvailabilityCalendar.jsx
- Calendario mensual interactivo
- Click para marcar disponible/no disponible
- Vista de eventos reservados
- Colores: Verde=disponible, Rojo=ocupado, Amarillo=reservado

### 2. FinancialDashboard.jsx
- Resumen de balances
- Gráficos de ingresos/egresos
- Lista de pagos pendientes
- Alertas de pagos vencidos

### 3. TransactionManager.jsx
- Crear nuevas transacciones
- Marcar como pagado
- Historial completo
- Filtros por DJ, tipo, estado

### 4. EquipmentManager.jsx
- Catálogo de equipos
- Estado y disponibilidad
- Registro de alquileres
- Cálculo automático de tarifas

## Próximos Pasos

1. ✅ Migrar tablas SQL
2. ✅ Crear modelos backend
3. ✅ API endpoints
4. ✅ Componentes frontend
5. ✅ Integrar con módulo existente

## Ejemplo de Uso

```javascript
// Registrar pago de cliente a agencia
await registerTransaction({
  tipo: 'pago_cliente',
  evento_id: 123,
  monto_total: 500,
  monto_agencia: 150, // 30% fee
  monto_dj: 350, // 70% para DJ
  pagado_a: 'agencia',
  metodo_pago: 'transferencia'
});

// Marcar pago a DJ como realizado
await markAsPaid(transaction_id, {
  fecha_pago: new Date(),
  metodo_pago: 'transferencia'
});

// Obtener balance de un DJ
const balance = await getDJBalance(dj_id);
// {
//   debe_agencia: 1200, // Agencia le debe
//   debe_dj: 320, // DJ nos debe
//   neto: 880 // Diferencia (positivo = le debemos, negativo = nos debe)
// }
```
