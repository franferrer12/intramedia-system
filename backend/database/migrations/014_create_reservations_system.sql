-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Migration 014: Sistema de Reservas (Bookings/Reservations)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Descripción: Sistema completo de reservas públicas con hold temporal
-- Fecha: 2025-12-01
-- Autor: IntraMedia Development Team
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BEGIN;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Tabla: reservations
-- Reservas públicas de eventos
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,

    -- Referencias
    agency_id INTEGER NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    dj_id INTEGER REFERENCES djs(id) ON DELETE SET NULL,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
    evento_id INTEGER REFERENCES eventos(id) ON DELETE SET NULL,
    quotation_id INTEGER REFERENCES quotations(id) ON DELETE SET NULL,

    -- Número de reserva
    reservation_number VARCHAR(50) UNIQUE NOT NULL,

    -- Estado del workflow
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending',       -- Pendiente de confirmación
        'hold',          -- Reserva temporal (hold)
        'confirmed',     -- Confirmada por admin
        'approved',      -- Aprobada completamente
        'cancelled',     -- Cancelada
        'expired',       -- Expirada (hold vencido)
        'rejected'       -- Rechazada
    )),

    -- Información del evento
    event_type VARCHAR(100) NOT NULL, -- boda, corporativo, fiesta privada
    event_date DATE NOT NULL,
    event_start_time TIME,
    event_end_time TIME,
    event_duration_hours INTEGER,
    event_location VARCHAR(255),
    event_description TEXT,
    estimated_guests INTEGER,

    -- Información del cliente (form público)
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50) NOT NULL,
    client_company VARCHAR(255),

    -- Servicios solicitados
    services_requested JSONB, -- Array de servicios: dj, equipment, lights, etc.

    -- Budget
    budget_range VARCHAR(50), -- '0-1000', '1000-2000', etc.
    estimated_price DECIMAL(10, 2),

    -- Hold temporal
    hold_expires_at TIMESTAMP, -- Cuándo expira el hold
    hold_duration_minutes INTEGER DEFAULT 30,

    -- Confirmación
    confirmed_at TIMESTAMP,
    confirmed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Aprobación
    approved_at TIMESTAMP,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Cancelación/Rechazo
    cancelled_at TIMESTAMP,
    cancelled_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    cancellation_reason TEXT,
    rejected_at TIMESTAMP,
    rejected_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    rejection_reason TEXT,

    -- Notas internas
    admin_notes TEXT,
    internal_notes TEXT,

    -- Tracking de origen
    source VARCHAR(50), -- 'web_form', 'widget', 'manual', 'api'
    ip_address VARCHAR(50),
    user_agent TEXT,
    referrer VARCHAR(500),

    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT check_event_date_future CHECK (event_date >= CURRENT_DATE),
    CONSTRAINT check_hold_expires CHECK (
        (status = 'hold' AND hold_expires_at IS NOT NULL) OR
        (status != 'hold')
    )
);

