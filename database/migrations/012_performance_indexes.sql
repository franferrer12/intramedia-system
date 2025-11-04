-- Migration: Performance Indexes
-- Description: Add optimized indexes for frequently queried columns
-- Version: 012
-- Date: 2025-10-27

-- ==================== EVENTOS TABLE ====================
-- Index for filtering by date range (very common in reports)
CREATE INDEX IF NOT EXISTS idx_eventos_fecha ON eventos(fecha DESC);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_eventos_status ON eventos(estado);

-- Composite index for DJ + date queries
CREATE INDEX IF NOT EXISTS idx_eventos_dj_fecha ON eventos(dj_id, fecha DESC);

-- Composite index for Cliente + date queries
CREATE INDEX IF NOT EXISTS idx_eventos_cliente_fecha ON eventos(cliente_id, fecha DESC);

-- Index for payment status queries
CREATE INDEX IF NOT EXISTS idx_eventos_cobrado ON eventos(cobrado_cliente);
CREATE INDEX IF NOT EXISTS idx_eventos_pagado_dj ON eventos(pagado_dj);

-- Composite index for financial queries (unpaid events)
CREATE INDEX IF NOT EXISTS idx_eventos_financial ON eventos(cobrado_cliente, fecha) WHERE cobrado_cliente = FALSE;

-- ==================== DJS TABLE ====================
-- Index for searching by name (ILIKE queries)
CREATE INDEX IF NOT EXISTS idx_djs_nombre_trgm ON djs USING gin (nombre gin_trgm_ops);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_djs_email ON djs(email);

-- Index for active DJs
CREATE INDEX IF NOT EXISTS idx_djs_activo ON djs(activo) WHERE activo = TRUE;

-- Index for agency multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_djs_agency ON djs(agency_id) WHERE agency_id IS NOT NULL;

-- ==================== CLIENTES TABLE ====================
-- Index for searching by name
CREATE INDEX IF NOT EXISTS idx_clientes_nombre_trgm ON clientes USING gin (nombre gin_trgm_ops);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);

-- Index for phone lookups
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON clientes(telefono);

-- Index for client type filtering
CREATE INDEX IF NOT EXISTS idx_clientes_tipo ON clientes(tipo_cliente);

-- Index for agency multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_clientes_agency ON clientes(agency_id) WHERE agency_id IS NOT NULL;

-- ==================== LEADS TABLE ====================
-- Index for leads by status
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- Index for leads by source
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);

-- Index for leads by date
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);

-- Index for conversion funnel analysis
CREATE INDEX IF NOT EXISTS idx_leads_converted ON leads(converted_to_client) WHERE converted_to_client = TRUE;

-- ==================== REQUESTS TABLE ====================
-- Index for requests by status
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);

-- Index for requests by date
CREATE INDEX IF NOT EXISTS idx_requests_fecha_evento ON requests(fecha_evento);

-- Index for unassigned requests (for assignment queue)
CREATE INDEX IF NOT EXISTS idx_requests_sin_asignar ON requests(dj_id) WHERE dj_id IS NULL;

-- ==================== SOCIAL MEDIA ====================
-- Index for active social media accounts
CREATE INDEX IF NOT EXISTS idx_social_media_active ON social_media_accounts(dj_id, platform, active) WHERE active = TRUE;

-- Index for metrics by date
CREATE INDEX IF NOT EXISTS idx_social_snapshots_date ON social_media_snapshots(dj_id, platform, created_at DESC);

-- Index for latest metrics per platform
CREATE INDEX IF NOT EXISTS idx_social_snapshots_latest ON social_media_snapshots(dj_id, platform, created_at DESC);

-- ==================== FINANCIAL TABLES ====================
-- Index for unpaid DJ commissions
CREATE INDEX IF NOT EXISTS idx_djs_financial_unpaid ON djs_financial_overview(dj_id, estado_pago) WHERE estado_pago = 'pendiente';

-- Index for client payment status
CREATE INDEX IF NOT EXISTS idx_clientes_financial_unpaid ON clientes_financial_overview(cliente_id, tiene_facturas_pendientes) WHERE tiene_facturas_pendientes = TRUE;

-- ==================== INTERACTIONS TABLE ====================
-- Index for interactions by lead
CREATE INDEX IF NOT EXISTS idx_interactions_lead ON interactions(lead_id, created_at DESC);

-- Index for interactions by type
CREATE INDEX IF NOT EXISTS idx_interactions_tipo ON interactions(tipo);

-- Index for follow-up tracking
CREATE INDEX IF NOT EXISTS idx_interactions_next_followup ON interactions(next_followup_date) WHERE next_followup_date IS NOT NULL;

-- ==================== PROFIT DISTRIBUTION ====================
-- Index for distributions by event
CREATE INDEX IF NOT EXISTS idx_profit_dist_evento ON profit_distributions(evento_id);

-- Index for distributions by DJ
CREATE INDEX IF NOT EXISTS idx_profit_dist_dj ON profit_distributions(dj_id, created_at DESC);

-- Index for distributions by socio
CREATE INDEX IF NOT EXISTS idx_profit_dist_socio ON profit_distributions(socio_id, created_at DESC) WHERE socio_id IS NOT NULL;

-- ==================== ENABLE pg_trgm for text search ====================
-- Enable pg_trgm extension for trigram text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ==================== STATISTICS ====================
-- Update table statistics for better query planning
ANALYZE eventos;
ANALYZE djs;
ANALYZE clientes;
ANALYZE leads;
ANALYZE requests;
ANALYZE social_media_accounts;
ANALYZE social_media_snapshots;
ANALYZE interactions;
ANALYZE profit_distributions;

-- Comments
COMMENT ON INDEX idx_eventos_fecha IS 'Optimizes date range queries and sorting by date';
COMMENT ON INDEX idx_eventos_dj_fecha IS 'Optimizes DJ schedule and history queries';
COMMENT ON INDEX idx_djs_nombre_trgm IS 'Enables fast text search on DJ names using trigrams';
COMMENT ON INDEX idx_eventos_financial IS 'Optimizes financial queries for unpaid events';
