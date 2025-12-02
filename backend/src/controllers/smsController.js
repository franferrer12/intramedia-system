import * as smsService from '../services/smsService.js';

/**
 * SMS Controller
 * Handles SMS sending endpoints
 */

/**
 * Send custom SMS
 * POST /api/sms/send
 */
export const sendSMS = async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and message are required'
      });
    }

    // Validate phone number
    if (!smsService.isValidPhoneNumber(to)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    const result = await smsService.sendSMS(to, message);

    res.json({
      success: true,
      message: 'SMS sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending SMS',
      error: error.message
    });
  }
};

/**
 * Send bulk SMS
 * POST /api/sms/send-bulk
 */
export const sendBulkSMS = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Messages array is required'
      });
    }

    // Validate each message
    for (const msg of messages) {
      if (!msg.to || !msg.message) {
        return res.status(400).json({
          success: false,
          message: 'Each message must have "to" and "message" fields'
        });
      }
    }

    const results = await smsService.sendBulkSMS(messages);

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    res.json({
      success: true,
      message: `Sent ${successCount} SMS, ${failureCount} failed`,
      data: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
        results
      }
    });
  } catch (error) {
    console.error('Error sending bulk SMS:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending bulk SMS',
      error: error.message
    });
  }
};

/**
 * Send event confirmation SMS
 * POST /api/sms/event-confirmation
 */
export const sendEventConfirmation = async (req, res) => {
  try {
    const { phone, eventData } = req.body;

    if (!phone || !eventData) {
      return res.status(400).json({
        success: false,
        message: 'Phone and event data are required'
      });
    }

    const result = await smsService.sendEventConfirmation(phone, eventData);

    res.json({
      success: true,
      message: 'Event confirmation SMS sent',
      data: result
    });
  } catch (error) {
    console.error('Error sending event confirmation SMS:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending event confirmation SMS',
      error: error.message
    });
  }
};

/**
 * Send event reminder SMS
 * POST /api/sms/event-reminder
 */
export const sendEventReminder = async (req, res) => {
  try {
    const { phone, eventData } = req.body;

    if (!phone || !eventData) {
      return res.status(400).json({
        success: false,
        message: 'Phone and event data are required'
      });
    }

    const result = await smsService.sendEventReminder(phone, eventData);

    res.json({
      success: true,
      message: 'Event reminder SMS sent',
      data: result
    });
  } catch (error) {
    console.error('Error sending event reminder SMS:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending event reminder SMS',
      error: error.message
    });
  }
};

/**
 * Send payment reminder SMS
 * POST /api/sms/payment-reminder
 */
export const sendPaymentReminder = async (req, res) => {
  try {
    const { phone, paymentData } = req.body;

    if (!phone || !paymentData) {
      return res.status(400).json({
        success: false,
        message: 'Phone and payment data are required'
      });
    }

    const result = await smsService.sendPaymentReminder(phone, paymentData);

    res.json({
      success: true,
      message: 'Payment reminder SMS sent',
      data: result
    });
  } catch (error) {
    console.error('Error sending payment reminder SMS:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending payment reminder SMS',
      error: error.message
    });
  }
};

/**
 * Send payment confirmation SMS
 * POST /api/sms/payment-confirmation
 */
export const sendPaymentConfirmation = async (req, res) => {
  try {
    const { phone, paymentData } = req.body;

    if (!phone || !paymentData) {
      return res.status(400).json({
        success: false,
        message: 'Phone and payment data are required'
      });
    }

    const result = await smsService.sendPaymentConfirmation(phone, paymentData);

    res.json({
      success: true,
      message: 'Payment confirmation SMS sent',
      data: result
    });
  } catch (error) {
    console.error('Error sending payment confirmation SMS:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending payment confirmation SMS',
      error: error.message
    });
  }
};

/**
 * Send DJ booking confirmation SMS
 * POST /api/sms/dj-booking
 */
export const sendDJBookingConfirmation = async (req, res) => {
  try {
    const { phone, bookingData } = req.body;

    if (!phone || !bookingData) {
      return res.status(400).json({
        success: false,
        message: 'Phone and booking data are required'
      });
    }

    const result = await smsService.sendDJBookingConfirmation(phone, bookingData);

    res.json({
      success: true,
      message: 'DJ booking confirmation SMS sent',
      data: result
    });
  } catch (error) {
    console.error('Error sending DJ booking confirmation SMS:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending DJ booking confirmation SMS',
      error: error.message
    });
  }
};

/**
 * Get SMS service status
 * GET /api/sms/status
 */
export const getStatus = async (req, res) => {
  try {
    const status = smsService.getServiceStatus();

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting SMS status:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting SMS status',
      error: error.message
    });
  }
};

/**
 * Test SMS configuration
 * POST /api/sms/test
 */
export const testConfiguration = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required for testing'
      });
    }

    const result = await smsService.testSMSConfiguration(phone);

    if (result.success) {
      res.json({
        success: true,
        message: 'Test SMS sent successfully',
        data: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Test SMS failed',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error testing SMS configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing SMS configuration',
      error: error.message
    });
  }
};

export default {
  sendSMS,
  sendBulkSMS,
  sendEventConfirmation,
  sendEventReminder,
  sendPaymentReminder,
  sendPaymentConfirmation,
  sendDJBookingConfirmation,
  getStatus,
  testConfiguration
};
