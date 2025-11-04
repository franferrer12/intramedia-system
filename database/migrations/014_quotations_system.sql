-- Migration: Quotations System
-- Description: Sistema completo de cotizaciones con estados y conversión a eventos
-- Version: 014
-- Date: 2025-10-28

-- ==================== QUOTATIONS TABLE ====================
CREATE TABLE IF NOT EXISTS cotizaciones (
    id SERIAL PRIMARY KEY,
    numero_cotizacion VARCHAR(50) UNIQUE NOT NULL,
    lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
    request_id INTEGER REFERENCES requests(id) ON DELETE SET NULL,

    -- Información del cliente
    cliente_nombre VARCHAR(100) NOT NULL,
    cliente_email VARCHAR(100),
    cliente_telefono VARCHAR(20),
    cliente_empresa VARCHAR(100),

    -- Información del evento
    tipo_evento VARCHAR(100) NOT NULL,
    fecha_evento DATE NOT NULL,
    hora_inicio TIME,
    hora_fin TIME,
    ubicacion TEXT,
    num_invitados INTEGER,

    -- Información financiera
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    descuento_porcentaje DECIMAL(5, 2) DEFAULT 0.00,
    descuento_monto DECIMAL(10, 2) DEFAULT 0.00,
    iva_porcentaje DECIMAL(5, 2) DEFAULT 21.00,
    iva_monto DECIMAL(10, 2) DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

    -- Estados
    estado VARCHAR(20) NOT NULL DEFAULT 'borrador',
    -- borrador, enviada, aceptada, rechazada, expirada, convertida

    -- Fechas
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE NOT NULL,
    fecha_aceptacion TIMESTAMP,
    fecha_rechazo TIMESTAMP,

    -- Referencias
    evento_id INTEGER REFERENCES eventos(id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES djs(id),

    -- Observaciones
    observaciones TEXT,
    terminos_condiciones TEXT,
    motivo_rechazo TEXT,

    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    CONSTRAINT chk_estado CHECK (estado IN ('borrador', 'enviada', 'aceptada', 'rechazada', 'expirada', 'convertida'))
);

-- ==================== QUOTATION ITEMS TABLE ====================
CREATE TABLE IF NOT EXISTS cotizacion_items (
    id SERIAL PRIMARY KEY,
    cotizacion_id INTEGER REFERENCES cotizaciones(id) ON DELETE CASCADE,

    concepto VARCHAR(200) NOT NULL,
    descripcion TEXT,
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,

    orden INTEGER DEFAULT 0, -- Para ordenar los items

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_cantidad CHECK (cantidad > 0),
    CONSTRAINT chk_precio CHECK (precio_unitario >= 0)
);

-- ==================== INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_cotizaciones_estado ON cotizaciones(estado);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_lead ON cotizaciones(lead_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_request ON cotizaciones(request_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_evento ON cotizaciones(evento_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_fecha_evento ON cotizaciones(fecha_evento);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_fecha_vencimiento ON cotizaciones(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_numero ON cotizaciones(numero_cotizacion);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_deleted ON cotizaciones(deleted_at);
CREATE INDEX IF NOT EXISTS idx_cotizacion_items_cotizacion ON cotizacion_items(cotizacion_id);

-- ==================== FUNCTIONS ====================

-- Función para generar número de cotización automático
CREATE OR REPLACE FUNCTION generate_quotation_number()
RETURNS VARCHAR AS $$
DECLARE
    year_prefix VARCHAR(4);
    next_number INTEGER;
    new_number VARCHAR(50);
BEGIN
    year_prefix := TO_CHAR(CURRENT_DATE, 'YYYY');

    -- Obtener el último número del año actual
    SELECT COALESCE(
        MAX(
            CAST(
                SUBSTRING(numero_cotizacion FROM '\d+$') AS INTEGER
            )
        ), 0
    ) + 1
    INTO next_number
    FROM cotizaciones
    WHERE numero_cotizacion LIKE 'COT-' || year_prefix || '%';

    new_number := 'COT-' || year_prefix || '-' || LPAD(next_number::TEXT, 4, '0');

    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular totales de cotización
CREATE OR REPLACE FUNCTION calculate_quotation_totals(cotizacion_id_param INTEGER)
RETURNS VOID AS $$
DECLARE
    items_subtotal DECIMAL(10, 2);
    discount_amount DECIMAL(10, 2);
    iva_amount DECIMAL(10, 2);
    total_amount DECIMAL(10, 2);
    discount_percent DECIMAL(5, 2);
    iva_percent DECIMAL(5, 2);
BEGIN
    -- Calcular subtotal de items
    SELECT COALESCE(SUM(subtotal), 0.00)
    INTO items_subtotal
    FROM cotizacion_items
    WHERE cotizacion_id = cotizacion_id_param;

    -- Obtener porcentajes de descuento e IVA
    SELECT descuento_porcentaje, iva_porcentaje
    INTO discount_percent, iva_percent
    FROM cotizaciones
    WHERE id = cotizacion_id_param;

    -- Calcular descuento
    discount_amount := ROUND(items_subtotal * (discount_percent / 100), 2);

    -- Calcular IVA sobre (subtotal - descuento)
    iva_amount := ROUND((items_subtotal - discount_amount) * (iva_percent / 100), 2);

    -- Calcular total
    total_amount := items_subtotal - discount_amount + iva_amount;

    -- Actualizar cotización
    UPDATE cotizaciones
    SET
        subtotal = items_subtotal,
        descuento_monto = discount_amount,
        iva_monto = iva_amount,
        total = total_amount,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = cotizacion_id_param;
END;
$$ LANGUAGE plpgsql;

-- Trigger para recalcular totales cuando cambian los items
CREATE OR REPLACE FUNCTION trigger_recalculate_quotation_totals()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM calculate_quotation_totals(OLD.cotizacion_id);
        RETURN OLD;
    ELSE
        PERFORM calculate_quotation_totals(NEW.cotizacion_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cotizacion_items_totals ON cotizacion_items;
CREATE TRIGGER trg_cotizacion_items_totals
    AFTER INSERT OR UPDATE OR DELETE ON cotizacion_items
    FOR EACH ROW
    EXECUTE FUNCTION trigger_recalculate_quotation_totals();

-- Función para convertir cotización a evento
CREATE OR REPLACE FUNCTION convert_quotation_to_event(cotizacion_id_param INTEGER)
RETURNS INTEGER AS $$
DECLARE
    new_event_id INTEGER;
    cotizacion_record RECORD;
BEGIN
    -- Obtener datos de la cotización
    SELECT * INTO cotizacion_record
    FROM cotizaciones
    WHERE id = cotizacion_id_param
      AND estado = 'aceptada'
      AND deleted_at IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cotización no encontrada o no está en estado aceptada';
    END IF;

    IF cotizacion_record.evento_id IS NOT NULL THEN
        RAISE EXCEPTION 'Esta cotización ya fue convertida a evento';
    END IF;

    -- Crear evento (usando las columnas reales de la tabla eventos)
    INSERT INTO eventos (
        categoria_id,
        evento,
        fecha,
        hora_inicio,
        hora_fin,
        ciudad_lugar,
        cache_total,
        observaciones,
        created_at
    ) VALUES (
        1, -- Default categoria_id
        cotizacion_record.tipo_evento,
        cotizacion_record.fecha_evento,
        cotizacion_record.hora_inicio,
        cotizacion_record.hora_fin,
        cotizacion_record.ubicacion,
        cotizacion_record.total,
        'Convertido desde cotización ' || cotizacion_record.numero_cotizacion || '. Cliente: ' || cotizacion_record.cliente_nombre,
        CURRENT_TIMESTAMP
    )
    RETURNING id INTO new_event_id;

    -- Actualizar cotización
    UPDATE cotizaciones
    SET
        evento_id = new_event_id,
        estado = 'convertida',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = cotizacion_id_param;

    RETURN new_event_id;
END;
$$ LANGUAGE plpgsql;

-- Función para marcar cotizaciones expiradas
CREATE OR REPLACE FUNCTION mark_expired_quotations()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE cotizaciones
    SET
        estado = 'expirada',
        updated_at = CURRENT_TIMESTAMP
    WHERE estado IN ('borrador', 'enviada')
      AND fecha_vencimiento < CURRENT_DATE
      AND deleted_at IS NULL;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ==================== VIEWS ====================

-- Vista de cotizaciones con items
CREATE OR REPLACE VIEW vw_cotizaciones_completas AS
SELECT
    c.id,
    c.numero_cotizacion,
    c.cliente_nombre,
    c.cliente_email,
    c.tipo_evento,
    c.fecha_evento,
    c.estado,
    c.total,
    c.fecha_emision,
    c.fecha_vencimiento,
    COUNT(ci.id) as num_items,
    CASE
        WHEN c.fecha_vencimiento < CURRENT_DATE AND c.estado IN ('borrador', 'enviada')
        THEN true
        ELSE false
    END as esta_vencida,
    l.nombre as lead_nombre,
    r.title as request_title,
    e.evento as evento_nombre,
    d.nombre as created_by_nombre
FROM cotizaciones c
LEFT JOIN cotizacion_items ci ON c.id = ci.cotizacion_id
LEFT JOIN leads l ON c.lead_id = l.id
LEFT JOIN requests r ON c.request_id = r.id
LEFT JOIN eventos e ON c.evento_id = e.id
LEFT JOIN djs d ON c.created_by = d.id
WHERE c.deleted_at IS NULL
GROUP BY c.id, l.nombre, r.title, e.evento, d.nombre;

-- Vista de estadísticas de cotizaciones
CREATE OR REPLACE VIEW vw_cotizaciones_stats AS
SELECT
    COUNT(*) FILTER (WHERE estado = 'borrador') as borradores,
    COUNT(*) FILTER (WHERE estado = 'enviada') as enviadas,
    COUNT(*) FILTER (WHERE estado = 'aceptada') as aceptadas,
    COUNT(*) FILTER (WHERE estado = 'rechazada') as rechazadas,
    COUNT(*) FILTER (WHERE estado = 'expirada') as expiradas,
    COUNT(*) FILTER (WHERE estado = 'convertida') as convertidas,
    COALESCE(SUM(total) FILTER (WHERE estado = 'aceptada'), 0) as valor_aceptadas,
    COALESCE(SUM(total) FILTER (WHERE estado = 'enviada'), 0) as valor_pendientes,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE estado = 'aceptada') /
        NULLIF(COUNT(*) FILTER (WHERE estado IN ('aceptada', 'rechazada')), 0),
        2
    ) as tasa_conversion
FROM cotizaciones
WHERE deleted_at IS NULL;

-- Comments
COMMENT ON TABLE cotizaciones IS 'Cotizaciones para eventos potenciales';
COMMENT ON TABLE cotizacion_items IS 'Ítems/líneas de cada cotización';
COMMENT ON FUNCTION generate_quotation_number IS 'Genera número de cotización automático en formato COT-YYYY-0001';
COMMENT ON FUNCTION calculate_quotation_totals IS 'Calcula y actualiza los totales de una cotización';
COMMENT ON FUNCTION convert_quotation_to_event IS 'Convierte una cotización aceptada en un evento';
COMMENT ON FUNCTION mark_expired_quotations IS 'Marca como expiradas las cotizaciones vencidas';

-- Update statistics
ANALYZE cotizaciones;
ANALYZE cotizacion_items;
