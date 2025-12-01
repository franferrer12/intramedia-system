/**
 * Notification Model
 * Sistema completo de gestión de notificaciones
 */

import pool from '../config/database.js';
import logger from '../utils/logger.js';

class Notification {
  /**
   * Crear nueva notificación
   * @param {Object} notificationData - Datos de la notificación
   * @returns {Promise<Object>} Notificación creada
   */
  static async create(notificationData) {
    const {
      user_id,
      dj_id,
      agency_id,
      type,
      title,
      message,
      priority = 'normal',
      action_url,
      action_text,
      related_entity_type,
      related_entity_id,
      expires_at
    } = notificationData;

    // Validar que al menos user_id o dj_id esté presente
    if (!user_id && !dj_id) {
      throw new Error('Se requiere user_id o dj_id para crear una notificación');
    }

    const query = `
      INSERT INTO notifications (
        user_id, dj_id, agency_id, type, title, message,
        priority, action_url, action_text,
        related_entity_type, related_entity_id, expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      user_id || null,
      dj_id || null,
      agency_id || null,
      type,
      title,
      message,
      priority,
      action_url || null,
      action_text || null,
      related_entity_type || null,
      related_entity_id || null,
      expires_at || null
    ];

    try {
      const result = await pool.query(query, values);
      logger.info('Notification created:', { notificationId: result.rows[0].id });
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Obtener notificación por ID
   * @param {number} id - ID de la notificación
   * @returns {Promise<Object|null>} Notificación encontrada
   */
  static async findById(id) {
    const query = `
      SELECT n.*,
             u.nombre as user_name,
             d.nombre_artistico as dj_name,
             a.name as agency_name
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      LEFT JOIN djs d ON n.dj_id = d.id
      LEFT JOIN agencies a ON n.agency_id = a.id
      WHERE n.id = $1
    `;

    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding notification:', error);
      throw error;
    }
  }

  /**
   * Obtener notificaciones con filtros y paginación
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<Object>} Resultado con data y pagination
   */
  static async findAll(filters = {}) {
    const {
      user_id,
      dj_id,
      agency_id,
      type,
      priority,
      is_read,
      from_date,
      to_date,
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = filters;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    // Filtros
    if (user_id) {
      conditions.push(`n.user_id = $${paramCount++}`);
      values.push(user_id);
    }

    if (dj_id) {
      conditions.push(`n.dj_id = $${paramCount++}`);
      values.push(dj_id);
    }

    if (agency_id) {
      conditions.push(`n.agency_id = $${paramCount++}`);
      values.push(agency_id);
    }

    if (type) {
      conditions.push(`n.type = $${paramCount++}`);
      values.push(type);
    }

    if (priority) {
      conditions.push(`n.priority = $${paramCount++}`);
      values.push(priority);
    }

    if (is_read !== undefined) {
      conditions.push(`n.is_read = $${paramCount++}`);
      values.push(is_read);
    }

    if (from_date) {
      conditions.push(`n.created_at >= $${paramCount++}`);
      values.push(from_date);
    }

    if (to_date) {
      conditions.push(`n.created_at <= $${paramCount++}`);
      values.push(to_date);
    }

    // Excluir notificaciones expiradas
    conditions.push(`(n.expires_at IS NULL OR n.expires_at > CURRENT_TIMESTAMP)`);

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Paginación
    const offset = (page - 1) * limit;
    values.push(limit, offset);

    // Query principal
    const query = `
      SELECT n.*,
             u.nombre as user_name,
             d.nombre_artistico as dj_name,
             a.name as agency_name
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      LEFT JOIN djs d ON n.dj_id = d.id
      LEFT JOIN agencies a ON n.agency_id = a.id
      ${whereClause}
      ORDER BY n.${sort_by} ${sort_order}
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;

    // Query de conteo
    const countQuery = `
      SELECT COUNT(*) as total
      FROM notifications n
      ${whereClause}
    `;

    try {
      const [dataResult, countResult] = await Promise.all([
        pool.query(query, values),
        pool.query(countQuery, values.slice(0, -2)) // Excluir limit y offset
      ]);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        data: dataResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Error finding notifications:', error);
      throw error;
    }
  }

  /**
   * Obtener notificaciones de un usuario
   * @param {number} userId - ID del usuario
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Array>} Notificaciones del usuario
   */
  static async findByUser(userId, options = {}) {
    const { is_read, limit = 50 } = options;

    const filters = {
      user_id: userId,
      is_read,
      limit,
      sort_by: 'created_at',
      sort_order: 'DESC'
    };

    const result = await this.findAll(filters);
    return result.data;
  }

  /**
   * Obtener notificaciones de un DJ
   * @param {number} djId - ID del DJ
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Array>} Notificaciones del DJ
   */
  static async findByDJ(djId, options = {}) {
    const { is_read, limit = 50 } = options;

    const filters = {
      dj_id: djId,
      is_read,
      limit,
      sort_by: 'created_at',
      sort_order: 'DESC'
    };

    const result = await this.findAll(filters);
    return result.data;
  }

