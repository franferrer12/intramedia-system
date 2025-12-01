-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Migration 011: Sistema de Cotizaciones (Quotations)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Descripción: Sistema completo de cotizaciones/presupuestos
-- Fecha: 2025-12-01
-- Autor: IntraMedia Development Team
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BEGIN;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Tabla: quotations
-- Almacena las cotizaciones/presupuestos enviados a clientes
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS quotations (
    id SERIAL PRIMARY KEY,

    -- Referencias
    agency_id INTEGER NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
    dj_id INTEGER REFERENCES djs(id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Información básica
    quotation_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Información del evento
    event_date DATE,
    event_location VARCHAR(255),
    event_duration_hours INTEGER,
    event_type VARCHAR(100), -- boda, corporativo, fiesta privada, etc.

    -- Estado y workflow
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN (
        'draft',        -- Borrador
        'sent',         -- Enviada al cliente
        'viewed',       -- Vista por el cliente
        'accepted',     -- Aceptada por el cliente
        'rejected',     -- Rechazada
        'expired',      -- Expirada
        'converted'     -- Convertida a factura/evento
    )),

    -- Montos
    subtotal DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
    discount_type VARCHAR(20) DEFAULT 'none' CHECK (discount_type IN ('none', 'percentage', 'fixed')),
    discount_value DECIMAL(10, 2) DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    tax_percentage DECIMAL(5, 2) DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    total DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,

    -- Validez
    valid_until DATE,

    -- Información de contacto
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),

    -- Notas y términos
    notes TEXT,
    terms_and_conditions TEXT,
    payment_terms TEXT,

    -- Tracking
    sent_at TIMESTAMP,
    viewed_at TIMESTAMP,
    accepted_at TIMESTAMP,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    converted_to_evento_id INTEGER REFERENCES eventos(id) ON DELETE SET NULL,
    converted_at TIMESTAMP,

    -- Attachments
    pdf_path VARCHAR(500),

    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Índices
    CONSTRAINT quotation_dates_check CHECK (
        event_date IS NULL OR
        valid_until IS NULL OR
        event_date >= CURRENT_DATE
    )
);

