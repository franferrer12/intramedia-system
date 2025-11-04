import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Award,
  DollarSign,
  Star,
  Music,
  BarChart3,
  CheckCircle,
  AlertCircle,
  FileDown,
  Eye,
  Clock
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Generador de Reportes Mensuales en PDF
 * Crea reportes profesionales con métricas, gráficos y análisis del DJ
 */
const DJMonthlyReportPDF = ({ djId, djData, eventosData }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportHistory, setReportHistory] = useState([
    {
      id: 1,
      periodo: '2025-09',
      mesNombre: 'Septiembre 2025',
      fechaGeneracion: '2025-10-01',
      totalEventos: 12,
      revenue: 12500,
      rating: 4.7,
      generadoPor: 'Manager Principal'
    },
    {
      id: 2,
      periodo: '2025-08',
      mesNombre: 'Agosto 2025',
      fechaGeneracion: '2025-09-01',
      totalEventos: 15,
      revenue: 15800,
      rating: 4.8,
      generadoPor: 'Manager Principal'
    }
  ]);

  // Filtrar eventos del mes seleccionado
  const getMonthEvents = (month) => {
    if (!eventosData) return [];
    return eventosData.filter(evento => {
      const eventoMonth = new Date(evento.fecha).toISOString().slice(0, 7);
      return eventoMonth === month;
    });
  };

  // Calcular métricas del mes
  const calculateMonthMetrics = (month) => {
    const eventos = getMonthEvents(month);
    const total = eventos.length;
    const completados = eventos.filter(e => e.estado === 'completado').length;
    const cancelados = eventos.filter(e => e.estado === 'cancelado').length;
    const revenue = eventos.reduce((sum, e) => sum + (parseFloat(e.cache_total) || 0), 0);
    const avgCache = total > 0 ? revenue / total : 0;

    return {
      totalEventos: total,
      eventosCompletados: completados,
      eventosCancelados: cancelados,
      tasaExito: total > 0 ? (completados / total * 100) : 0,
      revenue,
      avgCache,
      ratingPromedio: 4.6 // Mock - implementar real
    };
  };

  // Generar PDF
  const generatePDF = () => {
    setIsGenerating(true);

    try {
      const doc = new jsPDF();
      const metrics = calculateMonthMetrics(selectedMonth);
      const eventos = getMonthEvents(selectedMonth);
      const monthName = new Date(selectedMonth + '-01').toLocaleDateString('es-ES', {
        month: 'long',
        year: 'numeric'
      });

      let yPosition = 20;

      // ===== HEADER =====
      doc.setFillColor(14, 165, 233); // Blue
      doc.rect(0, 0, 210, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORTE MENSUAL DE PERFORMANCE', 105, 15, { align: 'center' });

      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(`${djData?.nombre || 'DJ'} - ${monthName}`, 105, 25, { align: 'center' });

      doc.setFontSize(10);
      doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')}`, 105, 32, { align: 'center' });

      yPosition = 50;

      // ===== INFORMACIÓN DEL DJ =====
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Información del DJ', 14, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nombre: ${djData?.nombre || 'N/A'}`, 14, yPosition);
      doc.text(`Email: ${djData?.email || 'N/A'}`, 110, yPosition);
      yPosition += 6;
      doc.text(`Teléfono: ${djData?.telefono || 'N/A'}`, 14, yPosition);
      doc.text(`Categoría: ${djData?.categoria || 'N/A'}`, 110, yPosition);
      yPosition += 12;

      // ===== MÉTRICAS PRINCIPALES =====
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Métricas del Mes', 14, yPosition);
      yPosition += 8;

      // Cuadros de métricas
      const metricBoxes = [
        {
          label: 'Total Eventos',
          value: metrics.totalEventos.toString(),
          color: [14, 165, 233],
          x: 14
        },
        {
          label: 'Completados',
          value: metrics.eventosCompletados.toString(),
          color: [34, 197, 94],
          x: 60
        },
        {
          label: 'Revenue Total',
          value: `€${metrics.revenue.toFixed(0)}`,
          color: [168, 85, 247],
          x: 106
        },
        {
          label: 'Rating Promedio',
          value: `${metrics.ratingPromedio.toFixed(1)} ⭐`,
          color: [234, 179, 8],
          x: 152
        }
      ];

      metricBoxes.forEach(box => {
        doc.setFillColor(...box.color);
        doc.roundedRect(box.x, yPosition, 40, 20, 2, 2, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(box.label, box.x + 20, yPosition + 6, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(box.value, box.x + 20, yPosition + 15, { align: 'center' });
      });

      yPosition += 30;

      // ===== TABLA DE EVENTOS =====
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Detalle de Eventos', 14, yPosition);
      yPosition += 5;

      const tableData = eventos.map(evento => [
        new Date(evento.fecha).toLocaleDateString('es-ES'),
        evento.nombre_evento || 'Evento',
        evento.local_nombre || 'N/A',
        evento.tipo_evento || 'N/A',
        evento.estado || 'N/A',
        `€${parseFloat(evento.cache_total || 0).toFixed(0)}`
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [['Fecha', 'Evento', 'Local', 'Tipo', 'Estado', 'Caché']],
        body: tableData.length > 0 ? tableData : [['No hay eventos en este mes', '', '', '', '', '']],
        theme: 'grid',
        headStyles: {
          fillColor: [14, 165, 233],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 45 },
          2: { cellWidth: 35 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 },
          5: { cellWidth: 25 }
        },
        didDrawCell: (data) => {
          // Colorear estado
          if (data.column.index === 4 && data.section === 'body') {
            const estado = data.cell.raw;
            let color = [107, 114, 128]; // gray
            if (estado === 'completado') color = [34, 197, 94]; // green
            if (estado === 'cancelado') color = [239, 68, 68]; // red
            if (estado === 'confirmado') color = [14, 165, 233]; // blue

            doc.setFillColor(...color);
            doc.setTextColor(255, 255, 255);
          }
        }
      });

      yPosition = doc.lastAutoTable.finalY + 15;

      // ===== ANÁLISIS Y ESTADÍSTICAS =====
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Análisis de Performance', 14, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      // Estadísticas adicionales
      const stats = [
        { label: 'Tasa de Éxito', value: `${metrics.tasaExito.toFixed(1)}%` },
        { label: 'Caché Promedio por Evento', value: `€${metrics.avgCache.toFixed(0)}` },
        { label: 'Eventos Cancelados', value: `${metrics.eventosCancelados} (${(metrics.eventosCancelados / metrics.totalEventos * 100 || 0).toFixed(1)}%)` }
      ];

      stats.forEach(stat => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${stat.label}:`, 14, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(stat.value, 80, yPosition);
        yPosition += 7;
      });

      yPosition += 10;

      // ===== TIPOS DE EVENTOS =====
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Distribución por Tipo de Evento', 14, yPosition);
      yPosition += 8;

      const eventosPorTipo = eventos.reduce((acc, evento) => {
        const tipo = evento.tipo_evento || 'Sin categoría';
        acc[tipo] = (acc[tipo] || 0) + 1;
        return acc;
      }, {});

      const tipoTableData = Object.entries(eventosPorTipo).map(([tipo, cantidad]) => [
        tipo,
        cantidad.toString(),
        `${(cantidad / eventos.length * 100).toFixed(1)}%`,
        `€${eventos.filter(e => e.tipo_evento === tipo).reduce((sum, e) => sum + (parseFloat(e.cache_total) || 0), 0).toFixed(0)}`
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [['Tipo de Evento', 'Cantidad', '% del Total', 'Revenue']],
        body: tipoTableData.length > 0 ? tipoTableData : [['No hay datos', '', '', '']],
        theme: 'grid',
        headStyles: {
          fillColor: [168, 85, 247],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 9
        }
      });

      yPosition = doc.lastAutoTable.finalY + 15;

      // ===== RECOMENDACIONES Y OBSERVACIONES =====
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Recomendaciones y Observaciones', 14, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      // Generar recomendaciones automáticas
      const recomendaciones = [];

      if (metrics.tasaExito < 80) {
        recomendaciones.push('⚠ Tasa de éxito por debajo del 80%. Revisar causas de cancelaciones.');
      }
      if (metrics.totalEventos < 8) {
        recomendaciones.push('📈 Menos de 8 eventos en el mes. Considerar aumentar actividad comercial.');
      }
      if (metrics.ratingPromedio >= 4.5) {
        recomendaciones.push('⭐ Excelente rating promedio. Continuar con el nivel de calidad.');
      }
      if (metrics.avgCache < 800) {
        recomendaciones.push('💰 Caché promedio bajo. Evaluar posibilidad de ajuste de tarifas.');
      }

      if (recomendaciones.length === 0) {
        recomendaciones.push('✅ Performance dentro de parámetros esperados.');
      }

      recomendaciones.forEach(rec => {
        const lines = doc.splitTextToSize(rec, 180);
        doc.text(lines, 14, yPosition);
        yPosition += 7 * lines.length;
      });

      yPosition += 10;

      // ===== OBJETIVOS DEL PRÓXIMO MES =====
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Objetivos para el Próximo Mes', 14, yPosition);
      yPosition += 8;

      const objetivos = [
        `Eventos objetivo: ${Math.ceil(metrics.totalEventos * 1.1)} eventos (+10%)`,
        `Revenue objetivo: €${Math.ceil(metrics.revenue * 1.15)} (+15%)`,
        `Mantener rating: ≥4.5 estrellas`,
        `Reducir cancelaciones: <10%`
      ];

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      objetivos.forEach(obj => {
        doc.text(`• ${obj}`, 20, yPosition);
        yPosition += 6;
      });

      // ===== FOOTER =====
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Página ${i} de ${totalPages} | Intra Media System | Confidencial`,
          105,
          290,
          { align: 'center' }
        );
      }

      // Guardar PDF
      const fileName = `Reporte_${djData?.nombre?.replace(/\s+/g, '_')}_${monthName.replace(/\s+/g, '_')}.pdf`;
      doc.save(fileName);

      // Agregar a historial
      const newReport = {
        id: Date.now(),
        periodo: selectedMonth,
        mesNombre: monthName,
        fechaGeneracion: new Date().toISOString().split('T')[0],
        totalEventos: metrics.totalEventos,
        revenue: metrics.revenue,
        rating: metrics.ratingPromedio,
        generadoPor: 'Sistema Automático'
      };

      setReportHistory(prev => [newReport, ...prev]);

    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF. Por favor intenta de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Formatear mes para mostrar
  const formatMonthName = (monthStr) => {
    return new Date(monthStr + '-01').toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric'
    });
  };

  const currentMonthMetrics = calculateMonthMetrics(selectedMonth);
  const currentMonthEvents = getMonthEvents(selectedMonth);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Reportes Mensuales PDF</h2>
        </div>
        <p className="text-blue-100">
          Genera reportes profesionales completos con métricas, análisis y recomendaciones
        </p>
      </div>

      {/* Generador */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-blue-600" />
          Generar Nuevo Reporte
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Selector de mes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Seleccionar Mes
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              max={new Date().toISOString().slice(0, 7)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {formatMonthName(selectedMonth)}
            </p>
          </div>

          {/* Preview de métricas */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Vista Previa del Reporte
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded px-3 py-2">
                <p className="text-xs text-blue-600 dark:text-blue-400">Eventos</p>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {currentMonthMetrics.totalEventos}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 rounded px-3 py-2">
                <p className="text-xs text-green-600 dark:text-green-400">Revenue</p>
                <p className="text-lg font-bold text-green-700 dark:text-green-300">
                  €{currentMonthMetrics.revenue.toFixed(0)}
                </p>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded px-3 py-2">
                <p className="text-xs text-yellow-600 dark:text-yellow-400">Rating</p>
                <p className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                  {currentMonthMetrics.ratingPromedio.toFixed(1)} ⭐
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/30 rounded px-3 py-2">
                <p className="text-xs text-purple-600 dark:text-purple-400">Éxito</p>
                <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                  {currentMonthMetrics.tasaExito.toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Botón generar */}
        <motion.button
          onClick={generatePDF}
          disabled={isGenerating || currentMonthEvents.length === 0}
          whileHover={{ scale: currentMonthEvents.length > 0 ? 1.02 : 1 }}
          whileTap={{ scale: currentMonthEvents.length > 0 ? 0.98 : 1 }}
          className={`mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            currentMonthEvents.length === 0
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : isGenerating
              ? 'bg-blue-400 text-white cursor-wait'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
          }`}
        >
          {isGenerating ? (
            <>
              <Clock className="w-5 h-5 animate-spin" />
              Generando PDF...
            </>
          ) : currentMonthEvents.length === 0 ? (
            <>
              <AlertCircle className="w-5 h-5" />
              No hay eventos en este mes
            </>
          ) : (
            <>
              <FileDown className="w-5 h-5" />
              Generar Reporte PDF
            </>
          )}
        </motion.button>

        {currentMonthEvents.length > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
            El reporte incluirá {currentMonthEvents.length} evento(s) del mes seleccionado
          </p>
        )}
      </div>

      {/* Historial de reportes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-600" />
          Historial de Reportes Generados
        </h3>

        {reportHistory.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No hay reportes generados aún
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Genera tu primer reporte para verlo aquí
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reportHistory.map((report) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {report.mesNombre}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Generado el {new Date(report.fechaGeneracion).toLocaleDateString('es-ES')}
                    </p>
                    <div className="flex gap-4 mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        📅 {report.totalEventos} eventos
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        💰 €{report.revenue.toFixed(0)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ⭐ {report.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedMonth(report.periodo);
                      generatePDF();
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Regenerar
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">El reporte PDF incluye:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
              <li>Métricas principales del mes (eventos, revenue, rating, tasa de éxito)</li>
              <li>Tabla detallada de todos los eventos con estado y caché</li>
              <li>Análisis de performance y estadísticas avanzadas</li>
              <li>Distribución por tipo de evento con gráficos</li>
              <li>Recomendaciones automáticas basadas en métricas</li>
              <li>Objetivos sugeridos para el próximo mes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DJMonthlyReportPDF;
