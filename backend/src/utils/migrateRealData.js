import ExcelJS from 'exceljs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool from '../config/database.js';
import DJ from '../models/DJ.js';
import Cliente from '../models/Cliente.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Lista de valores que NO son DJs reales (gastos, notas, etc.)
const INVALID_DJ_NAMES = new Set([
  'ALQUILER', 'CAMPAÑA', 'MONTAJE', 'NO HAY', 'OTRO', 'OTROS', 'X',
  'DJ1', 'DJ2', '', null, undefined
]);

// Mapeo de meses a nombres consistentes
const MESES_MAP = {
  'ENERO': 'ENERO',
  'FEBRERO': 'FEBRERO',
  'MARZO': 'MARZO',
  'ABRIL': 'ABRIL',
  'MAYO': 'MAYO',
  'JUNIO': 'JUNIO',
  'JULIO': 'JULIO',
  'AGOSTO': 'AGOSTO',
  'SEPTIEMBRE': 'SEPTIEMBRE',
  'OCTUBRE': 'OCTUBRE',
  'NOVIEMBRE': 'NOVIEMBRE',
  'DICIEMBRE': 'DICIEMBRE'
};

function isValidDJ(djName) {
  if (!djName || typeof djName !== 'string') return false;
  const normalized = djName.trim().toUpperCase();
  return !INVALID_DJ_NAMES.has(normalized);
}

function parseDate(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }

  return null;
}