-- Índices para búsqueda y performance
CREATE INDEX idx_quotations_agency_id ON quotations(agency_id);
CREATE INDEX idx_quotations_cliente_id ON quotations(cliente_id);
CREATE INDEX idx_quotations_dj_id ON quotations(dj_id);
CREATE INDEX idx_quotations_status ON quotations(status);
CREATE INDEX idx_quotations_quotation_number ON quotations(quotation_number);
CREATE INDEX idx_quotations_event_date ON quotations(event_date);
CREATE INDEX idx_quotations_valid_until ON quotations(valid_until);
CREATE INDEX idx_quotations_created_at ON quotations(created_at);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Tabla: quotation_items
-- Items/líneas de cada cotización
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS quotation_items (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,

    -- Información del item
    item_order INTEGER NOT NULL DEFAULT 1,
    item_type VARCHAR(50) DEFAULT 'service' CHECK (item_type IN ('service', 'equipment', 'extra', 'discount', 'custom')),

    -- Descripción
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Cantidad y precio
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,

    -- Metadatos
    metadata JSONB, -- Para información adicional específica

    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_quotation_items_quotation_id ON quotation_items(quotation_id);
CREATE INDEX idx_quotation_items_order ON quotation_items(quotation_id, item_order);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Tabla: quotation_templates
-- Templates predefinidos para cotizaciones rápidas
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS quotation_templates (
    id SERIAL PRIMARY KEY,
    agency_id INTEGER NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

    -- Información del template
    name VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(100),

    -- Template data (JSON con items y configuración)
    template_data JSONB NOT NULL,

    -- Usage stats
    usage_count INTEGER DEFAULT 0,

    -- Estado
    is_active BOOLEAN DEFAULT true,

    -- Auditoría
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_quotation_templates_agency_id ON quotation_templates(agency_id);
CREATE INDEX idx_quotation_templates_event_type ON quotation_templates(event_type);
CREATE INDEX idx_quotation_templates_active ON quotation_templates(is_active);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Tabla: quotation_history
-- Historial de cambios en cotizaciones
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS quotation_history (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,

    -- Acción realizada
    action VARCHAR(50) NOT NULL CHECK (action IN (
        'created', 'updated', 'sent', 'viewed', 'accepted',
        'rejected', 'expired', 'converted', 'deleted'
    )),

    -- Usuario que realizó la acción
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Datos previos y nuevos
    old_data JSONB,
    new_data JSONB,

    -- Metadata adicional
    notes TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,

    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_quotation_history_quotation_id ON quotation_history(quotation_id);
CREATE INDEX idx_quotation_history_action ON quotation_history(action);
CREATE INDEX idx_quotation_history_created_at ON quotation_history(created_at);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FUNCIONES Y TRIGGERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Función: Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_quotations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER trigger_quotations_updated_at
    BEFORE UPDATE ON quotations
    FOR EACH ROW
    EXECUTE FUNCTION update_quotations_updated_at();

CREATE TRIGGER trigger_quotation_items_updated_at
    BEFORE UPDATE ON quotation_items
    FOR EACH ROW
    EXECUTE FUNCTION update_quotations_updated_at();

CREATE TRIGGER trigger_quotation_templates_updated_at
    BEFORE UPDATE ON quotation_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_quotations_updated_at();

-- Función: Recalcular totales de cotización
CREATE OR REPLACE FUNCTION recalculate_quotation_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_quotation_id INTEGER;
    v_subtotal DECIMAL(10, 2);
    v_discount_amount DECIMAL(10, 2);
    v_tax_amount DECIMAL(10, 2);
    v_total DECIMAL(10, 2);
    v_discount_type VARCHAR(20);
    v_discount_value DECIMAL(10, 2);
    v_tax_percentage DECIMAL(5, 2);
BEGIN
    -- Obtener el quotation_id según la operación
    IF TG_OP = 'DELETE' THEN
        v_quotation_id := OLD.quotation_id;
    ELSE
        v_quotation_id := NEW.quotation_id;
    END IF;

    -- Calcular subtotal de items
    SELECT COALESCE(SUM(total_price), 0)
    INTO v_subtotal
    FROM quotation_items
    WHERE quotation_id = v_quotation_id;

    -- Obtener configuración de descuento e impuestos
    SELECT discount_type, discount_value, tax_percentage
    INTO v_discount_type, v_discount_value, v_tax_percentage
    FROM quotations
    WHERE id = v_quotation_id;

    -- Calcular descuento
    IF v_discount_type = 'percentage' THEN
        v_discount_amount := v_subtotal * (v_discount_value / 100);
    ELSIF v_discount_type = 'fixed' THEN
        v_discount_amount := v_discount_value;
    ELSE
        v_discount_amount := 0;
    END IF;

    -- Calcular impuesto
    v_tax_amount := (v_subtotal - v_discount_amount) * (v_tax_percentage / 100);

    -- Calcular total
    v_total := v_subtotal - v_discount_amount + v_tax_amount;

    -- Actualizar quotation
    UPDATE quotations
    SET
        subtotal = v_subtotal,
        discount_amount = v_discount_amount,
        tax_amount = v_tax_amount,
        total = v_total
    WHERE id = v_quotation_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers para recalcular totales cuando cambian los items
CREATE TRIGGER trigger_recalculate_quotation_on_item_insert
    AFTER INSERT ON quotation_items
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_quotation_totals();

CREATE TRIGGER trigger_recalculate_quotation_on_item_update
    AFTER UPDATE ON quotation_items
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_quotation_totals();

CREATE TRIGGER trigger_recalculate_quotation_on_item_delete
    AFTER DELETE ON quotation_items
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_quotation_totals();

-- Función: Generar número de cotización automático
CREATE OR REPLACE FUNCTION generate_quotation_number()
RETURNS TRIGGER AS $$
DECLARE
    v_year VARCHAR(4);
    v_month VARCHAR(2);
    v_sequence INTEGER;
    v_quotation_number VARCHAR(50);
BEGIN
    -- Si ya tiene número, no hacer nada
    IF NEW.quotation_number IS NOT NULL AND NEW.quotation_number != '' THEN
        RETURN NEW;
    END IF;

    -- Obtener año y mes
    v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
    v_month := TO_CHAR(CURRENT_DATE, 'MM');

    -- Obtener el último número de secuencia del mes
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(quotation_number FROM '[0-9]+$') AS INTEGER
        )
    ), 0) + 1
    INTO v_sequence
    FROM quotations
    WHERE quotation_number LIKE 'COT-' || v_year || v_month || '%'
    AND agency_id = NEW.agency_id;

    -- Generar número: COT-YYYYMM-XXXX
    v_quotation_number := 'COT-' || v_year || v_month || '-' || LPAD(v_sequence::TEXT, 4, '0');

    NEW.quotation_number := v_quotation_number;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para generar número automático
CREATE TRIGGER trigger_generate_quotation_number
    BEFORE INSERT ON quotations
    FOR EACH ROW
    EXECUTE FUNCTION generate_quotation_number();

