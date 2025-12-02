import { announceToScreenReader } from './accessibility';
import toast from './toast';

/**
 * Clipboard Utilities
 * Copy text, JSON, or formatted data to clipboard with accessibility support
 */

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @param {string} successMessage - Custom success message
 * @returns {Promise<boolean>} Success status
 */
export const copyToClipboard = async (text, successMessage = 'Copiado al portapapeles') => {
  try {
    // Modern Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      toast.copied();
      announceToScreenReader(successMessage, 'polite');
      return true;
    }

    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    if (successful) {
      toast.copied();
      announceToScreenReader(successMessage, 'polite');
      return true;
    } else {
      throw new Error('Copy command failed');
    }
  } catch (error) {
    console.error('Failed to copy:', error);
    toast.error('Error al copiar');
    announceToScreenReader('Error al copiar al portapapeles', 'assertive');
    return false;
  }
};

/**
 * Copy JSON to clipboard (formatted)
 */
export const copyJSON = async (data, successMessage = 'JSON copiado') => {
  try {
    const json = JSON.stringify(data, null, 2);
    return await copyToClipboard(json, successMessage);
  } catch (error) {
    console.error('Failed to copy JSON:', error);
    toast.error('Error al copiar JSON');
    return false;
  }
};

/**
 * Copy table data as TSV (Tab-Separated Values) for pasting into Excel
 */
export const copyTableData = async (data, columns) => {
  try {
    if (!data || data.length === 0) {
      toast.warning('No hay datos para copiar');
      return false;
    }

    // Create TSV format
    const headers = columns ? columns.map(c => c.label || c.key) : Object.keys(data[0]);
    const rows = data.map(row => {
      const values = columns
        ? columns.map(col => {
            const value = row[col.key];
            return col.format ? col.format(value) : value || '';
          })
        : Object.values(row);

      return values.join('\t');
    });

    const tsv = [headers.join('\t'), ...rows].join('\n');
    const success = await copyToClipboard(tsv, 'Tabla copiada - Pegar en Excel');
    return success;
  } catch (error) {
    console.error('Failed to copy table data:', error);
    toast.error('Error al copiar tabla');
    return false;
  }
};

/**
 * Copy entity as formatted text
 */
export const copyEntity = async (entity, entityType) => {
  try {
    let formatted = '';

    switch (entityType) {
      case 'evento':
        formatted = `
Evento: ${entity.evento}
Fecha: ${new Date(entity.fecha).toLocaleString('es-ES')}
Ubicación: ${entity.ubicacion || 'N/A'}
DJ: ${entity.dj_nombre || 'N/A'}
Cliente: ${entity.cliente_nombre || 'N/A'}
Precio: €${entity.precio_acordado?.toFixed(2) || '0.00'}
Estado: ${entity.estado}
        `.trim();
        break;

      case 'dj':
        formatted = `
DJ: ${entity.nombre_artistico || entity.nombre}
Email: ${entity.email}
Teléfono: ${entity.telefono || 'N/A'}
Especialidad: ${entity.especialidad || 'N/A'}
Comisión: ${entity.comision_predeterminada}%
Precio/Hora: €${entity.precio_por_hora?.toFixed(2) || '0.00'}
        `.trim();
        break;

      case 'cliente':
        formatted = `
Cliente: ${entity.nombre}
Email: ${entity.email}
Teléfono: ${entity.telefono || 'N/A'}
Tipo: ${entity.tipo_cliente}
Empresa: ${entity.empresa || 'N/A'}
        `.trim();
        break;

      case 'lead':
        formatted = `
Lead: ${entity.nombre}
Email: ${entity.email || 'N/A'}
Teléfono: ${entity.telefono || 'N/A'}
Estado: ${entity.status}
Score: ${entity.score || 0}
Valor Estimado: €${entity.estimated_value?.toFixed(2) || 'N/A'}
        `.trim();
        break;

      case 'payment':
        formatted = `
Pago ID: ${entity.id}
Monto: €${entity.amount?.toFixed(2) || '0.00'}
Tipo: ${entity.payment_type}
Método: ${entity.payment_method}
Estado: ${entity.status}
Pagado por: ${entity.paid_by || 'N/A'}
        `.trim();
        break;

      default:
        formatted = JSON.stringify(entity, null, 2);
    }

    return await copyToClipboard(formatted, 'Información copiada');
  } catch (error) {
    console.error('Failed to copy entity:', error);
    toast.error('Error al copiar información');
    return false;
  }
};

