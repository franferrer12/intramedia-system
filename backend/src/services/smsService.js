import twilio from 'twilio';

/**
 * SMS Service using Twilio
 * Handles SMS notifications for events, payments, reminders, etc.
 */

// Initialize Twilio client
let twilioClient = null;
let isConfigured = false;

const initializeTwilio = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('⚠️  Twilio not configured. SMS notifications will be disabled.');
    console.warn('   Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env');
    isConfigured = false;
    return null;
  }

  try {
    twilioClient = twilio(accountSid, authToken);
    isConfigured = true;
    console.log('✅ Twilio SMS service initialized');
    return twilioClient;
  } catch (error) {
    console.error('❌ Failed to initialize Twilio:', error.message);
    isConfigured = false;
    return null;
  }
};

// Initialize on module load
initializeTwilio();

/**
 * Format phone number to E.164 format
 * @param {string} phone - Phone number in any format
 * @returns {string} Phone number in E.164 format (+1234567890)
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return null;

  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');

  // Add country code if missing (assume +1 for US/Canada)
  if (cleaned.length === 10) {
    cleaned = '1' + cleaned;
  }

  // Format as E.164
  return '+' + cleaned;
};

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
const isValidPhoneNumber = (phone) => {
  const formatted = formatPhoneNumber(phone);
  return formatted && formatted.length >= 11 && formatted.length <= 15;
};

/**
 * Send SMS message
 * @param {string} to - Recipient phone number
 * @param {string} message - Message text (max 1600 chars)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Twilio message response
 */
export const sendSMS = async (to, message, options = {}) => {
  if (!isConfigured) {
    console.warn('Twilio not configured. SMS not sent.');
    return {
      success: false,
      error: 'SMS service not configured',
      simulated: true
    };
  }

  try {
    const formattedTo = formatPhoneNumber(to);

    if (!isValidPhoneNumber(to)) {
      throw new Error(`Invalid phone number: ${to}`);
    }

    if (!message || message.length === 0) {
      throw new Error('Message cannot be empty');
    }

    if (message.length > 1600) {
      console.warn('Message exceeds 1600 characters. Will be sent as multiple SMS.');
    }

    const result = await twilioClient.messages.create({
      body: message,
      to: formattedTo,
      from: process.env.TWILIO_PHONE_NUMBER,
      ...options
    });

    console.log(`✅ SMS sent to ${formattedTo} (SID: ${result.sid})`);

    return {
      success: true,
      sid: result.sid,
      status: result.status,
      to: formattedTo,
      from: result.from,
      dateSent: result.dateCreated,
      cost: result.price,
      segments: result.numSegments
    };
  } catch (error) {
    console.error('Error sending SMS:', error.message);
    throw error;
  }
};

/**
 * Send bulk SMS messages
 * @param {Array<{to: string, message: string}>} messages - Array of message objects
 * @returns {Promise<Array>} Results array
 */
export const sendBulkSMS = async (messages) => {
  if (!isConfigured) {
    console.warn('Twilio not configured. Bulk SMS not sent.');
    return messages.map(m => ({
      to: m.to,
      success: false,
      error: 'SMS service not configured',
      simulated: true
    }));
  }

  const results = [];

  for (const msg of messages) {
    try {
      const result = await sendSMS(msg.to, msg.message);
      results.push({
        to: msg.to,
        ...result
      });
    } catch (error) {
      results.push({
        to: msg.to,
        success: false,
        error: error.message
      });
    }
  }

  return results;
};

// ============================================================================
// SMS TEMPLATES
// ============================================================================

/**
 * Event Confirmation SMS
 */
export const sendEventConfirmation = async (phone, eventData) => {
  const { eventoNombre, fecha, hora, ubicacion, djNombre } = eventData;

  const message = `🎉 Evento confirmado: ${eventoNombre}
📅 ${fecha} a las ${hora}
📍 ${ubicacion}
🎧 DJ: ${djNombre}

Gracias por confiar en nosotros!`;

  return sendSMS(phone, message);
};

/**
 * Event Reminder SMS (24h before)
 */
export const sendEventReminder = async (phone, eventData) => {
  const { eventoNombre, fecha, hora, ubicacion } = eventData;

  const message = `⏰ Recordatorio: Mañana es tu evento!

🎉 ${eventoNombre}
📅 ${fecha} a las ${hora}
📍 ${ubicacion}

Nos vemos pronto!`;

  return sendSMS(phone, message);
};

/**
 * Payment Reminder SMS
 */
