import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import pool from './src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('🔄 Running audit logs migration...');

    const migrationPath = join(__dirname, 'database/migrations/019_create_audit_logs.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    await pool.query(sql);

    console.log('✅ Audit logs migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
