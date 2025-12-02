/**
 * Migration: 018 - Performance Optimization
 * Sprint 6.1 - Database Performance Improvements
 *
 * Features:
 * - Strategic indexes for frequent queries
 * - Composite indexes for multi-column searches
 * - Partial indexes for soft deletes
 * - Index optimization for foreign keys
 * - Query performance improvements
 */

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- EVENTOS - Critical table for business operations
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Composite index for date range queries with agency filter
CREATE INDEX IF NOT EXISTS idx_eventos_agency_fecha
ON eventos(agency_id, fecha DESC)
WHERE deleted_at IS NULL;

-- Index for DJ availability queries
CREATE INDEX IF NOT EXISTS idx_eventos_dj_fecha
ON eventos(dj_id, fecha)
WHERE deleted_at IS NULL;

-- Index for client event history
CREATE INDEX IF NOT EXISTS idx_eventos_cliente_fecha
ON eventos(cliente_id, fecha DESC)
WHERE deleted_at IS NULL;

-- Index for event status queries
CREATE INDEX IF NOT EXISTS idx_eventos_estado
ON eventos(estado)
WHERE deleted_at IS NULL;

-- Full-text search index for event names
CREATE INDEX IF NOT EXISTS idx_eventos_evento_trgm
ON eventos USING gin(evento gin_trgm_ops)
WHERE deleted_at IS NULL;

-- Composite index for financial queries
CREATE INDEX IF NOT EXISTS idx_eventos_agency_fecha_cache
ON eventos(agency_id, fecha, cache_total)
WHERE deleted_at IS NULL;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- DJS - Performance critical for availability checks
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Index for DJ search and listing
CREATE INDEX IF NOT EXISTS idx_djs_agency_nombre
ON djs(agency_id, nombre)
WHERE deleted_at IS NULL;

-- Index for active DJs
CREATE INDEX IF NOT EXISTS idx_djs_active
ON djs(agency_id, activo)
WHERE deleted_at IS NULL AND activo = true;

-- Full-text search for DJ names
CREATE INDEX IF NOT EXISTS idx_djs_nombre_trgm
ON djs USING gin(nombre gin_trgm_ops)
WHERE deleted_at IS NULL;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- CLIENTES - Frequent searches and filters
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Index for client search
CREATE INDEX IF NOT EXISTS idx_clientes_agency_nombre
ON clientes(agency_id, nombre)
WHERE deleted_at IS NULL;

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_clientes_email
ON clientes(email)
WHERE deleted_at IS NULL AND email IS NOT NULL;

-- Index for phone lookups
CREATE INDEX IF NOT EXISTS idx_clientes_telefono
ON clientes(telefono)
WHERE deleted_at IS NULL AND telefono IS NOT NULL;

-- Full-text search for client names
CREATE INDEX IF NOT EXISTS idx_clientes_nombre_trgm
ON clientes USING gin(nombre gin_trgm_ops)
WHERE deleted_at IS NULL;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PAYMENTS - High-frequency queries
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Composite index for payment listing with filters
CREATE INDEX IF NOT EXISTS idx_payments_agency_created
ON payments(agency_id, created_at DESC)
WHERE deleted_at IS NULL;

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_payments_status
ON payments(agency_id, status)
WHERE deleted_at IS NULL;

-- Index for payment type analytics
CREATE INDEX IF NOT EXISTS idx_payments_type_created
ON payments(agency_id, payment_type, created_at)
WHERE deleted_at IS NULL;

-- Index for Stripe payment intent lookups
CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent
ON payments(stripe_payment_intent_id)
WHERE deleted_at IS NULL AND stripe_payment_intent_id IS NOT NULL;

-- Index for event payments
CREATE INDEX IF NOT EXISTS idx_payments_evento
ON payments(evento_id, status)
WHERE deleted_at IS NULL AND evento_id IS NOT NULL;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- DOCUMENTS - File management queries
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Composite index for document listing
CREATE INDEX IF NOT EXISTS idx_documents_agency_uploaded
ON documents(agency_id, uploaded_at DESC)
WHERE deleted_at IS NULL;

