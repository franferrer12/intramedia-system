import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const { Pool } = pg;

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'intra_media_system',
  user: process.env.DB_USER || 'intra_media_user',
  password: process.env.DB_PASSWORD || 'change_this_strong_password_in_production'
});

async function applyMigration() {
  const client = await pool.connect();

  try {
    console.log('🚀 Applying Advanced Reports migration...\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '022_create_advanced_reports.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('📊 Executing SQL...\n');

    // Execute migration
    await client.query(migrationSQL);

    console.log('✅ Migration applied successfully!\n');

    // Verify views
    console.log('🔍 Verifying views created...');
    const viewsResult = await client.query(`
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = 'public'
      AND table_name LIKE 'vw_%'
      AND (table_name LIKE '%profit%' OR table_name LIKE '%cash%'
           OR table_name LIKE '%revenue%' OR table_name LIKE '%kpi%')
      ORDER BY table_name;
    `);

    console.log(`✅ Views created: ${viewsResult.rows.length}`);
    viewsResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Verify functions
    console.log('\n🔍 Verifying functions created...');
    const functionsResult = await client.query(`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND (routine_name LIKE '%profit%' OR routine_name LIKE '%cash%'
           OR routine_name LIKE '%revenue%' OR routine_name LIKE '%kpi%'
           OR routine_name LIKE '%expense%' OR routine_name LIKE '%djs%')
      ORDER BY routine_name;
    `);

    console.log(`✅ Functions created: ${functionsResult.rows.length}`);
    functionsResult.rows.forEach(row => {
      console.log(`   - ${row.routine_name}`);
    });

    // Test P&L view
    console.log('\n🔍 Testing P&L view...');
    const plTest = await client.query(`
      SELECT periodo, ingresos_brutos, utilidad_neta
      FROM vw_profit_loss
      WHERE periodo >= CURRENT_DATE - INTERVAL '3 months'
      LIMIT 3;
    `);

    console.log(`✅ P&L data available: ${plTest.rows.length} months`);
    if (plTest.rows.length > 0) {
      console.log('   Sample:');
      plTest.rows.forEach(row => {
        console.log(`   - ${row.periodo?.toISOString().split('T')[0]}: Ingresos $${row.ingresos_brutos || 0}, Utilidad $${row.utilidad_neta || 0}`);
      });
    }

    // Test KPIs view
    console.log('\n🔍 Testing KPIs view...');
    const kpiTest = await client.query(`
      SELECT periodo, roi_porcentaje, margen_contribucion, revenue_per_event
      FROM vw_financial_kpis
      WHERE periodo >= CURRENT_DATE - INTERVAL '3 months'
      LIMIT 3;
    `);

    console.log(`✅ KPIs data available: ${kpiTest.rows.length} months`);
    if (kpiTest.rows.length > 0) {
      console.log('   Sample:');
      kpiTest.rows.forEach(row => {
        console.log(`   - ${row.periodo?.toISOString().split('T')[0]}: ROI ${row.roi_porcentaje || 0}%, Margen ${row.margen_contribucion || 0}%`);
      });
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Advanced Reports system ready!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
applyMigration()
  .then(() => {
    console.log('✅ Migration script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