-- Función: Registrar cambios en historial
CREATE OR REPLACE FUNCTION log_quotation_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO quotation_history (quotation_id, action, new_data)
        VALUES (NEW.id, 'created', to_jsonb(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        -- Detectar acción específica basada en cambios
        IF OLD.status != NEW.status THEN
            INSERT INTO quotation_history (quotation_id, action, old_data, new_data)
            VALUES (NEW.id, NEW.status,
                    jsonb_build_object('status', OLD.status),
                    jsonb_build_object('status', NEW.status));
        ELSE
            INSERT INTO quotation_history (quotation_id, action, old_data, new_data)
            VALUES (NEW.id, 'updated', to_jsonb(OLD), to_jsonb(NEW));
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO quotation_history (quotation_id, action, old_data)
        VALUES (OLD.id, 'deleted', to_jsonb(OLD));
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para logging
CREATE TRIGGER trigger_log_quotation_changes
    AFTER INSERT OR UPDATE OR DELETE ON quotations
    FOR EACH ROW
    EXECUTE FUNCTION log_quotation_change();

-- Función: Expirar cotizaciones automáticamente
CREATE OR REPLACE FUNCTION expire_old_quotations()
RETURNS INTEGER AS $$
DECLARE
    v_expired_count INTEGER;
BEGIN
    UPDATE quotations
    SET status = 'expired'
    WHERE status IN ('draft', 'sent', 'viewed')
    AND valid_until < CURRENT_DATE;

    GET DIAGNOSTICS v_expired_count = ROW_COUNT;

    RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- VISTAS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Vista: Cotizaciones con información completa
CREATE OR REPLACE VIEW quotations_complete AS
SELECT
    q.*,
    a.agency_name,
    c.nombre AS cliente_nombre,
    c.email AS cliente_email,
    c.telefono AS cliente_telefono,
    d.nombre AS dj_nombre,
    u.email AS created_by_email,
    COUNT(qi.id) AS items_count,
    (
        SELECT COUNT(*)
        FROM quotation_history qh
        WHERE qh.quotation_id = q.id
    ) AS history_count
FROM quotations q
LEFT JOIN agencies a ON q.agency_id = a.id
LEFT JOIN clientes c ON q.cliente_id = c.id
LEFT JOIN djs d ON q.dj_id = d.id
LEFT JOIN users u ON q.created_by = u.id
LEFT JOIN quotation_items qi ON q.id = qi.quotation_id
GROUP BY q.id, a.agency_name, c.nombre, c.email, c.telefono,
         d.nombre, u.email;

-- Vista: Estadísticas de cotizaciones por agencia
CREATE OR REPLACE VIEW quotation_stats_by_agency AS
SELECT
    agency_id,
    COUNT(*) AS total_quotations,
    COUNT(*) FILTER (WHERE status = 'draft') AS draft_count,
    COUNT(*) FILTER (WHERE status = 'sent') AS sent_count,
    COUNT(*) FILTER (WHERE status = 'accepted') AS accepted_count,
    COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_count,
    COUNT(*) FILTER (WHERE status = 'expired') AS expired_count,
    COUNT(*) FILTER (WHERE status = 'converted') AS converted_count,
    ROUND(AVG(total), 2) AS avg_quotation_amount,
    SUM(total) FILTER (WHERE status = 'accepted') AS accepted_total,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE status = 'accepted') /
        NULLIF(COUNT(*) FILTER (WHERE status IN ('accepted', 'rejected')), 0),
        2
    ) AS acceptance_rate
FROM quotations
GROUP BY agency_id;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- DATOS INICIALES (OPCIONAL)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Template básico de cotización para eventos
INSERT INTO quotation_templates (agency_id, name, description, event_type, template_data, created_by)
SELECT
    id,
    'Boda Estándar',
    'Template básico para eventos de boda',
    'boda',
    '{
        "items": [
            {"name": "DJ Profesional", "description": "DJ con experiencia en bodas", "quantity": 1, "unit_price": 800, "item_type": "service"},
            {"name": "Equipo de Sonido", "description": "Sistema profesional de audio", "quantity": 1, "unit_price": 300, "item_type": "equipment"},
            {"name": "Iluminación Básica", "description": "Luces LED y efectos", "quantity": 1, "unit_price": 200, "item_type": "equipment"}
        ],
        "discount_type": "none",
        "discount_value": 0,
        "tax_percentage": 0,
        "terms_and_conditions": "Pago: 50% al reservar, 50% el día del evento. Cancelación con 30 días de anticipación sin penalización.",
        "payment_terms": "Depósito no reembolsable de 50% para confirmar la fecha."
    }'::jsonb,
    NULL
FROM agencies
WHERE NOT EXISTS (
    SELECT 1 FROM quotation_templates WHERE name = 'Boda Estándar'
)
LIMIT 1;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PERMISOS (Ajustar según sea necesario)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Grants básicos (ajustar según tu esquema de usuarios)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON quotations TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON quotation_items TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON quotation_templates TO app_user;
-- GRANT SELECT ON quotation_history TO app_user;

COMMIT;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- END OF MIGRATION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Para verificar la instalación:
-- SELECT * FROM quotations_complete;
-- SELECT * FROM quotation_stats_by_agency;
-- SELECT expire_old_quotations(); -- Correr periódicamente en un cron job
