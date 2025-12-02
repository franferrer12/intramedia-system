/**
 * Migration: 017 - Google Calendar Integration
 * Sprint 5.2 - Sistema de integración con Google Calendar
 *
 * Features:
 * - OAuth connections per agency/user
 * - Bidirectional sync
 * - Conflict detection
 * - Sync history and logs
 */

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ENUMS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Sync status
CREATE TYPE calendar_sync_status AS ENUM (
  'pending',
  'syncing',
  'completed',
  'failed',
  'conflict'
);

-- Sync direction
CREATE TYPE sync_direction AS ENUM (
  'import',      -- Google → Sistema
  'export',      -- Sistema → Google
  'bidirectional' -- Ambos
);

-- Connection status
CREATE TYPE connection_status AS ENUM (
  'active',
  'expired',
  'revoked',
  'error'
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TABLES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Google Calendar Connections
 * Stores OAuth tokens and connection info for each agency/user
 */
CREATE TABLE google_calendar_connections (
  id BIGSERIAL PRIMARY KEY,

  -- Ownership
  agency_id BIGINT NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  dj_id BIGINT REFERENCES djs(id) ON DELETE SET NULL,

  -- OAuth Credentials
  google_email VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMP,

  -- Calendar Info
  calendar_id VARCHAR(255) NOT NULL, -- Primary calendar ID from Google
  calendar_name VARCHAR(255),
  calendar_timezone VARCHAR(100) DEFAULT 'Europe/Madrid',

  -- Sync Settings
  sync_enabled BOOLEAN DEFAULT true,
  sync_direction sync_direction DEFAULT 'bidirectional',
  auto_sync BOOLEAN DEFAULT true,
  sync_interval_minutes INTEGER DEFAULT 15 CHECK (sync_interval_minutes >= 5),

  -- Last Sync
  last_sync_at TIMESTAMP,
  last_sync_status calendar_sync_status,
  next_sync_at TIMESTAMP,

  -- Status
  status connection_status DEFAULT 'active',
  error_message TEXT,
  error_count INTEGER DEFAULT 0,

  -- Metadata
  scopes TEXT[], -- OAuth scopes granted
  metadata JSONB DEFAULT '{}',

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP,

  CONSTRAINT unique_agency_calendar UNIQUE(agency_id, calendar_id)
);

-- Indexes for connections
CREATE INDEX idx_google_connections_agency ON google_calendar_connections(agency_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_google_connections_user ON google_calendar_connections(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_google_connections_dj ON google_calendar_connections(dj_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_google_connections_status ON google_calendar_connections(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_google_connections_next_sync ON google_calendar_connections(next_sync_at) WHERE auto_sync = true AND deleted_at IS NULL;

/**
 * Event Calendar Mappings
 * Maps local events to Google Calendar events
 */
CREATE TABLE event_calendar_mappings (
  id BIGSERIAL PRIMARY KEY,

  -- Local Event
  evento_id BIGINT NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  agency_id BIGINT NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- Google Calendar Event
  connection_id BIGINT NOT NULL REFERENCES google_calendar_connections(id) ON DELETE CASCADE,
  google_event_id VARCHAR(255) NOT NULL,
  google_calendar_id VARCHAR(255) NOT NULL,

  -- Sync Info
  synced_at TIMESTAMP DEFAULT NOW(),
  sync_direction sync_direction NOT NULL,
  last_modified_local TIMESTAMP,
  last_modified_google TIMESTAMP,

  -- Conflict Detection
  has_conflict BOOLEAN DEFAULT false,
  conflict_reason TEXT,
  conflict_detected_at TIMESTAMP,
  conflict_resolved_at TIMESTAMP,
  conflict_resolution_strategy VARCHAR(50), -- 'local_wins', 'google_wins', 'merge', 'manual'

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,

  CONSTRAINT unique_evento_connection UNIQUE(evento_id, connection_id),
  CONSTRAINT unique_google_event UNIQUE(google_event_id, connection_id)
);

-- Indexes for mappings
CREATE INDEX idx_event_mappings_evento ON event_calendar_mappings(evento_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_event_mappings_connection ON event_calendar_mappings(connection_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_event_mappings_google_event ON event_calendar_mappings(google_event_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_event_mappings_conflicts ON event_calendar_mappings(has_conflict) WHERE has_conflict = true AND deleted_at IS NULL;

/**
 * Google Calendar Sync Log
 * Logs all sync operations for auditing
 */
CREATE TABLE google_calendar_sync_log (
  id BIGSERIAL PRIMARY KEY,

  -- Connection
  connection_id BIGINT NOT NULL REFERENCES google_calendar_connections(id) ON DELETE CASCADE,
  agency_id BIGINT NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- Sync Info
  sync_direction sync_direction NOT NULL,
  sync_started_at TIMESTAMP DEFAULT NOW(),
  sync_completed_at TIMESTAMP,
  duration_seconds INTEGER,

  -- Status
  status calendar_sync_status DEFAULT 'pending',

  -- Stats
  events_imported INTEGER DEFAULT 0,
  events_exported INTEGER DEFAULT 0,
  events_updated INTEGER DEFAULT 0,
  events_deleted INTEGER DEFAULT 0,
  events_skipped INTEGER DEFAULT 0,
  conflicts_detected INTEGER DEFAULT 0,

  -- Error Handling
  error_message TEXT,
  error_details JSONB,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Trigger
  triggered_by VARCHAR(50) DEFAULT 'manual', -- 'manual', 'auto', 'webhook', 'cron'
  triggered_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for sync log
CREATE INDEX idx_sync_log_connection ON google_calendar_sync_log(connection_id);
CREATE INDEX idx_sync_log_agency ON google_calendar_sync_log(agency_id);
CREATE INDEX idx_sync_log_status ON google_calendar_sync_log(status);
CREATE INDEX idx_sync_log_started_at ON google_calendar_sync_log(sync_started_at DESC);

/**
 * Calendar Conflicts
 * Stores detected conflicts for resolution
 */
CREATE TABLE calendar_conflicts (
  id BIGSERIAL PRIMARY KEY,

  -- Mapping
  mapping_id BIGINT REFERENCES event_calendar_mappings(id) ON DELETE CASCADE,
  connection_id BIGINT NOT NULL REFERENCES google_calendar_connections(id) ON DELETE CASCADE,
  evento_id BIGINT NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  agency_id BIGINT NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- Conflict Details
  conflict_type VARCHAR(50) NOT NULL, -- 'time_overlap', 'data_mismatch', 'deleted_local', 'deleted_google'
  conflict_reason TEXT NOT NULL,

  -- Data Snapshot
  local_data JSONB NOT NULL,
  google_data JSONB NOT NULL,

  -- Resolution
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'resolved', 'ignored'
  resolution_strategy VARCHAR(50), -- 'local_wins', 'google_wins', 'merge', 'manual'
  resolved_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP,
  resolution_notes TEXT,

  -- Metadata
  detected_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for conflicts
CREATE INDEX idx_conflicts_status ON calendar_conflicts(status) WHERE status = 'pending';
CREATE INDEX idx_conflicts_evento ON calendar_conflicts(evento_id);
CREATE INDEX idx_conflicts_connection ON calendar_conflicts(connection_id);
CREATE INDEX idx_conflicts_detected_at ON calendar_conflicts(detected_at DESC);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- TRIGGERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_google_calendar_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER google_calendar_connections_updated_at
BEFORE UPDATE ON google_calendar_connections
FOR EACH ROW
EXECUTE FUNCTION update_google_calendar_connections_updated_at();

CREATE TRIGGER event_calendar_mappings_updated_at
BEFORE UPDATE ON event_calendar_mappings
FOR EACH ROW
EXECUTE FUNCTION update_google_calendar_connections_updated_at();

CREATE TRIGGER calendar_conflicts_updated_at
BEFORE UPDATE ON calendar_conflicts
FOR EACH ROW
EXECUTE FUNCTION update_google_calendar_connections_updated_at();

-- Schedule next sync
CREATE OR REPLACE FUNCTION schedule_next_sync()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.auto_sync = true AND NEW.status = 'active' THEN
    NEW.next_sync_at = NOW() + (NEW.sync_interval_minutes || ' minutes')::INTERVAL;
  ELSE
    NEW.next_sync_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schedule_next_sync_trigger
BEFORE INSERT OR UPDATE OF last_sync_at, auto_sync, sync_interval_minutes
ON google_calendar_connections
FOR EACH ROW
EXECUTE FUNCTION schedule_next_sync();

-- Track sync completion
CREATE OR REPLACE FUNCTION update_sync_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sync_completed_at IS NOT NULL AND OLD.sync_completed_at IS NULL THEN
    NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.sync_completed_at - NEW.sync_started_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_completion_trigger
BEFORE UPDATE OF sync_completed_at
ON google_calendar_sync_log
FOR EACH ROW
EXECUTE FUNCTION update_sync_completion();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- VIEWS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Active Connections View
 * All active Google Calendar connections with sync status
 */
CREATE OR REPLACE VIEW active_calendar_connections AS
SELECT
  gc.id,
  gc.agency_id,
  gc.user_id,
  gc.dj_id,
  gc.google_email,
  gc.calendar_id,
  gc.calendar_name,
  gc.calendar_timezone,
  gc.sync_enabled,
  gc.sync_direction,
  gc.auto_sync,
  gc.sync_interval_minutes,
  gc.last_sync_at,
  gc.last_sync_status,
  gc.next_sync_at,
  gc.status,
  gc.error_count,
  gc.token_expiry,
  gc.token_expiry < NOW() AS token_expired,
  a.name AS agency_name,
  u.username AS user_username,
  d.nombre AS dj_nombre,
  COALESCE(
    (SELECT COUNT(*) FROM event_calendar_mappings WHERE connection_id = gc.id AND deleted_at IS NULL),
    0
  ) AS mapped_events_count,
  COALESCE(
    (SELECT COUNT(*) FROM event_calendar_mappings WHERE connection_id = gc.id AND has_conflict = true AND deleted_at IS NULL),
    0
  ) AS conflicts_count
FROM google_calendar_connections gc
LEFT JOIN agencies a ON gc.agency_id = a.id
LEFT JOIN users u ON gc.user_id = u.id
LEFT JOIN djs d ON gc.dj_id = d.id
WHERE gc.deleted_at IS NULL;

/**
 * Pending Conflicts View
 * All unresolved conflicts
 */
CREATE OR REPLACE VIEW pending_calendar_conflicts AS
SELECT
  cf.id,
  cf.evento_id,
  cf.connection_id,
  cf.agency_id,
  cf.conflict_type,
  cf.conflict_reason,
  cf.detected_at,
  e.evento AS evento_nombre,
  e.fecha AS evento_fecha,
  e.ubicacion AS evento_ubicacion,
  gc.google_email,
  gc.calendar_name,
  a.name AS agency_name
FROM calendar_conflicts cf
INNER JOIN eventos e ON cf.evento_id = e.id
INNER JOIN google_calendar_connections gc ON cf.connection_id = gc.id
INNER JOIN agencies a ON cf.agency_id = a.id
WHERE cf.status = 'pending'
ORDER BY cf.detected_at DESC;

/**
 * Sync Statistics View
 * Aggregated sync statistics per connection
 */
CREATE OR REPLACE VIEW calendar_sync_stats AS
SELECT
  gc.id AS connection_id,
  gc.agency_id,
  gc.google_email,
  gc.calendar_name,
  COUNT(sl.id) AS total_syncs,
  SUM(CASE WHEN sl.status = 'completed' THEN 1 ELSE 0 END) AS successful_syncs,
  SUM(CASE WHEN sl.status = 'failed' THEN 1 ELSE 0 END) AS failed_syncs,
  SUM(sl.events_imported) AS total_imported,
  SUM(sl.events_exported) AS total_exported,
  SUM(sl.conflicts_detected) AS total_conflicts,
  MAX(sl.sync_started_at) AS last_sync_time,
  AVG(sl.duration_seconds) AS avg_sync_duration_seconds
FROM google_calendar_connections gc
LEFT JOIN google_calendar_sync_log sl ON gc.id = sl.connection_id
WHERE gc.deleted_at IS NULL
GROUP BY gc.id, gc.agency_id, gc.google_email, gc.calendar_name;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FUNCTIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Get connections needing sync
 * Returns all connections that should be synced now
 */
CREATE OR REPLACE FUNCTION get_connections_needing_sync()
RETURNS TABLE (
  connection_id BIGINT,
  agency_id BIGINT,
  google_email VARCHAR,
  calendar_id VARCHAR,
  minutes_since_last_sync INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gc.id,
    gc.agency_id,
    gc.google_email,
    gc.calendar_id,
    EXTRACT(EPOCH FROM (NOW() - gc.last_sync_at))::INTEGER / 60
  FROM google_calendar_connections gc
  WHERE gc.deleted_at IS NULL
    AND gc.status = 'active'
    AND gc.sync_enabled = true
    AND gc.auto_sync = true
    AND (
      gc.next_sync_at IS NULL
      OR gc.next_sync_at <= NOW()
    )
  ORDER BY gc.next_sync_at ASC NULLS FIRST;
END;
$$ LANGUAGE plpgsql;

/**
 * Check for scheduling conflicts
 * Detects time overlaps for a DJ
 */
CREATE OR REPLACE FUNCTION check_calendar_conflicts(
  p_dj_id BIGINT,
  p_evento_fecha TIMESTAMP,
  p_evento_duracion INTEGER DEFAULT 240, -- minutes
  p_exclude_evento_id BIGINT DEFAULT NULL
)
RETURNS TABLE (
  conflict_type VARCHAR,
  conflicting_evento_id BIGINT,
  conflicting_evento_nombre VARCHAR,
  overlap_minutes INTEGER
) AS $$
DECLARE
  v_end_time TIMESTAMP;
BEGIN
  v_end_time := p_evento_fecha + (p_evento_duracion || ' minutes')::INTERVAL;

  RETURN QUERY
  SELECT
    'time_overlap'::VARCHAR,
    e.id,
    e.evento,
    EXTRACT(EPOCH FROM (
      LEAST(v_end_time, e.fecha + (COALESCE(e.duracion_minutos, 240) || ' minutes')::INTERVAL) -
      GREATEST(p_evento_fecha, e.fecha)
    ))::INTEGER / 60
  FROM eventos e
  WHERE e.dj_id = p_dj_id
    AND e.deleted_at IS NULL
    AND (p_exclude_evento_id IS NULL OR e.id != p_exclude_evento_id)
    AND (
      -- Event overlaps with new event
      (e.fecha, e.fecha + (COALESCE(e.duracion_minutos, 240) || ' minutes')::INTERVAL)
      OVERLAPS
      (p_evento_fecha, v_end_time)
    );
END;
$$ LANGUAGE plpgsql;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- COMMENTS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMMENT ON TABLE google_calendar_connections IS 'OAuth connections to Google Calendar per agency/user/DJ';
COMMENT ON TABLE event_calendar_mappings IS 'Maps local eventos to Google Calendar events';
COMMENT ON TABLE google_calendar_sync_log IS 'Audit log of all sync operations';
COMMENT ON TABLE calendar_conflicts IS 'Stores detected scheduling conflicts for resolution';

COMMENT ON COLUMN google_calendar_connections.sync_interval_minutes IS 'Auto-sync interval (minimum 5 minutes)';
COMMENT ON COLUMN google_calendar_connections.token_expiry IS 'When access token expires (1 hour from issue)';
COMMENT ON COLUMN event_calendar_mappings.has_conflict IS 'True if data mismatch detected between local and Google';
COMMENT ON COLUMN calendar_conflicts.conflict_type IS 'Type: time_overlap, data_mismatch, deleted_local, deleted_google';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- INITIAL DATA
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- No initial data needed for Google Calendar connections
-- Connections will be created via OAuth flow

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PERMISSIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Grant permissions (adjust based on your user setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON google_calendar_connections TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON event_calendar_mappings TO app_user;
-- GRANT SELECT, INSERT, UPDATE ON google_calendar_sync_log TO app_user;
-- GRANT SELECT, INSERT, UPDATE ON calendar_conflicts TO app_user;
