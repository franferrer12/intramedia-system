-- Migration to add agency_id column to djs table
-- This allows DJs to be linked to agencies in the multi-tenant system
-- Safe to execute multiple times

BEGIN;

-- Add agency_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'djs' AND column_name = 'agency_id'
  ) THEN
    ALTER TABLE djs ADD COLUMN agency_id INTEGER REFERENCES agencies(id) ON DELETE SET NULL;
    RAISE NOTICE 'Column agency_id added to djs table';
  ELSE
    RAISE NOTICE 'Column agency_id already exists in djs table';
  END IF;
END$$;

-- Add Instagram username column if it doesn't exist (for social media tracking)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'djs' AND column_name = 'instagram_username'
  ) THEN
    ALTER TABLE djs ADD COLUMN instagram_username VARCHAR(255);
    RAISE NOTICE 'Column instagram_username added to djs table';
  ELSE
    RAISE NOTICE 'Column instagram_username already exists in djs table';
  END IF;
END$$;

-- Create index for agency_id for better query performance
CREATE INDEX IF NOT EXISTS idx_djs_agency_id ON djs(agency_id);

-- Create index for managed_by for better query performance
CREATE INDEX IF NOT EXISTS idx_djs_managed_by ON djs(managed_by);

COMMIT;

-- Show result
SELECT
  'djs' as tabla,
  COUNT(*) as total_djs,
  COUNT(CASE WHEN agency_id IS NOT NULL THEN 1 END) as djs_con_agencia,
  COUNT(CASE WHEN managed_by = 'self' THEN 1 END) as djs_independientes
FROM djs;