  /**
   * Obtener notificaciones de una agencia
   * @param {number} agencyId - ID de la agencia
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Array>} Notificaciones de la agencia
   */
  static async findByAgency(agencyId, options = {}) {
    const { is_read, limit = 50 } = options;

    const filters = {
      agency_id: agencyId,
      is_read,
      limit,
      sort_by: 'created_at',
      sort_order: 'DESC'
    };

    const result = await this.findAll(filters);
    return result.data;
  }

  /**
   * Marcar notificación como leída
   * @param {number} id - ID de la notificación
   * @returns {Promise<Object>} Notificación actualizada
   */
  static async markAsRead(id) {
    const query = `
      UPDATE notifications
      SET is_read = true,
          read_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        throw new Error('Notificación no encontrada');
      }

      logger.info('Notification marked as read:', { notificationId: id });
      return result.rows[0];
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Marcar todas las notificaciones de un usuario como leídas
   * @param {number} userId - ID del usuario
   * @returns {Promise<number>} Cantidad de notificaciones marcadas
   */
  static async markAllAsRead(userId) {
    const query = `
      UPDATE notifications
      SET is_read = true,
          read_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND is_read = false
      RETURNING id
    `;

    try {
      const result = await pool.query(query, [userId]);
      logger.info('All notifications marked as read:', {
        userId,
        count: result.rows.length
      });
      return result.rows.length;
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Eliminar notificación
   * @param {number} id - ID de la notificación
   * @returns {Promise<Object>} Notificación eliminada
   */
  static async delete(id) {
    const query = `
      DELETE FROM notifications
      WHERE id = $1
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        throw new Error('Notificación no encontrada');
      }

