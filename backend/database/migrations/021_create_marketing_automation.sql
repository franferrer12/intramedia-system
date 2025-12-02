-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 📧 MARKETING AUTOMATION - EMAIL CAMPAIGNS SYSTEM
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Migration: 021
-- Description: Email campaigns, templates, and recipient tracking
-- Dependencies: users, leads, clientes tables
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Drop existing objects (idempotent)
DROP TABLE IF EXISTS email_campaign_recipients CASCADE;
DROP TABLE IF EXISTS email_campaigns CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;
DROP VIEW IF EXISTS vw_campaign_stats CASCADE;
DROP FUNCTION IF EXISTS get_campaign_stats(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS schedule_campaign_delivery(INTEGER, TIMESTAMP) CASCADE;
DROP TRIGGER IF EXISTS update_email_campaigns_timestamp ON email_campaigns CASCADE;
DROP TRIGGER IF EXISTS update_email_templates_timestamp ON email_templates CASCADE;

-- ============================================================================
-- EMAIL TEMPLATES
-- ============================================================================
CREATE TABLE email_templates (
    id SERIAL PRIMARY KEY,
    agency_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    -- Template info
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100), -- 'marketing', 'transactional', 'notification'

    -- Content
    asunto VARCHAR(300) NOT NULL,
    contenido_html TEXT NOT NULL,
    contenido_texto TEXT, -- Plain text version

    -- Variables/placeholders info
    variables_disponibles TEXT[], -- ['{{nombre}}', '{{evento}}', '{{fecha}}']

    -- Usage stats
    veces_usado INTEGER DEFAULT 0,
    ultima_vez_usado TIMESTAMP,

    -- Status
    activo BOOLEAN DEFAULT true,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- ============================================================================
-- EMAIL CAMPAIGNS
-- ============================================================================
CREATE TABLE email_campaigns (
    id SERIAL PRIMARY KEY,
    agency_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    template_id INTEGER REFERENCES email_templates(id) ON DELETE SET NULL,

    -- Campaign info
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,

    -- Email content (can override template)
    asunto VARCHAR(300) NOT NULL,
    contenido_html TEXT NOT NULL,
    contenido_texto TEXT,

    -- Targeting
    tipo_destinatarios VARCHAR(50) NOT NULL, -- 'leads', 'clientes', 'djs', 'custom', 'todos'
    filtros JSONB, -- Filtros de segmentación: {status: 'new', tags: ['vip']}
    destinatarios_personalizados TEXT[], -- Array de emails si tipo='custom'

    -- Scheduling
    estado VARCHAR(50) DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'sent', 'cancelled'
    fecha_envio_programada TIMESTAMP,
    fecha_envio_real TIMESTAMP,

    -- Stats (denormalized for performance)
    total_destinatarios INTEGER DEFAULT 0,
    enviados INTEGER DEFAULT 0,
    entregados INTEGER DEFAULT 0,
    abiertos INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    rebotados INTEGER DEFAULT 0,
    cancelados INTEGER DEFAULT 0,

    -- User tracking
    creado_por INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_campaign_status CHECK (estado IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
    CONSTRAINT valid_recipient_type CHECK (tipo_destinatarios IN ('leads', 'clientes', 'djs', 'custom', 'todos'))
);

-- ============================================================================
-- EMAIL CAMPAIGN RECIPIENTS
-- ============================================================================
CREATE TABLE email_campaign_recipients (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES email_campaigns(id) ON DELETE CASCADE NOT NULL,

    -- Recipient info
    email VARCHAR(255) NOT NULL,
    nombre VARCHAR(255),
    tipo_destinatario VARCHAR(50), -- 'lead', 'cliente', 'dj'
    destinatario_id INTEGER, -- ID en la tabla correspondiente (leads/clientes/djs)

    -- Personalization data
    variables_personalizacion JSONB, -- {nombre: 'Juan', evento: 'Boda'}

    -- Delivery tracking
    estado VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'

    -- Timestamps
    fecha_envio TIMESTAMP,
    fecha_entrega TIMESTAMP,
    fecha_apertura TIMESTAMP,
    fecha_primer_click TIMESTAMP,

    -- Engagement
    veces_abierto INTEGER DEFAULT 0,
    veces_clicado INTEGER DEFAULT 0,
    links_clicados TEXT[], -- URLs que clicó

    -- Error handling
    error_mensaje TEXT,
    intentos_envio INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_recipient_status CHECK (estado IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'))
);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Campaign stats aggregated view
CREATE OR REPLACE VIEW vw_campaign_stats AS
SELECT
    c.id as campaign_id,
    c.nombre as campaign_nombre,
    c.estado as campaign_estado,
    c.fecha_envio_programada,
    c.fecha_envio_real,

    -- Recipient counts
    COUNT(r.id) as total_destinatarios,
    COUNT(r.id) FILTER (WHERE r.estado = 'sent') as enviados,
    COUNT(r.id) FILTER (WHERE r.estado = 'delivered') as entregados,
    COUNT(r.id) FILTER (WHERE r.estado = 'opened' OR r.veces_abierto > 0) as abiertos,
    COUNT(r.id) FILTER (WHERE r.estado = 'clicked' OR r.veces_clicado > 0) as clicados,
    COUNT(r.id) FILTER (WHERE r.estado = 'bounced') as rebotados,
    COUNT(r.id) FILTER (WHERE r.estado = 'failed') as fallidos,

    -- Percentages (handle division by zero)
    CASE
        WHEN COUNT(r.id) > 0 THEN
            ROUND((COUNT(r.id) FILTER (WHERE r.estado = 'delivered')::NUMERIC / COUNT(r.id)) * 100, 2)
        ELSE 0
    END as tasa_entrega,

    CASE
        WHEN COUNT(r.id) FILTER (WHERE r.estado = 'delivered') > 0 THEN
            ROUND((COUNT(r.id) FILTER (WHERE r.veces_abierto > 0)::NUMERIC /
                   COUNT(r.id) FILTER (WHERE r.estado = 'delivered')) * 100, 2)
        ELSE 0
    END as tasa_apertura,

    CASE
        WHEN COUNT(r.id) FILTER (WHERE r.veces_abierto > 0) > 0 THEN
            ROUND((COUNT(r.id) FILTER (WHERE r.veces_clicado > 0)::NUMERIC /
                   COUNT(r.id) FILTER (WHERE r.veces_abierto > 0)) * 100, 2)
        ELSE 0
    END as tasa_click

FROM email_campaigns c
LEFT JOIN email_campaign_recipients r ON c.id = r.campaign_id
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.nombre, c.estado, c.fecha_envio_programada, c.fecha_envio_real;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Get campaign stats
CREATE OR REPLACE FUNCTION get_campaign_stats(p_campaign_id INTEGER)
RETURNS TABLE(
    total_destinatarios INTEGER,
    enviados INTEGER,
    entregados INTEGER,
    abiertos INTEGER,
    clicados INTEGER,
    rebotados INTEGER,
    fallidos INTEGER,
    tasa_entrega NUMERIC,
    tasa_apertura NUMERIC,
    tasa_click NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total_destinatarios,
        COUNT(*) FILTER (WHERE estado = 'sent')::INTEGER as enviados,
        COUNT(*) FILTER (WHERE estado = 'delivered')::INTEGER as entregados,
        COUNT(*) FILTER (WHERE veces_abierto > 0)::INTEGER as abiertos,
        COUNT(*) FILTER (WHERE veces_clicado > 0)::INTEGER as clicados,
        COUNT(*) FILTER (WHERE estado = 'bounced')::INTEGER as rebotados,
        COUNT(*) FILTER (WHERE estado = 'failed')::INTEGER as fallidos,

        CASE
            WHEN COUNT(*) > 0 THEN
                ROUND((COUNT(*) FILTER (WHERE estado = 'delivered')::NUMERIC / COUNT(*)) * 100, 2)
            ELSE 0
        END as tasa_entrega,

        CASE
            WHEN COUNT(*) FILTER (WHERE estado = 'delivered') > 0 THEN
                ROUND((COUNT(*) FILTER (WHERE veces_abierto > 0)::NUMERIC /
                       COUNT(*) FILTER (WHERE estado = 'delivered')) * 100, 2)
            ELSE 0
        END as tasa_apertura,

        CASE
            WHEN COUNT(*) FILTER (WHERE veces_abierto > 0) > 0 THEN
                ROUND((COUNT(*) FILTER (WHERE veces_clicado > 0)::NUMERIC /
                       COUNT(*) FILTER (WHERE veces_abierto > 0)) * 100, 2)
            ELSE 0
        END as tasa_click

    FROM email_campaign_recipients
    WHERE campaign_id = p_campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Update campaign stats (call after recipient updates)
CREATE OR REPLACE FUNCTION update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update denormalized stats in email_campaigns table
    UPDATE email_campaigns
    SET
        enviados = (SELECT COUNT(*) FROM email_campaign_recipients WHERE campaign_id = NEW.campaign_id AND estado IN ('sent', 'delivered', 'opened', 'clicked')),
        entregados = (SELECT COUNT(*) FROM email_campaign_recipients WHERE campaign_id = NEW.campaign_id AND estado IN ('delivered', 'opened', 'clicked')),
        abiertos = (SELECT COUNT(*) FROM email_campaign_recipients WHERE campaign_id = NEW.campaign_id AND veces_abierto > 0),
        clicks = (SELECT COUNT(*) FROM email_campaign_recipients WHERE campaign_id = NEW.campaign_id AND veces_clicado > 0),
        rebotados = (SELECT COUNT(*) FROM email_campaign_recipients WHERE campaign_id = NEW.campaign_id AND estado = 'bounced'),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.campaign_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_email_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update campaign stats when recipient status changes
CREATE TRIGGER update_campaign_stats_trigger
    AFTER INSERT OR UPDATE ON email_campaign_recipients
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_stats();

-- Auto-update timestamps
CREATE TRIGGER update_email_campaigns_timestamp
    BEFORE UPDATE ON email_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_email_timestamp();

CREATE TRIGGER update_email_templates_timestamp
    BEFORE UPDATE ON email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_email_timestamp();

-- ============================================================================
-- INDEXES (Performance optimization)
-- ============================================================================

-- Email Campaigns
CREATE INDEX idx_email_campaigns_agency ON email_campaigns(agency_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_email_campaigns_estado ON email_campaigns(estado) WHERE deleted_at IS NULL;
CREATE INDEX idx_email_campaigns_fecha_envio ON email_campaigns(fecha_envio_programada);
CREATE INDEX idx_email_campaigns_creado_por ON email_campaigns(creado_por);

-- Email Templates
CREATE INDEX idx_email_templates_agency ON email_templates(agency_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_email_templates_categoria ON email_templates(categoria) WHERE deleted_at IS NULL AND activo = true;

-- Email Campaign Recipients
CREATE INDEX idx_recipients_campaign ON email_campaign_recipients(campaign_id);
CREATE INDEX idx_recipients_email ON email_campaign_recipients(email);
CREATE INDEX idx_recipients_estado ON email_campaign_recipients(estado);
CREATE INDEX idx_recipients_destinatario ON email_campaign_recipients(tipo_destinatario, destinatario_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE email_templates IS 'Plantillas reutilizables para emails de marketing';
COMMENT ON TABLE email_campaigns IS 'Campañas de email marketing con segmentación';
COMMENT ON TABLE email_campaign_recipients IS 'Destinatarios y tracking de campañas';
COMMENT ON VIEW vw_campaign_stats IS 'Vista agregada de estadísticas por campaña';

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Sample email template
INSERT INTO email_templates (agency_id, nombre, descripcion, categoria, asunto, contenido_html, contenido_texto, variables_disponibles)
VALUES (
    1,
    'Promoción de Eventos',
    'Template para promocionar próximos eventos',
    'marketing',
    '¡No te pierdas {{evento_nombre}}!',
    '<h1>Hola {{nombre}}!</h1><p>Te invitamos a nuestro próximo evento: <strong>{{evento_nombre}}</strong></p><p>Fecha: {{fecha}}</p><p>Lugar: {{ubicacion}}</p><p><a href="{{link_reserva}}">Reserva ahora</a></p>',
    'Hola {{nombre}}! Te invitamos a nuestro próximo evento: {{evento_nombre}}. Fecha: {{fecha}}. Lugar: {{ubicacion}}. Reserva en: {{link_reserva}}',
    ARRAY['{{nombre}}', '{{evento_nombre}}', '{{fecha}}', '{{ubicacion}}', '{{link_reserva}}']
);

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

-- Verify tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'email_%'
ORDER BY table_name;

-- Verify view created
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name LIKE 'vw_%campaign%';

-- Verify functions created
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%campaign%'
ORDER BY routine_name;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ Marketing Automation migration complete!
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