export const sendPaymentReminder = async (phone, paymentData) => {
  const { clienteNombre, monto, fechaVencimiento, concepto } = paymentData;

  const message = `💰 Recordatorio de pago

Hola ${clienteNombre},
Tienes un pago pendiente:
Monto: $${monto}
Concepto: ${concepto}
Vence: ${fechaVencimiento}

Gracias!`;

  return sendSMS(phone, message);
};

/**
 * Payment Confirmation SMS
 */
export const sendPaymentConfirmation = async (phone, paymentData) => {
  const { clienteNombre, monto, fecha, metodoPago } = paymentData;

  const message = `✅ Pago recibido

Hola ${clienteNombre},
Hemos recibido tu pago de $${monto}
Fecha: ${fecha}
Método: ${metodoPago}

Gracias por tu pago!`;

  return sendSMS(phone, message);
};

/**
 * DJ Availability Request SMS
 */
export const sendDJAvailabilityRequest = async (phone, requestData) => {
  const { djNombre, fecha, hora, evento, clienteNombre } = requestData;

  const message = `🎧 Nueva solicitud de evento

Hola ${djNombre},
${clienteNombre} solicita tu disponibilidad:
📅 ${fecha} a las ${hora}
🎉 ${evento}

Responde lo antes posible!`;

  return sendSMS(phone, message);
};

/**
 * DJ Booking Confirmation SMS
 */
export const sendDJBookingConfirmation = async (phone, bookingData) => {
  const { djNombre, evento, fecha, hora, ubicacion, pago } = bookingData;

  const message = `✅ Evento confirmado!

Hola ${djNombre},
Tienes un nuevo evento:
🎉 ${evento}
📅 ${fecha} a las ${hora}
📍 ${ubicacion}
💰 Pago: $${pago}

Éxito en tu presentación!`;

  return sendSMS(phone, message);
};

/**
 * Lead Follow-up SMS
 */
export const sendLeadFollowUp = async (phone, leadData) => {
  const { nombre, servicio } = leadData;

  const message = `Hola ${nombre}!

Gracias por tu interés en nuestros servicios de ${servicio}.

¿Tienes alguna pregunta? Estamos aquí para ayudarte!

Responde o llámanos para más info.`;

  return sendSMS(phone, message);
};

/**
 * General notification SMS
 */
export const sendNotification = async (phone, title, message) => {
  const fullMessage = title ? `${title}\n\n${message}` : message;
  return sendSMS(phone, fullMessage);
};

/**
 * Equipment rental reminder
 */
export const sendEquipmentRentalReminder = async (phone, rentalData) => {
  const { equipment, fechaDevolucion, nombreCliente } = rentalData;

  const message = `🔔 Recordatorio de equipo

Hola ${nombreCliente},
Recuerda devolver: ${equipment}
📅 Fecha límite: ${fechaDevolucion}

Gracias!`;

  return sendSMS(phone, message);
};

/**
 * Emergency alert SMS
 */
export const sendEmergencyAlert = async (phone, alertData) => {
  const { titulo, mensaje, contacto } = alertData;

  const message = `🚨 ALERTA IMPORTANTE

${titulo}

${mensaje}

${contacto ? `Contacto: ${contacto}` : ''}`;

  return sendSMS(phone, message);
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get SMS service status
 */
export const getServiceStatus = () => {
  return {
    configured: isConfigured,
    accountSid: process.env.TWILIO_ACCOUNT_SID ? '***' + process.env.TWILIO_ACCOUNT_SID.slice(-4) : null,
    fromNumber: process.env.TWILIO_PHONE_NUMBER || null
  };
};

/**
 * Test SMS configuration
 */
export const testSMSConfiguration = async (testPhone) => {
  if (!isConfigured) {
    return {
      success: false,
      error: 'Twilio not configured'
    };
  }

  try {
    const result = await sendSMS(
      testPhone,
      '🧪 Test SMS from IntraMedia System. Configuration is working correctly!'
    );
    return {
      success: true,
      message: 'Test SMS sent successfully',
      result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  sendSMS,
  sendBulkSMS,
  sendEventConfirmation,
  sendEventReminder,
  sendPaymentReminder,
  sendPaymentConfirmation,
  sendDJAvailabilityRequest,
  sendDJBookingConfirmation,
  sendLeadFollowUp,
  sendNotification,
  sendEquipmentRentalReminder,
  sendEmergencyAlert,
  formatPhoneNumber,
  isValidPhoneNumber,
  getServiceStatus,
  testSMSConfiguration
};
