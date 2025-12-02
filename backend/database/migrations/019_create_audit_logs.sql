-- Migration: Create Audit Logs System
-- Description: Comprehensive audit logging for all CRUD operations and security events
-- Date: 2025-12-02

-- =============================================
-- AUDIT LOGS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,

    -- Event Information
    event_type VARCHAR(50) NOT NULL,  -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ACCESS', 'ERROR', 'SECURITY'
    entity_type VARCHAR(100),          -- 'evento', 'dj', 'cliente', 'lead', 'payment', 'document', 'contract', etc.
    entity_id BIGINT,                  -- ID of the affected entity

    -- User Information
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),           -- Stored for reference even if user is deleted
    user_role VARCHAR(50),             -- 'ADMIN', 'AGENCY', 'INDIVIDUAL_DJ', etc.
    impersonated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,  -- If action was done via impersonation

    -- Request Details
    action VARCHAR(255) NOT NULL,      -- Detailed action description
    method VARCHAR(10),                -- HTTP method: GET, POST, PUT, DELETE, PATCH
    endpoint VARCHAR(500),             -- API endpoint called
    ip_address INET,                   -- Client IP address
    user_agent TEXT,                   -- Browser/client info

    -- Changes Tracking
    old_values JSONB,                  -- Previous state (for UPDATE/DELETE)
    new_values JSONB,                  -- New state (for CREATE/UPDATE)
    changed_fields TEXT[],             -- Array of field names that changed

    -- Metadata
    status VARCHAR(20) DEFAULT 'SUCCESS',  -- 'SUCCESS', 'FAILURE', 'ERROR'
    error_message TEXT,                -- Error details if status is FAILURE/ERROR
    duration_ms INTEGER,               -- Request duration in milliseconds
    metadata JSONB,                    -- Additional contextual data

    -- Session Information
    session_id VARCHAR(255),           -- Session/JWT token ID
    request_id UUID,                   -- Unique request identifier

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CHECK (event_type IN ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ACCESS', 'VIEW', 'ERROR', 'SECURITY', 'EXPORT', 'IMPORT'))
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Primary query patterns
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id) WHERE entity_type IS NOT NULL AND entity_id IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX idx_audit_logs_user_event ON audit_logs(user_id, event_type, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_logs_entity_time ON audit_logs(entity_type, entity_id, created_at DESC) WHERE entity_type IS NOT NULL;
CREATE INDEX idx_audit_logs_status ON audit_logs(status, created_at DESC) WHERE status != 'SUCCESS';

-- Full-text search index for action descriptions
CREATE INDEX idx_audit_logs_action_search ON audit_logs USING gin(to_tsvector('spanish', action));

-- IP-based queries (security monitoring)
CREATE INDEX idx_audit_logs_ip ON audit_logs(ip_address, created_at DESC) WHERE ip_address IS NOT NULL;

-- Session tracking
CREATE INDEX idx_audit_logs_session ON audit_logs(session_id, created_at DESC) WHERE session_id IS NOT NULL;

-- Request tracking
CREATE INDEX idx_audit_logs_request ON audit_logs(request_id) WHERE request_id IS NOT NULL;

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- Recent Activity View (last 7 days)
CREATE OR REPLACE VIEW recent_audit_activity AS
SELECT
    al.id,
    al.event_type,
    al.entity_type,
    al.entity_id,
    al.action,
    al.user_email,
    al.user_role,
    al.status,
    al.created_at,
    u.nombre as user_name,
    u.nombre_artistico as dj_name
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
ORDER BY al.created_at DESC;

-- Failed Operations View
CREATE OR REPLACE VIEW failed_audit_operations AS
SELECT
    al.id,
    al.event_type,
    al.action,
    al.user_email,
    al.error_message,
    al.ip_address,
    al.endpoint,
    al.created_at,
    u.nombre as user_name
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.status IN ('FAILURE', 'ERROR')
ORDER BY al.created_at DESC;

-- Security Events View
CREATE OR REPLACE VIEW security_audit_events AS
SELECT
    al.id,
    al.event_type,
    al.action,
    al.user_email,
    al.ip_address,
    al.user_agent,
    al.status,
    al.error_message,
    al.created_at
FROM audit_logs al
WHERE al.event_type = 'SECURITY' OR al.status IN ('FAILURE', 'ERROR')
ORDER BY al.created_at DESC;

-- User Activity Summary View
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT
    u.id as user_id,
    u.email,
    u.nombre,
    u.role,
    COUNT(*) as total_actions,
    COUNT(*) FILTER (WHERE al.event_type = 'CREATE') as creates,
    COUNT(*) FILTER (WHERE al.event_type = 'UPDATE') as updates,
    COUNT(*) FILTER (WHERE al.event_type = 'DELETE') as deletes,
    COUNT(*) FILTER (WHERE al.event_type = 'VIEW') as views,
    COUNT(*) FILTER (WHERE al.status = 'FAILURE') as failures,
    MAX(al.created_at) as last_activity,
    MIN(al.created_at) as first_activity
FROM users u
LEFT JOIN audit_logs al ON u.id = al.user_id
GROUP BY u.id, u.email, u.nombre, u.role;

-- Entity Change History View
CREATE OR REPLACE VIEW entity_change_history AS
SELECT
    al.id,
    al.entity_type,
    al.entity_id,
    al.event_type,
    al.action,
    al.changed_fields,
    al.old_values,
    al.new_values,
    al.user_email,
    al.created_at,
    u.nombre as user_name
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.entity_type IS NOT NULL
  AND al.entity_id IS NOT NULL
  AND al.event_type IN ('CREATE', 'UPDATE', 'DELETE')
ORDER BY al.entity_type, al.entity_id, al.created_at DESC;

-- =============================================
-- FUNCTIONS FOR AUDIT LOG MANAGEMENT
-- =============================================

-- Function to get entity changes
CREATE OR REPLACE FUNCTION get_entity_audit_trail(
    p_entity_type VARCHAR,
    p_entity_id BIGINT,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id BIGINT,
    event_type VARCHAR,
    action VARCHAR,
    changed_fields TEXT[],
    old_values JSONB,
    new_values JSONB,
    user_email VARCHAR,
    user_name VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        al.id,
        al.event_type,
        al.action,
        al.changed_fields,
        al.old_values,
        al.new_values,
        al.user_email,
        u.nombre as user_name,
        al.created_at
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.entity_type = p_entity_type
      AND al.entity_id = p_entity_id
    ORDER BY al.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to clean old audit logs (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(
    retention_days INTEGER DEFAULT 365
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Keep security events forever, delete old routine logs
    DELETE FROM audit_logs
    WHERE created_at < CURRENT_TIMESTAMP - (retention_days || ' days')::INTERVAL
      AND event_type NOT IN ('SECURITY', 'ERROR')
      AND status = 'SUCCESS';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get audit statistics
CREATE OR REPLACE FUNCTION get_audit_statistics(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP - INTERVAL '30 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
)
RETURNS TABLE (
    total_events BIGINT,
    successful_events BIGINT,
    failed_events BIGINT,
    unique_users BIGINT,
    unique_ips BIGINT,
    events_by_type JSONB,
    events_by_entity JSONB,
    hourly_distribution JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_events,
        COUNT(*) FILTER (WHERE status = 'SUCCESS')::BIGINT as successful_events,
        COUNT(*) FILTER (WHERE status != 'SUCCESS')::BIGINT as failed_events,
        COUNT(DISTINCT user_id)::BIGINT as unique_users,
        COUNT(DISTINCT ip_address)::BIGINT as unique_ips,
        jsonb_object_agg(event_type, event_count) as events_by_type,
        jsonb_object_agg(entity_type, entity_count) as events_by_entity,
        jsonb_object_agg(hour, hour_count) as hourly_distribution
    FROM (
        SELECT
            event_type,
            entity_type,
            EXTRACT(HOUR FROM created_at)::INTEGER as hour,
            COUNT(*) as event_count,
            COUNT(*) as entity_count,
            COUNT(*) as hour_count
        FROM audit_logs
        WHERE created_at BETWEEN start_date AND end_date
        GROUP BY event_type, entity_type, hour
    ) stats;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- PARTITIONING SETUP (for high-volume logs)
-- =============================================

-- Note: For production with high volume, consider partitioning by month:
-- CREATE TABLE audit_logs_2025_12 PARTITION OF audit_logs
-- FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- =============================================
-- GRANTS
-- =============================================

-- Grant read access to all authenticated users
GRANT SELECT ON audit_logs TO PUBLIC;
GRANT SELECT ON recent_audit_activity TO PUBLIC;
GRANT SELECT ON user_activity_summary TO PUBLIC;
GRANT SELECT ON entity_change_history TO PUBLIC;

-- Only admins can delete audit logs
-- (typically you never delete, but in case cleanup is needed)

-- =============================================
-- TRIGGERS (optional - for automatic logging)
-- =============================================

-- Note: Most logging will be done from application layer via middleware,
-- but we can add triggers for critical tables if needed

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE audit_logs IS 'Comprehensive audit log for all system operations';
COMMENT ON COLUMN audit_logs.event_type IS 'Type of event: CREATE, UPDATE, DELETE, LOGIN, etc.';
COMMENT ON COLUMN audit_logs.entity_type IS 'Type of entity affected: evento, dj, cliente, etc.';
COMMENT ON COLUMN audit_logs.old_values IS 'Previous state before change (JSON)';
COMMENT ON COLUMN audit_logs.new_values IS 'New state after change (JSON)';
COMMENT ON COLUMN audit_logs.changed_fields IS 'Array of field names that were modified';
COMMENT ON COLUMN audit_logs.duration_ms IS 'Request processing time in milliseconds';
COMMENT ON COLUMN audit_logs.request_id IS 'Unique identifier for request tracing';

-- =============================================
-- VERIFICATION
-- =============================================

-- Verify table creation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        RAISE NOTICE 'SUCCESS: audit_logs table created';
    ELSE
        RAISE EXCEPTION 'FAILED: audit_logs table not created';
    END IF;
END $$;
