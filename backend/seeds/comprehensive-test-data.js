/**
 * COMPREHENSIVE TEST DATA SEED
 * Generates realistic test data for development and testing
 *
 * Usage:
 *   node seeds/comprehensive-test-data.js
 *
 * Features:
 * - Multiple clients with different activity levels
 * - Multiple DJs with varied earnings
 * - 200+ realistic events across 12 months
 * - Mix of paid/unpaid transactions
 * - Different event types and prices
 */

import pool from '../src/config/database.js';

// Configuración de datos
const CLIENTS = [
  { nombre: 'Disco Pacha', ciudad: 'Valencia', email: 'info@pacha.com', tipo: 'VIP', frecuencia: 'alta' },
  { nombre: 'Sala Apolo', ciudad: 'Barcelona', email: 'reservas@apolo.es', tipo: 'VIP', frecuencia: 'alta' },
  { nombre: 'Terraza Umbracle', ciudad: 'Valencia', email: 'eventos@umbracle.com', tipo: 'Premium', frecuencia: 'media' },
  { nombre: 'Club Mya', ciudad: 'Ibiza', email: 'booking@mya.es', tipo: 'Premium', frecuencia: 'media' },
  { nombre: 'Fiestas Privadas SL', ciudad: 'Madrid', email: 'info@fiestas.com', tipo: 'Regular', frecuencia: 'media' },
  { nombre: 'Hotel Arts', ciudad: 'Barcelona', email: 'eventos@hotelarts.com', tipo: 'Premium', frecuencia: 'baja' },
  { nombre: 'Marina Beach Club', ciudad: 'Valencia', email: 'info@marina.com', tipo: 'Premium', frecuencia: 'alta' },
  { nombre: 'Café del Mar', ciudad: 'Ibiza', email: 'bookings@cafedelmar.com', tipo: 'VIP', frecuencia: 'media' },
  { nombre: 'Restaurante El Celler', ciudad: 'Girona', email: 'eventos@elceller.com', tipo: 'Regular', frecuencia: 'baja' },
  { nombre: 'Bodega Torres', ciudad: 'Barcelona', email: 'eventos@torres.es', tipo: 'Premium', frecuencia: 'baja' },
  { nombre: 'Club Razzmatazz', ciudad: 'Barcelona', email: 'info@razz.com', tipo: 'VIP', frecuencia: 'alta' },
  { nombre: 'Eventos Corporativos SA', ciudad: 'Madrid', email: 'info@eventoscorp.com', tipo: 'Regular', frecuencia: 'media' },
  { nombre: 'Palacio de Congresos', ciudad: 'Valencia', email: 'reservas@palacio.com', tipo: 'Premium', frecuencia: 'baja' },
  { nombre: 'Oceanografic', ciudad: 'Valencia', email: 'eventos@oceanografic.org', tipo: 'Premium', frecuencia: 'baja' },
  { nombre: 'Masía Mediterránea', ciudad: 'Alicante', email: 'info@masia.com', tipo: 'Regular', frecuencia: 'baja' },
];

const DJS = [
  { nombre: 'DJ Luisma', email: 'luisma@intramedia.com', nivel: 'senior', tarifa_base: 300 },
  { nombre: 'DJ Carlitos', email: 'carlitos@intramedia.com', nivel: 'senior', tarifa_base: 280 },
  { nombre: 'DJ Marina', email: 'marina@intramedia.com', nivel: 'mid', tarifa_base: 200 },
  { nombre: 'DJ Alex', email: 'alex@intramedia.com', nivel: 'mid', tarifa_base: 180 },
  { nombre: 'DJ Paula', email: 'paula@intramedia.com', nivel: 'mid', tarifa_base: 190 },
  { nombre: 'DJ Rafa', email: 'rafa@intramedia.com', nivel: 'junior', tarifa_base: 120 },
  { nombre: 'DJ Santi', email: 'santi@intramedia.com', nivel: 'junior', tarifa_base: 110 },
  { nombre: 'DJ Nuria', email: 'nuria@intramedia.com', nivel: 'junior', tarifa_base: 100 },
];

