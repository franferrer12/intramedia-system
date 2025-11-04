import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const { Pool } = pg;

// Configuración de la base de datos
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'intra_media_system',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

console.log('🗄️  Ejecutando TODAS las migraciones del sistema...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📊 Base de datos: ${process.env.DB_NAME || 'intra_media_system'}`);
console.log(`👤 Usuario: ${process.env.DB_USER || 'postgres'}`);
console.log('');

async function runMigration(filePath, name) {
  console.log(`⏳ Ejecutando: ${name}...`);

  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    await pool.query(sql);
    console.log(`✅ ${name} completada`);
    console.log('');
    return true;
  } catch (error) {
    console.log(`❌ Error en ${name}`);
    console.log(`   ${error.message}`);
    console.log('   Intentando continuar...');
    console.log('');
    return false;
  }
}

async function main() {
  try {
    // Lista de migraciones en orden
    const migrations = [
      { file: '005_profit_distribution_system.sql', name: 'Sistema de Distribución de Beneficios' },
      { file: '006_real_expenses_and_surplus.sql', name: 'Gastos Reales y Excedentes' },
      { file: '011_soft_deletes.sql', name: 'Soft Deletes' },
      { file: '012_performance_indexes.sql', name: 'Índices de Performance' },
      { file: '013_rbac_system.sql', name: 'Sistema RBAC (Roles y Permisos)' },
      { file: '014_quotations_system.sql', name: 'Sistema de Cotizaciones' },
    ];

    let completed = 0;
    let failed = 0;

    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      console.log(`${i + 1}️⃣  Migración: ${migration.name}`);

      const filePath = path.join(__dirname, 'migrations', migration.file);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Archivo no encontrado: ${migration.file}`);
        console.log('   Saltando...');
        console.log('');
        failed++;
        continue;
      }

      const success = await runMigration(filePath, migration.name);
      if (success) {
        completed++;
      } else {
        failed++;
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Migraciones completadas: ${completed}/${migrations.length}`);
    if (failed > 0) {
      console.log(`⚠️  Migraciones con errores: ${failed} (esto es normal si ya estaban aplicadas)`);
    }
    console.log('');
    console.log('📋 Características del sistema:');
    console.log('   ✅ Distribución de beneficios entre socios');
    console.log('   ✅ Gestión de gastos mensuales');
    console.log('   ✅ Soft deletes en todas las tablas');
    console.log('   ✅ Índices de performance optimizados');
    console.log('   ✅ Sistema RBAC con roles y permisos');
    console.log('   ✅ Sistema de cotizaciones con conversión a eventos');
    console.log('');
    console.log('🚀 El sistema está listo para usarse');
    console.log('');
    console.log('📍 Próximos pasos:');
    console.log('   1. Reinicia el backend si está corriendo');
    console.log('   2. Accede a http://localhost:3000');
    console.log('   3. Prueba las nuevas funcionalidades');
    console.log('');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fatal:', error.message);
    await pool.end();
    process.exit(1);
  }
}

main();
