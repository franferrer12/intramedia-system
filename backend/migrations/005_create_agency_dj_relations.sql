-- Migration to create agency_dj_relations table
-- This table manages the relationship between agencies and DJs
-- Safe to execute multiple times

BEGIN;

-- Create agency_dj_relations table if not exists
CREATE TABLE IF NOT EXISTS agency_dj_relations (
  id SERIAL PRIMARY KEY,
  agency_id INTEGER NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  dj_id INTEGER NOT NULL REFERENCES djs(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'managed',
  commission_rate DECIMAL(5,2) DEFAULT 0.00,
  contract_start_date DATE,
  contract_end_date DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Ensure unique active relationship between agency and DJ
  CONSTRAINT unique_active_agency_dj UNIQUE (agency_id, dj_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_agency_dj_relations_agency_id ON agency_dj_relations(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_dj_relations_dj_id ON agency_dj_relations(dj_id);
CREATE INDEX IF NOT EXISTS idx_agency_dj_relations_active ON agency_dj_relations(active);

COMMIT;

-- Show result
SELECT
  'agency_dj_relations' as tabla,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN active = true THEN 1 END) as activos
FROM agency_dj_relations;
