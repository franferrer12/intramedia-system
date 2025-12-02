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
    console.log('🚀 Applying Marketing Automation migration...\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '021_create_marketing_automation.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('📊 Executing SQL...\n');

    // Execute migration
    await client.query(migrationSQL);

    console.log('✅ Migration applied successfully!\n');

    // Verify tables
    console.log('🔍 Verifying tables created...');
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'email_%'
      ORDER BY table_name;
    `);

    console.log(`✅ Tables created: ${tablesResult.rows.length}`);
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Verify views
    console.log('\n🔍 Verifying views created...');
    const viewsResult = await client.query(`
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = 'public'
      AND table_name LIKE 'vw_%campaign%';
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
      AND routine_name LIKE '%campaign%'
      OR routine_name LIKE '%email_timestamp%'
      ORDER BY routine_name;
    `);

    console.log(`✅ Functions created: ${functionsResult.rows.length}`);
    functionsResult.rows.forEach(row => {
      console.log(`   - ${row.routine_name}`);
    });

    // Check sample data
    console.log('\n🔍 Checking sample data...');
    const templateCount = await client.query('SELECT COUNT(*) as count FROM email_templates');
    console.log(`✅ Sample templates: ${templateCount.rows[0].count}`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Marketing Automation system ready!');
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
