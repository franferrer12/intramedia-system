import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('🔄 Running social media tables migration...');

    const migrationPath = join(__dirname, '../../migrations/009_social_media_tables.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    await pool.query(sql);

    console.log('✅ Migration completed successfully');
    console.log('');
    console.log('Created tables:');
    console.log('  - social_media_accounts');
    console.log('  - social_media_snapshots');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
