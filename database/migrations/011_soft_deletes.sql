-- Migration: Soft Deletes System
-- Description: Add deleted_at column to main tables for soft delete functionality
-- Version: 011
-- Date: 2025-10-27

-- Add deleted_at column to main tables
ALTER TABLE djs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;
ALTER TABLE socios ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;
ALTER TABLE social_media_accounts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

-- Create indexes for deleted_at columns (for WHERE deleted_at IS NULL queries)
CREATE INDEX IF NOT EXISTS idx_djs_deleted_at ON djs(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clientes_deleted_at ON clientes(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_eventos_deleted_at ON eventos(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_socios_deleted_at ON socios(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_deleted_at ON leads(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_requests_deleted_at ON requests(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_social_media_accounts_deleted_at ON social_media_accounts(deleted_at) WHERE deleted_at IS NULL;

-- Helper function to soft delete
CREATE OR REPLACE FUNCTION soft_delete(table_name TEXT, record_id INTEGER)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('UPDATE %I SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL', table_name)
    USING record_id;
END;
$$ LANGUAGE plpgsql;

-- Helper function to restore soft deleted record
CREATE OR REPLACE FUNCTION restore_soft_delete(table_name TEXT, record_id INTEGER)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('UPDATE %I SET deleted_at = NULL WHERE id = $1', table_name)
    USING record_id;
END;
$$ LANGUAGE plpgsql;

-- Helper function to permanently delete soft deleted records
CREATE OR REPLACE FUNCTION hard_delete(table_name TEXT, record_id INTEGER)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('DELETE FROM %I WHERE id = $1 AND deleted_at IS NOT NULL', table_name)
    USING record_id;
END;
$$ LANGUAGE plpgsql;

-- View para DJs activos (no eliminados)
CREATE OR REPLACE VIEW vw_djs_activos AS
SELECT * FROM djs WHERE deleted_at IS NULL;

-- View para Clientes activos
CREATE OR REPLACE VIEW vw_clientes_activos AS
SELECT * FROM clientes WHERE deleted_at IS NULL;

-- View para Eventos activos
CREATE OR REPLACE VIEW vw_eventos_activos AS
SELECT * FROM eventos WHERE deleted_at IS NULL;

-- Comments
COMMENT ON COLUMN djs.deleted_at IS 'Timestamp of soft deletion. NULL = active record';
COMMENT ON COLUMN clientes.deleted_at IS 'Timestamp of soft deletion. NULL = active record';
COMMENT ON COLUMN eventos.deleted_at IS 'Timestamp of soft deletion. NULL = active record';
COMMENT ON FUNCTION soft_delete IS 'Soft delete a record by setting deleted_at timestamp';
COMMENT ON FUNCTION restore_soft_delete IS 'Restore a soft deleted record';
COMMENT ON FUNCTION hard_delete IS 'Permanently delete a soft deleted record';
