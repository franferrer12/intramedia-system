import pool from './src/config/database.js';

const checkTables = async () => {
  try {
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'agency_%'
      ORDER BY table_name;
    `);

    console.log('📊 Tablas financieras encontradas:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    if (result.rows.length === 0) {
      console.log('  ❌ No se encontraron tablas financieras');
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkTables();