-- Index for document type filtering
CREATE INDEX IF NOT EXISTS idx_documents_type
ON documents(agency_id, document_type)
WHERE deleted_at IS NULL;

-- Index for entity document lookups
CREATE INDEX IF NOT EXISTS idx_documents_entity
ON documents(entity_type, entity_id)
WHERE deleted_at IS NULL;

-- Full-text search for document names
CREATE INDEX IF NOT EXISTS idx_documents_filename_trgm
ON documents USING gin(filename gin_trgm_ops)
WHERE deleted_at IS NULL;

-- Index for version management
CREATE INDEX IF NOT EXISTS idx_documents_parent
ON documents(parent_document_id, version)
WHERE deleted_at IS NULL AND parent_document_id IS NOT NULL;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- RESERVATIONS - Availability and booking queries
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Index for reservation status queries
CREATE INDEX IF NOT EXISTS idx_reservations_status
ON reservations(agency_id, status, event_date)
WHERE deleted_at IS NULL;

-- Index for hold expiration checks
CREATE INDEX IF NOT EXISTS idx_reservations_hold_expires
ON reservations(hold_expires_at)
WHERE status = 'hold' AND deleted_at IS NULL;

-- Index for DJ availability
CREATE INDEX IF NOT EXISTS idx_reservations_dj_date
ON reservations(dj_id, event_date)
WHERE deleted_at IS NULL;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- GOOGLE CALENDAR - Sync operations
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Index for next sync scheduling
CREATE INDEX IF NOT EXISTS idx_calendar_connections_next_sync
ON google_calendar_connections(next_sync_at)
WHERE auto_sync = true AND status = 'active' AND deleted_at IS NULL;

-- Index for event mappings by connection
CREATE INDEX IF NOT EXISTS idx_calendar_mappings_connection
ON event_calendar_mappings(connection_id, synced_at DESC)
WHERE deleted_at IS NULL;

-- Index for conflict detection
CREATE INDEX IF NOT EXISTS idx_calendar_mappings_conflicts
ON event_calendar_mappings(has_conflict)
WHERE has_conflict = true AND deleted_at IS NULL;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- NOTIFICATIONS - Real-time delivery
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Index for unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
ON notifications(user_id, created_at DESC)
WHERE read_at IS NULL AND deleted_at IS NULL;

-- Index for notification type filtering
CREATE INDEX IF NOT EXISTS idx_notifications_type
ON notifications(user_id, notification_type, created_at DESC)
WHERE deleted_at IS NULL;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- LEADS - CRM queries
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Index for lead status pipeline
CREATE INDEX IF NOT EXISTS idx_leads_status_created
ON leads(agency_id, status, created_at DESC)
WHERE deleted_at IS NULL;

-- Index for lead assignment
CREATE INDEX IF NOT EXISTS idx_leads_assigned
ON leads(assigned_to, status)
WHERE deleted_at IS NULL AND assigned_to IS NOT NULL;

-- Index for follow-up queries
CREATE INDEX IF NOT EXISTS idx_leads_follow_up
ON leads(agency_id, next_follow_up)
WHERE deleted_at IS NULL AND next_follow_up IS NOT NULL;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- USERS & AUTH - Security and session queries
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Index for login queries
CREATE INDEX IF NOT EXISTS idx_users_username
ON users(username)
WHERE deleted_at IS NULL;

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email
ON users(email)
WHERE deleted_at IS NULL AND email IS NOT NULL;

-- Index for agency users
CREATE INDEX IF NOT EXISTS idx_users_agency
ON users(agency_id)
WHERE deleted_at IS NULL;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FINANCIAL TABLES - Analytics and reporting
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Index for profit distribution queries
CREATE INDEX IF NOT EXISTS idx_profit_distributions_agency_period
ON profit_distributions(agency_id, period_start, period_end)
WHERE deleted_at IS NULL;