const TIPO_EVENTOS = [
  { nombre: 'Boda', precio_min: 400, precio_max: 800, duracion: [4, 6] },
  { nombre: 'Fiesta Privada', precio_min: 200, precio_max: 500, duracion: [3, 5] },
  { nombre: 'Evento Corporativo', precio_min: 300, precio_max: 700, duracion: [3, 5] },
  { nombre: 'Discoteca', precio_min: 150, precio_max: 350, duracion: [5, 8] },
  { nombre: 'Bar/Pub', precio_min: 100, precio_max: 250, duracion: [4, 6] },
  { nombre: 'Festival', precio_min: 500, precio_max: 1200, duracion: [6, 10] },
  { nombre: 'After Hours', precio_min: 200, precio_max: 400, duracion: [4, 6] },
];

// Utilidades
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Generadores
async function clearExistingData(client) {
  console.log('🗑️  Limpiando datos existentes...');

  await client.query('DELETE FROM financial_alerts');
  await client.query('DELETE FROM eventos');
  await client.query('DELETE FROM clientes WHERE id > 0');
  await client.query('DELETE FROM djs WHERE id > 0');

  console.log('✅ Datos limpiados');
}

async function seedClients(client) {
  console.log('👥 Creando clientes...');

  const clientIds = [];
  for (const clientData of CLIENTS) {
    const result = await client.query(`
      INSERT INTO clientes (nombre, ciudad, email, contacto, activo, created_at)
      VALUES ($1, $2, $3, $4, true, NOW() - INTERVAL '${randomInt(1, 365)} days')
      RETURNING id
    `, [clientData.nombre, clientData.ciudad, clientData.email, clientData.nombre]);

    clientIds.push({ id: result.rows[0].id, ...clientData });
  }

  console.log(`✅ ${clientIds.length} clientes creados`);
  return clientIds;
}

async function seedDJs(client) {
  console.log('🎧 Creando DJs...');

  const djIds = [];
  for (const djData of DJS) {
    const result = await client.query(`
      INSERT INTO djs (nombre, email, telefono, activo, created_at)
      VALUES ($1, $2, $3, true, NOW() - INTERVAL '${randomInt(1, 730)} days')
      RETURNING id
    `, [djData.nombre, djData.email, `+34${randomInt(600000000, 699999999)}`]);

    djIds.push({ id: result.rows[0].id, ...djData });
  }

  console.log(`✅ ${djIds.length} DJs creados`);
  return djIds;
}

async function seedEvents(client, clients, djs) {
  console.log('🎉 Creando eventos...');

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 12); // Últimos 12 meses
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 2); // Próximos 2 meses

  let eventCount = 0;
  const eventosCreados = [];

  // Generar eventos basados en frecuencia del cliente
  for (const clientData of clients) {
    let numEventos;
    switch (clientData.frecuencia) {
      case 'alta': numEventos = randomInt(15, 25); break;
      case 'media': numEventos = randomInt(6, 12); break;
      case 'baja': numEventos = randomInt(2, 5); break;
      default: numEventos = 3;
    }

    for (let i = 0; i < numEventos; i++) {
      const tipoEvento = randomElement(TIPO_EVENTOS);
      const dj = randomElement(djs);
      const fecha = randomDate(startDate, endDate);
      const horas = randomInt(tipoEvento.duracion[0], tipoEvento.duracion[1]);

      // Precios realistas
      const cacheTotal = randomInt(tipoEvento.precio_min, tipoEvento.precio_max);
      const parteDj = Math.min(dj.tarifa_base * horas * 0.7, cacheTotal * 0.3); // Max 30% del cache
      const parteAgencia = cacheTotal - parteDj;

      // Estados de pago realistas
      const esPasado = fecha < new Date();
      let cobradoCliente, pagadoDj;

      if (esPasado) {
        // Eventos pasados: alta probabilidad de estar cobrados/pagados
        cobradoCliente = Math.random() < 0.85; // 85% cobrados
        pagadoDj = cobradoCliente && Math.random() < 0.90; // 90% de los cobrados están pagados
      } else {
        // Eventos futuros: no cobrados ni pagados
        cobradoCliente = false;
        pagadoDj = false;
      }

      // Calcular mes en formato español
      const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
                     'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
      const mesNombre = meses[fecha.getMonth()];

      const result = await client.query(`
        INSERT INTO eventos (
          evento, fecha, mes, cliente_id, dj_id,
          cache_total, parte_dj, parte_agencia, horas,
          cobrado_cliente, pagado_dj,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
      `, [
        `${tipoEvento.nombre} - ${clientData.nombre}`,
        formatDate(fecha),
        mesNombre,
        clientData.id,
        dj.id,
        cacheTotal,
        Math.round(parteDj),
        Math.round(parteAgencia),
        horas,
        cobradoCliente,
        pagadoDj,
        fecha
      ]);

      eventosCreados.push({
        id: result.rows[0].id,
        cliente: clientData.nombre,
        dj: dj.nombre,
        fecha,
        cobrado: cobradoCliente,
        pagado: pagadoDj
      });
      eventCount++;
    }
  }

  console.log(`✅ ${eventCount} eventos creados`);
  return eventosCreados;
}

