/**
 * QUICK DEMO DATA SEED
 * Conjunto pequeño de datos para demostraciones rápidas
 *
 * Uso: node seeds/quick-demo.js
 *
 * Genera:
 * - 5 clientes
 * - 3 DJs
 * - 20 eventos (10 pasados, 10 futuros)
 */

import pool from '../src/config/database.js';

async function quickDemo() {
  const client = await pool.connect();

  try {
    console.log('🎬 INICIANDO DEMO RÁPIDA\n');
    await client.query('BEGIN');

    // Limpiar
    console.log('🗑️  Limpiando datos...');
    await client.query('DELETE FROM financial_alerts');
    await client.query('DELETE FROM eventos');
    await client.query('DELETE FROM clientes WHERE id > 0');
    await client.query('DELETE FROM djs WHERE id > 0');

    // Crear clientes
    console.log('👥 Creando 5 clientes...');
    const clientes = [];
    const clientesData = [
      { nombre: 'Disco Demo', email: 'demo@disco.com', ciudad: 'Valencia' },
      { nombre: 'Hotel Luxe', email: 'info@luxe.com', ciudad: 'Barcelona' },
      { nombre: 'Club Night', email: 'booking@night.com', ciudad: 'Madrid' },
      { nombre: 'Eventos SA', email: 'contacto@eventos.com', ciudad: 'Valencia' },
      { nombre: 'Beach Club', email: 'info@beach.com', ciudad: 'Ibiza' }
    ];

    for (const c of clientesData) {
      const result = await client.query(
        'INSERT INTO clientes (nombre, email, ciudad, activo) VALUES ($1, $2, $3, true) RETURNING id',
        [c.nombre, c.email, c.ciudad]
      );
      clientes.push(result.rows[0].id);
    }

    // Crear DJs
    console.log('🎧 Creando 3 DJs...');
    const djs = [];
    const djsData = [
      { nombre: 'DJ Pro', email: 'pro@dj.com' },
      { nombre: 'DJ Mix', email: 'mix@dj.com' },
      { nombre: 'DJ Beat', email: 'beat@dj.com' }
    ];

    for (const d of djsData) {
      const result = await client.query(
        'INSERT INTO djs (nombre, email, activo) VALUES ($1, $2, true) RETURNING id',
        [d.nombre, d.email]
      );
      djs.push(result.rows[0].id);
    }

    // Crear eventos
    console.log('🎉 Creando 20 eventos...');
    const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
                   'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

    for (let i = 0; i < 20; i++) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + (i - 10) * 10); // -10 a +10 eventos

      const esPasado = fecha < new Date();
      const cliente = clientes[i % clientes.length];
      const dj = djs[i % djs.length];
      const cache = 300 + Math.random() * 400;
      const parteDj = cache * 0.25;

      await client.query(`
        INSERT INTO eventos (
          evento, fecha, mes, cliente_id, dj_id,
          cache_total, parte_dj, parte_agencia, horas,
          cobrado_cliente, pagado_dj
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        `Evento Demo ${i + 1}`,
        fecha.toISOString().split('T')[0],
        meses[fecha.getMonth()],
        cliente,
        dj,
        Math.round(cache),
        Math.round(parteDj),
        Math.round(cache - parteDj),
        5,
        esPasado,
        esPasado
      ]);
    }

    await client.query('COMMIT');

    console.log('\n✅ DEMO LISTA');
    console.log('📊 5 clientes, 3 DJs, 20 eventos');
    console.log('🌐 Abre http://localhost:5174 para ver los datos\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

quickDemo();