-- Índices
CREATE INDEX idx_reservations_agency_id ON reservations(agency_id);
CREATE INDEX idx_reservations_dj_id ON reservations(dj_id);
CREATE INDEX idx_reservations_cliente_id ON reservations(cliente_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_event_date ON reservations(event_date);
CREATE INDEX idx_reservations_hold_expires ON reservations(hold_expires_at)
    WHERE status = 'hold' AND hold_expires_at IS NOT NULL;
CREATE INDEX idx_reservations_client_email ON reservations(client_email);
CREATE INDEX idx_reservations_created_at ON reservations(created_at DESC);
CREATE INDEX idx_reservations_number ON reservations(reservation_number);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Tabla: reservation_availability_checks
-- Historial de verificaciones de disponibilidad
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS reservation_availability_checks (
    id SERIAL PRIMARY KEY,
    reservation_id INTEGER REFERENCES reservations(id) ON DELETE CASCADE,

    -- Parámetros de la verificación
    check_date DATE NOT NULL,
    check_start_time TIME,
    check_end_time TIME,
    dj_id INTEGER REFERENCES djs(id) ON DELETE SET NULL,
    agency_id INTEGER NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

    -- Resultado
    is_available BOOLEAN NOT NULL,
    conflicts_found INTEGER DEFAULT 0,
    conflicts_data JSONB, -- Detalles de conflictos si los hay

    -- Auditoría
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checked_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX idx_availability_checks_reservation ON reservation_availability_checks(reservation_id);
CREATE INDEX idx_availability_checks_date ON reservation_availability_checks(check_date);
CREATE INDEX idx_availability_checks_dj ON reservation_availability_checks(dj_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Tabla: reservation_status_history
-- Historial de cambios de estado
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS reservation_status_history (
    id SERIAL PRIMARY KEY,
    reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,

    -- Estados
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,

    -- Usuario que realizó el cambio
    changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Notas del cambio
    notes TEXT,

    -- Metadata adicional
    metadata JSONB,

    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_reservation_status_history_reservation ON reservation_status_history(reservation_id);
CREATE INDEX idx_reservation_status_history_created ON reservation_status_history(created_at DESC);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FUNCIONES Y TRIGGERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Función: Actualizar updated_at
CREATE OR REPLACE FUNCTION update_reservations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
CREATE TRIGGER trigger_reservations_updated_at
    BEFORE UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_reservations_updated_at();

-- Función: Generar número de reserva automático
CREATE OR REPLACE FUNCTION generate_reservation_number()
RETURNS TRIGGER AS $$
DECLARE
    v_year VARCHAR(4);
    v_month VARCHAR(2);
    v_sequence INTEGER;
    v_reservation_number VARCHAR(50);
BEGIN
    -- Si ya tiene número, no hacer nada
    IF NEW.reservation_number IS NOT NULL AND NEW.reservation_number != '' THEN
        RETURN NEW;
    END IF;

    -- Obtener año y mes
    v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
    v_month := TO_CHAR(CURRENT_DATE, 'MM');

    -- Obtener el último número de secuencia del mes
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(reservation_number FROM '[0-9]+$') AS INTEGER
        )
    ), 0) + 1
    INTO v_sequence
    FROM reservations
    WHERE reservation_number LIKE 'RES-' || v_year || v_month || '%'
    AND agency_id = NEW.agency_id;

    -- Generar número: RES-YYYYMM-XXXX
    v_reservation_number := 'RES-' || v_year || v_month || '-' || LPAD(v_sequence::TEXT, 4, '0');

    NEW.reservation_number := v_reservation_number;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para generar número automático
CREATE TRIGGER trigger_generate_reservation_number
    BEFORE INSERT ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION generate_reservation_number();

-- Función: Registrar cambios de estado en historial
CREATE OR REPLACE FUNCTION log_reservation_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO reservation_status_history (reservation_id, old_status, new_status)
        VALUES (NEW.id, NULL, NEW.status);
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO reservation_status_history (reservation_id, old_status, new_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, NEW.confirmed_by);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para logging de cambios de estado
CREATE TRIGGER trigger_log_reservation_status
    AFTER INSERT OR UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION log_reservation_status_change();

-- Función: Expirar holds automáticamente
CREATE OR REPLACE FUNCTION expire_old_holds()
RETURNS INTEGER AS $$
DECLARE
    v_expired_count INTEGER;
BEGIN
    UPDATE reservations
    SET status = 'expired',
        updated_at = CURRENT_TIMESTAMP
    WHERE status = 'hold'
    AND hold_expires_at < CURRENT_TIMESTAMP;

    GET DIAGNOSTICS v_expired_count = ROW_COUNT;

    RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql;

-- Función: Crear hold temporal
CREATE OR REPLACE FUNCTION create_reservation_hold(
    p_agency_id INTEGER,
    p_event_date DATE,
    p_event_start_time TIME,
    p_event_end_time TIME,
    p_hold_duration_minutes INTEGER DEFAULT 30
)
RETURNS TABLE (
    can_hold BOOLEAN,
    conflicts_count INTEGER,
    conflicts JSONB,
    hold_expires_at TIMESTAMP
) AS $$
DECLARE
    v_conflicts INTEGER;
    v_conflicts_data JSONB;
    v_hold_expires TIMESTAMP;
BEGIN
    -- Calcular expiración del hold
    v_hold_expires := CURRENT_TIMESTAMP + (p_hold_duration_minutes || ' minutes')::INTERVAL;

    -- Verificar disponibilidad (check simple)
    SELECT COUNT(*), jsonb_agg(to_jsonb(da))
    INTO v_conflicts, v_conflicts_data
    FROM dj_availability da
    WHERE da.fecha = p_event_date
    AND da.estado IN ('reservado', 'no_disponible')
    AND (
        (da.hora_inicio <= p_event_start_time AND da.hora_fin >= p_event_start_time) OR
        (da.hora_inicio <= p_event_end_time AND da.hora_fin >= p_event_end_time) OR
        (da.hora_inicio >= p_event_start_time AND da.hora_fin <= p_event_end_time) OR
        da.todo_el_dia = true
    );

    -- Si no hay conflictos, se puede crear hold
    RETURN QUERY SELECT
        v_conflicts = 0 AS can_hold,
        v_conflicts AS conflicts_count,
        COALESCE(v_conflicts_data, '[]'::jsonb) AS conflicts,
        v_hold_expires AS hold_expires_at;
END;
$$ LANGUAGE plpgsql;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- VISTAS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Vista: Reservas con información completa
CREATE OR REPLACE VIEW reservations_complete AS
SELECT
    r.*,
    a.agency_name,
    d.nombre AS dj_nombre,
    d.email AS dj_email,
    c.nombre AS cliente_nombre,
    e.evento AS evento_nombre,
    u.email AS confirmed_by_email,
    (
        SELECT COUNT(*)
        FROM reservation_status_history rsh
        WHERE rsh.reservation_id = r.id
    ) AS status_changes_count
FROM reservations r
LEFT JOIN agencies a ON r.agency_id = a.id
LEFT JOIN djs d ON r.dj_id = d.id
LEFT JOIN clientes c ON r.cliente_id = c.id
LEFT JOIN eventos e ON r.evento_id = e.id
LEFT JOIN users u ON r.confirmed_by = u.id;

-- Vista: Estadísticas de reservas por agencia
CREATE OR REPLACE VIEW reservation_stats_by_agency AS
SELECT
    agency_id,
    COUNT(*) AS total_reservations,
    COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
    COUNT(*) FILTER (WHERE status = 'hold') AS hold_count,
    COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed_count,
    COUNT(*) FILTER (WHERE status = 'approved') AS approved_count,
    COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_count,
    COUNT(*) FILTER (WHERE status = 'expired') AS expired_count,
    COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_count,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE status IN ('confirmed', 'approved')) /
        NULLIF(COUNT(*) FILTER (WHERE status NOT IN ('expired')), 0),
        2
    ) AS conversion_rate,
    ROUND(AVG(estimated_price), 2) AS avg_estimated_price
FROM reservations
GROUP BY agency_id;

-- Vista: Reservas que requieren acción (pending o próximas a expirar)
CREATE OR REPLACE VIEW reservations_requiring_action AS
SELECT
    r.*,
    a.agency_name,
    CASE
        WHEN r.status = 'hold' THEN
            EXTRACT(EPOCH FROM (r.hold_expires_at - CURRENT_TIMESTAMP)) / 60
        ELSE NULL
    END AS minutes_until_expiration
FROM reservations r
LEFT JOIN agencies a ON r.agency_id = a.id
WHERE r.status IN ('pending', 'hold')
AND (
    r.status = 'pending'
    OR (r.status = 'hold' AND r.hold_expires_at > CURRENT_TIMESTAMP)
)
ORDER BY
    CASE
        WHEN r.status = 'hold' THEN r.hold_expires_at
        ELSE r.created_at
    END ASC;

COMMIT;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- END OF MIGRATION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Para verificar:
-- SELECT * FROM reservations_complete;
-- SELECT * FROM reservation_stats_by_agency;
-- SELECT * FROM reservations_requiring_action;
-- SELECT expire_old_holds(); -- Correr periódicamente
