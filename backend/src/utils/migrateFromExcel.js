import ExcelJS from 'exceljs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from '../config/database.js';
import DJ from '../models/DJ.js';
import Cliente from '../models/Client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mapeo de nombres de meses
const MESES_MAP = {
  'JUNIO': 'JUNIO',
  'JULIO': 'JULIO',
  'AGOSTO': 'AGOSTO',
  'SEPTIEMBRE': 'SEPTIEMBRE',
  'OCTUBRE': 'OCTUBRE',
  'NOVIEMBRE': 'NOVIEMBRE',
  'DICIEMBRE': 'DICIEMBRE',
  'ENERO': 'ENERO',
  'FEBRERO': 'FEBRERO',
  'MARZO': 'MARZO',
  'ABRIL': 'ABRIL',
  'MAYO': 'MAYO'
};

// Mapeo de categorías
const CATEGORIAS_MAP = {
  'Discoteca': 1,
  'Pub': 2,
  'Cumpleaños': 3,
  'Boda': 4,
  'Corporativo': 5,
  'Festival': 6,
  'Privado': 7,
  'Otro': 8
};

function parseEuro(value) {
  if (typeof value === 'number') return value;
  if (!value) return 0;

  let str = String(value).trim();
  str = str.replace(/[€\s]/g, '').replace(/EUR/gi, '');

  if (str.includes('.') && str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function parseDate(value) {
  if (!value) return null;

  // Si ya es una fecha
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }

  // Si es texto tipo "Viernes 6"
  if (typeof value === 'string') {
    // Por ahora asumimos el mes actual o podemos extraerlo del contexto
    // Esto debería mejorarse según tus necesidades
    return null;
  }

  return null;
}

async function migrateFromExcel() {
  const excelPath = join(__dirname, '../../../ORIGINAL.xlsx');

  console.log('📊 Iniciando migración desde Excel...');
  console.log('📁 Archivo:', excelPath);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // Leer archivo Excel
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelPath);

    const sheet = workbook.getWorksheet('Registro de Eventos');

    if (!sheet) {
      throw new Error('No se encontró la hoja "Registro de Eventos"');
    }

    console.log(`\n✅ Hoja encontrada: ${sheet.rowCount} filas`);

    // Extraer encabezados
    const headers = [];
    sheet.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber] = cell.value;
    });

    console.log('\n📋 Columnas encontradas:', headers.filter(Boolean));

    // Mapeo de columnas - headers ya tiene índices correctos de ExcelJS (basados en 1)
    const colMap = {
      fecha: headers.indexOf('FECHA'),
      mes: headers.indexOf('MES'),
      dj: headers.indexOf('DJ'),
      evento: headers.indexOf('EVENTO'),
      ciudad: headers.indexOf('CIUDAD / LUGAR'),
      horas: headers.indexOf('HORAS'),
      cacheTotal: headers.indexOf('CACHÉ TOTAL (€)'),
      parteDJ: headers.indexOf('PARTE DJ (€)'),
      parteAgencia: headers.indexOf('PARTE AGENCIA (€)'),
      reserva: headers.indexOf('Reservas'),
      cobradoCliente: headers.indexOf('¿Cobrado cliente?'),
      pagadoDJ: headers.indexOf('¿Pagado al DJ?'),
      observaciones: headers.indexOf('Observaciones'),
      etiqueta: headers.indexOf('Etiqueta')
    };

    console.log('\n🔍 DEBUG - Mapeo de columnas:', colMap);

    console.log('\n🔍 Extrayendo DJs únicos...');

    // Extraer DJs únicos
    const djsSet = new Set();
    for (let i = 2; i <= sheet.rowCount; i++) {
      const row = sheet.getRow(i);
      const djNombre = row.getCell(colMap.dj).value;
      if (djNombre && typeof djNombre === 'string') {
        djsSet.add(djNombre.trim().toUpperCase());
      }
    }

    console.log(`   Encontrados ${djsSet.size} DJs únicos`);

    // Crear DJs en la base de datos
    const djsMap = new Map();
    for (const djNombre of djsSet) {
      try {
        const dj = await DJ.create({
          nombre: djNombre,
          email: `${djNombre.toLowerCase().replace(/\s+/g, '')}@intramedia.com`,
          activo: true
        });
        djsMap.set(djNombre, dj.id);
        console.log(`   ✓ DJ creado: ${djNombre} (ID: ${dj.id})`);
      } catch (error) {
        console.error(`   ✗ Error creando DJ ${djNombre}:`, error.message);
      }
    }

    console.log('\n🔍 Extrayendo clientes únicos...');

    // Extraer clientes únicos de la columna EVENTO (locales como PUB MV, WHATEVER, etc.)
    const clientesSet = new Set();
    for (let i = 2; i <= sheet.rowCount; i++) {
      const row = sheet.getRow(i);
      const eventoNombre = row.getCell(colMap.evento).value;
      if (eventoNombre && typeof eventoNombre === 'string') {
        clientesSet.add(eventoNombre.trim());
      }
    }

    console.log(`   Encontrados ${clientesSet.size} clientes únicos`);

    // Crear clientes en la base de datos
    const clientesMap = new Map();
    for (const clienteNombre of clientesSet) {
      try {
        const cliente = await Cliente.findOrCreate(clienteNombre, clienteNombre);
        clientesMap.set(clienteNombre, cliente.id);
        console.log(`   ✓ Cliente creado: ${clienteNombre} (ID: ${cliente.id})`);
      } catch (error) {
        console.error(`   ✗ Error creando cliente ${clienteNombre}:`, error.message);
      }
    }

    console.log('\n🔄 Migrando eventos...');

    let eventosCreados = 0;
    let eventosError = 0;

    // Migrar eventos
    for (let i = 2; i <= sheet.rowCount; i++) {
      const row = sheet.getRow(i);

      try {
        const djNombre = row.getCell(colMap.dj).value?.toString().trim().toUpperCase();
        const ciudadLugar = row.getCell(colMap.ciudad).value?.toString().trim();
        const mes = row.getCell(colMap.mes).value?.toString().trim().toUpperCase();
        const eventoNombre = row.getCell(colMap.evento).value?.toString().trim();

        if (!djNombre || !eventoNombre) {
          continue; // Skip filas vacías
        }

        const eventoData = {
          fecha: parseDate(row.getCell(colMap.fecha).value) || '2024-06-01', // Default si no hay fecha
          mes: MESES_MAP[mes] || mes || 'JUNIO',
          dj_id: djsMap.get(djNombre),
          cliente_id: eventoNombre ? clientesMap.get(eventoNombre) : null,
          evento: eventoNombre,
          ciudad_lugar: ciudadLugar || '',
          categoria_id: CATEGORIAS_MAP[row.getCell(colMap.etiqueta).value] || 8, // Otro por defecto
          horas: parseFloat(row.getCell(colMap.horas).value) || 0,
          cache_total: parseEuro(row.getCell(colMap.cacheTotal).value),
          parte_dj: parseEuro(row.getCell(colMap.parteDJ).value),
          parte_agencia: parseEuro(row.getCell(colMap.parteAgencia).value),
          reserva: parseEuro(row.getCell(colMap.reserva).value),
          cobrado_cliente: row.getCell(colMap.cobradoCliente).value === 'Sí',
          pagado_dj: row.getCell(colMap.pagadoDJ).value === 'Listo' || row.getCell(colMap.pagadoDJ).value === 'Sí',
          observaciones: row.getCell(colMap.observaciones).value?.toString() || null
        };

        // Insertar evento
        const sql = `
          INSERT INTO events (
            fecha, mes, dj_id, cliente_id, evento, ciudad_lugar, categoria_id,
            horas, cache_total, parte_dj, parte_agencia, reserva,
            cobrado_cliente, pagado_dj, observaciones
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          RETURNING id
        `;

        // Debug: log data antes de insertar (solo las primeras 5 filas)
        if (eventosCreados < 5) {
          console.log(`      DEBUG Fila ${i}:`, {
            cache_total: eventoData.cache_total,
            parte_dj: eventoData.parte_dj,
            parte_agencia: eventoData.parte_agencia,
            reserva: eventoData.reserva,
            horas: eventoData.horas
          });
        }

        const result = await pool.query(sql, [
          eventoData.fecha,
          eventoData.mes,
          eventoData.dj_id,
          eventoData.cliente_id,
          eventoData.evento,
          eventoData.ciudad_lugar,
          eventoData.categoria_id,
          eventoData.horas,
          eventoData.cache_total,
          eventoData.parte_dj,
          eventoData.parte_agencia,
          eventoData.reserva,
          eventoData.cobrado_cliente,
          eventoData.pagado_dj,
          eventoData.observaciones
        ]);

        eventosCreados++;

        if (eventosCreados % 50 === 0) {
          console.log(`   ${eventosCreados} eventos migrados...`);
        }

      } catch (error) {
        eventosError++;
        if (eventosError <= 3) { // Solo mostrar detalles de los primeros 3 errores
          console.error(`   ✗ Error en fila ${i}:`, error.message);
          console.error(`      Stack:`, error.stack);
        } else {
          console.error(`   ✗ Error en fila ${i}:`, error.message);
        }
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Migración completada');
    console.log(`   DJs creados: ${djsMap.size}`);
    console.log(`   Clientes creados: ${clientesMap.size}`);
    console.log(`   Eventos migrados: ${eventosCreados}`);
    console.log(`   Eventos con error: ${eventosError}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ Error en migración:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Ejecutar migración
migrateFromExcel().catch(console.error);
