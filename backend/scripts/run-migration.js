import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script para ejecutar migraciones
 * Ejecutar: node scripts/run-migration.js migrations/003_multi_tenant_system.sql
 */

const runMigration = async (migrationFile) => {
  try {
    console.log(`🚀 Ejecutando migración: ${migrationFile}\n`);

    // Leer archivo de migración
    const migrationPath = path.join(__dirname, '..', migrationFile);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Contenido de la migración:');
    console.log('━'.repeat(60));
    console.log(migrationSQL.substring(0, 500) + '...\n');

    // Ejecutar migración
    console.log('⚙️  Ejecutando SQL...');
    await pool.query(migrationSQL);

    console.log('✅ Migración ejecutada exitosamente!\n');

    // Verificar que las tablas fueron creadas
    console.log('🔍 Verificando tablas creadas...');

    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('users', 'agencies', 'sessions', 'audit_logs')
      ORDER BY table_name
    `);

    console.log('\n📊 Tablas en la base de datos:');
    tablesResult.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    // Verificar columnas de users
    const columnsResult = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Columnas de la tabla users:');
    columnsResult.rows.forEach(row => {
      console.log(`   • ${row.column_name} (${row.data_type})`);
    });

    console.log('\n✨ Todo listo! Ahora puedes crear usuarios multi-tenant.\n');

  } catch (error) {
    console.error('❌ Error ejecutando migración:', error.message);
    console.error('\nDetalles:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
};

// Obtener archivo de migración de los argumentos
const migrationFile = process.argv[2] || 'migrations/003_multi_tenant_system.sql';

runMigration(migrationFile);
