import pool from './src/config/database.js';

const checkViews = async () => {
  try {
    // Check for equipment_rentals table
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'equipment_rentals';
    `);

    console.log('\n📦 Tabla equipment_rentals:');
    if (tables.rows.length > 0) {
      console.log('  ✓ equipment_rentals existe');
    } else {
      console.log('  ❌ equipment_rentals NO existe');
    }

    // Check for views
    const views = await pool.query(`
      SELECT table_name as view_name
      FROM information_schema.views
      WHERE table_schema = 'public'
      AND table_name LIKE 'vw_%'
      ORDER BY table_name;
    `);

    console.log('\n👁️  Vistas SQL encontradas:');
    if (views.rows.length > 0) {
      views.rows.forEach(row => {
        console.log(`  ✓ ${row.view_name}`);
      });
    } else {
      console.log('  ❌ No se encontraron vistas');
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkViews();
