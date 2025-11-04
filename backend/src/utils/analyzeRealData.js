import ExcelJS from 'exceljs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function analyzeRealData() {
  const files = [
    { year: '2024', path: join(__dirname, '../../../2024/ de INGRESOS DJS 2024.xlsx') },
    { year: '2025', path: join(__dirname, '../../../2025/INGRESOS DJS 2025.xlsx') },
    { year: '2026', path: join(__dirname, '../../../2026/INGRESOS DJS 2026.xlsx') }
  ];

  console.log('========================================');
  console.log('   ANÁLISIS DE DATOS REALES 2024-2026');
  console.log('========================================\n');

  for (const file of files) {
    console.log(`\n📁 Analizando: ${file.year}`);
    console.log(`   Ruta: ${file.path}`);
    console.log('   ' + '-'.repeat(50));

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(file.path);

      console.log(`\n   Hojas disponibles:`);
      workbook.worksheets.forEach((sheet, index) => {
        console.log(`     ${index + 1}. ${sheet.name} (${sheet.rowCount} filas)`);
      });

      // Analizar la hoja principal
      const mainSheet = workbook.getWorksheet('Registro de Eventos') || workbook.worksheets[0];

      if (mainSheet) {
        console.log(`\n   📊 Analizando hoja principal: "${mainSheet.name}"`);

        const headers = [];
        mainSheet.getRow(1).eachCell((cell, colNumber) => {
          headers[colNumber] = cell.value;
        });

        console.log(`   Columnas encontradas: ${headers.filter(Boolean).join(', ')}`);

        const djCol = headers.indexOf('DJ');
        const eventoCol = headers.indexOf('EVENTO');
        const cacheCol = headers.indexOf('CACHÉ TOTAL (€)');
        const fechaCol = headers.indexOf('FECHA');

        if (djCol > 0 && eventoCol > 0) {
          let eventosValidos = 0;
          const djsSet = new Set();
          const eventosSet = new Set();
          const mesesSet = new Set();

          for (let i = 2; i <= mainSheet.rowCount; i++) {
            const row = mainSheet.getRow(i);
            const dj = row.getCell(djCol).value;
            const evento = row.getCell(eventoCol).value;
            const mes = row.getCell(headers.indexOf('MES')).value;

            if (dj && evento && typeof dj === 'string' && typeof evento === 'string') {
              eventosValidos++;
              djsSet.add(dj.trim().toUpperCase());
              eventosSet.add(evento.trim());
              if (mes) mesesSet.add(mes.trim().toUpperCase());
            }
          }

          console.log(`\n   ✅ Eventos válidos encontrados: ${eventosValidos}`);
          console.log(`   👤 DJs únicos: ${djsSet.size} (${Array.from(djsSet).join(', ')})`);
          console.log(`   🏢 Clientes/Locales únicos: ${eventosSet.size}`);
          console.log(`   📅 Meses con datos: ${Array.from(mesesSet).join(', ')}`);

          // Mostrar muestra de primeros 5 eventos
          console.log(`\n   Muestra de eventos:`);
          let muestraCount = 0;
          for (let i = 2; i <= mainSheet.rowCount && muestraCount < 5; i++) {
            const row = mainSheet.getRow(i);
            const dj = row.getCell(djCol).value;
            const evento = row.getCell(eventoCol).value;
            const cache = row.getCell(cacheCol).value;
            const fecha = row.getCell(fechaCol).value;
            const mes = row.getCell(headers.indexOf('MES')).value;

            if (dj && evento) {
              const fechaStr = fecha instanceof Date ? fecha.toISOString().split('T')[0] : fecha;
              console.log(`     ${i}. ${mes} | DJ: ${dj} | ${evento} | €${cache || 0} | ${fechaStr || 'Sin fecha'}`);
              muestraCount++;
            }
          }
        } else {
          console.log(`   ⚠️  No se encontraron columnas DJ o EVENTO`);
        }
      }

    } catch (error) {
      console.error(`   ❌ Error procesando ${file.year}:`, error.message);
    }
  }

  console.log('\n========================================');
  console.log('   FIN DEL ANÁLISIS');
  console.log('========================================\n');
}

// Ejecutar análisis
analyzeRealData().catch(console.error);
