import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Utility for exporting data to PDF and Excel formats
 */

// ========================================
// PDF EXPORTS
// ========================================

/**
 * Export data to PDF with custom formatting
 * @param {Object} options - Export options
 * @param {string} options.filename - Output filename
 * @param {string} options.title - Document title
 * @param {Array} options.headers - Table headers
 * @param {Array} options.data - Table data
 * @param {Object} options.summary - Optional summary data
 * @param {string} options.orientation - 'portrait' or 'landscape'
 */
export const exportToPDF = ({
  filename = 'export.pdf',
  title = 'Reporte',
  subtitle = '',
  headers = [],
  data = [],
  summary = null,
  orientation = 'portrait',
  pageSize = 'a4'
}) => {
  const doc = new jsPDF(orientation, 'mm', pageSize);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let yPosition = 20;

  // Header Section
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(45, 55, 72);
  doc.text(title, pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 8;

  if (subtitle) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;
  }

  // Generation info
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  const generatedDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Generado: ${generatedDate}`, pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 5;

  // Add line separator
  doc.setDrawColor(200, 200, 200);
  doc.line(15, yPosition, pageWidth - 15, yPosition);
  yPosition += 10;

  // Summary Section (if provided)
  if (summary) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(45, 55, 72);
    doc.text('Resumen', 15, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    Object.entries(summary).forEach(([key, value]) => {
      doc.setTextColor(100, 100, 100);
      doc.text(`${key}:`, 20, yPosition);
      doc.setTextColor(45, 55, 72);
      doc.setFont('helvetica', 'bold');
      doc.text(String(value), 80, yPosition);
      doc.setFont('helvetica', 'normal');
      yPosition += 6;
    });

    yPosition += 5;
  }

  // Data Table
  if (data.length > 0 && headers.length > 0) {
    doc.autoTable({
      startY: yPosition,
      head: [headers],
      body: data,
      theme: 'grid',
      headStyles: {
        fillColor: [79, 70, 229], // Indigo
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        textColor: [45, 55, 72],
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: 15, right: 15 },
      styles: {
        cellPadding: 3,
        fontSize: 9,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      didDrawPage: (data) => {
        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        const currentPage = doc.internal.getCurrentPageInfo().pageNumber;

        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Página ${currentPage} de ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }
    });
  }

  // Save PDF
  doc.save(filename);
};

/**
 * Export Financial Alerts to PDF
 */
export const exportAlertsToPDF = (alerts, stats) => {
  const headers = ['Tipo', 'Severidad', 'Título', 'Mensaje', 'Fecha'];
  const data = alerts.map(alert => [
    formatAlertType(alert.alert_type),
    alert.severity.toUpperCase(),
    alert.title,
    truncateText(alert.message, 60),
    new Date(alert.created_at).toLocaleDateString('es-ES')
  ]);

  const summary = stats ? {
    'Total Activas': stats.total_active,
    'No Leídas': stats.total_unread,
    'Críticas': stats.critical_count,
    'Advertencias': stats.warning_count,
    'Cobros Críticos': stats.cobros_criticos,
    'Pagos DJ Pendientes': stats.pagos_dj
  } : null;

  exportToPDF({
    filename: `alertas-financieras-${new Date().toISOString().split('T')[0]}.pdf`,
    title: 'Reporte de Alertas Financieras',
    subtitle: `Sistema de Gestión Intra Media - ${new Date().toLocaleDateString('es-ES')}`,
    headers,
    data,
    summary,
    orientation: 'landscape'
  });
};

/**
 * Export DJ Financial Report to PDF
 */
export const exportDJFinancialToPDF = (djs, stats) => {
  const headers = ['DJ', 'Eventos', 'Total Facturado', 'Total Cobrado', 'Pendiente', 'Tasa Cobro'];
  const data = djs.map(dj => [
    dj.dj_nombre,
    dj.total_eventos,
    `€${parseFloat(dj.total_facturado || 0).toFixed(2)}`,
    `€${parseFloat(dj.total_cobrado || 0).toFixed(2)}`,
    `€${parseFloat(dj.pendiente_cobro || 0).toFixed(2)}`,
    `${parseFloat(dj.tasa_cobro || 0).toFixed(1)}%`
  ]);

  const summary = stats ? {
    'Total DJs': stats.total_djs,
    'Total Facturado': `€${parseFloat(stats.total_facturado || 0).toFixed(2)}`,
    'Total Cobrado': `€${parseFloat(stats.total_cobrado || 0).toFixed(2)}`,
    'Pendiente Cobro': `€${parseFloat(stats.pendiente_cobro || 0).toFixed(2)}`
  } : null;

  exportToPDF({
    filename: `djs-financiero-${new Date().toISOString().split('T')[0]}.pdf`,
    title: 'Análisis Financiero de DJs',
    subtitle: `Sistema de Gestión Intra Media - ${new Date().toLocaleDateString('es-ES')}`,
    headers,
    data,
    summary,
    orientation: 'landscape'
  });
};

/**
 * Export Client Financial Report to PDF
 */
export const exportClientFinancialToPDF = (clients, stats) => {
  const headers = ['Cliente', 'Eventos', 'Total', 'Cobrado', 'Pendiente', 'Tasa Cobro'];
  const data = clients.map(client => [
    client.cliente_nombre,
    client.total_eventos,
    `€${parseFloat(client.total_cliente || 0).toFixed(2)}`,
    `€${parseFloat(client.total_cobrado || 0).toFixed(2)}`,
    `€${parseFloat(client.pendiente_cobro || 0).toFixed(2)}`,
    `${parseFloat(client.tasa_cobro || 0).toFixed(1)}%`
  ]);

  const summary = stats ? {
    'Total Clientes': stats.total_clientes,
    'Total Facturado': `€${parseFloat(stats.total_facturado || 0).toFixed(2)}`,
    'Total Cobrado': `€${parseFloat(stats.total_cobrado || 0).toFixed(2)}`,
    'Pendiente Cobro': `€${parseFloat(stats.pendiente_cobro || 0).toFixed(2)}`
  } : null;

  exportToPDF({
    filename: `clientes-financiero-${new Date().toISOString().split('T')[0]}.pdf`,
    title: 'Análisis Financiero de Clientes',
    subtitle: `Sistema de Gestión Intra Media - ${new Date().toLocaleDateString('es-ES')}`,
    headers,
    data,
    summary,
    orientation: 'landscape'
  });
};

// ========================================
// EXCEL EXPORTS
// ========================================

/**
 * Export data to Excel with multiple sheets
 * @param {Object} options - Export options
 * @param {string} options.filename - Output filename
 * @param {Array} options.sheets - Array of sheet objects { name, headers, data }
 */
export const exportToExcel = ({
  filename = 'export.xlsx',
  sheets = []
}) => {
  const workbook = XLSX.utils.book_new();

  sheets.forEach(sheet => {
    const { name, headers, data, summary } = sheet;

    // Prepare worksheet data
    let wsData = [];

    // Add headers
    if (headers && headers.length > 0) {
      wsData.push(headers);
    }

    // Add data rows
    if (data && data.length > 0) {
      wsData = wsData.concat(data);
    }

    // Add summary at the end if provided
    if (summary) {
      wsData.push([]); // Empty row
      wsData.push(['RESUMEN']);
      Object.entries(summary).forEach(([key, value]) => {
        wsData.push([key, value]);
      });
    }

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    const colWidths = headers ? headers.map((_, idx) => {
      const maxLength = Math.max(
        String(headers[idx]).length,
        ...data.map(row => String(row[idx] || '').length)
      );
      return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
    }) : [];

    worksheet['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, name);
  });

  // Write file
  XLSX.writeFile(workbook, filename);
};

/**
 * Export Financial Alerts to Excel
 */
export const exportAlertsToExcel = (alerts, stats) => {
  const headers = ['ID', 'Tipo', 'Severidad', 'Título', 'Mensaje', 'Cliente', 'DJ', 'Evento', 'Leída', 'Resuelta', 'Fecha Creación'];
  const data = alerts.map(alert => [
    alert.id,
    formatAlertType(alert.alert_type),
    alert.severity.toUpperCase(),
    alert.title,
    alert.message,
    alert.cliente_nombre || '-',
    alert.dj_nombre || '-',
    alert.evento_nombre || '-',
    alert.is_read ? 'Sí' : 'No',
    alert.is_resolved ? 'Sí' : 'No',
    new Date(alert.created_at).toLocaleString('es-ES')
  ]);

  const summary = stats ? {
    'Total Activas': stats.total_active,
    'No Leídas': stats.total_unread,
    'Críticas': stats.critical_count,
    'Advertencias': stats.warning_count,
    'Cobros Críticos': stats.cobros_criticos,
    'Pagos DJ Pendientes': stats.pagos_dj,
    'Clientes Inactivos': stats.clientes_inactivos,
    'Clientes en Riesgo': stats.clientes_riesgo
  } : null;

  exportToExcel({
    filename: `alertas-financieras-${new Date().toISOString().split('T')[0]}.xlsx`,
    sheets: [
      {
        name: 'Alertas',
        headers,
        data,
        summary
      }
    ]
  });
};

/**
 * Export DJ Financial Report to Excel
 */
export const exportDJFinancialToExcel = (djs, stats) => {
  const headers = ['DJ', 'Ciudad', 'Email', 'Eventos', 'Total Facturado', 'Total Cobrado', 'Pendiente Cobro', 'Tasa Cobro (%)', 'Precio Promedio'];
  const data = djs.map(dj => [
    dj.dj_nombre,
    dj.dj_ciudad || '-',
    dj.dj_email || '-',
    dj.total_eventos,
    parseFloat(dj.total_facturado || 0),
    parseFloat(dj.total_cobrado || 0),
    parseFloat(dj.pendiente_cobro || 0),
    parseFloat(dj.tasa_cobro || 0),
    parseFloat(dj.precio_promedio || 0)
  ]);

  const summary = stats ? {
    'Total DJs': stats.total_djs,
    'Total Facturado': parseFloat(stats.total_facturado || 0),
    'Total Cobrado': parseFloat(stats.total_cobrado || 0),
    'Pendiente Cobro': parseFloat(stats.pendiente_cobro || 0),
    'Tasa Promedio Cobro': `${parseFloat(stats.tasa_promedio_cobro || 0).toFixed(2)}%`
  } : null;

  exportToExcel({
    filename: `djs-financiero-${new Date().toISOString().split('T')[0]}.xlsx`,
    sheets: [
      {
        name: 'Análisis Financiero DJs',
        headers,
        data,
        summary
      }
    ]
  });
};

/**
 * Export Client Financial Report to Excel
 */
export const exportClientFinancialToExcel = (clients, stats) => {
  const headers = ['Cliente', 'Ciudad', 'Email', 'Eventos', 'Total', 'Cobrado', 'Pendiente', 'Tasa Cobro (%)', 'Rentabilidad'];
  const data = clients.map(client => [
    client.cliente_nombre,
    client.cliente_ciudad || '-',
    client.cliente_email || '-',
    client.total_eventos,
    parseFloat(client.total_cliente || 0),
    parseFloat(client.total_cobrado || 0),
    parseFloat(client.pendiente_cobro || 0),
    parseFloat(client.tasa_cobro || 0),
    parseFloat(client.rentabilidad_promedio || 0)
  ]);

  const summary = stats ? {
    'Total Clientes': stats.total_clientes,
    'Total Facturado': parseFloat(stats.total_facturado || 0),
    'Total Cobrado': parseFloat(stats.total_cobrado || 0),
    'Pendiente Cobro': parseFloat(stats.pendiente_cobro || 0),
    'Rentabilidad Promedio': `${parseFloat(stats.rentabilidad_promedio || 0).toFixed(2)}%`
  } : null;

  exportToExcel({
    filename: `clientes-financiero-${new Date().toISOString().split('T')[0]}.xlsx`,
    sheets: [
      {
        name: 'Análisis Financiero Clientes',
        headers,
        data,
        summary
      }
    ]
  });
};

// ========================================
// HELPER FUNCTIONS
// ========================================

function formatAlertType(type) {
  const labels = {
    cobro_critico: 'Cobro Crítico',
    cobro_urgente: 'Cobro Urgente',
    pago_dj_pendiente: 'Pago DJ Pendiente',
    cliente_inactivo: 'Cliente Inactivo',
    dj_bajo_rendimiento: 'DJ Bajo Rendimiento',
    evento_sin_asignar: 'Evento Sin Asignar',
    rentabilidad_baja: 'Rentabilidad Baja',
    cliente_riesgo_perdida: 'Cliente en Riesgo'
  };
  return labels[type] || type;
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
