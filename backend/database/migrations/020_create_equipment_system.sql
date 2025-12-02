-- Migration: 020_create_equipment_system.sql
-- Description: Equipment Management System for agency equipment inventory and rentals
-- Date: 2025-01-02
-- Tables: agency_equipment, equipment_rentals
-- Views: vw_equipment_availability
-- Functions: get_equipment_availability_by_date

BEGIN;

-- ============================================================================
-- TABLE: agency_equipment
-- Purpose: Store agency equipment inventory (speakers, lights, mixers, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS agency_equipment (
    id SERIAL PRIMARY KEY,
    agency_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    -- Equipment details
    tipo VARCHAR(100) NOT NULL, -- tipo: mixer, speaker, lights, dj_controller, etc.
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(150) NOT NULL,
    cantidad INTEGER DEFAULT 1 CHECK (cantidad > 0),

    -- Pricing
    precio_compra DECIMAL(10,2),
    precio_alquiler_dia DECIMAL(10,2),
    precio_alquiler_evento DECIMAL(10,2),

    -- Status and availability
    estado VARCHAR(50) DEFAULT 'disponible' CHECK (estado IN ('disponible', 'alquilado', 'mantenimiento', 'dañado', 'fuera_servicio')),

    -- Descriptions and details
    descripcion TEXT,
    especificaciones JSONB DEFAULT '{}', -- technical specs, features, etc.

    -- Media
    foto_url VARCHAR(500),

    -- Tracking
    numero_serie VARCHAR(100),
    fecha_compra DATE,

    -- Maintenance tracking
    ultima_revision DATE,
    proxima_revision DATE,

    -- Soft delete and timestamps
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_equipment_agency ON agency_equipment(agency_id) WHERE activo = true;
CREATE INDEX idx_equipment_tipo ON agency_equipment(tipo) WHERE activo = true;
CREATE INDEX idx_equipment_estado ON agency_equipment(estado) WHERE activo = true;
CREATE INDEX idx_equipment_tipo_marca ON agency_equipment(tipo, marca, modelo) WHERE activo = true;
CREATE INDEX idx_equipment_mantenimiento ON agency_equipment(proxima_revision) WHERE estado != 'fuera_servicio' AND activo = true;

-- ============================================================================
-- TABLE: equipment_rentals
-- Purpose: Track equipment rentals to DJs and events
-- ============================================================================
CREATE TABLE IF NOT EXISTS equipment_rentals (
    id SERIAL PRIMARY KEY,

    -- References
    equipment_id INTEGER NOT NULL REFERENCES agency_equipment(id) ON DELETE RESTRICT,
    evento_id INTEGER REFERENCES eventos(id) ON DELETE SET NULL,
    dj_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Rental details
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,

    -- Pricing
    precio_unitario DECIMAL(10,2) NOT NULL,
    precio_total DECIMAL(10,2) NOT NULL,

    -- Status tracking
    estado VARCHAR(50) DEFAULT 'reservado' CHECK (estado IN ('reservado', 'entregado', 'devuelto', 'cancelado')),

    -- Delivery tracking
    fecha_entrega TIMESTAMP WITH TIME ZONE,
    entregado_por INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Return tracking
    fecha_devolucion TIMESTAMP WITH TIME ZONE,
    recibido_por INTEGER REFERENCES users(id) ON DELETE SET NULL,
    condicion_devolucion VARCHAR(50) CHECK (condicion_devolucion IN ('excelente', 'bueno', 'regular', 'dañado', NULL)),

    -- Additional info
    notas TEXT,

    -- Timestamps
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Business rules
    CHECK (fecha_fin >= fecha_inicio),
    CHECK (precio_total >= 0)
);

-- Indexes for performance
CREATE INDEX idx_rentals_equipment ON equipment_rentals(equipment_id);
CREATE INDEX idx_rentals_evento ON equipment_rentals(evento_id);
CREATE INDEX idx_rentals_dj ON equipment_rentals(dj_id);
CREATE INDEX idx_rentals_estado ON equipment_rentals(estado);
CREATE INDEX idx_rentals_fechas ON equipment_rentals(fecha_inicio, fecha_fin) WHERE estado IN ('reservado', 'entregado');
CREATE INDEX idx_rentals_devolucion ON equipment_rentals(fecha_devolucion, condicion_devolucion) WHERE estado = 'devuelto';

-- ============================================================================
-- VIEW: vw_equipment_availability
-- Purpose: Real-time equipment availability view
-- ============================================================================
CREATE OR REPLACE VIEW vw_equipment_availability AS
SELECT
    e.id,
    e.tipo,
    e.marca,
    e.modelo,
    e.cantidad as cantidad_total,
    e.estado,

    -- Current rentals
    COALESCE((
        SELECT SUM(r.cantidad)
        FROM equipment_rentals r
        WHERE r.equipment_id = e.id
        AND r.estado IN ('reservado', 'entregado')
        AND r.fecha_inicio <= CURRENT_DATE
        AND r.fecha_fin >= CURRENT_DATE
    ), 0)::INTEGER as cantidad_alquilada,

    -- Available quantity
    (e.cantidad - COALESCE((
        SELECT SUM(r.cantidad)
        FROM equipment_rentals r
        WHERE r.equipment_id = e.id
        AND r.estado IN ('reservado', 'entregado')
        AND r.fecha_inicio <= CURRENT_DATE
        AND r.fecha_fin >= CURRENT_DATE
    ), 0))::INTEGER as cantidad_disponible,

    -- Upcoming rentals (next 30 days)
    COALESCE((
        SELECT json_agg(
            json_build_object(
                'rental_id', rental_data.id,
                'fecha_inicio', rental_data.fecha_inicio,
                'fecha_fin', rental_data.fecha_fin,
                'cantidad', rental_data.cantidad,
                'evento_id', rental_data.evento_id,
                'dj_id', rental_data.dj_id
            ) ORDER BY rental_data.fecha_inicio
        )
        FROM (
            SELECT r.id, r.fecha_inicio, r.fecha_fin, r.cantidad, r.evento_id, r.dj_id
            FROM equipment_rentals r
            WHERE r.equipment_id = e.id
            AND r.estado IN ('reservado', 'entregado')
            AND r.fecha_inicio > CURRENT_DATE
            AND r.fecha_inicio <= CURRENT_DATE + INTERVAL '30 days'
            ORDER BY r.fecha_inicio
        ) as rental_data
    ), '[]'::json) as proximas_reservas

FROM agency_equipment e
WHERE e.activo = true;

-- ============================================================================
-- FUNCTION: get_equipment_availability_by_date
-- Purpose: Check equipment availability for specific date range
-- ============================================================================
CREATE OR REPLACE FUNCTION get_equipment_availability_by_date(
    p_equipment_id INTEGER,
    p_fecha_inicio DATE,
    p_fecha_fin DATE
)
RETURNS TABLE (
    equipment_id INTEGER,
    cantidad_total INTEGER,
    cantidad_reservada BIGINT,
    cantidad_disponible INTEGER,
    disponible BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id as equipment_id,
        e.cantidad as cantidad_total,
        COALESCE(SUM(r.cantidad), 0)::BIGINT as cantidad_reservada,
        (e.cantidad - COALESCE(SUM(r.cantidad), 0))::INTEGER as cantidad_disponible,
        (e.cantidad - COALESCE(SUM(r.cantidad), 0) > 0) as disponible
    FROM agency_equipment e
    LEFT JOIN equipment_rentals r ON e.id = r.equipment_id
        AND r.estado IN ('reservado', 'entregado')
        AND (
            (r.fecha_inicio <= p_fecha_fin AND r.fecha_fin >= p_fecha_inicio)
        )
    WHERE e.id = p_equipment_id
    AND e.activo = true
    GROUP BY e.id, e.cantidad;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: get_equipment_rental_revenue
-- Purpose: Calculate equipment rental revenue for a given period
-- ============================================================================
CREATE OR REPLACE FUNCTION get_equipment_rental_revenue(
    p_agency_id INTEGER,
    p_fecha_inicio DATE,
    p_fecha_fin DATE
)
RETURNS TABLE (
    equipment_id INTEGER,
    tipo VARCHAR,
    marca VARCHAR,
    modelo VARCHAR,
    total_alquileres BIGINT,
    ingresos_totales NUMERIC,
    dias_alquilados BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id as equipment_id,
        e.tipo,
        e.marca,
        e.modelo,
        COUNT(r.id) as total_alquileres,
        COALESCE(SUM(r.precio_total), 0) as ingresos_totales,
        COALESCE(SUM(r.fecha_fin - r.fecha_inicio + 1), 0) as dias_alquilados
    FROM agency_equipment e
    LEFT JOIN equipment_rentals r ON e.id = r.equipment_id
        AND r.estado != 'cancelado'
        AND r.fecha_inicio >= p_fecha_inicio
        AND r.fecha_fin <= p_fecha_fin
    WHERE e.agency_id = p_agency_id
    AND e.activo = true
    GROUP BY e.id, e.tipo, e.marca, e.modelo
    ORDER BY ingresos_totales DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: cleanup_expired_reservations
-- Purpose: Auto-cancel reservations that were never delivered
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_reservations()
RETURNS INTEGER AS $$
DECLARE
    affected_count INTEGER;
BEGIN
    -- Cancel reservations that are past their start date and were never delivered
    UPDATE equipment_rentals
    SET
        estado = 'cancelado',
        notas = COALESCE(notas || E'\n', '') || 'Auto-cancelado: No entregado en fecha de inicio',
        fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE estado = 'reservado'
    AND fecha_inicio < CURRENT_DATE - INTERVAL '1 day'
    AND fecha_entrega IS NULL;

    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update fecha_actualizacion on equipment
CREATE OR REPLACE FUNCTION update_equipment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_equipment_updated
    BEFORE UPDATE ON agency_equipment
    FOR EACH ROW
    EXECUTE FUNCTION update_equipment_timestamp();

-- Trigger to update fecha_actualizacion on rentals
CREATE TRIGGER trg_rental_updated
    BEFORE UPDATE ON equipment_rentals
    FOR EACH ROW
    EXECUTE FUNCTION update_equipment_timestamp();

-- Trigger to validate rental quantity doesn't exceed equipment availability
CREATE OR REPLACE FUNCTION validate_rental_quantity()
RETURNS TRIGGER AS $$
DECLARE
    v_availability RECORD;
BEGIN
    -- Check availability for the rental period
    SELECT * INTO v_availability
    FROM get_equipment_availability_by_date(
        NEW.equipment_id,
        NEW.fecha_inicio,
        NEW.fecha_fin
    );

    -- If availability check returned no rows, equipment doesn't exist
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Equipment with ID % not found or inactive', NEW.equipment_id;
    END IF;

    -- Check if requested quantity is available
    IF NEW.cantidad > v_availability.cantidad_disponible THEN
        RAISE EXCEPTION 'Insufficient equipment availability. Requested: %, Available: %',
            NEW.cantidad, v_availability.cantidad_disponible;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_rental_quantity
    BEFORE INSERT OR UPDATE OF cantidad, fecha_inicio, fecha_fin ON equipment_rentals
    FOR EACH ROW
    WHEN (NEW.estado IN ('reservado', 'entregado'))
    EXECUTE FUNCTION validate_rental_quantity();

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert sample equipment types
COMMENT ON TABLE agency_equipment IS 'Equipment inventory for DJ agencies - speakers, mixers, controllers, lights, etc.';
COMMENT ON TABLE equipment_rentals IS 'Equipment rental tracking with delivery and return management';
COMMENT ON COLUMN agency_equipment.especificaciones IS 'JSONB field for technical specifications: power, weight, dimensions, etc.';
COMMENT ON COLUMN equipment_rentals.condicion_devolucion IS 'Equipment condition on return: excelente, bueno, regular, dañado';

COMMIT;
