import express from 'express';
import {
  sendSMS,
  sendBulkSMS,
  sendEventConfirmation,
  sendEventReminder,
  sendPaymentReminder,
  sendPaymentConfirmation,
  sendDJBookingConfirmation,
  getStatus,
  testConfiguration
} from '../controllers/smsController.js';
import { authenticate as authenticateToken } from '../middleware/auth.js';
import { requireAdmin, requireStaff } from '../middleware/rbac.js';

const router = express.Router();

// ============================================================================
// SMS ROUTES
// All routes require authentication
// Most routes require admin or staff role
// ============================================================================

/**
 * @route   GET /api/sms/status
 * @desc    Get SMS service status
 * @access  Private (Admin/Staff only)
 * @returns SMS service configuration status
 */
router.get('/status', authenticateToken, requireStaff, getStatus);

/**
 * @route   POST /api/sms/test
 * @desc    Test SMS configuration by sending test message
 * @access  Private (Admin only)
 * @body    { phone: string }
 * @returns Test result
 */
router.post('/test', authenticateToken, requireAdmin, testConfiguration);

/**
 * @route   POST /api/sms/send
 * @desc    Send custom SMS message
 * @access  Private (Admin/Staff only)
 * @body    { to: string, message: string }
 * @returns SMS send result
 */
router.post('/send', authenticateToken, requireStaff, sendSMS);

/**
 * @route   POST /api/sms/send-bulk
 * @desc    Send bulk SMS messages
 * @access  Private (Admin only)
 * @body    { messages: [{to: string, message: string}] }
 * @returns Bulk SMS results
 */
router.post('/send-bulk', authenticateToken, requireAdmin, sendBulkSMS);

/**
 * @route   POST /api/sms/event-confirmation
 * @desc    Send event confirmation SMS using template
 * @access  Private (Staff only)
 * @body    { phone: string, eventData: object }
 * @returns SMS send result
 */
router.post('/event-confirmation', authenticateToken, requireStaff, sendEventConfirmation);

/**
 * @route   POST /api/sms/event-reminder
 * @desc    Send event reminder SMS using template
 * @access  Private (Staff only)
 * @body    { phone: string, eventData: object }
 * @returns SMS send result
 */
router.post('/event-reminder', authenticateToken, requireStaff, sendEventReminder);

/**
 * @route   POST /api/sms/payment-reminder
 * @desc    Send payment reminder SMS using template
 * @access  Private (Staff only)
 * @body    { phone: string, paymentData: object }
 * @returns SMS send result
 */
router.post('/payment-reminder', authenticateToken, requireStaff, sendPaymentReminder);

/**
 * @route   POST /api/sms/payment-confirmation
 * @desc    Send payment confirmation SMS using template
 * @access  Private (Staff only)
 * @body    { phone: string, paymentData: object }
 * @returns SMS send result
 */
router.post('/payment-confirmation', authenticateToken, requireStaff, sendPaymentConfirmation);

/**
 * @route   POST /api/sms/dj-booking
 * @desc    Send DJ booking confirmation SMS using template
 * @access  Private (Staff only)
 * @body    { phone: string, bookingData: object }
 * @returns SMS send result
 */
router.post('/dj-booking', authenticateToken, requireStaff, sendDJBookingConfirmation);

export default router;
