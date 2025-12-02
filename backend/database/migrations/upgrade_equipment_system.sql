-- Upgrade Script: Drop and recreate equipment system
-- Use this if equipment tables already exist from previous partial implementation

BEGIN;

-- Drop existing objects in reverse dependency order
DROP VIEW IF EXISTS vw_equipment_availability CASCADE;
DROP TABLE IF EXISTS equipment_rentals CASCADE;
DROP TABLE IF EXISTS agency_equipment CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS get_equipment_availability_by_date(INTEGER, DATE, DATE) CASCADE;
DROP FUNCTION IF EXISTS get_equipment_rental_revenue(INTEGER, DATE, DATE) CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_reservations() CASCADE;
DROP FUNCTION IF EXISTS validate_rental_quantity() CASCADE;
DROP FUNCTION IF EXISTS update_equipment_timestamp() CASCADE;

COMMIT;

-- Now run the main migration
\i /docker-entrypoint-initdb.d/020_create_equipment_system.sql
