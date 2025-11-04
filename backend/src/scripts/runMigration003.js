import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const migrationPath = path.join(__dirname, '../../../migrations/003_auth_and_oauth_system.sql');

  console.log('🔄 Starting migration 003: Authentication & OAuth System...');
  console.log('📂 Reading migration file:', migrationPath);

  try {
    // Read migration file
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Executing migration...');

    // Execute migration
    await pool.query(sql);

    console.log('✅ Migration 003 completed successfully!');
    console.log('');
    console.log('📊 Tables created:');
    console.log('  - users');
    console.log('  - oauth_tokens');
    console.log('  - social_connections');
    console.log('  - monthly_reports');
    console.log('  - audit_log');
    console.log('  - notification_preferences');
    console.log('');
    console.log('👤 Default admin user created:');
    console.log('  Email: admin@intramedia.com');
    console.log('  Password: admin123 (CHANGE IN PRODUCTION!)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