async function generateFinancialAlerts(client) {
  console.log('🚨 Generando alertas financieras...');

  try {
    // Alertas simplificadas - solo las columnas que existen
    const cobrosCriticos = await client.query(`
      INSERT INTO financial_alerts (alert_type, severity, title, message, metadata)
      SELECT
        'cobro_critico',
        'critical',
        'Cobro crítico: ' || c.nombre,
        'Cliente con €' || SUM(e.cache_total)::text || ' pendientes desde hace más de 60 días',
        json_build_object(
          'cliente_id', c.id,
          'cliente_nombre', c.nombre,
          'monto_pendiente', SUM(e.cache_total),
          'dias_pendiente', EXTRACT(DAY FROM (CURRENT_DATE - MAX(e.fecha))),
          'eventos_pendientes', COUNT(e.id)
        )
      FROM clientes c
      JOIN eventos e ON e.cliente_id = c.id
      WHERE NOT e.cobrado_cliente
        AND e.fecha < CURRENT_DATE - INTERVAL '60 days'
      GROUP BY c.id, c.nombre
      HAVING SUM(e.cache_total) > 500
      RETURNING id
    `);

    const cobrosUrgentes = await client.query(`
      INSERT INTO financial_alerts (alert_type, severity, title, message, metadata)
      SELECT
        'cobro_urgente',
        'warning',
        'Cobro urgente: ' || c.nombre,
        'Cliente con €' || SUM(e.cache_total)::text || ' pendientes desde hace 30-60 días',
        json_build_object(
          'cliente_id', c.id,
          'cliente_nombre', c.nombre,
          'monto_pendiente', SUM(e.cache_total),
          'eventos_pendientes', COUNT(e.id)
        )
      FROM clientes c
      JOIN eventos e ON e.cliente_id = c.id
      WHERE NOT e.cobrado_cliente
        AND e.fecha < CURRENT_DATE - INTERVAL '30 days'
        AND e.fecha >= CURRENT_DATE - INTERVAL '60 days'
      GROUP BY c.id, c.nombre
      HAVING SUM(e.cache_total) > 200
      RETURNING id
    `);

    const pagosDjPendientes = await client.query(`
      INSERT INTO financial_alerts (alert_type, severity, title, message, metadata)
      SELECT
        'pago_dj_pendiente',
        'critical',
        'Pago pendiente: ' || d.nombre,
        'DJ con €' || SUM(e.parte_dj)::text || ' pendientes de pago',
        json_build_object(
          'dj_id', d.id,
          'dj_nombre', d.nombre,
          'monto_pendiente', SUM(e.parte_dj),
          'eventos_pendientes', COUNT(e.id)
        )
      FROM djs d
      JOIN eventos e ON e.dj_id = d.id
      WHERE NOT e.pagado_dj
        AND e.cobrado_cliente = true
        AND e.fecha < CURRENT_DATE
      GROUP BY d.id, d.nombre
      HAVING SUM(e.parte_dj) > 100
      RETURNING id
    `);

    const totalAlertas =
      cobrosCriticos.rowCount +
      cobrosUrgentes.rowCount +
      pagosDjPendientes.rowCount;

    console.log(`✅ ${totalAlertas} alertas generadas`);
    console.log(`   - ${cobrosCriticos.rowCount} cobros críticos`);
    console.log(`   - ${cobrosUrgentes.rowCount} cobros urgentes`);
    console.log(`   - ${pagosDjPendientes.rowCount} pagos DJ pendientes`);
  } catch (error) {
    console.log(`⚠️  No se pudieron generar alertas (tabla incompatible): ${error.message}`);
    console.log('   Continuando sin alertas...');
  }
}

