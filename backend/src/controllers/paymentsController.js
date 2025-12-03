/**
 * Payments Controller
 * Sprint 5.1 - Pagos Online con Stripe
 */

import Payment from '../models/Payment.js';
import pool from '../config/database.js';
import logger from '../utils/logger.js';
import Stripe from 'stripe';

// Initialize Stripe only if API key is provided
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

/**
 * Crear Payment Intent
 */
export const createPaymentIntent = async (req, res) => {
  try {
    const {
      amount,
      currency = 'eur',
      evento_id,
      cliente_id,
      reservation_id,
      payment_type = 'event_full',
      description,
      customer_email
    } = req.body;

    const userId = req.user.id;
    const agencyId = req.user.agency_id || req.agency?.id;

    // Crear Payment Intent en Stripe
    const paymentIntent = await Payment.createPaymentIntent({
      amount,
      currency,
      customer_email,
      description,
      metadata: {
        agency_id: agencyId,
        evento_id,
        cliente_id,
        reservation_id,
        payment_type
      }
    });

    // Guardar en DB
    const payment = await Payment.create({
      agency_id: agencyId,
      evento_id,
      cliente_id,
      reservation_id,
      stripe_payment_intent_id: paymentIntent.id,
      amount,
      currency: currency.toUpperCase(),
      payment_type,
      description,
      billing_email: customer_email,
      created_by: userId
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        payment
      }
    });
  } catch (error) {
    logger.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Obtener todos los pagos
 */
export const getAllPayments = async (req, res) => {
  try {
    const agencyId = req.user.agency_id || req.agency?.id;
    const filters = {
      agency_id: agencyId,
      ...req.query
    };

    const result = await Payment.findAll(filters);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error getting payments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Obtener pago por ID
 */
export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    logger.error('Error getting payment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Crear reembolso
 */
export const createRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason, reason_description } = req.body;
    const userId = req.user.id;

    const refund = await Payment.createRefund(id, {
      amount,
      reason,
      reason_description,
      created_by: userId
    });

    res.json({
      success: true,
      data: refund,
      message: 'Reembolso creado exitosamente'
    });
  } catch (error) {
    logger.error('Error creating refund:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Obtener estadísticas
 */
export const getPaymentStats = async (req, res) => {
  try {
    const agencyId = req.user.agency_id || req.agency?.id;
    const stats = await Payment.getStats(agencyId, req.query);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting payment stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Webhook de Stripe
 */
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    logger.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Guardar evento en DB
    await pool.query(
      `INSERT INTO stripe_webhooks (stripe_event_id, event_type, payload, api_version)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (stripe_event_id) DO NOTHING`,
      [event.id, event.type, JSON.stringify(event), event.api_version]
    );

    // Procesar evento
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;

      default:
        logger.info('Unhandled event type:', event.type);
    }

    // Marcar como procesado
    await pool.query(
      `UPDATE stripe_webhooks SET processed = true, processed_at = NOW() WHERE stripe_event_id = $1`,
      [event.id]
    );

    res.json({ received: true });
  } catch (error) {
    logger.error('Error processing webhook:', error);
    await pool.query(
      `UPDATE stripe_webhooks SET processing_error = $2, retry_count = retry_count + 1 WHERE stripe_event_id = $1`,
      [event.id, error.message]
    );
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// Handlers de webhooks
async function handlePaymentIntentSucceeded(paymentIntent) {
  await Payment.updateFromStripe(paymentIntent.id, paymentIntent);
  logger.info('Payment succeeded:', paymentIntent.id);
}

async function handlePaymentIntentFailed(paymentIntent) {
  await pool.query(
    `UPDATE payments
     SET status = 'failed', failure_message = $2, updated_at = NOW()
     WHERE stripe_payment_intent_id = $1`,
    [paymentIntent.id, paymentIntent.last_payment_error?.message]
  );
  logger.info('Payment failed:', paymentIntent.id);
}

async function handlePaymentIntentCanceled(paymentIntent) {
  await pool.query(
    `UPDATE payments
     SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
     WHERE stripe_payment_intent_id = $1`,
    [paymentIntent.id]
  );
  logger.info('Payment canceled:', paymentIntent.id);
}

async function handleChargeRefunded(charge) {
  const payment = await Payment.findByPaymentIntentId(charge.payment_intent);
  if (payment) {
    await Payment.updateRefundAmount(payment.id);
    logger.info('Charge refunded:', charge.id);
  }
}
