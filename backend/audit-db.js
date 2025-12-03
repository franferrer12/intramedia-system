import pool from './src/config/database.js';

async function auditDatabase() {
  const client = await pool.connect();

  try {
    console.log('=== AUDITORÍA DE BASE DE DATOS ===\n');

    // 1. Listar todas las tablas
    console.log('1. TABLAS EXISTENTES:');
    const tables = await client.query(`
      SELECT table_name,
             pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log(`Total: ${tables.rows.length} tablas\n`);
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name} (${row.size})`);
    });

    // 2. Detectar posibles duplicados (inglés/español)
    console.log('\n2. ANÁLISIS DE NOMENCLATURA (Inglés vs Español):');
    const tableNames = tables.rows.map(r => r.table_name);

    const possibleDuplicates = {
      'agencies': 'agencias',
      'clients': 'clientes',
      'djs': 'djs',
      'contracts': 'contratos',
      'quotations': 'cotizaciones',
      'events': 'eventos',
      'users': 'usuarios'
    };

    console.log('\nVerificando pares inglés/español:');
    for (const [eng, esp] of Object.entries(possibleDuplicates)) {
      const hasEng = tableNames.includes(eng);
      const hasEsp = tableNames.includes(esp);

      if (hasEng && hasEsp) {
        console.log(`  ⚠️  DUPLICADO: "${eng}" Y "${esp}" existen`);
      } else if (hasEng) {
        console.log(`  ✓  "${eng}" (inglés)`);
      } else if (hasEsp) {
        console.log(`  ✓  "${esp}" (español)`);
      } else {
        console.log(`  ✗  Ninguna: "${eng}" ni "${esp}"`);
      }
    }

    // 3. Verificar tablas relacionadas con cotizaciones
    console.log('\n3. TABLAS DEL SISTEMA DE COTIZACIONES:');
    const quotationTables = tableNames.filter(t =>
      t.includes('cotizacion') || t.includes('quotation')
    );
    if (quotationTables.length > 0) {
      quotationTables.forEach(t => console.log(`  - ${t}`));
    } else {
      console.log('  ✗ No se encontraron tablas de cotizaciones');
    }

    // 4. Verificar foreign keys rotas
    console.log('\n4. VERIFICANDO FOREIGN KEYS:');
    const fks = await client.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name
    `);

    console.log(`Total: ${fks.rows.length} foreign keys\n`);

    // Verificar si las tablas referenciadas existen
    const brokenFKs = [];
    fks.rows.forEach(fk => {
      if (!tableNames.includes(fk.foreign_table_name)) {
        brokenFKs.push(fk);
      }
    });

    if (brokenFKs.length > 0) {
      console.log('⚠️  FOREIGN KEYS ROTAS (referencia tabla inexistente):');
      brokenFKs.forEach(fk => {
        console.log(`  - ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    } else {
      console.log('✓ Todas las foreign keys son válidas');
    }

    // 5. Contar registros en tablas principales
    console.log('\n5. CONTEO DE REGISTROS (tablas principales):');
    const mainTables = ['agencies', 'agencias', 'clients', 'clientes', 'djs',
                        'contracts', 'contratos', 'quotations', 'cotizaciones',
                        'events', 'eventos', 'users', 'usuarios'];

    for (const table of mainTables) {
      if (tableNames.includes(table)) {
        try {
          const count = await client.query(`SELECT COUNT(*) FROM ${table}`);
          console.log(`  - ${table}: ${count.rows[0].count} registros`);
        } catch (err) {
          console.log(`  - ${table}: ERROR - ${err.message}`);
        }
      }
    }

    // 6. Verificar índices
    console.log('\n6. ÍNDICES PERSONALIZADOS:');
    const indexes = await client.query(`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname NOT LIKE '%_pkey'
      ORDER BY tablename, indexname
      LIMIT 50
    `);

    console.log(`Total: ${indexes.rows.length} índices personalizados (primeros 50)\n`);

    // Agrupar por tabla
    const indexesByTable = {};
    indexes.rows.forEach(idx => {
      if (!indexesByTable[idx.tablename]) {
        indexesByTable[idx.tablename] = [];
      }
      indexesByTable[idx.tablename].push(idx.indexname);
    });

    Object.entries(indexesByTable).forEach(([table, idxs]) => {
      console.log(`  ${table}: ${idxs.length} índices`);
    });

    console.log('\n=== FIN DE AUDITORÍA ===');

  } catch (error) {
    console.error('Error en auditoría:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

auditDatabase();
