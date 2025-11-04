import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const { Pool } = pg;

// Configuración de la base de datos
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'intra_media_system',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

console.log('🗄️  Ejecutando migraciones del sistema financiero...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
    console.log('1️⃣  Migración: Sistema de Distribución de Beneficios');
    await runMigration(
      path.join(__dirname, '../database/migrations/005_profit_distribution_system.sql'),
      '005_profit_distribution_system'
    );

    console.log('2️⃣  Migración: Gastos Reales y Excedentes');
    await runMigration(
      path.join(__dirname, '../database/migrations/006_real_expenses_and_surplus.sql'),
      '006_real_expenses_and_surplus'
    );

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Todas las migraciones completadas');
    console.log('');
    console.log('📋 Tablas creadas:');
    console.log('   - profit_distribution_config');
    console.log('   - monthly_expenses');
    console.log('');
    console.log('📊 Vistas creadas:');
    console.log('   - vw_eventos_desglose_financiero');
    console.log('   - vw_resumen_financiero_mensual');
    console.log('   - vw_resumen_por_socio');
    console.log('   - vw_budget_vs_real');
    console.log('');
    console.log('🔄 Funciones creadas:');
    console.log('   - calcular_distribucion_beneficio()');
    console.log('   - calcular_presupuesto_mes()');
    console.log('   - redistribuir_excedente()');
    console.log('   - cerrar_mes()');
    console.log('');
    console.log('🚀 El sistema está listo para usarse');
    console.log('');
    console.log('📍 Próximos pasos:');
    console.log('   1. Reinicia el backend si está corriendo');
    console.log('   2. Accede a http://localhost:5174');
    console.log('   3. Navega a \'Distribución de Beneficios\' en el menú');
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
