import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runLeadsMigration() {
  try {
    console.log('🚀 Ejecutando migración de CRM - Tabla Leads...\n');

    // Leer el archivo SQL
    const migrationPath = join(__dirname, '../../../database/migrations/002_create_leads_table.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Archivo de migración cargado');
    console.log('🔄 Ejecutando SQL...\n');

    // Ejecutar la migración
    await pool.query(sql);

    console.log('✅ Migración completada exitosamente!\n');

    // Verificar que la tabla existe
    const checkTable = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'leads'
    `);

    if (checkTable.rows.length > 0) {
      console.log('✅ Tabla "leads" creada correctamente\n');

      // Mostrar estructura de la tabla
      const structure = await pool.query(`
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'leads'
        ORDER BY ordinal_position
      `);

      console.log('📋 Estructura de la tabla:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      structure.rows.forEach(col => {
        const maxLength = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
        console.log(`  ${col.column_name.padEnd(30)} ${col.data_type}${maxLength}`);
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      console.log('🎉 ¡El CRM básico está listo para usar!');
      console.log('\n📌 Próximos pasos:');
      console.log('  1. Reinicia el backend si está corriendo');
      console.log('  2. Ve a Gestión → Leads (CRM) en el frontend');
      console.log('  3. ¡Empieza a capturar leads!\n');
    } else {
      console.log('⚠️  La tabla no se creó. Revisa los errores anteriores.');
    }

  } catch (error) {
    console.error('❌ Error al ejecutar la migración:', error.message);
    console.error('\nDetalles del error:');
    console.error(error);

    if (error.code === '42P07') {
      console.log('\n💡 La tabla "leads" ya existe. No es necesario ejecutar la migración de nuevo.');
    }

    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Ejecutar
runLeadsMigration();
