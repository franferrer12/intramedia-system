import pool from './src/config/database.js';

async function checkTable() {
  try {
    console.log('🔍 Checking audit_logs table...');

    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'audit_logs'
      );
    `);

    const tableExists = tableCheck.rows[0].exists;
    console.log(`Table exists: ${tableExists}`);

    if (tableExists) {
      // Get table structure
      const columns = await pool.query(`
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'audit_logs'
        ORDER BY ordinal_position;
      `);

      console.log('\nColumns:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`);
      });

      // Get indexes
      const indexes = await pool.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'audit_logs'
        ORDER BY indexname;
      `);

      console.log('\nIndexes:');
      indexes.rows.forEach(idx => {
        console.log(`  - ${idx.indexname}`);
      });

      // Get views
      const views = await pool.query(`
        SELECT table_name
        FROM information_schema.views
        WHERE table_schema = 'public'
        AND table_name LIKE '%audit%'
        ORDER BY table_name;
      `);

      console.log('\nViews:');
      views.rows.forEach(view => {
        console.log(`  - ${view.table_name}`);
      });

      // Get functions
      const functions = await pool.query(`
        SELECT routine_name
        FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND routine_name LIKE '%audit%'
        ORDER BY routine_name;
      `);

      console.log('\nFunctions:');
      functions.rows.forEach(func => {
        console.log(`  - ${func.routine_name}`);
      });

      // Test a query
      const count = await pool.query('SELECT COUNT(*) FROM audit_logs');
      console.log(`\nTotal audit logs: ${count.rows[0].count}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTable();
