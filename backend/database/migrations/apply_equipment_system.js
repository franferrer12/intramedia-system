import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'intra_media_system'
});

async function applyMigration() {
  const client = await pool.connect();

  try {
    console.log('🔧 Starting equipment system migration...\n');

    // Step 1: Drop existing objects
    console.log('📦 Dropping existing equipment tables and objects...');
    await client.query('DROP VIEW IF EXISTS vw_equipment_availability CASCADE');
    await client.query('DROP TABLE IF EXISTS equipment_rentals CASCADE');
    await client.query('DROP TABLE IF EXISTS agency_equipment CASCADE');
    await client.query('DROP FUNCTION IF EXISTS get_equipment_availability_by_date(INTEGER, DATE, DATE) CASCADE');
    await client.query('DROP FUNCTION IF EXISTS get_equipment_rental_revenue(INTEGER, DATE, DATE) CASCADE');
    await client.query('DROP FUNCTION IF EXISTS cleanup_expired_reservations() CASCADE');
    await client.query('DROP FUNCTION IF EXISTS validate_rental_quantity() CASCADE');
    await client.query('DROP FUNCTION IF EXISTS update_equipment_timestamp() CASCADE');
    console.log('✅ Existing objects dropped\n');

    // Step 2: Read and apply migration
    console.log('📝 Reading migration file...');
    const migrationPath = join(__dirname, '020_create_equipment_system.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    console.log('✅ Migration file loaded\n');

    console.log('🚀 Applying migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration applied successfully!\n');

    // Step 3: Verify tables
    console.log('🔍 Verifying tables...');
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('agency_equipment', 'equipment_rentals')
      ORDER BY table_name
    `);

    if (tables.rows.length === 2) {
      console.log('✅ Tables created:');
      tables.rows.forEach(row => console.log(`   - ${row.table_name}`));
    } else {
      console.log('⚠️  Warning: Expected 2 tables, found', tables.rows.length);
    }

    // Step 4: Verify view
    console.log('\n🔍 Verifying view...');
    const views = await client.query(`
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = 'public'
      AND table_name = 'vw_equipment_availability'
    `);

    if (views.rows.length > 0) {
      console.log('✅ View created: vw_equipment_availability');
    }

    // Step 5: Verify functions
    console.log('\n🔍 Verifying functions...');
    const functions = await client.query(`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name IN (
        'get_equipment_availability_by_date',
        'get_equipment_rental_revenue',
        'cleanup_expired_reservations',
        'validate_rental_quantity',
        'update_equipment_timestamp'
      )
      ORDER BY routine_name
    `);

    console.log(`✅ Functions created (${functions.rows.length}/5):`);
    functions.rows.forEach(row => console.log(`   - ${row.routine_name}`));

    console.log('\n✨ Equipment system migration completed successfully!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
applyMigration();
