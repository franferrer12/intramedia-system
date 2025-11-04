import pool from './src/config/database.js';

const checkSchema = async () => {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'eventos'
      ORDER BY ordinal_position;
    `);

    console.log('📋 Columnas de la tabla eventos:');
    result.rows.forEach(row => {
      console.log(`  • ${row.column_name} (${row.data_type})`);
    });

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkSchema();
