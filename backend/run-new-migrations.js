import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'intra_media_system',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

console.log('🗄️  Ejecutando nuevas migraciones (013 y 014)...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

async function runMigration(filePath, name) {
  console.log(`⏳ Ejecutando: ${name}...`);

  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    await pool.query(sql);
    console.log(`✅ ${name} completada\n`);
    return true;
  } catch (error) {
    console.log(`❌ Error en ${name}`);
    console.log(`   ${error.message}\n`);
    return false;
  }
}

async function main() {
  try {
    // Migración 013: RBAC
    await runMigration(
      path.join(__dirname, '../database/migrations/013_rbac_system.sql'),
      'RBAC System (Roles y Permisos)'
    );

    // Migración 014: Cotizaciones
    await runMigration(
      path.join(__dirname, '../database/migrations/014_quotations_system.sql'),
      'Sistema de Cotizaciones'
    );

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Migraciones completadas\n');
    console.log('📋 Nuevas características:');
    console.log('   ✅ Sistema RBAC con 4 roles (admin, manager, dj, viewer)');
    console.log('   ✅ Permisos granulares por recurso y acción');
    console.log('   ✅ Sistema de cotizaciones con estados y conversión a eventos');
    console.log('   ✅ Funciones para verificar permisos y generar números de cotización\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fatal:', error.message);
    await pool.end();
    process.exit(1);
  }
}

main();
