import pool from './src/config/database.js';

async function upgradeAuditLogs() {
  const client = await pool.connect();

  try {
    console.log('🔄 Upgrading audit_logs table...');

    await client.query('BEGIN');

    // Drop old table and recreate with new schema
    console.log('Dropping old audit_logs table...');
    await client.query('DROP TABLE IF EXISTS audit_logs CASCADE');

    console.log('Creating new audit_logs table with enhanced schema...');
    await client.query(`
      CREATE TABLE audit_logs (
        id BIGSERIAL PRIMARY KEY,

        -- Event Information
        event_type VARCHAR(50) NOT NULL,
        entity_type VARCHAR(100),
        entity_id BIGINT,

        -- User Information
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        user_email VARCHAR(255),
        user_role VARCHAR(50),
        impersonated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,

        -- Request Details
        action VARCHAR(255) NOT NULL,
        method VARCHAR(10),
        endpoint VARCHAR(500),
        ip_address INET,
        user_agent TEXT,

        -- Changes Tracking
        old_values JSONB,
        new_values JSONB,
        changed_fields TEXT[],

        -- Metadata
        status VARCHAR(20) DEFAULT 'SUCCESS',
        error_message TEXT,
        duration_ms INTEGER,
        metadata JSONB,

        -- Session Information
        session_id VARCHAR(255),
        request_id UUID,

        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

        -- Constraints
        CHECK (event_type IN ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ACCESS', 'VIEW', 'ERROR', 'SECURITY', 'EXPORT', 'IMPORT'))
      );
    `);

    console.log('Creating indexes...');
    await client.query(`
      CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
      CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id) WHERE user_id IS NOT NULL;
      CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
      CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id) WHERE entity_type IS NOT NULL AND entity_id IS NOT NULL;
      CREATE INDEX idx_audit_logs_user_event ON audit_logs(user_id, event_type, created_at DESC) WHERE user_id IS NOT NULL;
      CREATE INDEX idx_audit_logs_entity_time ON audit_logs(entity_type, entity_id, created_at DESC) WHERE entity_type IS NOT NULL;
      CREATE INDEX idx_audit_logs_status ON audit_logs(status, created_at DESC) WHERE status != 'SUCCESS';
      CREATE INDEX idx_audit_logs_action_search ON audit_logs USING gin(to_tsvector('spanish', action));
      CREATE INDEX idx_audit_logs_ip ON audit_logs(ip_address, created_at DESC) WHERE ip_address IS NOT NULL;
      CREATE INDEX idx_audit_logs_session ON audit_logs(session_id, created_at DESC) WHERE session_id IS NOT NULL;
      CREATE INDEX idx_audit_logs_request ON audit_logs(request_id) WHERE request_id IS NOT NULL;
    `);

    console.log('Creating views...');
    await client.query(`
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
        u.email as user_name,
        dj.artistic_name as dj_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN djs dj ON u.dj_id = dj.id
      WHERE al.created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
      ORDER BY al.created_at DESC;

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
        u.email as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.status IN ('FAILURE', 'ERROR')
      ORDER BY al.created_at DESC;

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

      CREATE OR REPLACE VIEW user_activity_summary AS
      SELECT
        u.id as user_id,
        u.email,
        u.email as nombre,
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
      GROUP BY u.id, u.email, u.role;

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
        u.email as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.entity_type IS NOT NULL
        AND al.entity_id IS NOT NULL
        AND al.event_type IN ('CREATE', 'UPDATE', 'DELETE')
      ORDER BY al.entity_type, al.entity_id, al.created_at DESC;
    `);

    console.log('Creating functions...');
    await client.query(`
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
          u.email as user_name,
          al.created_at
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.entity_type = p_entity_type
          AND al.entity_id = p_entity_id
        ORDER BY al.created_at DESC
        LIMIT p_limit;
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(
        retention_days INTEGER DEFAULT 365
      )
      RETURNS INTEGER AS $$
      DECLARE
        deleted_count INTEGER;
      BEGIN
        DELETE FROM audit_logs
        WHERE created_at < CURRENT_TIMESTAMP - (retention_days || ' days')::INTERVAL
          AND event_type NOT IN ('SECURITY', 'ERROR')
          AND status = 'SUCCESS';

        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RETURN deleted_count;
      END;
      $$ LANGUAGE plpgsql;

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
          jsonb_object_agg(COALESCE(event_type::TEXT, 'null'), event_count) as events_by_type,
          jsonb_object_agg(COALESCE(entity_type::TEXT, 'null'), entity_count) as events_by_entity,
          jsonb_object_agg(hour::TEXT, hour_count) as hourly_distribution
        FROM (
          SELECT
            event_type,
            entity_type,
            EXTRACT(HOUR FROM al.created_at)::INTEGER as hour,
            COUNT(*) as event_count,
            COUNT(*) as entity_count,
            COUNT(*) as hour_count
          FROM audit_logs al
          WHERE al.created_at BETWEEN start_date AND end_date
          GROUP BY event_type, entity_type, hour
        ) stats;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query('COMMIT');

    console.log('✅ Audit logs table upgraded successfully!');
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Upgrade failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
  }
}

upgradeAuditLogs();
