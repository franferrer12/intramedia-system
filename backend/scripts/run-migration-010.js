import pool from '../src/config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('🔄 Ejecutando migración 010...\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/010_app_service_integration.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    await client.query(sql);

    console.log('\n✅ Migración 010 ejecutada exitosamente!');
    console.log('');
    console.log('Cambios aplicados:');
    console.log('  ✓ Campos agregados a tabla djs (availability, artistic_name, location)');
    console.log('  ✓ Campos agregados a tabla eventos (hora_inicio, hora_fin)');
    console.log('  ✓ Tabla requests creada');
    console.log('  ✓ Tabla user_devices creada');
    console.log('  ✓ Triggers y funciones creados');
    console.log('');

    // Verify tables
    const verifyRequests = await client.query(`
      SELECT COUNT(*) as count FROM information_schema.tables
      WHERE table_name = 'requests'
    `);

    const verifyUserDevices = await client.query(`
      SELECT COUNT(*) as count FROM information_schema.tables
      WHERE table_name = 'user_devices'
    `);

    console.log('Verificación:');
    console.log(`  requests table: ${verifyRequests.rows[0].count === '1' ? '✅' : '❌'}`);
    console.log(`  user_devices table: ${verifyUserDevices.rows[0].count === '1' ? '✅' : '❌'}`);

  } catch (error) {
    console.error('❌ Error ejecutando migración:', error.message);
    if (error.message.includes('already exists')) {
      console.log('\n⚠️  Algunas tablas/campos ya existen. Esto es normal si la migración ya fue ejecutada.');
    }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
