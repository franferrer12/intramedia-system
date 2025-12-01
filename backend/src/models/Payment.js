/**
 * Payment Model
 * Sprint 5.1 - Sistema de Pagos con Stripe
 */

import pool from '../config/database.js';
import logger from '../utils/logger.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

class Payment {
  /**
   * Crear Payment Intent en Stripe
   */
  static async createPaymentIntent(data) {
    const {
      amount,
      currency = 'eur',
      customer_email,
      description,
      metadata = {}
    } = data;

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        receipt_email: customer_email,
        description,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      logger.info('Payment intent created:', { id: paymentIntent.id, amount });
      return paymentIntent;
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Crear registro de pago en DB
   */
  static async create(paymentData) {
    const {
      agency_id,
      evento_id,
      cliente_id,
      reservation_id,
      stripe_payment_intent_id,
      amount,
      currency = 'EUR',
      payment_type = 'other',
      payment_method = 'card',
      description,
      billing_name,
      billing_email,
      billing_phone,
      metadata = {},
      created_by
    } = paymentData;

    try {
      const query = `
        INSERT INTO payments (
          agency_id, evento_id, cliente_id, reservation_id,
          stripe_payment_intent_id, amount, currency,
          payment_type, payment_method, description,
          billing_name, billing_email, billing_phone,
          metadata, created_by, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending')
        RETURNING *
      `;

      const values = [
        agency_id, evento_id || null, cliente_id || null, reservation_id || null,
        stripe_payment_intent_id, amount, currency,
        payment_type, payment_method, description || null,
        billing_name || null, billing_email || null, billing_phone || null,
        JSON.stringify(metadata), created_by || null
      ];

      const result = await pool.query(query, values);
      logger.info('Payment record created:', { id: result.rows[0].id });
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating payment record:', error);
      throw error;
    }
  }

  /**
   * Actualizar pago con información de Stripe
   */
  static async updateFromStripe(paymentIntentId, stripeData) {
    try {
      const {
        status,
        amount_received,
        charges,
        payment_method
      } = stripeData;

      const charge = charges?.data?.[0];
      const paymentMethodDetails = charge?.payment_method_details;

      const query = `
        UPDATE payments
        SET
          status = $2,
          amount_received = $3,
          stripe_charge_id = $4,
          stripe_payment_method_id = $5,
          card_brand = $6,
          card_last4 = $7,
          stripe_fee = $8,
          net_amount = amount_received - COALESCE(application_fee, 0) - COALESCE($8, 0),
          paid_at = CASE WHEN $2 = 'succeeded' THEN NOW() ELSE paid_at END,
          receipt_url = $9,
          updated_at = NOW()
        WHERE stripe_payment_intent_id = $1
        RETURNING *
      `;

      const values = [
        paymentIntentId,
        this.mapStripeStatus(status),
        amount_received ? amount_received / 100 : 0,
        charge?.id || null,
        payment_method || null,
        paymentMethodDetails?.card?.brand || null,
        paymentMethodDetails?.card?.last4 || null,
        charge?.balance_transaction ? await this.getStripeFee(charge.balance_transaction) : 0,
        charge?.receipt_url || null
      ];

      const result = await pool.query(query, values);
      logger.info('Payment updated from Stripe:', { id: result.rows[0]?.id });
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating payment from Stripe:', error);
      throw error;
    }
  }

  /**
   * Obtener fee de Stripe
   */
  static async getStripeFee(balanceTransactionId) {
    try {
      const balanceTransaction = await stripe.balanceTransactions.retrieve(balanceTransactionId);
      return balanceTransaction.fee / 100;
    } catch (error) {
      logger.error('Error getting Stripe fee:', error);
      return 0;
    }
  }

  /**
   * Mapear estado de Stripe a nuestro sistema
   */
  static mapStripeStatus(stripeStatus) {
    const statusMap = {
      'requires_payment_method': 'pending',
      'requires_confirmation': 'pending',
      'requires_action': 'requires_action',
      'processing': 'processing',
      'requires_capture': 'processing',
      'canceled': 'cancelled',
      'succeeded': 'succeeded'
    };
    return statusMap[stripeStatus] || 'pending';
  }

  /**
   * Obtener todos los pagos
   */
  static async findAll(filters = {}) {
    const {
      agency_id,
      evento_id,
      cliente_id,
      status,
      payment_type,
      date_from,
      date_to,
      page = 1,
      limit = 20
    } = filters;

    try {
      const conditions = ['p.deleted_at IS NULL'];
      const values = [];
      let paramIndex = 1;

      if (agency_id) {
        conditions.push(`p.agency_id = $${paramIndex++}`);
        values.push(agency_id);
      }

      if (evento_id) {
        conditions.push(`p.evento_id = $${paramIndex++}`);
        values.push(evento_id);
      }

      if (cliente_id) {
        conditions.push(`p.cliente_id = $${paramIndex++}`);
        values.push(cliente_id);
      }

      if (status) {
        conditions.push(`p.status = $${paramIndex++}`);
        values.push(status);
      }

      if (payment_type) {
        conditions.push(`p.payment_type = $${paramIndex++}`);
        values.push(payment_type);
      }

      if (date_from) {
        conditions.push(`p.created_at >= $${paramIndex++}`);
        values.push(date_from);
      }

      if (date_to) {
        conditions.push(`p.created_at <= $${paramIndex++}`);
        values.push(date_to);
      }

      const offset = (page - 1) * limit;
      values.push(limit, offset);

      const query = `
        SELECT * FROM payments_complete p
        WHERE ${conditions.join(' AND ')}
        ORDER BY p.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}
      `;

      const countQuery = `
        SELECT COUNT(*) FROM payments p
        WHERE ${conditions.join(' AND ')}
      `;

      const [paymentsResult, countResult] = await Promise.all([
        pool.query(query, values),
        pool.query(countQuery, values.slice(0, -2))
      ]);

      return {
        payments: paymentsResult.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit)
      };
    } catch (error) {
      logger.error('Error finding payments:', error);
      throw error;
    }
  }

