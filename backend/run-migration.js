import { readFileSync } from 'fs';
import pool from './src/config/database.js';

const runMigration = async () => {
  try {
    console.log('📊 Ejecutando migración financiera...');

    const sql = readFileSync('../database/migrations/003_agency_financial_system.sql', 'utf8');

    await pool.query(sql);

    console.log('✅ Migración ejecutada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al ejecutar migración:', error);
    process.exit(1);
  }
};

runMigration();
