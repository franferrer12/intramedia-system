import pg from 'pg';
import fs from 'fs';

const { Pool } = pg;

const pool = new Pool({
  user: 'club_admin',
  host: 'localhost',
  database: 'intra_media_system',
  password: 'club_password',
  port: 5432,
});

async function executeCleanupAndMigration() {
  const client = await pool.connect();

  try {
    console.log('\n🧹 STEP 1: Cleaning up existing objects...\n');

    // Cleanup in correct order
    await client.query('DROP TRIGGER IF EXISTS trigger_auto_resolve_cobro_alerts ON eventos');
    await client.query('DROP TRIGGER IF EXISTS trigger_auto_resolve_pago_dj_alerts ON eventos');

    await client.query('DROP FUNCTION IF EXISTS auto_resolve_cobro_alerts() CASCADE');
    await client.query('DROP FUNCTION IF EXISTS auto_resolve_pago_dj_alerts() CASCADE');
    await client.query('DROP FUNCTION IF EXISTS generate_all_financial_alerts() CASCADE');
    await client.query('DROP FUNCTION IF EXISTS generate_cliente_riesgo_alerts() CASCADE');
    await client.query('DROP FUNCTION IF EXISTS generate_cliente_inactivo_alerts() CASCADE');
    await client.query('DROP FUNCTION IF EXISTS generate_pago_dj_alerts() CASCADE');
    await client.query('DROP FUNCTION IF EXISTS generate_cobro_alerts() CASCADE');

    await client.query('DROP VIEW IF EXISTS vw_active_alerts CASCADE');
    await client.query('DROP VIEW IF EXISTS vw_alerts_summary CASCADE');

    await client.query('DROP TABLE IF EXISTS financial_alerts CASCADE');

    await client.query('DROP TYPE IF EXISTS alert_severity CASCADE');
    await client.query('DROP TYPE IF EXISTS alert_type CASCADE');

    console.log('✅ Cleanup completed successfully\n');

    console.log('📝 STEP 2: Executing migration 009...\n');

    // Read and execute migration
    const migrationSQL = fs.readFileSync(
      '/Users/franferrer/intra-media-system/database/migrations/009_financial_alerts_system.sql',
      'utf8'
    );

    await client.query(migrationSQL);

    console.log('✅ Migration 009 executed successfully\n');

    console.log('🧪 STEP 3: Testing alert generation...\n');

    // Test generating alerts
    const result = await client.query('SELECT * FROM generate_all_financial_alerts()');
    console.log('Alert Generation Results:');
    console.table(result.rows);

    // Check alerts summary
    const summary = await client.query('SELECT * FROM vw_alerts_summary');
    console.log('\nAlerts Summary:');
    console.table(summary.rows);

    // Count total alerts
    const count = await client.query('SELECT COUNT(*) as total FROM financial_alerts');
    console.log(`\n✅ Total alerts created: ${count.rows[0].total}`);

    console.log('\n✅ Migration 009 completed and tested successfully!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Details:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

executeCleanupAndMigration();