function parseNumber(value) {
  if (typeof value === 'number') return value;
  if (!value) return 0;

  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

async function migrateRealData() {
  const files = [
    { year: '2024', path: join(__dirname, '../../../2024/ de INGRESOS DJS 2024.xlsx') },
    { year: '2025', path: join(__dirname, '../../../2025/INGRESOS DJS 2025.xlsx') },
    { year: '2026', path: join(__dirname, '../../../2026/INGRESOS DJS 2026.xlsx') }
  ];

  console.log('\n' + '='.repeat(70));
  console.log('   MIGRACIÓN DE DATOS REALES 2024-2026');
  console.log('='.repeat(70) + '\n');

  try {
    // Recolectar todos los DJs y clientes únicos primero
    console.log('🔍 Fase 1: Recolectando DJs y clientes únicos...\n');

    const djsSet = new Set();
    const clientesSet = new Set();
    let eventosAMigrar = 0;

    for (const file of files) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(file.path);

      workbook.worksheets.forEach((sheet) => {
        if (sheet.name === 'CIERRE AÑO' || sheet.rowCount < 5) return;

        for (let i = 5; i <= sheet.rowCount; i++) {
          const row = sheet.getRow(i);
          const djNombre = row.getCell(2).value;
          const ubicacion = row.getCell(3).value;

          if (djNombre && ubicacion && isValidDJ(djNombre)) {
            djsSet.add(djNombre.toString().trim().toUpperCase());
            if (typeof ubicacion === 'string') {
              clientesSet.add(ubicacion.trim());
            }
            eventosAMigrar++;
          }
        }
      });
    }

    console.log(`   ✅ ${djsSet.size} DJs únicos encontrados`);
    console.log(`   ✅ ${clientesSet.size} clientes/locales únicos encontrados`);
    console.log(`   ✅ ${eventosAMigrar} eventos válidos a migrar\n`);

    // Crear DJs en la base de datos
    console.log('🔍 Fase 2: Creando DJs en la base de datos...\n');

    const djsMap = new Map();
    for (const djNombre of djsSet) {
      try {
        const dj = await DJ.create({
          nombre: djNombre,
          email: `${djNombre.toLowerCase().replace(/[^a-z0-9]/g, '')}@intramedia.com`,
          activo: true
        });
        djsMap.set(djNombre, dj.id);
        console.log(`   ✓ DJ creado: ${djNombre} (ID: ${dj.id})`);
      } catch (error) {
        console.error(`   ✗ Error creando DJ ${djNombre}:`, error.message);
      }
    }

    // Crear clientes
    console.log('\n🔍 Fase 3: Creando clientes/locales en la base de datos...\n');

    const clientesMap = new Map();
    let clientesCreados = 0;

    for (const clienteNombre of clientesSet) {
      try {
        const cliente = await Cliente.findOrCreate(clienteNombre, clienteNombre);
        clientesMap.set(clienteNombre, cliente.id);
        clientesCreados++;

        if (clientesCreados % 50 === 0) {
          console.log(`   ${clientesCreados}/${clientesSet.size} clientes creados...`);
        }
      } catch (error) {
        console.error(`   ✗ Error creando cliente ${clienteNombre}:`, error.message);
      }
    }

    console.log(`   ✅ ${clientesCreados} clientes creados\n`);

    // Migrar eventos
    console.log('🔍 Fase 4: Migrando eventos...\n');

    let eventosCreados = 0;
    let eventosError = 0;

    for (const file of files) {
      console.log(`\n   📁 Procesando ${file.year}...`);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(file.path);

      for (const sheet of workbook.worksheets) {
        if (sheet.name === 'CIERRE AÑO' || sheet.rowCount < 5) continue;

        const mesNombre = MESES_MAP[sheet.name.toUpperCase()] || sheet.name.toUpperCase();
        let eventosHoja = 0;

        for (let i = 5; i <= sheet.rowCount; i++) {
          const row = sheet.getRow(i);

          try {
            const djNombre = row.getCell(2).value?.toString().trim().toUpperCase();
            const ubicacion = row.getCell(3).value?.toString().trim();
            const fecha = row.getCell(1).value;
            const cantidad = row.getCell(4).value; // Caché total
            const agencia = row.getCell(5).value;  // Parte agencia
            const parteDJ = row.getCell(6).value;  // Parte DJ
            const alquiler = row.getCell(7).value; // Alquiler equipo
            const cobrado = row.getCell(8).value;  // Estado cobrado

            if (!djNombre || !ubicacion || !isValidDJ(djNombre)) {
              continue;
            }

            const djId = djsMap.get(djNombre);
            const clienteId = clientesMap.get(ubicacion);

            if (!djId) {
              console.log(`   ⚠️  DJ no encontrado: ${djNombre}`);
              continue;
            }

            const eventoData = {
              fecha: parseDate(fecha) || `${file.year}-${String(Object.keys(MESES_MAP).indexOf(mesNombre) + 1).padStart(2, '0')}-01`,
              mes: mesNombre,
              dj_id: djId,
              cliente_id: clienteId,
              evento: ubicacion,
              ciudad_lugar: ubicacion,
              categoria_id: 1, // Discoteca por defecto
              horas: 0, // No tenemos horas en esta estructura
              cache_total: parseNumber(cantidad),
              parte_dj: parseNumber(parteDJ),
              parte_agencia: parseNumber(agencia),
              reserva: 0,
              cobrado_cliente: cobrado === 'P' || cobrado === 'SI' || cobrado === 'Sí',
              pagado_dj: cobrado === 'P' || cobrado === 'SI' || cobrado === 'Sí',
              observaciones: alquiler ? `Alquiler: €${alquiler}` : null
            };

            const sql = `
              INSERT INTO eventos (
                fecha, mes, dj_id, cliente_id, evento, ciudad_lugar, categoria_id,
                horas, cache_total, parte_dj, parte_agencia, reserva,
                cobrado_cliente, pagado_dj, observaciones
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
              RETURNING id
            `;

            await pool.query(sql, [
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
            eventosHoja++;

          } catch (error) {
            eventosError++;
            if (eventosError <= 5) {
              console.error(`   ✗ Error en ${sheet.name} fila ${i}:`, error.message);
            }
          }
        }

        if (eventosHoja > 0) {
          console.log(`      ${sheet.name}: ${eventosHoja} eventos migrados`);
        }
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ MIGRACIÓN COMPLETADA');
    console.log('='.repeat(70));
    console.log(`   DJs creados: ${djsMap.size}`);
    console.log(`   Clientes creados: ${clientesMap.size}`);
    console.log(`   Eventos migrados: ${eventosCreados}`);
    console.log(`   Eventos con error: ${eventosError}`);
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Error en migración:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Ejecutar migración
migrateRealData().catch(console.error);