      logger.info('Notification deleted:', { notificationId: id });
      return result.rows[0];
    } catch (error) {
      logger.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Obtener conteo de notificaciones no leídas
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} Conteos por tipo
   */
  static async getUnreadCount(userId) {
    const query = `
      SELECT * FROM unread_notifications_summary
      WHERE user_id = $1
    `;

    try {
      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0) {
        return {
          user_id: userId,
          unread_count: 0,
          error_count: 0,
          warning_count: 0,
          urgent_count: 0,
          latest_notification: null
        };
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error getting unread count:', error);
      throw error;
    }
  }

  /**
   * Crear notificación desde template
   * @param {string} templateKey - Clave del template
   * @param {Object} variables - Variables para reemplazar
   * @param {Object} recipients - Destinatarios (user_id, dj_id, agency_id)
   * @returns {Promise<Object>} Notificación creada
   */
  static async createFromTemplate(templateKey, variables = {}, recipients = {}) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Obtener template
      const templateQuery = `
        SELECT * FROM notification_templates
        WHERE template_key = $1 AND is_active = true
      `;
      const templateResult = await client.query(templateQuery, [templateKey]);

      if (templateResult.rows.length === 0) {
        throw new Error(`Template '${templateKey}' no encontrado o inactivo`);
      }

      const template = templateResult.rows[0];

      // Reemplazar variables en título y mensaje
      let title = template.title_template;
      let message = template.message_template;

      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        title = title.replace(regex, variables[key]);
        message = message.replace(regex, variables[key]);
      });

      // Crear notificación
      const notification = await this.create({
        ...recipients,
        type: template.type,
        title,
        message,
        priority: template.default_priority,
        related_entity_type: variables.entity_type,
        related_entity_id: variables.entity_id
      });

      // Si hay email template y destinatario, encolar email
      if (template.email_subject_template && template.email_body_template) {
        const emailRecipient = variables.email || variables.client_email || variables.lead_email;

        if (emailRecipient) {
          let emailSubject = template.email_subject_template;
          let emailBody = template.email_body_template;

          Object.keys(variables).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            emailSubject = emailSubject.replace(regex, variables[key]);
            emailBody = emailBody.replace(regex, variables[key]);
          });

          await this.queueEmail({
            recipient: emailRecipient,
            subject: emailSubject,
            body: emailBody,
            template_key: templateKey,
            related_notification_id: notification.id
          }, client);
        }
      }

      await client.query('COMMIT');

      logger.info('Notification created from template:', {
        templateKey,
        notificationId: notification.id
      });

      return notification;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating notification from template:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Encolar email para envío
   * @param {Object} emailData - Datos del email
   * @param {Object} client - Cliente de base de datos (opcional)
   * @returns {Promise<Object>} Email encolado
   */
  static async queueEmail(emailData, client = null) {
    const {
      recipient,
      subject,
      body,
      template_key,
      related_notification_id
    } = emailData;

    const query = `
      INSERT INTO notification_queue (
        channel, recipient, subject, body,
        template_key, related_notification_id,
        next_attempt_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP + INTERVAL '1 minute')
      RETURNING *
    `;

    const values = [
      'email',
      recipient,
      subject,
      body,
      template_key || null,
      related_notification_id || null
    ];

    try {
      const db = client || pool;
      const result = await db.query(query, values);

      logger.info('Email queued:', { queueId: result.rows[0].id, recipient });
      return result.rows[0];
    } catch (error) {
      logger.error('Error queueing email:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de notificaciones
   * @returns {Promise<Object>} Estadísticas generales
   */
  static async getStats() {
    const query = 'SELECT * FROM notification_stats';

    try {
      const result = await pool.query(query);
      return result.rows[0] || {
        total_notifications: 0,
        read_count: 0,
        unread_count: 0,
        error_count: 0,
        warning_count: 0,
        urgent_count: 0,
        last_24h_count: 0,
        last_7d_count: 0
      };
    } catch (error) {
      logger.error('Error getting notification stats:', error);
      throw error;
    }
  }

  /**
   * Limpiar notificaciones antiguas (más de X días)
   * @param {number} daysToKeep - Días de retención
   * @returns {Promise<number>} Cantidad de notificaciones eliminadas
   */
  static async cleanupOld(daysToKeep = 90) {
    const query = 'SELECT cleanup_old_notifications($1)';

    try {
      const result = await pool.query(query, [daysToKeep]);
      const deletedCount = result.rows[0].cleanup_old_notifications;

      logger.info('Old notifications cleaned up:', { deletedCount, daysToKeep });
      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }

  /**
   * Limpiar notificaciones expiradas
   * @returns {Promise<number>} Cantidad de notificaciones eliminadas
   */
  static async cleanupExpired() {
    const query = 'SELECT cleanup_expired_notifications()';

    try {
      const result = await pool.query(query);
      const deletedCount = result.rows[0].cleanup_expired_notifications;

      logger.info('Expired notifications cleaned up:', { deletedCount });
      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning up expired notifications:', error);
      throw error;
    }
  }

  /**
   * Reintentar notificaciones fallidas en la cola
   * @returns {Promise<number>} Cantidad de notificaciones reintentadas
   */
  static async retryFailed() {
    const query = 'SELECT retry_failed_notifications()';

    try {
      const result = await pool.query(query);
      const retryCount = result.rows[0].retry_failed_notifications;

      logger.info('Failed notifications retried:', { retryCount });
      return retryCount;
    } catch (error) {
      logger.error('Error retrying failed notifications:', error);
      throw error;
    }
  }

  /**
   * Obtener preferencias de notificación de un usuario
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} Preferencias del usuario
   */
  static async getUserPreferences(userId) {
    const query = `
      SELECT * FROM notification_preferences
      WHERE user_id = $1
    `;

    try {
      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0) {
        // Crear preferencias por defecto si no existen
        const createQuery = `
          INSERT INTO notification_preferences (user_id)
          VALUES ($1)
          RETURNING *
        `;
        const createResult = await pool.query(createQuery, [userId]);
        return createResult.rows[0];
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error getting user preferences:', error);
      throw error;
    }
  }

  /**
   * Actualizar preferencias de notificación de un usuario
   * @param {number} userId - ID del usuario
   * @param {Object} preferences - Nuevas preferencias
   * @returns {Promise<Object>} Preferencias actualizadas
   */
  static async updateUserPreferences(userId, preferences) {
    const {
      in_app_enabled,
      email_enabled,
      sms_enabled,
      preferences: typePreferences,
      quiet_hours_enabled,
      quiet_hours_start,
      quiet_hours_end,
      email_digest_enabled,
      email_digest_frequency
    } = preferences;

    const updates = [];
    const values = [userId];
    let paramCount = 2;

    if (in_app_enabled !== undefined) {
      updates.push(`in_app_enabled = $${paramCount++}`);
      values.push(in_app_enabled);
    }

    if (email_enabled !== undefined) {
      updates.push(`email_enabled = $${paramCount++}`);
      values.push(email_enabled);
    }

    if (sms_enabled !== undefined) {
      updates.push(`sms_enabled = $${paramCount++}`);
      values.push(sms_enabled);
    }

    if (typePreferences !== undefined) {
      updates.push(`preferences = $${paramCount++}`);
      values.push(JSON.stringify(typePreferences));
    }

    if (quiet_hours_enabled !== undefined) {
      updates.push(`quiet_hours_enabled = $${paramCount++}`);
      values.push(quiet_hours_enabled);
    }

    if (quiet_hours_start !== undefined) {
      updates.push(`quiet_hours_start = $${paramCount++}`);
      values.push(quiet_hours_start);
    }

    if (quiet_hours_end !== undefined) {
      updates.push(`quiet_hours_end = $${paramCount++}`);
      values.push(quiet_hours_end);
    }

    if (email_digest_enabled !== undefined) {
      updates.push(`email_digest_enabled = $${paramCount++}`);
      values.push(email_digest_enabled);
    }

    if (email_digest_frequency !== undefined) {
      updates.push(`email_digest_frequency = $${paramCount++}`);
      values.push(email_digest_frequency);
    }

    if (updates.length === 0) {
      throw new Error('No hay preferencias para actualizar');
    }

    const query = `
      UPDATE notification_preferences
      SET ${updates.join(', ')},
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING *
    `;

    try {
      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Preferencias no encontradas');
      }

      logger.info('User preferences updated:', { userId });
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating user preferences:', error);
      throw error;
    }
  }
}

export default Notification;