-- Index for monthly expenses
CREATE INDEX IF NOT EXISTS idx_monthly_expenses_agency_month
ON monthly_expenses(agency_id, expense_month)
WHERE deleted_at IS NULL;

-- Index for financial alerts
CREATE INDEX IF NOT EXISTS idx_financial_alerts_agency_active
ON financial_alerts(agency_id, is_active, created_at DESC)
WHERE deleted_at IS NULL;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ENABLE pg_trgm EXTENSION FOR FULL-TEXT SEARCH
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Enable trigram extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- QUERY OPTIMIZATION HELPERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Function to analyze table statistics
CREATE OR REPLACE FUNCTION analyze_table_stats()
RETURNS TABLE (
  tablename TEXT,
  total_rows BIGINT,
  dead_rows BIGINT,
  last_vacuum TIMESTAMP,
  last_analyze TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    schemaname || '.' || relname AS tablename,
    n_live_tup AS total_rows,
    n_dead_tup AS dead_rows,
    last_vacuum,
    last_analyze
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
  ORDER BY n_live_tup DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get slow queries (requires pg_stat_statements extension)
CREATE OR REPLACE FUNCTION get_slow_queries(min_duration_ms INTEGER DEFAULT 1000)
RETURNS TABLE (
  query TEXT,
  calls BIGINT,
  total_time_ms NUMERIC,
  mean_time_ms NUMERIC,
  max_time_ms NUMERIC
) AS $$
BEGIN
  -- Check if pg_stat_statements is available
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
  ) THEN
    RAISE NOTICE 'pg_stat_statements extension is not installed. Install with: CREATE EXTENSION pg_stat_statements;';
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    pss.query,
    pss.calls,
    ROUND(pss.total_exec_time::numeric, 2) AS total_time_ms,
    ROUND(pss.mean_exec_time::numeric, 2) AS mean_time_ms,
    ROUND(pss.max_exec_time::numeric, 2) AS max_time_ms
  FROM pg_stat_statements pss
  WHERE pss.mean_exec_time > min_duration_ms
  ORDER BY pss.mean_exec_time DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Function to get table sizes
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE (
  schema_name TEXT,
  table_name TEXT,
  total_size TEXT,
  table_size TEXT,
  indexes_size TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    schemaname::TEXT,
    tablename::TEXT,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))::TEXT AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename))::TEXT AS table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename))::TEXT AS indexes_size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- MAINTENANCE RECOMMENDATIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Update statistics after migration
ANALYZE;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- COMMENTS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMMENT ON FUNCTION analyze_table_stats() IS 'Get statistics about table sizes and maintenance status';
COMMENT ON FUNCTION get_slow_queries(INTEGER) IS 'Get slow queries from pg_stat_statements (requires extension)';
COMMENT ON FUNCTION get_table_sizes() IS 'Get disk space usage for all tables and indexes';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PERFORMANCE MONITORING QUERIES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/*
-- Enable pg_stat_statements for query performance monitoring:
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Check table statistics:
SELECT * FROM analyze_table_stats();

-- Check slow queries:
SELECT * FROM get_slow_queries(1000); -- queries > 1 second

-- Check table sizes:
SELECT * FROM get_table_sizes();

-- Check index usage:
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;

-- Check missing indexes (low seq_scan is good):
SELECT
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  seq_tup_read / NULLIF(seq_scan, 0) AS avg_tuples_per_scan
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND seq_scan > 0
ORDER BY seq_tup_read DESC;

-- Check cache hit ratio (should be > 95%):
SELECT
  sum(heap_blks_read) AS heap_read,
  sum(heap_blks_hit) AS heap_hit,
  sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100 AS cache_hit_ratio
FROM pg_statio_user_tables;

-- Manual VACUUM and ANALYZE (run periodically):
VACUUM ANALYZE eventos;
VACUUM ANALYZE djs;
VACUUM ANALYZE clientes;
VACUUM ANALYZE payments;
VACUUM ANALYZE documents;
*/
