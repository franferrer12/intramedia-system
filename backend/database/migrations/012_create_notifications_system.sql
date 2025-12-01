-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Migration 012: Sistema de Notificaciones
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Descripción: Sistema completo de notificaciones in-app y email
-- Fecha: 2025-12-01
-- Autor: IntraMedia Development Team
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BEGIN;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Tabla: notifications
-- Notificaciones in-app para usuarios
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,

    -- Destinatario
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agency_id INTEGER REFERENCES agencies(id) ON DELETE CASCADE,

    -- Tipo y prioridad
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'info',         -- Información general
        'success',      -- Operación exitosa
        'warning',      -- Advertencia
        'error',        -- Error
        'evento',       -- Relacionado con eventos
        'payment',      -- Relacionado con pagos
        'quotation',    -- Cotizaciones
        'contract',     -- Contratos
        'lead',         -- Leads
        'system'        -- Sistema
    )),

    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

    -- Contenido
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,

    -- Datos adicionales (JSON)
    data JSONB,

    -- Links y acciones
    action_url VARCHAR(500),
    action_text VARCHAR(100),

    -- Referencias a entidades
    related_entity_type VARCHAR(50), -- 'evento', 'quotation', 'contract', etc.
    related_entity_id INTEGER,

    -- Estado de lectura
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,

    -- Expiración
    expires_at TIMESTAMP,

    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_agency_id ON notifications(agency_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Tabla: notification_preferences
-- Preferencias de notificaciones por usuario
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- Canales habilitados
    in_app_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,

    -- Preferencias por tipo de notificación
    preferences JSONB DEFAULT '{
        "info": {"in_app": true, "email": false, "sms": false},
        "success": {"in_app": true, "email": false, "sms": false},
        "warning": {"in_app": true, "email": true, "sms": false},
        "error": {"in_app": true, "email": true, "sms": false},
        "evento": {"in_app": true, "email": true, "sms": false},
        "payment": {"in_app": true, "email": true, "sms": false},
        "quotation": {"in_app": true, "email": true, "sms": false},
        "contract": {"in_app": true, "email": true, "sms": false},
        "lead": {"in_app": true, "email": false, "sms": false},
        "system": {"in_app": true, "email": true, "sms": false}
    }'::jsonb,

    -- Horario de notificaciones (quiet hours)
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME DEFAULT '22:00:00',
    quiet_hours_end TIME DEFAULT '08:00:00',

    -- Frecuencia de emails (digest)
    email_digest_enabled BOOLEAN DEFAULT false,
    email_digest_frequency VARCHAR(20) DEFAULT 'daily' CHECK (email_digest_frequency IN ('immediate', 'daily', 'weekly')),

    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Tabla: notification_templates
-- Templates de notificaciones con variables
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS notification_templates (
    id SERIAL PRIMARY KEY,

    -- Identificador único del template
    template_key VARCHAR(100) UNIQUE NOT NULL,

    -- Información básica
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,

    -- Contenido del template
    title_template VARCHAR(255) NOT NULL,
    message_template TEXT NOT NULL,

    -- Template de email (opcional)
    email_subject_template VARCHAR(255),
    email_body_template TEXT,

    -- Variables esperadas (JSON array)
    variables JSONB,
    -- Ejemplo: ["user_name", "event_date", "amount"]

    -- Configuración
    is_active BOOLEAN DEFAULT true,
    default_priority VARCHAR(20) DEFAULT 'normal',

    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_notification_templates_key ON notification_templates(template_key);
CREATE INDEX idx_notification_templates_type ON notification_templates(type);
CREATE INDEX idx_notification_templates_active ON notification_templates(is_active);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Tabla: notification_queue
-- Cola de notificaciones pendientes de envío
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS notification_queue (
    id SERIAL PRIMARY KEY,

    -- Tipo de canal
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'sms')),

    -- Destinatario
    recipient VARCHAR(255) NOT NULL, -- email o teléfono

    -- Contenido
    subject VARCHAR(255),
    body TEXT NOT NULL,

    -- Metadatos
    template_key VARCHAR(100),
    related_notification_id INTEGER REFERENCES notifications(id) ON DELETE SET NULL,

    -- Estado
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),

    -- Reintentos
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_attempt_at TIMESTAMP,
    next_attempt_at TIMESTAMP,

    -- Resultado
    error_message TEXT,
    sent_at TIMESTAMP,

    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_notification_queue_status ON notification_queue(status);
CREATE INDEX idx_notification_queue_channel ON notification_queue(channel);
CREATE INDEX idx_notification_queue_next_attempt ON notification_queue(next_attempt_at) WHERE status = 'pending';
CREATE INDEX idx_notification_queue_created_at ON notification_queue(created_at);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FUNCIONES Y TRIGGERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Función: Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER trigger_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

CREATE TRIGGER trigger_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

CREATE TRIGGER trigger_notification_templates_updated_at
    BEFORE UPDATE ON notification_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

