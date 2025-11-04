/**
 * STRESS TEST DATA SEED
 * Dataset masivo para pruebas de rendimiento
 *
 * Uso: node seeds/stress-test.js
 *
 * Genera:
 * - 50 clientes
 * - 20 DJs
 * - 1000+ eventos
 *
 * ⚠️ ADVERTENCIA: Este script puede tardar varios minutos
 */

import pool from '../src/config/database.js';

const CIUDADES = ['Valencia', 'Barcelona', 'Madrid', 'Sevilla', 'Bilbao', 'Málaga', 'Alicante', 'Murcia', 'Zaragoza', 'Granada'];
const NOMBRES_CLIENTES = ['Club', 'Disco', 'Sala', 'Hotel', 'Resort', 'Beach', 'Lounge', 'Bar', 'Restaurant', 'Events'];
const NOMBRES_DJS = ['Carlos', 'Ana', 'Pedro', 'Laura', 'Miguel', 'Sofia', 'Diego', 'Carmen', 'Javier', 'Elena'];
const TIPOS_EVENTO = ['Boda', 'Cumpleaños', 'Corporativo', 'Discoteca', 'Festival', 'Privado', 'Bar', 'Terr aza'];
const MESES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement(arr) {
  return arr[random(0, arr.length - 1)];
}

async function stressTest() {
  const client = await pool.connect();
  const startTime = Date.now();

  try {
    console.log('💪 INICIANDO STRESS TEST\n');
    console.log('⏳ Esto puede tardar varios minutos...\n');

    await client.query('BEGIN');

    // Limpiar
    console.log('🗑️  Limpiando datos...');
    await client.query('DELETE FROM financial_alerts');
    await client.query('DELETE FROM eventos');
    await client.query('DELETE FROM clientes WHERE id > 0');
    await client.query('DELETE FROM djs WHERE id > 0');

    // Crear clientes
    console.log('👥 Creando 50 clientes...');
    const clientes = [];
    for (let i = 0; i < 50; i++) {
      const nombre = `${randomElement(NOMBRES_CLIENTES)} ${randomElement(CIUDADES)} ${i + 1}`;
      const email = `${nombre.toLowerCase().replace(/ /g, '')}@test.com`;
      const ciudad = randomElement(CIUDADES);

      const result = await client.query(
        'INSERT INTO clientes (nombre, email, ciudad, contacto, activo) VALUES ($1, $2, $3, $4, true) RETURNING id',
        [nombre, email, ciudad, nombre]
      );
      clientes.push(result.rows[0].id);
    }
    console.log(`✅ ${clientes.length} clientes creados`);

    // Crear DJs
    console.log('🎧 Creando 20 DJs...');
    const djs = [];
    for (let i = 0; i < 20; i++) {
      const nombre = `DJ ${randomElement(NOMBRES_DJS)} ${i + 1}`;
      const email = `${nombre.toLowerCase().replace(/ /g, '')}@dj.com`;

      const result = await client.query(
        'INSERT INTO djs (nombre, email, telefono, activo) VALUES ($1, $2, $3, true) RETURNING id',
        [nombre, email, `+346${random(10000000, 99999999)}`]
      );
      djs.push(result.rows[0].id);
    }
    console.log(`✅ ${djs.length} DJs creados`);

    // Crear eventos en lotes
    console.log('🎉 Creando 1000 eventos...');
    let eventosCreados = 0;
    const BATCH_SIZE = 50;
    const TOTAL_EVENTOS = 1000;

    for (let batch = 0; batch < TOTAL_EVENTOS / BATCH_SIZE; batch++) {
      const values = [];
      const placeholders = [];

      for (let i = 0; i < BATCH_SIZE; i++) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() + random(-365, 90));
        const esPasado = fecha < new Date();

        const cache = random(100, 1000);
        const parteDj = Math.round(cache * (0.2 + Math.random() * 0.2));
        const parteAgencia = cache - parteDj;

        const paramBase = i * 11;
        placeholders.push(
          `($${paramBase + 1}, $${paramBase + 2}, $${paramBase + 3}, $${paramBase + 4}, $${paramBase + 5}, $${paramBase + 6}, $${paramBase + 7}, $${paramBase + 8}, $${paramBase + 9}, $${paramBase + 10}, $${paramBase + 11})`
        );

        values.push(
          `${randomElement(TIPOS_EVENTO)} ${eventosCreados + i + 1}`,
          fecha.toISOString().split('T')[0],
          MESES[fecha.getMonth()],
          randomElement(clientes),
          randomElement(djs),
          cache,
          parteDj,
          parteAgencia,
          random(3, 8),
          esPasado && Math.random() > 0.2,
          esPasado && Math.random() > 0.15
        );
      }

      await client.query(`
        INSERT INTO eventos (
          evento, fecha, mes, cliente_id, dj_id,
          cache_total, parte_dj, parte_agencia, horas,
          cobrado_cliente, pagado_dj
        ) VALUES ${placeholders.join(', ')}
      `, values);

      eventosCreados += BATCH_SIZE;
      process.stdout.write(`\r   📊 ${eventosCreados}/${TOTAL_EVENTOS} eventos...`);
    }
    console.log('\n✅ 1000 eventos creados');

    await client.query('COMMIT');

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n✅ STRESS TEST COMPLETADO');
    console.log(`⏱️  Tiempo total: ${duration}s`);
    console.log('📊 50 clientes, 20 DJs, 1000 eventos\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

stressTest();
