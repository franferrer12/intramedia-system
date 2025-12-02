import api from './api';

/**
 * SMS Service
 * API calls para el sistema de notificaciones SMS
 */

// ============================================================================
// STATUS & CONFIGURATION
// ============================================================================

/**
 * Get SMS service status
 * @returns {Promise} SMS service configuration status
 */
export const getSMSStatus = async () => {
  const response = await api.get('/sms/status');
  return response.data;
};

/**
 * Test SMS configuration
 * @param {string} phone - Phone number to send test SMS
 * @returns {Promise} Test result
 */
export const testSMSConfiguration = async (phone) => {
  const response = await api.post('/sms/test', { phone });
  return response.data;
};

// ============================================================================
// SEND SMS
// ============================================================================

/**
 * Send custom SMS
 * @param {string} to - Recipient phone number
 * @param {string} message - Message text
 * @returns {Promise} Send result
 */
export const sendSMS = async (to, message) => {
  const response = await api.post('/sms/send', { to, message });
  return response.data;
};

/**
 * Send bulk SMS
 * @param {Array<{to: string, message: string}>} messages - Array of messages
 * @returns {Promise} Bulk send results
 */
export const sendBulkSMS = async (messages) => {
  const response = await api.post('/sms/send-bulk', { messages });
  return response.data;
};

// ============================================================================
// TEMPLATES
// ============================================================================

/**
 * Send event confirmation SMS
 * @param {string} phone - Recipient phone
 * @param {Object} eventData - Event data
 * @returns {Promise} Send result
 */
export const sendEventConfirmation = async (phone, eventData) => {
  const response = await api.post('/sms/event-confirmation', { phone, eventData });
  return response.data;
};

/**
 * Send event reminder SMS
 * @param {string} phone - Recipient phone
 * @param {Object} eventData - Event data
 * @returns {Promise} Send result
 */
export const sendEventReminder = async (phone, eventData) => {
  const response = await api.post('/sms/event-reminder', { phone, eventData });
  return response.data;
};

/**
 * Send payment reminder SMS
 * @param {string} phone - Recipient phone
 * @param {Object} paymentData - Payment data
 * @returns {Promise} Send result
 */
export const sendPaymentReminder = async (phone, paymentData) => {
  const response = await api.post('/sms/payment-reminder', { phone, paymentData });
  return response.data;
};

/**
 * Send payment confirmation SMS
 * @param {string} phone - Recipient phone
 * @param {Object} paymentData - Payment data
 * @returns {Promise} Send result
 */
export const sendPaymentConfirmation = async (phone, paymentData) => {
  const response = await api.post('/sms/payment-confirmation', { phone, paymentData });
  return response.data;
};

/**
 * Send DJ booking confirmation SMS
 * @param {string} phone - Recipient phone
 * @param {Object} bookingData - Booking data
 * @returns {Promise} Send result
 */
export const sendDJBookingConfirmation = async (phone, bookingData) => {
  const response = await api.post('/sms/dj-booking', { phone, bookingData });
  return response.data;
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Format phone number for display
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';

  // Remove non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // Format as (XXX) XXX-XXXX for US/Canada
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // Format as +X (XXX) XXX-XXXX for international
  if (cleaned.length === 11) {
    return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  return phone;
};

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
export const isValidPhoneNumber = (phone) => {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
};

/**
 * Get SMS templates list
 * @returns {Array} List of available templates
 */
export const getSMSTemplates = () => [
  {
    id: 'event_confirmation',
    name: 'Confirmación de Evento',
    description: 'Confirma detalles del evento al cliente',
    icon: '🎉',
    fields: ['eventoNombre', 'fecha', 'hora', 'ubicacion', 'djNombre']
  },
  {
    id: 'event_reminder',
    name: 'Recordatorio de Evento',
    description: 'Recordatorio 24h antes del evento',
    icon: '⏰',
    fields: ['eventoNombre', 'fecha', 'hora', 'ubicacion']
  },
  {
    id: 'payment_reminder',
    name: 'Recordatorio de Pago',
    description: 'Recuerda pago pendiente al cliente',
    icon: '💰',
    fields: ['clienteNombre', 'monto', 'fechaVencimiento', 'concepto']
  },
  {
    id: 'payment_confirmation',
    name: 'Confirmación de Pago',
    description: 'Confirma recepción de pago',
    icon: '✅',
    fields: ['clienteNombre', 'monto', 'fecha', 'metodoPago']
  },
  {
    id: 'dj_booking',
    name: 'Confirmación DJ',
    description: 'Confirma booking al DJ',
    icon: '🎧',
    fields: ['djNombre', 'evento', 'fecha', 'hora', 'ubicacion', 'pago']
  }
];

/**
 * Get template by ID
 * @param {string} templateId - Template ID
 * @returns {Object|null} Template object or null
 */
export const getTemplateById = (templateId) => {
  return getSMSTemplates().find(t => t.id === templateId) || null;
};

export default {
  getSMSStatus,
  testSMSConfiguration,
  sendSMS,
  sendBulkSMS,
  sendEventConfirmation,
  sendEventReminder,
  sendPaymentReminder,
  sendPaymentConfirmation,
  sendDJBookingConfirmation,
  formatPhoneNumber,
  isValidPhoneNumber,
  getSMSTemplates,
  getTemplateById
};
