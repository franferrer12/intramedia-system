-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Migration 012: Mejoras al Sistema de Notificaciones
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Descripción: Extender sistema de notificaciones existente
-- Fecha: 2025-12-01
-- Autor: IntraMedia Development Team
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BEGIN;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Mejorar tabla notifications existente
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Agregar columna user_id para notificaciones generales (haciendo dj_id opcional)
ALTER TABLE notifications
    ALTER COLUMN dj_id DROP NOT NULL;

ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS agency_id INTEGER REFERENCES agencies(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    ADD COLUMN IF NOT EXISTS action_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS action_text VARCHAR(100),
    ADD COLUMN IF NOT EXISTS related_entity_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS related_entity_id INTEGER,
    ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS read_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

-- Renombrar columna 'read' a 'is_read' si no existe is_read
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='is_read') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='read') THEN
            ALTER TABLE notifications RENAME COLUMN "read" TO is_read;
        END IF;
    END IF;
END $$;

-- Ampliar tipos de notificación
ALTER TABLE notifications
    DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
    ADD CONSTRAINT notifications_type_check CHECK (type IN (
        'info', 'success', 'warning', 'error',
        'evento', 'payment', 'quotation', 'contract', 'lead', 'system'
    ));

-- Crear índices adicionales si no existen
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_agency_id ON notifications(agency_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Mejorar notification_preferences existente
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Agregar columnas adicionales si no existen
ALTER TABLE notification_preferences
    ADD COLUMN IF NOT EXISTS in_app_enabled BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{
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
    ADD COLUMN IF NOT EXISTS quiet_hours_enabled BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS quiet_hours_start TIME DEFAULT '22:00:00',
    ADD COLUMN IF NOT EXISTS quiet_hours_end TIME DEFAULT '08:00:00',
    ADD COLUMN IF NOT EXISTS email_digest_enabled BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS email_digest_frequency VARCHAR(20) DEFAULT 'daily';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Nuevas tablas
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Tabla: notification_templates
CREATE TABLE IF NOT EXISTS notification_templates (
    id SERIAL PRIMARY KEY,
    template_key VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    title_template VARCHAR(255) NOT NULL,
    message_template TEXT NOT NULL,
    email_subject_template VARCHAR(255),
    email_body_template TEXT,
    variables JSONB,
    is_active BOOLEAN DEFAULT true,
    default_priority VARCHAR(20) DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_templates_key ON notification_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active);

-- Tabla: notification_queue
CREATE TABLE IF NOT EXISTS notification_queue (
    id SERIAL PRIMARY KEY,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'sms')),
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    body TEXT NOT NULL,
    template_key VARCHAR(100),
    related_notification_id INTEGER REFERENCES notifications(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_attempt_at TIMESTAMP,
    next_attempt_at TIMESTAMP,
    error_message TEXT,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_channel ON notification_queue(channel);
CREATE INDEX IF NOT EXISTS idx_notification_queue_next_attempt ON notification_queue(next_attempt_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_notification_queue_created_at ON notification_queue(created_at);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FUNCIONES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Función: Marcar notificación como leída
CREATE OR REPLACE FUNCTION mark_notification_as_read()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_read = true AND OLD.is_read = false THEN
        NEW.read_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger mejorado
DROP TRIGGER IF EXISTS trigger_mark_notification_read ON notifications;
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

-- Función: Crear preferencias por defecto
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para crear preferencias
DROP TRIGGER IF EXISTS trigger_create_default_preferences ON users;
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

-- Triggers para updated_at en nuevas tablas
CREATE TRIGGER trigger_notification_templates_updated_at
    BEFORE UPDATE ON notification_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

CREATE TRIGGER trigger_notification_queue_updated_at
    BEFORE UPDATE ON notification_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

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
AND user_id IS NOT NULL
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

-- Templates de notificaciones
INSERT INTO notification_templates (template_key, name, description, type, title_template, message_template, email_subject_template, email_body_template, variables) VALUES
('evento_created', 'Evento Creado', 'Notificación cuando se crea un nuevo evento', 'evento',
 'Nuevo evento: {{event_name}}',
 'Se ha creado el evento "{{event_name}}" para el {{event_date}} en {{location}}',
 'Nuevo evento registrado: {{event_name}}',
 '<h2>Nuevo Evento</h2><p>Se ha registrado el evento <strong>{{event_name}}</strong></p><p><strong>Fecha:</strong> {{event_date}}<br><strong>Ubicación:</strong> {{location}}<br><strong>DJ:</strong> {{dj_name}}</p>',
 '["event_name", "event_date", "location", "dj_name"]'::jsonb),

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

('payment_received', 'Pago Recibido', 'Notificación cuando se recibe un pago', 'payment',
 'Pago recibido: {{amount}}',
 'Se ha recibido un pago de {{amount}} para {{event_name}}',
 '✅ Pago confirmado: {{amount}}',
 '<h2>Pago Recibido</h2><p>Se ha confirmado el pago de <strong>{{amount}}</strong></p><p>Evento: {{event_name}}<br>Fecha: {{payment_date}}</p>',
 '["amount", "event_name", "payment_date"]'::jsonb),

('lead_new', 'Nuevo Lead', 'Notificación de nuevo lead', 'lead',
 'Nuevo lead: {{lead_name}}',
 'Se ha recibido un nuevo lead de {{lead_name}} ({{lead_email}})',
 'Nuevo lead recibido',
 '<h2>Nuevo Lead</h2><p><strong>Nombre:</strong> {{lead_name}}<br><strong>Email:</strong> {{lead_email}}<br><strong>Teléfono:</strong> {{lead_phone}}</p>',
 '["lead_name", "lead_email", "lead_phone"]'::jsonb)

ON CONFLICT (template_key) DO NOTHING;

COMMIT;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- END OF MIGRATION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