CREATE TRIGGER trigger_notification_queue_updated_at
    BEFORE UPDATE ON notification_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- Función: Marcar notificación como leída automáticamente
CREATE OR REPLACE FUNCTION mark_notification_as_read()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_read = true AND OLD.is_read = false THEN
        NEW.read_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para marcar como leída
CREATE TRIGGER trigger_mark_notification_read
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    WHEN (NEW.is_read = true AND OLD.is_read = false)
    EXECUTE FUNCTION mark_notification_as_read();

-- Función: Limpiar notificaciones antiguas
CREATE OR REPLACE FUNCTION cleanup_old_notifications(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications
    WHERE created_at < CURRENT_TIMESTAMP - (days_to_keep || ' days')::INTERVAL
    AND is_read = true;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Función: Limpiar notificaciones expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications
    WHERE expires_at IS NOT NULL
    AND expires_at < CURRENT_TIMESTAMP;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Función: Crear preferencias por defecto para nuevo usuario
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para crear preferencias por defecto
CREATE TRIGGER trigger_create_default_preferences
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_preferences();

-- Función: Reintentar notificaciones fallidas
CREATE OR REPLACE FUNCTION retry_failed_notifications()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE notification_queue
    SET
        status = 'pending',
        next_attempt_at = CURRENT_TIMESTAMP + INTERVAL '5 minutes',
        updated_at = CURRENT_TIMESTAMP
    WHERE status = 'failed'
    AND attempts < max_attempts
    AND (last_attempt_at IS NULL OR last_attempt_at < CURRENT_TIMESTAMP - INTERVAL '1 hour');

    GET DIAGNOSTICS updated_count = ROW_COUNT;

    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- VISTAS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Vista: Notificaciones no leídas por usuario
CREATE OR REPLACE VIEW unread_notifications_summary AS
SELECT
    user_id,
    COUNT(*) AS unread_count,
    COUNT(*) FILTER (WHERE type = 'error') AS error_count,
    COUNT(*) FILTER (WHERE type = 'warning') AS warning_count,
    COUNT(*) FILTER (WHERE priority = 'urgent') AS urgent_count,
    MAX(created_at) AS latest_notification
FROM notifications
WHERE is_read = false
AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
GROUP BY user_id;

-- Vista: Estadísticas de notificaciones
CREATE OR REPLACE VIEW notification_stats AS
SELECT
    COUNT(*) AS total_notifications,
    COUNT(*) FILTER (WHERE is_read = true) AS read_count,
    COUNT(*) FILTER (WHERE is_read = false) AS unread_count,
    COUNT(*) FILTER (WHERE type = 'error') AS error_count,
    COUNT(*) FILTER (WHERE type = 'warning') AS warning_count,
    COUNT(*) FILTER (WHERE priority = 'urgent') AS urgent_count,
    COUNT(*) FILTER (WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours') AS last_24h_count,
    COUNT(*) FILTER (WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '7 days') AS last_7d_count
FROM notifications
WHERE expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- DATOS INICIALES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Templates de notificaciones predefinidos
INSERT INTO notification_templates (template_key, name, description, type, title_template, message_template, email_subject_template, email_body_template, variables) VALUES
-- Eventos
('evento_created', 'Evento Creado', 'Notificación cuando se crea un nuevo evento', 'evento',
 'Nuevo evento: {{event_name}}',
 'Se ha creado el evento "{{event_name}}" para el {{event_date}} en {{location}}',
 'Nuevo evento registrado: {{event_name}}',
 '<h2>Nuevo Evento</h2><p>Se ha registrado el evento <strong>{{event_name}}</strong></p><p><strong>Fecha:</strong> {{event_date}}<br><strong>Ubicación:</strong> {{location}}<br><strong>DJ:</strong> {{dj_name}}</p>',
 '["event_name", "event_date", "location", "dj_name"]'::jsonb),

('evento_updated', 'Evento Actualizado', 'Notificación cuando se actualiza un evento', 'evento',
 'Evento actualizado: {{event_name}}',
 'Se ha actualizado el evento "{{event_name}}" del {{event_date}}',
 'Actualización de evento: {{event_name}}',
 '<h2>Evento Actualizado</h2><p>Se han realizado cambios en el evento <strong>{{event_name}}</strong></p>',
 '["event_name", "event_date"]'::jsonb),

('evento_cancelled', 'Evento Cancelado', 'Notificación cuando se cancela un evento', 'warning',
 'Evento cancelado: {{event_name}}',
 'El evento "{{event_name}}" del {{event_date}} ha sido cancelado. Motivo: {{reason}}',
 '⚠️ Evento cancelado: {{event_name}}',
 '<h2>Evento Cancelado</h2><p>El evento <strong>{{event_name}}</strong> del {{event_date}} ha sido cancelado.</p><p><strong>Motivo:</strong> {{reason}}</p>',
 '["event_name", "event_date", "reason"]'::jsonb),

-- Pagos
('payment_received', 'Pago Recibido', 'Notificación cuando se recibe un pago', 'payment',
 'Pago recibido: {{amount}}',
 'Se ha recibido un pago de {{amount}} para {{event_name}}',
 '✅ Pago confirmado: {{amount}}',
 '<h2>Pago Recibido</h2><p>Se ha confirmado el pago de <strong>{{amount}}</strong></p><p>Evento: {{event_name}}<br>Fecha: {{payment_date}}</p>',
 '["amount", "event_name", "payment_date"]'::jsonb),

('payment_pending', 'Pago Pendiente', 'Recordatorio de pago pendiente', 'warning',
 'Recordatorio: Pago pendiente',
 'Tienes un pago pendiente de {{amount}} para el evento {{event_name}}',
 'Recordatorio de pago pendiente',
 '<h2>Pago Pendiente</h2><p>Recuerda que tienes un pago pendiente de <strong>{{amount}}</strong></p><p>Evento: {{event_name}}<br>Vencimiento: {{due_date}}</p>',
 '["amount", "event_name", "due_date"]'::jsonb),

-- Cotizaciones
('quotation_sent', 'Cotización Enviada', 'Notificación cuando se envía una cotización', 'quotation',
 'Cotización enviada: {{quotation_number}}',
 'Se ha enviado la cotización {{quotation_number}} a {{client_name}}',
 'Cotización enviada: {{quotation_number}}',
 '<h2>Cotización Enviada</h2><p>La cotización <strong>{{quotation_number}}</strong> ha sido enviada a {{client_name}}</p>',
 '["quotation_number", "client_name"]'::jsonb),

('quotation_accepted', 'Cotización Aceptada', 'Notificación cuando se acepta una cotización', 'success',
 '✅ Cotización aceptada: {{quotation_number}}',
 'El cliente {{client_name}} ha aceptado la cotización {{quotation_number}}',
 '✅ Cotización aceptada: {{quotation_number}}',
 '<h2>¡Cotización Aceptada!</h2><p>El cliente <strong>{{client_name}}</strong> ha aceptado la cotización {{quotation_number}}</p><p>Monto: {{amount}}</p>',
 '["quotation_number", "client_name", "amount"]'::jsonb),

('quotation_rejected', 'Cotización Rechazada', 'Notificación cuando se rechaza una cotización', 'warning',
 'Cotización rechazada: {{quotation_number}}',
 'El cliente {{client_name}} ha rechazado la cotización {{quotation_number}}. Motivo: {{reason}}',
 'Cotización rechazada: {{quotation_number}}',
 '<h2>Cotización Rechazada</h2><p>El cliente <strong>{{client_name}}</strong> ha rechazado la cotización {{quotation_number}}</p><p>Motivo: {{reason}}</p>',
 '["quotation_number", "client_name", "reason"]'::jsonb),

('quotation_expiring', 'Cotización por Expirar', 'Alerta de cotización próxima a expirar', 'warning',
 'Cotización por expirar: {{quotation_number}}',
 'La cotización {{quotation_number}} expira el {{expiry_date}}',
 '⏰ Cotización por expirar pronto',
 '<h2>Cotización por Expirar</h2><p>La cotización <strong>{{quotation_number}}</strong> para {{client_name}} expira el {{expiry_date}}</p>',
 '["quotation_number", "client_name", "expiry_date"]'::jsonb),

-- Leads
('lead_new', 'Nuevo Lead', 'Notificación de nuevo lead', 'lead',
 'Nuevo lead: {{lead_name}}',
 'Se ha recibido un nuevo lead de {{lead_name}} ({{lead_email}})',
 'Nuevo lead recibido',
 '<h2>Nuevo Lead</h2><p><strong>Nombre:</strong> {{lead_name}}<br><strong>Email:</strong> {{lead_email}}<br><strong>Teléfono:</strong> {{lead_phone}}</p>',
 '["lead_name", "lead_email", "lead_phone"]'::jsonb),

-- Sistema
('system_maintenance', 'Mantenimiento del Sistema', 'Notificación de mantenimiento', 'system',
 'Mantenimiento programado',
 'El sistema estará en mantenimiento el {{maintenance_date}} de {{start_time}} a {{end_time}}',
 'Mantenimiento programado del sistema',
 '<h2>Mantenimiento Programado</h2><p>El sistema estará en mantenimiento el {{maintenance_date}} de {{start_time}} a {{end_time}}</p>',
 '["maintenance_date", "start_time", "end_time"]'::jsonb)

ON CONFLICT (template_key) DO NOTHING;

COMMIT;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- END OF MIGRATION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Para verificar la instalación:
-- SELECT * FROM notification_templates;
-- SELECT * FROM unread_notifications_summary;
-- SELECT * FROM notification_stats;
-- SELECT cleanup_old_notifications(90); -- Limpiar notificaciones antiguas
-- SELECT cleanup_expired_notifications(); -- Limpiar notificaciones expiradas
