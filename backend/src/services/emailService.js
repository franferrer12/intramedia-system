/**
 * Email Service
 * Servicio para envío de emails con templates y procesamiento de cola
 */

import nodemailer from 'nodemailer';
import pool from '../config/database.js';
import logger from '../utils/logger.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.configure();
  }

  /**
   * Configurar transporter de nodemailer
   */
  configure() {
    try {
      const config = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      };

      // Validar configuración
      if (!config.host || !config.auth.user || !config.auth.pass) {
        logger.warn('Email service not configured - missing SMTP credentials');
        return;
      }

      this.transporter = nodemailer.createTransporter(config);
      this.isConfigured = true;

      // Verificar conexión
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error('Email service verification failed:', error);
          this.isConfigured = false;
        } else {
          logger.info('Email service configured and ready');
        }
      });
    } catch (error) {
      logger.error('Error configuring email service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Verificar si el servicio está configurado
   * @returns {boolean} Estado de configuración
   */
  isReady() {
    return this.isConfigured && this.transporter !== null;
  }

  /**
   * Enviar email
   * @param {Object} options - Opciones de email
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendEmail(options) {
    if (!this.isReady()) {
      throw new Error('Email service is not configured');
    }

    const {
      to,
      subject,
      text,
      html,
      from = process.env.EMAIL_FROM || 'noreply@intramedia.com'
    } = options;

    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        text,
        html: html || text
      });

      logger.info('Email sent successfully:', {
        messageId: info.messageId,
        to,
        subject
      });

      return {
        success: true,
        messageId: info.messageId,
        response: info.response
      };
    } catch (error) {
      logger.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Procesar cola de emails pendientes
   * @returns {Promise<Object>} Resultado del procesamiento
   */
  async processQueue() {
    if (!this.isReady()) {
      logger.warn('Email service not ready, skipping queue processing');
      return { processed: 0, failed: 0, skipped: true };
    }

    try {
      // Obtener emails pendientes de la cola
      const query = `
        SELECT *
        FROM notification_queue
        WHERE status = 'pending'
          AND channel = 'email'
          AND (next_attempt_at IS NULL OR next_attempt_at <= CURRENT_TIMESTAMP)
          AND attempts < max_attempts
        ORDER BY created_at ASC
        LIMIT 50
      `;

      const result = await pool.query(query);
      const emails = result.rows;

      if (emails.length === 0) {
        return { processed: 0, failed: 0 };
      }

      logger.info(`Processing ${emails.length} emails from queue`);

      let processed = 0;
      let failed = 0;

      for (const email of emails) {
        try {
          // Actualizar estado a 'processing'
          await pool.query(
            `UPDATE notification_queue
             SET status = 'processing', updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [email.id]
          );

          // Enviar email
          await this.sendEmail({
            to: email.recipient,
            subject: email.subject,
            html: email.body
          });

          // Marcar como enviado
          await pool.query(
            `UPDATE notification_queue
             SET status = 'sent',
                 sent_at = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [email.id]
          );

          processed++;
        } catch (error) {
          // Marcar como fallido e incrementar intentos
          const newAttempts = email.attempts + 1;
          const nextAttempt = this.calculateNextAttempt(newAttempts);

          await pool.query(
            `UPDATE notification_queue
             SET status = $1,
                 attempts = $2,
                 last_attempt_at = CURRENT_TIMESTAMP,
                 next_attempt_at = $3,
                 error_message = $4,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $5`,
            [
              newAttempts >= email.max_attempts ? 'failed' : 'pending',
              newAttempts,
              nextAttempt,
              error.message,
              email.id
            ]
          );

          failed++;
          logger.error('Failed to send email:', {
            queueId: email.id,
            recipient: email.recipient,
            attempts: newAttempts,
            error: error.message
          });
        }
      }

      logger.info('Queue processing completed:', { processed, failed });
      return { processed, failed };
    } catch (error) {
      logger.error('Error processing email queue:', error);
      throw error;
    }
  }

  /**
   * Calcular próximo intento basado en backoff exponencial
   * @param {number} attempts - Número de intentos
   * @returns {Date} Fecha del próximo intento
   */
  calculateNextAttempt(attempts) {
    // Backoff exponencial: 5min, 15min, 60min
    const delays = [5, 15, 60]; // minutos
    const delayMinutes = delays[Math.min(attempts - 1, delays.length - 1)];

    const nextAttempt = new Date();
    nextAttempt.setMinutes(nextAttempt.getMinutes() + delayMinutes);

    return nextAttempt;
  }

  /**
   * Renderizar template de email
   * @param {string} template - Template HTML
   * @param {Object} variables - Variables para reemplazar
   * @returns {string} HTML renderizado
   */
  renderTemplate(template, variables = {}) {
    let rendered = template;

    // Reemplazar variables simples {{variable}}
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, variables[key] || '');
    });

    // Wrap en layout básico si no tiene estructura HTML
    if (!rendered.includes('<html>')) {
      rendered = this.wrapInLayout(rendered);
    }

    return rendered;
  }

  /**
   * Envolver contenido en layout de email
   * @param {string} content - Contenido HTML
   * @returns {string} HTML con layout
   */
  wrapInLayout(content) {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notificación - IntraMedia</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .email-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .email-header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .email-body {
      padding: 30px;
    }
    .email-footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6c757d;
      border-top: 1px solid #e9ecef;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #5a67d8;
    }
    h2 {
      color: #2d3748;
      font-size: 20px;
      margin-top: 0;
    }
    p {
      margin: 15px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>IntraMedia System</h1>
    </div>
    <div class="email-body">
      ${content}
    </div>
    <div class="email-footer">
      <p>Este es un email automático generado por IntraMedia System.</p>
      <p>Por favor no respondas a este email.</p>
      <p>&copy; ${new Date().getFullYear()} IntraMedia. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Enviar email de prueba
   * @param {string} to - Destinatario
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendTestEmail(to) {
    const content = `
      <h2>Email de Prueba</h2>
      <p>Este es un email de prueba del sistema de notificaciones de IntraMedia.</p>
      <p>Si recibes este email, significa que el servicio de email está funcionando correctamente.</p>
      <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
    `;

    return await this.sendEmail({
      to,
      subject: 'Prueba - Sistema de Notificaciones IntraMedia',
      html: this.wrapInLayout(content)
    });
  }

  /**
   * Obtener estadísticas de la cola de emails
   * @returns {Promise<Object>} Estadísticas
   */
  async getQueueStats() {
    try {
      const query = `
        SELECT
          status,
          COUNT(*) as count,
          MIN(created_at) as oldest,
          MAX(created_at) as newest
        FROM notification_queue
        WHERE channel = 'email'
        GROUP BY status
      `;

      const result = await pool.query(query);

      const stats = {
        pending: 0,
        processing: 0,
        sent: 0,
        failed: 0,
        cancelled: 0
      };

      result.rows.forEach(row => {
        stats[row.status] = {
          count: parseInt(row.count),
          oldest: row.oldest,
          newest: row.newest
        };
      });

      return stats;
    } catch (error) {
      logger.error('Error getting queue stats:', error);
      throw error;
    }
  }

  /**
   * Limpiar emails antiguos de la cola
   * @param {number} daysToKeep - Días de retención
   * @returns {Promise<number>} Cantidad de emails eliminados
   */
  async cleanupOldEmails(daysToKeep = 30) {
    try {
      const query = `
        DELETE FROM notification_queue
        WHERE channel = 'email'
          AND status IN ('sent', 'failed', 'cancelled')
          AND created_at < CURRENT_TIMESTAMP - ($1 || ' days')::INTERVAL
        RETURNING id
      `;

      const result = await pool.query(query, [daysToKeep]);
      const deletedCount = result.rows.length;

      logger.info('Old emails cleaned up:', { deletedCount, daysToKeep });
      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning up old emails:', error);
      throw error;
    }
  }

  /**
   * Cancelar emails pendientes por criterios
   * @param {Object} criteria - Criterios de cancelación
   * @returns {Promise<number>} Cantidad de emails cancelados
   */
  async cancelPendingEmails(criteria) {
    try {
      const { recipient, template_key, related_notification_id } = criteria;

      const conditions = ['status = $1', 'channel = $2'];
      const values = ['pending', 'email'];
      let paramCount = 3;

      if (recipient) {
        conditions.push(`recipient = $${paramCount++}`);
        values.push(recipient);
      }

      if (template_key) {
        conditions.push(`template_key = $${paramCount++}`);
        values.push(template_key);
      }

      if (related_notification_id) {
        conditions.push(`related_notification_id = $${paramCount++}`);
        values.push(related_notification_id);
      }

      const query = `
        UPDATE notification_queue
        SET status = 'cancelled',
            updated_at = CURRENT_TIMESTAMP
        WHERE ${conditions.join(' AND ')}
        RETURNING id
      `;

      const result = await pool.query(query, values);
      const cancelledCount = result.rows.length;

      logger.info('Pending emails cancelled:', { cancelledCount, criteria });
      return cancelledCount;
    } catch (error) {
      logger.error('Error cancelling pending emails:', error);
      throw error;
    }
  }
}

// Exportar instancia singleton
const emailService = new EmailService();
export default emailService;
