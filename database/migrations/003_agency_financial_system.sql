-- =====================================================
-- MIGRACIÓN: Sistema Financiero Agencia-DJ
-- Versión: 003
-- Fecha: 2025-01-25
-- Descripción: Tablas para gestión financiera, disponibilidad y equipos
-- =====================================================

-- ========================================
-- 1. TABLA: agency_transactions
-- Gestión de todas las transacciones financieras entre agencia, DJs y clientes
-- ========================================
CREATE TABLE IF NOT EXISTS agency_transactions (
  id SERIAL PRIMARY KEY,

  -- Referencias
  agency_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  dj_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  evento_id INTEGER REFERENCES eventos(id) ON DELETE SET NULL,

  -- Tipo de transacción
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN (
    'pago_cliente',      -- Cliente paga por evento
    'pago_dj',           -- Pago a DJ
    'fee_agencia',       -- Fee/comisión para agencia
    'alquiler_equipo',   -- Alquiler de equipos
    'anticipo',          -- Anticipo/reserva
    'devolucion',        -- Devolución de dinero
    'ajuste'             -- Ajuste manual
  )),

  -- Montos
  monto_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  monto_agencia DECIMAL(10,2) DEFAULT 0, -- Comisión/Fee de agencia
  monto_dj DECIMAL(10,2) DEFAULT 0,      -- Pago al DJ
  monto_alquiler DECIMAL(10,2) DEFAULT 0, -- Alquiler equipos

  -- Control de estado
  estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'parcial', 'cancelado')),

  -- Dirección del pago
  pagado_por VARCHAR(50) CHECK (pagado_por IN ('cliente', 'agencia', 'dj')),
  pagado_a VARCHAR(50) CHECK (pagado_a IN ('agencia', 'dj', 'cliente')),

  -- Detalles
  descripcion TEXT,
  concepto VARCHAR(255),
  metodo_pago VARCHAR(50) CHECK (metodo_pago IN ('transferencia', 'efectivo', 'tarjeta', 'bizum', 'paypal', 'otro')),

  -- Equipos alquilados (JSON)
  equipos_alquilados JSONB DEFAULT '[]',

  -- Fechas
  fecha_transaccion TIMESTAMP DEFAULT NOW(),
  fecha_vencimiento DATE,
  fecha_pago TIMESTAMP,

  -- Auditoría
  creado_por INTEGER REFERENCES usuarios(id),
  notas_internas TEXT,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- Índices para agency_transactions
CREATE INDEX idx_agency_transactions_agency ON agency_transactions(agency_id);
CREATE INDEX idx_agency_transactions_dj ON agency_transactions(dj_id);
CREATE INDEX idx_agency_transactions_evento ON agency_transactions(evento_id);
CREATE INDEX idx_agency_transactions_tipo ON agency_transactions(tipo);
CREATE INDEX idx_agency_transactions_estado ON agency_transactions(estado);
CREATE INDEX idx_agency_transactions_fecha ON agency_transactions(fecha_transaccion);

-- Trigger para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION update_agency_transactions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_agency_transactions_timestamp
  BEFORE UPDATE ON agency_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_agency_transactions_timestamp();

-- ========================================
-- 2. TABLA: dj_availability
-- Gestión de disponibilidad de DJs en calendario
-- ========================================
CREATE TABLE IF NOT EXISTS dj_availability (
  id SERIAL PRIMARY KEY,

  -- Referencias
  dj_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

  -- Fecha y hora
  fecha DATE NOT NULL,
  hora_inicio TIME DEFAULT '00:00',
  hora_fin TIME DEFAULT '23:59',
  todo_el_dia BOOLEAN DEFAULT TRUE,

  -- Estado
  estado VARCHAR(50) DEFAULT 'disponible' CHECK (estado IN (
    'disponible',     -- Disponible para trabajar
    'reservado',      -- Reservado/ocupado con evento confirmado
    'no_disponible',  -- No disponible (vacaciones, personal, etc.)
    'tentativo'       -- Posible evento, pendiente confirmación
  )),

  -- Si está reservado/ocupado
  evento_id INTEGER REFERENCES eventos(id) ON DELETE SET NULL,
  motivo VARCHAR(255), -- 'evento', 'vacaciones', 'personal', 'otro_trabajo', 'enfermedad'

  -- Notas y detalles
  notas TEXT,
  color VARCHAR(20) DEFAULT '#10b981', -- Color para el calendario

  -- Auditoría
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP DEFAULT NOW(),

  -- Constraint: No permitir solapamientos para mismo DJ
  UNIQUE(dj_id, fecha, hora_inicio, hora_fin)
);

-- Índices para dj_availability
CREATE INDEX idx_dj_availability_dj_fecha ON dj_availability(dj_id, fecha);
CREATE INDEX idx_dj_availability_estado ON dj_availability(estado);
CREATE INDEX idx_dj_availability_evento ON dj_availability(evento_id);