/**
 * Copy URL to clipboard
 */
export const copyURL = async (url, successMessage = 'URL copiado') => {
  return await copyToClipboard(url, successMessage);
};

/**
 * Copy email address
 */
export const copyEmail = async (email) => {
  return await copyToClipboard(email, 'Email copiado');
};

/**
 * Copy phone number
 */
export const copyPhone = async (phone) => {
  return await copyToClipboard(phone, 'Teléfono copiado');
};

/**
 * Copy IBAN
 */
export const copyIBAN = async (iban) => {
  return await copyToClipboard(iban, 'IBAN copiado');
};

/**
 * Copy formatted address
 */
export const copyAddress = async (address) => {
  return await copyToClipboard(address, 'Dirección copiada');
};

/**
 * Copy formatted event link for sharing
 */
export const copyEventLink = async (eventoId, includeHost = true) => {
  try {
    const baseUrl = includeHost ? window.location.origin : '';
    const url = `${baseUrl}/eventos/${eventoId}`;
    return await copyURL(url, 'Link de evento copiado');
  } catch (error) {
    console.error('Failed to copy event link:', error);
    return false;
  }
};

/**
 * Copy booking form link (public)
 */
export const copyBookingLink = async (includeHost = true) => {
  try {
    const baseUrl = includeHost ? window.location.origin : '';
    const url = `${baseUrl}/booking`;
    return await copyURL(url, 'Link de reserva copiado');
  } catch (error) {
    console.error('Failed to copy booking link:', error);
    return false;
  }
};

/**
 * Copy public lead form link
 */
export const copyLeadFormLink = async (includeHost = true) => {
  try {
    const baseUrl = includeHost ? window.location.origin : '';
    const url = `${baseUrl}/leads/public`;
    return await copyURL(url, 'Link de formulario copiado');
  } catch (error) {
    console.error('Failed to copy lead form link:', error);
    return false;
  }
};

/**
 * Format entity for sharing (WhatsApp, email, etc.)
 */
export const formatForSharing = (entity, entityType) => {
  let text = '';

  switch (entityType) {
    case 'evento':
      text = `🎉 *${entity.evento}*\n`;
      text += `📅 ${new Date(entity.fecha).toLocaleString('es-ES')}\n`;
      text += `📍 ${entity.ubicacion || ''}\n`;
      text += `🎧 DJ: ${entity.dj_nombre || ''}\n`;
      text += `💰 €${entity.precio_acordado?.toFixed(2) || '0.00'}`;
      break;

    case 'dj':
      text = `🎧 *${entity.nombre_artistico || entity.nombre}*\n`;
      text += `📧 ${entity.email}\n`;
      text += `📞 ${entity.telefono || ''}\n`;
      text += `🎵 ${entity.especialidad || ''}\n`;
      text += `💰 €${entity.precio_por_hora?.toFixed(2) || '0.00'}/hora`;
      break;

    case 'cliente':
      text = `👤 *${entity.nombre}*\n`;
      text += `📧 ${entity.email}\n`;
      text += `📞 ${entity.telefono || ''}\n`;
      if (entity.empresa) text += `🏢 ${entity.empresa}\n`;
      break;

    default:
      text = JSON.stringify(entity, null, 2);
  }

  return text;
};

/**
 * Copy formatted text for WhatsApp
 */
export const copyForWhatsApp = async (entity, entityType) => {
  try {
    const text = formatForSharing(entity, entityType);
    return await copyToClipboard(text, 'Texto copiado para WhatsApp');
  } catch (error) {
    console.error('Failed to copy for WhatsApp:', error);
    return false;
  }
};

/**
 * Check if clipboard API is available
 */
export const isClipboardAvailable = () => {
  return !!(
    navigator.clipboard ||
    (document.queryCommandSupported && document.queryCommandSupported('copy'))
  );
};

export default {
  copyToClipboard,
  copyJSON,
  copyTableData,
  copyEntity,
  copyURL,
  copyEmail,
  copyPhone,
  copyIBAN,
  copyAddress,
  copyEventLink,
  copyBookingLink,
  copyLeadFormLink,
  copyForWhatsApp,
  formatForSharing,
  isClipboardAvailable,
};
