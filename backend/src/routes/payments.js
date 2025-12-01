/**
 * Payments Routes
 * Sprint 5.1 - Pagos Online con Stripe
 */

import express from 'express';
import {
  createPaymentIntent,
  getAllPayments,
  getPaymentById,
  createRefund,
  getPaymentStats,
  handleStripeWebhook
} from '../controllers/paymentsController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission, requireAdminOrManager } from '../middleware/authorization.js';
import { validate, field } from '../middleware/validation.js';

const router = express.Router();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WEBHOOK (Sin autenticación - verificado por Stripe)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.post('/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUTAS PROTEGIDAS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.use(authenticate);

/**
 * POST /api/payments/intent
 * Crear Payment Intent de Stripe
 */
router.post('/intent',
  requirePermission('payments', 'create'),
  validate([
    field('amount').required().numeric().positive(),
    field('currency').optional().oneOf(['eur', 'usd', 'gbp']),
    field('evento_id').optional().numeric().positive(),
    field('cliente_id').optional().numeric().positive(),
    field('reservation_id').optional().numeric().positive(),
    field('payment_type').optional().oneOf(['event_deposit', 'event_balance', 'event_full', 'subscription', 'service', 'late_fee', 'other']),
    field('description').optional().maxLength(500),
    field('customer_email').required().email()
  ]),
  createPaymentIntent
);

/**
 * GET /api/payments
 * Obtener todos los pagos
 */
router.get('/',
  requirePermission('payments', 'read'),
  validate([
    field('page').optional().numeric().positive(),
    field('limit').optional().numeric().positive().max(100),
    field('evento_id').optional().numeric().positive(),
    field('cliente_id').optional().numeric().positive(),
    field('status').optional().oneOf(['pending', 'processing', 'requires_action', 'succeeded', 'failed', 'cancelled', 'refunded', 'partially_refunded']),
    field('payment_type').optional(),
    field('date_from').optional().date(),
    field('date_to').optional().date()
  ]),
  getAllPayments
);

/**
 * GET /api/payments/stats
 * Obtener estadísticas de pagos
 */
router.get('/stats',
  requirePermission('payments', 'read'),
  getPaymentStats
);

/**
 * GET /api/payments/:id
 * Obtener pago por ID
 */
router.get('/:id',
  requirePermission('payments', 'read'),
  validate([
    field('id', 'params').required().numeric().positive()
  ]),
  getPaymentById
);

/**
 * POST /api/payments/:id/refund
 * Crear reembolso
 */
router.post('/:id/refund',
  requireAdminOrManager,
  validate([
    field('id', 'params').required().numeric().positive(),
    field('amount').optional().numeric().positive(),
    field('reason').optional().oneOf(['duplicate', 'fraudulent', 'requested_by_customer']),
    field('reason_description').optional().maxLength(500)
  ]),
  createRefund
);

export default router;