-- Trigger para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION update_dj_availability_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_dj_availability_timestamp
  BEFORE UPDATE ON dj_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_dj_availability_timestamp();

-- ========================================
-- 3. TABLA: agency_equipment
-- Catálogo de equipos de la agencia disponibles para alquiler
-- ========================================
CREATE TABLE IF NOT EXISTS agency_equipment (
  id SERIAL PRIMARY KEY,

  -- Referencias
  agency_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

  -- Detalles del equipo
  tipo VARCHAR(100) NOT NULL CHECK (tipo IN (
    'altavoces',
    'subwoofer',
    'luces',
    'microfono',
    'mixer',
    'controlador',
    'cdj',
    'amplificador',
    'cables',
    'stands',
    'otros'
  )),

  marca VARCHAR(100),
  modelo VARCHAR(100),
  cantidad INTEGER DEFAULT 1 CHECK (cantidad >= 0),

  -- Precios
  precio_compra DECIMAL(10,2),
  precio_alquiler_dia DECIMAL(10,2),
  precio_alquiler_evento DECIMAL(10,2),

  -- Estado
  estado VARCHAR(50) DEFAULT 'disponible' CHECK (estado IN (
    'disponible',
    'alquilado',
    'mantenimiento',
    'averiado',
    'baja'
  )),

  -- Info adicional
  descripcion TEXT,
  especificaciones JSONB DEFAULT '{}', -- {potencia: '2000W', peso: '15kg', etc}
  foto_url VARCHAR(500),
  numero_serie VARCHAR(100),

  -- Mantenimiento
  ultima_revision DATE,
  proxima_revision DATE,

  -- Auditoría
  fecha_compra DATE,
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- Índices para agency_equipment
CREATE INDEX idx_agency_equipment_agency ON agency_equipment(agency_id);
CREATE INDEX idx_agency_equipment_tipo ON agency_equipment(tipo);
CREATE INDEX idx_agency_equipment_estado ON agency_equipment(estado);

-- Trigger para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION update_agency_equipment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_agency_equipment_timestamp
  BEFORE UPDATE ON agency_equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_agency_equipment_timestamp();

-- ========================================
-- 4. TABLA: equipment_rentals
-- Historial de alquileres de equipos
-- ========================================
CREATE TABLE IF NOT EXISTS equipment_rentals (
  id SERIAL PRIMARY KEY,

  -- Referencias
  equipment_id INTEGER NOT NULL REFERENCES agency_equipment(id) ON DELETE CASCADE,
  evento_id INTEGER REFERENCES eventos(id) ON DELETE SET NULL,
  dj_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  transaction_id INTEGER REFERENCES agency_transactions(id) ON DELETE SET NULL,

  -- Detalles del alquiler
  cantidad INTEGER DEFAULT 1,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  dias_alquiler INTEGER GENERATED ALWAYS AS (fecha_fin - fecha_inicio + 1) STORED,

  -- Precios
  precio_unitario DECIMAL(10,2),
  precio_total DECIMAL(10,2),

  -- Estado
  estado VARCHAR(50) DEFAULT 'reservado' CHECK (estado IN (
    'reservado',
    'entregado',
    'devuelto',
    'cancelado'
  )),

  -- Entregas
  fecha_entrega TIMESTAMP,
  entregado_por INTEGER REFERENCES usuarios(id),
  fecha_devolucion TIMESTAMP,
  recibido_por INTEGER REFERENCES usuarios(id),

  -- Condición
  condicion_entrega TEXT,
  condicion_devolucion TEXT,

  -- Notas
  notas TEXT,

  -- Auditoría
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- Índices para equipment_rentals
CREATE INDEX idx_equipment_rentals_equipment ON equipment_rentals(equipment_id);
CREATE INDEX idx_equipment_rentals_evento ON equipment_rentals(evento_id);
CREATE INDEX idx_equipment_rentals_dj ON equipment_rentals(dj_id);
CREATE INDEX idx_equipment_rentals_estado ON equipment_rentals(estado);

-- ========================================
-- 5. VISTA: DJ Balance
-- Calcula el balance financiero de cada DJ con la agencia
-- ========================================
CREATE OR REPLACE VIEW vw_dj_balances AS
SELECT
  d.id as dj_id,
  d.nombre as dj_nombre,

  -- Lo que la agencia debe al DJ (positivo)
  COALESCE(SUM(CASE
    WHEN t.tipo IN ('pago_cliente', 'pago_dj')
      AND t.pagado_a = 'agencia'
      AND t.estado != 'cancelado'
    THEN t.monto_dj
    ELSE 0
  END), 0) as debe_agencia_a_dj,

  -- Lo que el DJ debe a la agencia (positivo)
  COALESCE(SUM(CASE
    WHEN t.tipo IN ('fee_agencia', 'alquiler_equipo')
      AND t.pagado_por = 'dj'
      AND t.estado != 'cancelado'
    THEN t.monto_agencia + t.monto_alquiler
    WHEN t.tipo = 'pago_cliente'
      AND t.pagado_a = 'dj'
      AND t.estado != 'cancelado'
    THEN t.monto_agencia
    ELSE 0
  END), 0) as debe_dj_a_agencia,

  -- Pagos ya realizados al DJ
  COALESCE(SUM(CASE
    WHEN t.tipo = 'pago_dj'
      AND t.estado = 'pagado'
    THEN t.monto_dj
    ELSE 0
  END), 0) as pagado_a_dj,

  -- Pagos ya recibidos del DJ
  COALESCE(SUM(CASE
    WHEN t.tipo IN ('fee_agencia', 'alquiler_equipo')
      AND t.estado = 'pagado'
    THEN t.monto_total
    ELSE 0
  END), 0) as recibido_de_dj,

  -- Balance neto (positivo = agencia debe, negativo = dj debe)
  COALESCE(SUM(CASE
    WHEN t.tipo IN ('pago_cliente', 'pago_dj')
      AND t.pagado_a = 'agencia'
      AND t.estado = 'pendiente'
    THEN t.monto_dj
    WHEN t.tipo IN ('fee_agencia', 'alquiler_equipo')
      AND t.estado = 'pendiente'
    THEN -(t.monto_agencia + t.monto_alquiler)
    WHEN t.tipo = 'pago_cliente'
      AND t.pagado_a = 'dj'
      AND t.estado = 'pendiente'
    THEN -t.monto_agencia
    ELSE 0
  END), 0) as balance_neto,

  -- Totales
  COUNT(t.id) as total_transacciones,
  COUNT(CASE WHEN t.estado = 'pendiente' THEN 1 END) as transacciones_pendientes

FROM usuarios d
LEFT JOIN agency_transactions t ON d.id = t.dj_id
WHERE d.rol = 'dj'
GROUP BY d.id, d.nombre;

-- ========================================
-- 6. VISTA: Equipment Availability
-- Estado de disponibilidad de equipos
-- ========================================
CREATE OR REPLACE VIEW vw_equipment_availability AS
SELECT
  e.id,
  e.tipo,
  e.marca,
  e.modelo,
  e.cantidad as cantidad_total,
  e.estado,

  -- Cantidad actualmente alquilada
  COALESCE(SUM(CASE
    WHEN r.estado IN ('reservado', 'entregado')
      AND r.fecha_inicio <= CURRENT_DATE
      AND r.fecha_fin >= CURRENT_DATE
    THEN r.cantidad
    ELSE 0
  END), 0) as cantidad_alquilada,

  -- Cantidad disponible
  e.cantidad - COALESCE(SUM(CASE
    WHEN r.estado IN ('reservado', 'entregado')
      AND r.fecha_inicio <= CURRENT_DATE
      AND r.fecha_fin >= CURRENT_DATE
    THEN r.cantidad
    ELSE 0
  END), 0) as cantidad_disponible,

  -- Próximas reservas
  COUNT(CASE
    WHEN r.estado = 'reservado'
      AND r.fecha_inicio > CURRENT_DATE
    THEN 1
  END) as proximas_reservas

FROM agency_equipment e
LEFT JOIN equipment_rentals r ON e.id = r.equipment_id
WHERE e.activo = TRUE
GROUP BY e.id;

-- ========================================
-- COMENTARIOS EN TABLAS
-- ========================================
COMMENT ON TABLE agency_transactions IS 'Gestión de transacciones financieras entre agencia, DJs y clientes';
COMMENT ON TABLE dj_availability IS 'Calendario de disponibilidad de DJs';
COMMENT ON TABLE agency_equipment IS 'Catálogo de equipos de la agencia disponibles para alquiler';
COMMENT ON TABLE equipment_rentals IS 'Historial de alquileres de equipos';

-- ========================================
-- DATOS DE EJEMPLO (OPCIONAL - COMENTAR EN PRODUCCIÓN)
-- ========================================

-- Ejemplo: Equipo de prueba
-- INSERT INTO agency_equipment (agency_id, tipo, marca, modelo, cantidad, precio_alquiler_evento, descripcion)
-- VALUES
--   (1, 'altavoces', 'JBL', 'PRX815W', 2, 150, 'Altavoces activos 1500W'),
--   (1, 'luces', 'Chauvet', 'SlimPAR 64', 4, 80, 'Pack de luces LED RGB'),
--   (1, 'mixer', 'Pioneer', 'DJM-900NXS2', 1, 200, 'Mixer profesional 4 canales');

COMMIT;

-- ========================================
-- FIN DE MIGRACIÓN
-- ========================================
