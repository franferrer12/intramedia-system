import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { announceToScreenReader } from './accessibility';
import toast from './toast';

/**
 * Export Utilities
 * Excel and CSV export functionality for tables
 */

/**
 * Export data to Excel
 * @param {Array} data - Array of objects to export
 * @param {String} filename - Filename without extension
 * @param {String} sheetName - Name of the worksheet
 * @param {Object} options - Export options
 */
export const exportToExcel = (data, filename = 'export', sheetName = 'Data', options = {}) => {
  try {
    if (!data || data.length === 0) {
      toast.warning('No hay datos para exportar');
      return;
    }

    // Transform data if transformer provided
    const transformedData = options.transformer ? data.map(options.transformer) : data;

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Create worksheet from data
    const ws = XLSX.utils.json_to_sheet(transformedData, {
      header: options.headers || undefined,
      skipHeader: options.skipHeader || false,
    });

    // Auto-size columns
    if (options.autoWidth !== false) {
      const maxWidth = 50;
      const colWidths = [];

      // Get headers
      const headers = options.headers || Object.keys(transformedData[0] || {});

      headers.forEach((header, i) => {
        const headerLength = String(header).length;
        const dataLengths = transformedData.map(row => {
          const value = row[header];
          return String(value || '').length;
        });
        const maxLength = Math.max(headerLength, ...dataLengths);
        colWidths.push({ wch: Math.min(maxLength + 2, maxWidth) });
      });

      ws['!cols'] = colWidths;
    }

    // Apply custom styles if provided
    if (options.styles) {
      // Apply styles (advanced feature, requires XLSX Pro or custom implementation)
      // For now, basic styling is applied automatically
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate file
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
    const finalFilename = `${filename}_${timestamp}.xlsx`;

    XLSX.writeFile(wb, finalFilename);

    announceToScreenReader(`Archivo ${finalFilename} descargado`, 'polite');
    toast.success(`Exportado: ${finalFilename}`);

    return finalFilename;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    toast.error('Error al exportar a Excel');
    throw error;
  }
};

/**
 * Export data to CSV
 */
export const exportToCSV = (data, filename = 'export', options = {}) => {
  try {
    if (!data || data.length === 0) {
      toast.warning('No hay datos para exportar');
      return;
    }

    // Transform data if transformer provided
    const transformedData = options.transformer ? data.map(options.transformer) : data;

    // Create CSV content
    const headers = options.headers || Object.keys(transformedData[0] || {});
    const csvRows = [];

    // Add headers
    if (!options.skipHeader) {
      csvRows.push(headers.map(h => `"${h}"`).join(','));
    }

    // Add data rows
    transformedData.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes
        return `"${String(value || '').replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });

    const csvContent = csvRows.join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
    const finalFilename = `${filename}_${timestamp}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', finalFilename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    announceToScreenReader(`Archivo ${finalFilename} descargado`, 'polite');
    toast.success(`Exportado: ${finalFilename}`);

    return finalFilename;
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    toast.error('Error al exportar a CSV');
    throw error;
  }
};

/**
 * Predefined transformers for common entities
 */
export const exportTransformers = {
  eventos: (evento) => ({
    ID: evento.id,
    Evento: evento.evento,
    Fecha: format(new Date(evento.fecha), 'dd/MM/yyyy HH:mm'),
    Ubicación: evento.ubicacion || '',
    DJ: evento.dj_nombre || '',
    Cliente: evento.cliente_nombre || '',
    'Precio Acordado': `€${evento.precio_acordado?.toFixed(2) || '0.00'}`,
    'Comisión Agencia': `€${evento.comision_agencia?.toFixed(2) || '0.00'}`,
    'Comisión DJ': `€${evento.comision_dj?.toFixed(2) || '0.00'}`,
    'Duración (min)': evento.duracion_minutos,
    Estado: evento.estado,
    'Contrato Firmado': evento.contract_signed ? 'Sí' : 'No',
    Creado: format(new Date(evento.created_at), 'dd/MM/yyyy'),
  }),

  djs: (dj) => ({
    ID: dj.id,
    Nombre: dj.nombre,
    'Nombre Artístico': dj.nombre_artistico || '',
    Email: dj.email,
    Teléfono: dj.telefono || '',
    Especialidad: dj.especialidad || '',
    'Comisión (%)': dj.comision_predeterminada,
    'Precio/Hora': `€${dj.precio_por_hora?.toFixed(2) || '0.00'}`,
    Activo: dj.active ? 'Sí' : 'No',
    'NIF/CIF': dj.nif_cif || '',
    IBAN: dj.banco_iban || '',
    Creado: format(new Date(dj.created_at), 'dd/MM/yyyy'),
  }),

  clientes: (cliente) => ({
    ID: cliente.id,
    Nombre: cliente.nombre,
    Email: cliente.email,
    Teléfono: cliente.telefono || '',
    Empresa: cliente.empresa || '',
    Tipo: cliente.tipo_cliente,
    'NIF/CIF': cliente.nif_cif || '',
    Dirección: cliente.direccion || '',
    Creado: format(new Date(cliente.created_at), 'dd/MM/yyyy'),
  }),

  leads: (lead) => ({
    ID: lead.id,
    Nombre: lead.nombre,
    Email: lead.email || '',
    Teléfono: lead.telefono || '',
    Empresa: lead.empresa || '',
    Origen: lead.origen,
    Estado: lead.status,
    Score: lead.score || 0,
    'Valor Estimado': lead.estimated_value ? `€${lead.estimated_value.toFixed(2)}` : '',
    'Próximo Seguimiento': lead.next_follow_up
      ? format(new Date(lead.next_follow_up), 'dd/MM/yyyy')
      : '',
    'Asignado a': lead.assigned_to_name || '',
    Creado: format(new Date(lead.created_at), 'dd/MM/yyyy'),
  }),

  payments: (payment) => ({
    ID: payment.id,
    'Evento ID': payment.evento_id || '',
    Monto: `€${payment.amount?.toFixed(2) || '0.00'}`,
    Moneda: payment.currency,
    Tipo: payment.payment_type,
    Método: payment.payment_method,
    Estado: payment.status,
    'Pagado por': payment.paid_by || '',
    Descripción: payment.description || '',
    'Stripe ID': payment.stripe_payment_intent_id || '',
    Creado: format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm'),
  }),

  documents: (doc) => ({
    ID: doc.id,
    'Tipo Entidad': doc.entity_type,
    'ID Entidad': doc.entity_id,
    'Tipo Documento': doc.document_type,
    Archivo: doc.filename,
    'Tamaño (KB)': Math.round(doc.file_size / 1024),
    Versión: doc.version,
    Actual: doc.is_current ? 'Sí' : 'No',
    'Subido por': doc.uploaded_by_name || '',
    'Fecha Subida': format(new Date(doc.uploaded_at), 'dd/MM/yyyy HH:mm'),
  }),

  reservations: (reservation) => ({
    ID: reservation.id,
    DJ: reservation.dj_name || '',
    Cliente: reservation.client_name,
    Email: reservation.client_email,
    Teléfono: reservation.client_phone || '',
    'Fecha Evento': format(new Date(reservation.event_date), 'dd/MM/yyyy HH:mm'),
    'Duración (min)': reservation.event_duration_minutes,
    'Tipo Evento': reservation.event_type || '',
    Ubicación: reservation.event_location || '',
    'Precio Estimado': `€${reservation.estimated_price?.toFixed(2) || '0.00'}`,
    Estado: reservation.status,
    'Expira': reservation.hold_expires_at
      ? format(new Date(reservation.hold_expires_at), 'dd/MM/yyyy HH:mm')
      : '',
    Creado: format(new Date(reservation.created_at), 'dd/MM/yyyy'),
  }),
};

/**
 * Quick export button helper
 */
export const quickExport = (data, entityType, format = 'excel') => {
  const transformer = exportTransformers[entityType];
  const filename = `${entityType}_export`;

  if (format === 'excel') {
    return exportToExcel(data, filename, entityType, { transformer });
  } else if (format === 'csv') {
    return exportToCSV(data, filename, { transformer });
  }
};

/**
 * Export with custom columns
 */
export const exportWithColumns = (data, columns, filename, format = 'excel') => {
  const transformer = (row) => {
    const result = {};
    columns.forEach(col => {
      result[col.label || col.key] = col.format
        ? col.format(row[col.key])
        : row[col.key];
    });
    return result;
  };

  if (format === 'excel') {
    return exportToExcel(data, filename, 'Data', { transformer });
  } else if (format === 'csv') {
    return exportToCSV(data, filename, { transformer });
  }
};

export default {
  exportToExcel,
  exportToCSV,
  quickExport,
  exportWithColumns,
  transformers: exportTransformers,
};
