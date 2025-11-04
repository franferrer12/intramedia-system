/**
 * Migration Runner Script
 * Executes SQL migrations on the database
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration(migrationFile) {
  try {
    const migrationPath = path.join(__dirname, '../../database/migrations', migrationFile);
    console.log(`\n📝 Running migration: ${migrationFile}`);
    console.log(`   Path: ${migrationPath}`);

    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      return false;
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    await query(sql);

    console.log(`✅ Migration completed: ${migrationFile}`);
    return true;
  } catch (error) {
    console.error(`❌ Error running migration ${migrationFile}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting database migrations...\n');

  const migrations = [
    '011_soft_deletes.sql',
    '012_performance_indexes.sql'
  ];

  let successCount = 0;
  let failCount = 0;

  for (const migration of migrations) {
    const success = await runMigration(migration);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log(`\n📊 Migration Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📁 Total: ${migrations.length}`);

  if (failCount === 0) {
    console.log('\n🎉 All migrations completed successfully!');
  } else {
    console.log('\n⚠️  Some migrations failed. Please check the errors above.');
  }

  process.exit(failCount > 0 ? 1 : 0);
}

main();
