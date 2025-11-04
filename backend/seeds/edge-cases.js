/**
 * EDGE CASES DATA SEED
 * Datos para probar casos límite y situaciones especiales
 *
 * Uso: node seeds/edge-cases.js
 *
 * Incluye:
 * - Clientes con deuda extrema
 * - Eventos sin cobrar desde hace años
 * - DJs sin pagar hace meses
 * - Precios inusuales (muy altos/bajos)
 * - Duraciones extremas
 */

import pool from '../src/config/database.js';

const MESES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
               'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

async function edgeCases() {
  const client = await pool.connect();

  try {
    console.log('🔥 CREANDO CASOS LÍMITE\n');
    await client.query('BEGIN');

    // Limpiar
    console.log('🗑️  Limpiando datos...');
    await client.query('DELETE FROM financial_alerts');
    await client.query('DELETE FROM eventos');
    await client.query('DELETE FROM clientes WHERE id > 0');
    await client.query('DELETE FROM djs WHERE id > 0');

    // Crear DJ por defecto para los eventos
    console.log('🎧 Creando DJ por defecto...');
    const djGenerico = await client.query(
      `INSERT INTO djs (nombre, email, telefono, activo)
       VALUES ('DJ Genérico', 'generico@dj.com', '+34600000000', true)
       RETURNING id`
    );
    const djGenericoId = djGenerico.rows[0].id;

    // CASO 1: Cliente moroso extremo
    console.log('💰 Caso 1: Cliente con deuda extrema (2 años sin pagar)...');
    const moroso = await client.query(
      `INSERT INTO clientes (nombre, email, ciudad, activo)
       VALUES ('Cliente Moroso SA', 'moroso@test.com', 'Valencia', true)
       RETURNING id`
    );
    const morosoId = moroso.rows[0].id;

    // 10 eventos sin cobrar de hace 2 años
    for (let i = 0; i < 10; i++) {
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - 24); // 2 años atrás
      fecha.setDate(fecha.getDate() + i * 10);

      await client.query(`
        INSERT INTO eventos (
          evento, fecha, mes, cliente_id, dj_id,
          cache_total, parte_dj, parte_agencia, horas,
          cobrado_cliente, pagado_dj
        ) VALUES ($1, $2, $3, $4, ${djGenericoId}, $5, $6, $7, 5, false, false)
      `, [
        `Evento impagado ${i + 1}`,
        fecha.toISOString().split('T')[0],
        MESES[fecha.getMonth()],
        morosoId,
        5000 + (i * 500),
        1000,
        4000 + (i * 500)
      ]);
    }

    // CASO 2: Cliente VIP perfecto (siempre paga)
    console.log('⭐ Caso 2: Cliente VIP con historial perfecto...');
    const vip = await client.query(
      `INSERT INTO clientes (nombre, email, ciudad, activo)
       VALUES ('Cliente VIP Gold', 'vip@gold.com', 'Barcelona', true)
       RETURNING id`
    );
    const vipId = vip.rows[0].id;

    for (let i = 0; i < 20; i++) {
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - i);

      await client.query(`
        INSERT INTO eventos (
          evento, fecha, mes, cliente_id, dj_id,
          cache_total, parte_dj, parte_agencia, horas,
          cobrado_cliente, pagado_dj
        ) VALUES ($1, $2, $3, $4, ${djGenericoId}, 2000, 500, 1500, 6, true, true)
      `, [
        `Evento VIP ${i + 1}`,
        fecha.toISOString().split('T')[0],
        MESES[fecha.getMonth()],
        vipId
      ]);
    }

    // CASO 3: Evento con precio extremadamente alto
    console.log('💎 Caso 3: Evento premium de lujo...');
    const premium = await client.query(
      `INSERT INTO clientes (nombre, email, ciudad, activo)
       VALUES ('Evento Premium Elite', 'premium@elite.com', 'Ibiza', true)
       RETURNING id`
    );

    const fecha1 = new Date();
    fecha1.setDate(fecha1.getDate() - 30);
    await client.query(`
      INSERT INTO eventos (
        evento, fecha, mes, cliente_id, dj_id,
        cache_total, parte_dj, parte_agencia, horas,
        cobrado_cliente, pagado_dj
      ) VALUES ('Festival Internacional VIP', $1, $2, $3, ${djGenericoId}, 50000, 15000, 35000, 12, true, true)
    `, [
      fecha1.toISOString().split('T')[0],
      MESES[fecha1.getMonth()],
      premium.rows[0].id
    ]);

    // CASO 4: Evento con precio extremadamente bajo
    console.log('💵 Caso 4: Evento económico...');
    const economico = await client.query(
      `INSERT INTO clientes (nombre, email, ciudad, activo)
       VALUES ('Bar Pequeño', 'bar@pequeno.com', 'Valencia', true)
       RETURNING id`
    );

    const fecha2 = new Date();
    fecha2.setDate(fecha2.getDate() - 15);
    await client.query(`
      INSERT INTO eventos (
        evento, fecha, mes, cliente_id, dj_id,
        cache_total, parte_dj, parte_agencia, horas,
        cobrado_cliente, pagado_dj
      ) VALUES ('Noche tranquila', $1, $2, $3, ${djGenericoId}, 50, 30, 20, 2, true, false)
    `, [
      fecha2.toISOString().split('T')[0],
      MESES[fecha2.getMonth()],
      economico.rows[0].id
    ]);

    // CASO 5: DJ sin pagar desde hace meses (cobrado pero no pagado)
    console.log('😤 Caso 5: DJ sin cobrar (cliente pagó pero DJ no)...');
    const djImpagado = await client.query(
      `INSERT INTO djs (nombre, email, activo)
       VALUES ('DJ Sin Cobrar', 'nopagado@dj.com', true)
       RETURNING id`
    );
    const djId = djImpagado.rows[0].id;

    const cliente = await client.query(
      `INSERT INTO clientes (nombre, email, ciudad, activo)
       VALUES ('Cliente Regular', 'regular@test.com', 'Madrid', true)
       RETURNING id`
    );

    for (let i = 0; i < 5; i++) {
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - (3 + i));

      await client.query(`
        INSERT INTO eventos (
          evento, fecha, mes, cliente_id, dj_id,
          cache_total, parte_dj, parte_agencia, horas,
          cobrado_cliente, pagado_dj
        ) VALUES ($1, $2, $3, $4, $5, 400, 120, 280, 4, true, false)
      `, [
        `Evento cobrado ${i + 1}`,
        fecha.toISOString().split('T')[0],
        MESES[fecha.getMonth()],
        cliente.rows[0].id,
        djId
      ]);
    }

    // CASO 6: Eventos futuros (sin cobrar ni pagar aún)
    console.log('📅 Caso 6: Eventos futuros programados...');
    const futuro = await client.query(
      `INSERT INTO clientes (nombre, email, ciudad, activo)
       VALUES ('Cliente Futuro', 'futuro@test.com', 'Sevilla', true)
       RETURNING id`
    );

    for (let i = 1; i <= 10; i++) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + (i * 7)); // Próximas 10 semanas

      await client.query(`
        INSERT INTO eventos (
          evento, fecha, mes, cliente_id, dj_id,
          cache_total, parte_dj, parte_agencia, horas,
          cobrado_cliente, pagado_dj
        ) VALUES ($1, $2, $3, $4, ${djGenericoId}, 500, 150, 350, 5, false, false)
      `, [
        `Evento futuro semana ${i}`,
        fecha.toISOString().split('T')[0],
        MESES[fecha.getMonth()],
        futuro.rows[0].id
      ]);
    }

    // CASO 7: Duración extrema (evento de 24 horas)
    console.log('⏰ Caso 7: Evento maratón (24 horas)...');
    const maraton = await client.query(
      `INSERT INTO clientes (nombre, email, ciudad, activo)
       VALUES ('Festival 24h', 'festival@24h.com', 'Alicante', true)
       RETURNING id`
    );

    const fecha3 = new Date();
    fecha3.setDate(fecha3.getDate() - 7);
    await client.query(`
      INSERT INTO eventos (
        evento, fecha, mes, cliente_id, dj_id,
        cache_total, parte_dj, parte_agencia, horas,
        cobrado_cliente, pagado_dj
      ) VALUES ('Festival Non-Stop 24h', $1, $2, $3, ${djGenericoId}, 8000, 3000, 5000, 24, true, true)
    `, [
      fecha3.toISOString().split('T')[0],
      MESES[fecha3.getMonth()],
      maraton.rows[0].id
    ]);

    // CASO 8: Cliente inactivo con deuda
    console.log('🚫 Caso 8: Cliente inactivo con deuda pendiente...');
    const inactivo = await client.query(
      `INSERT INTO clientes (nombre, email, ciudad, activo)
       VALUES ('Cliente Inactivo', 'inactivo@test.com', 'Murcia', false)
       RETURNING id`
    );

    const fecha4 = new Date();
    fecha4.setMonth(fecha4.getMonth() - 6);
    await client.query(`
      INSERT INTO eventos (
        evento, fecha, mes, cliente_id, dj_id,
        cache_total, parte_dj, parte_agencia, horas,
        cobrado_cliente, pagado_dj
      ) VALUES ('Último evento antes de cerrar', $1, $2, $3, ${djGenericoId}, 1500, 400, 1100, 5, false, false)
    `, [
      fecha4.toISOString().split('T')[0],
      MESES[fecha4.getMonth()],
      inactivo.rows[0].id
    ]);

    await client.query('COMMIT');

    console.log('\n✅ CASOS LÍMITE CREADOS');
    console.log('📊 Resumen:');
    console.log('   - Cliente con deuda de 2 años');
    console.log('   - Cliente VIP perfecto (20 eventos)');
    console.log('   - Evento premium (€50,000)');
    console.log('   - Evento económico (€50)');
    console.log('   - DJ sin cobrar (€600 pendientes)');
    console.log('   - 10 eventos futuros');
    console.log('   - Evento maratón 24 horas');
    console.log('   - Cliente inactivo con deuda');
    console.log('\n🔍 Perfecto para probar validaciones y casos límite\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

edgeCases();