  /**
   * Obtener pago por ID
   */
  static async findById(id) {
    try {
      const query = `SELECT * FROM payments_complete WHERE id = $1 AND deleted_at IS NULL`;
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding payment:', error);
      throw error;
    }
  }

  /**
   * Obtener pago por Payment Intent ID
   */
  static async findByPaymentIntentId(paymentIntentId) {
    try {
      const query = `SELECT * FROM payments WHERE stripe_payment_intent_id = $1 AND deleted_at IS NULL`;
      const result = await pool.query(query, [paymentIntentId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding payment by intent ID:', error);
      throw error;
    }
  }

  /**
   * Crear reembolso
   */
  static async createRefund(paymentId, refundData) {
    const {
      amount,
      reason = 'requested_by_customer',
      reason_description,
      created_by
    } = refundData;

    try {
      // Obtener pago
      const payment = await this.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Crear reembolso en Stripe
      const stripeRefund = await stripe.refunds.create({
        payment_intent: payment.stripe_payment_intent_id,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason
      });

      // Guardar en DB
      const query = `
        INSERT INTO refunds (
          payment_id, agency_id, stripe_refund_id,
          amount, currency, reason, reason_description,
          status, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
        RETURNING *
      `;

      const values = [
        paymentId,
        payment.agency_id,
        stripeRefund.id,
        stripeRefund.amount / 100,
        stripeRefund.currency.toUpperCase(),
        reason,
        reason_description || null,
        created_by
      ];

      const result = await pool.query(query, values);

      // Actualizar pago
      await this.updateRefundAmount(paymentId);

      logger.info('Refund created:', { id: result.rows[0].id, paymentId });
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating refund:', error);
      throw error;
    }
  }

  /**
   * Actualizar monto reembolsado en pago
   */
  static async updateRefundAmount(paymentId) {
    try {
      const query = `
        UPDATE payments
        SET
          amount_refunded = (
            SELECT COALESCE(SUM(amount), 0)
            FROM refunds
            WHERE payment_id = $1 AND status = 'succeeded' AND deleted_at IS NULL
          ),
          status = CASE
            WHEN amount_refunded >= amount THEN 'refunded'::payment_status
            WHEN amount_refunded > 0 THEN 'partially_refunded'::payment_status
            ELSE status
          END,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;

      const result = await pool.query(query, [paymentId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating refund amount:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas
   */
  static async getStats(agencyId, filters = {}) {
    try {
      const { date_from, date_to } = filters;
      const conditions = ['deleted_at IS NULL', 'agency_id = $1'];
      const values = [agencyId];
      let paramIndex = 2;

      if (date_from) {
        conditions.push(`created_at >= $${paramIndex++}`);
        values.push(date_from);
      }

      if (date_to) {
        conditions.push(`created_at <= $${paramIndex++}`);
        values.push(date_to);
      }

      const query = `
        SELECT
          COUNT(*) as total_count,
          COUNT(*) FILTER (WHERE status = 'succeeded') as succeeded_count,
          COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
          COUNT(*) FILTER (WHERE status = 'refunded') as refunded_count,
          SUM(amount) as total_amount,
          SUM(amount_received) as total_received,
          SUM(amount_refunded) as total_refunded,
          SUM(net_amount) as total_net,
          AVG(amount) as avg_amount
        FROM payments
        WHERE ${conditions.join(' AND ')}
      `;

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting payment stats:', error);
      throw error;
    }
  }
}

export default Payment;
