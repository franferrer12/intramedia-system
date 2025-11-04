import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runAgencyFinancialMigration() {
  try {
    console.log('🚀 Ejecutando migración del Sistema Financiero Agencia-DJ...\n');

    // Leer el archivo SQL
    const migrationPath = join(__dirname, '../../../database/migrations/003_agency_financial_system.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Archivo de migración cargado');
    console.log('🔄 Ejecutando SQL...\n');

    // Ejecutar la migración
    await pool.query(sql);

    console.log('✅ Migración completada exitosamente!\n');

    // Verificar que las tablas existen
    const checkTables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('agency_transactions', 'dj_availability', 'agency_equipment', 'equipment_rentals')
      ORDER BY table_name
    `);

    if (checkTables.rows.length === 4) {
      console.log('✅ Todas las tablas creadas correctamente:\n');
      checkTables.rows.forEach(table => {
        console.log(`   ✓ ${table.table_name}`);
      });
      console.log();

      // Mostrar estructura de la tabla principal
      const structure = await pool.query(`
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'agency_transactions'
        ORDER BY ordinal_position
      `);

      console.log('📋 Estructura de agency_transactions:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      structure.rows.forEach(col => {
        const maxLength = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
        console.log(`  ${col.column_name.padEnd(30)} ${col.data_type}${maxLength}`);
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Verificar vistas
      const checkViews = await pool.query(`
        SELECT table_name
        FROM information_schema.views
        WHERE table_schema = 'public'
        AND table_name IN ('vw_dj_balances', 'vw_equipment_availability')
      `);

      if (checkViews.rows.length === 2) {
        console.log('✅ Vistas creadas correctamente:');
        checkViews.rows.forEach(view => {
          console.log(`   ✓ ${view.table_name}`);
        });
        console.log();
      }

      console.log('🎉 ¡El Sistema Financiero está listo para usar!\n');
      console.log('📌 Próximos pasos:');
      console.log('  1. Reinicia el backend si está corriendo');
      console.log('  2. Implementar los modelos y controladores backend');
      console.log('  3. Crear los componentes frontend:');
      console.log('     - DJAvailabilityCalendar.jsx (Calendario visual)');
      console.log('     - FinancialDashboard.jsx (Dashboard financiero)');
      console.log('     - TransactionManager.jsx (Gestión de transacciones)');
      console.log('     - EquipmentManager.jsx (Gestión de equipos)\n');

    } else {
      console.log('⚠️  No se crearon todas las tablas. Revisa los errores anteriores.');
    }

  } catch (error) {
    console.error('❌ Error al ejecutar la migración:', error.message);
    console.error('\nDetalles del error:');
    console.error(error);

    if (error.code === '42P07') {
      console.log('\n💡 Algunas tablas ya existen. Verifica si necesitas recrearlas o si ya están actualizadas.');
    }

    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Ejecutar
runAgencyFinancialMigration();