async function showStatistics(client) {
  console.log('\n📊 ESTADÍSTICAS GENERADAS:\n');

  const stats = await client.query(`
    SELECT
      COUNT(DISTINCT c.id) as total_clientes,
      COUNT(DISTINCT d.id) as total_djs,
      COUNT(e.id) as total_eventos,
      COALESCE(SUM(e.cache_total), 0) as facturacion_total,
      COALESCE(SUM(CASE WHEN e.cobrado_cliente THEN e.cache_total ELSE 0 END), 0) as total_cobrado,
      COALESCE(SUM(CASE WHEN NOT e.cobrado_cliente THEN e.cache_total ELSE 0 END), 0) as pendiente_cobro,
      COALESCE(SUM(e.parte_dj), 0) as total_costes_dj,
      COALESCE(SUM(CASE WHEN e.pagado_dj THEN e.parte_dj ELSE 0 END), 0) as total_pagado_dj,
      COALESCE(SUM(CASE WHEN NOT e.pagado_dj THEN e.parte_dj ELSE 0 END), 0) as pendiente_pago_dj,
      COUNT(CASE WHEN e.fecha >= CURRENT_DATE THEN 1 END) as eventos_futuros,
      COUNT(CASE WHEN e.fecha < CURRENT_DATE THEN 1 END) as eventos_pasados
    FROM clientes c
    CROSS JOIN djs d
    LEFT JOIN eventos e ON true
  `);

  const s = stats.rows[0];
  console.log(`👥 Clientes: ${s.total_clientes}`);
  console.log(`🎧 DJs: ${s.total_djs}`);
  console.log(`🎉 Eventos: ${s.total_eventos} (${s.eventos_pasados} pasados, ${s.eventos_futuros} futuros)`);
  console.log(`💰 Facturación total: €${parseFloat(s.facturacion_total).toFixed(2)}`);
  console.log(`✅ Total cobrado: €${parseFloat(s.total_cobrado).toFixed(2)}`);
  console.log(`⏳ Pendiente cobro: €${parseFloat(s.pendiente_cobro).toFixed(2)}`);
  console.log(`💸 Costes DJs: €${parseFloat(s.total_costes_dj).toFixed(2)}`);
  console.log(`✅ Pagado a DJs: €${parseFloat(s.total_pagado_dj).toFixed(2)}`);
  console.log(`⏳ Pendiente pago DJs: €${parseFloat(s.pendiente_pago_dj).toFixed(2)}`);

  const alertStats = await client.query(`
    SELECT COUNT(*) as total, severity
    FROM financial_alerts
    GROUP BY severity
  `);

  console.log(`\n🚨 Alertas financieras:`);
  alertStats.rows.forEach(row => {
    console.log(`   - ${row.severity}: ${row.total}`);
  });
}

// MAIN
async function main() {
  const client = await pool.connect();

  try {
    console.log('🚀 INICIANDO SEED DE DATOS DE PRUEBA\n');

    await client.query('BEGIN');

    // Limpiar datos existentes
    await clearExistingData(client);

    // Crear datos base
    const clients = await seedClients(client);
    const djs = await seedDJs(client);

    // Crear eventos
    await seedEvents(client, clients, djs);

    // Generar alertas
    await generateFinancialAlerts(client);

    await client.query('COMMIT');

    // Mostrar estadísticas
    await showStatistics(client);

    console.log('\n✅ SEED COMPLETADO EXITOSAMENTE\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error ejecutando seed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar
main().catch(console.error);
