import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyContractsMigration() {
  try {
    console.log('📄 Reading contracts migration file...');
    const migrationPath = path.join(__dirname, '010_create_contracts_system.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('🔄 Applying contracts migration...');
    await pool.query(sql);

    console.log('✅ Contracts migration applied successfully!');

    // Verify tables were created
    const result = await pool.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename LIKE 'contract%'
      ORDER BY tablename
    `);

    console.log('\n📊 Contracts tables created:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.tablename}`);
    });

    // Get table counts
    console.log('\n📈 Table record counts:');
    for (const row of result.rows) {
      const countResult = await pool.query(`SELECT COUNT(*) FROM ${row.tablename}`);
      console.log(`  ${row.tablename}: ${countResult.rows[0].count} records`);
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error applying contracts migration:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

applyContractsMigration();
