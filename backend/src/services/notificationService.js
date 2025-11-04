import db from '../config/database.js';

/**
 * Servicio de Notificaciones
 * Maneja notificaciones in-app, emails, Slack, SMS, etc.
 */

/**
 * Configuración de servicios externos (usar variables de entorno)
 */
const config = {
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
    channel: process.env.SLACK_CHANNEL || '#leads',
    enabled: !!process.env.SLACK_WEBHOOK_URL
  },
  email: {
    from: process.env.EMAIL_FROM || 'noreply@intramedia.com',
    enabled: !!process.env.EMAIL_SERVICE
  }
};

/**
 * Enviar notificación a Slack
 */
export const sendSlackNotification = async (message, leadData = {}) => {
  if (!config.slack.enabled) {
    console.log('[Slack] Webhook no configurado. Mensaje:', message);
    return { success: false, message: 'Slack webhook not configured' };
  }

  try {
    const payload = {
      channel: config.slack.channel,
      username: 'Intra Media CRM',
      icon_emoji: ':mega:',
      text: message
    };

    const response = await fetch(config.slack.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`);
    }

    return { success: true, message: 'Slack notification sent' };
  } catch (error) {
    console.error('[Slack] Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Enviar notificación interna al equipo
 */
export const sendInternalNotification = async (leadData) => {
  const message = `🎯 Nuevo Lead: ${leadData.nombre} | ${leadData.tipo_evento || 'N/A'} | ${leadData.email || leadData.telefono}`;

  if (config.slack.enabled) {
    await sendSlackNotification(message, leadData);
  }

  console.log('[Notificación]', message);
  return { success: true };
};

/**
 * Get notifications for a DJ
 */
export const getNotifications = async (djId, options = {}) => {
  try {
    const { limit = 20, unreadOnly = false } = options;

    let query = `
      SELECT
        id,
        dj_id,
        type,
        title,
        message,
        data,
        read,
        created_at
      FROM notifications
      WHERE dj_id = $1
    `;

    const params = [djId];

    if (unreadOnly) {
      query += ` AND read = false`;
    }

    query += ` ORDER BY created_at DESC LIMIT $2`;
    params.push(limit);

    const result = await db.query(query, params);

    return result.rows;
  } catch (error) {
    // If table doesn't exist, return empty array
    if (error.code === '42P01') {
      console.log('[Notifications] Table does not exist yet, returning empty array');
      return [];
    }
    console.error('[Notifications] Error getting notifications:', error);
    throw error;
  }
};

/**
 * Get unread notification count for a DJ
 */
export const getUnreadCount = async (djId) => {
  try {
    const result = await db.query(
      `SELECT COUNT(*) as count
       FROM notifications
       WHERE dj_id = $1 AND read = false`,
      [djId]
    );

    return parseInt(result.rows[0]?.count || 0);
  } catch (error) {
    // If table doesn't exist, return 0
    if (error.code === '42P01') {
      return 0;
    }
    console.error('[Notifications] Error getting unread count:', error);
    throw error;
  }
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (notificationId, djId) => {
  try {
    await db.query(
      `UPDATE notifications
       SET read = true, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND dj_id = $2`,
      [notificationId, djId]
    );

    return { success: true };
  } catch (error) {
    // If table doesn't exist, silently succeed
    if (error.code === '42P01') {
      return { success: true };
    }
    console.error('[Notifications] Error marking as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a DJ
 */
export const markAllAsRead = async (djId) => {
  try {
    await db.query(
      `UPDATE notifications
       SET read = true, updated_at = CURRENT_TIMESTAMP
       WHERE dj_id = $1 AND read = false`,
      [djId]
    );

    return { success: true };
  } catch (error) {
    // If table doesn't exist, silently succeed
    if (error.code === '42P01') {
      return { success: true };
    }
    console.error('[Notifications] Error marking all as read:', error);
    throw error;
  }
};

/**
 * Analyze Instagram metrics and create notifications for significant changes
 */
export const analyzeAndNotify = async (djId, newMetrics, oldMetrics) => {
  try {
    if (!oldMetrics) {
      // First time tracking, no comparison
      return { success: true, message: 'No previous metrics to compare' };
    }

    const notifications = [];

    // Analyze follower growth
    const oldFollowers = oldMetrics.followers || 0;
    const newFollowers = newMetrics.followers || 0;
    const followerGrowth = newFollowers - oldFollowers;
    const followerGrowthPercent = oldFollowers > 0
      ? ((followerGrowth / oldFollowers) * 100).toFixed(2)
      : 0;

    // Notify on significant follower milestones or growth
    if (followerGrowth >= 100) {
      notifications.push({
        type: 'follower_milestone',
        title: 'Ganaste seguidores!',
        message: `Has ganado ${followerGrowth} nuevos seguidores (${followerGrowthPercent}% de crecimiento)`,
        data: { oldFollowers, newFollowers, growth: followerGrowth }
      });
    } else if (followerGrowth <= -50) {
      notifications.push({
        type: 'follower_drop',
        title: 'Alerta: Pérdida de seguidores',
        message: `Has perdido ${Math.abs(followerGrowth)} seguidores`,
        data: { oldFollowers, newFollowers, loss: followerGrowth }
      });
    }

    // Check for follower milestones (10k, 50k, 100k, etc.)
    const milestones = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];
    for (const milestone of milestones) {
      if (oldFollowers < milestone && newFollowers >= milestone) {
        notifications.push({
          type: 'follower_milestone',
          title: `¡Hito alcanzado: ${milestone.toLocaleString()} seguidores!`,
          message: `Felicidades! Has alcanzado ${milestone.toLocaleString()} seguidores en Instagram`,
          data: { milestone, followers: newFollowers }
        });
      }
    }

    // Analyze engagement rate changes
    const oldEngagement = oldMetrics.engagement_rate || 0;
    const newEngagement = newMetrics.engagement_rate || 0;
    const engagementChange = newEngagement - oldEngagement;

    if (engagementChange >= 0.5) {
      notifications.push({
        type: 'engagement_increase',
        title: 'Mejora en engagement',
        message: `Tu tasa de engagement ha aumentado ${engagementChange.toFixed(2)}%`,
        data: { oldEngagement, newEngagement }
      });
    } else if (engagementChange <= -0.5) {
      notifications.push({
        type: 'engagement_decrease',
        title: 'Alerta: Disminución en engagement',
        message: `Tu tasa de engagement ha bajado ${Math.abs(engagementChange).toFixed(2)}%`,
        data: { oldEngagement, newEngagement }
      });
    }

    // Check for viral post (top post with exceptional performance)
    if (newMetrics.top_post && oldMetrics.top_post) {
      const newTopLikes = newMetrics.top_post.likes || 0;
      const oldTopLikes = oldMetrics.top_post.likes || 0;

      if (newTopLikes > oldTopLikes * 2 && newTopLikes > 1000) {
        notifications.push({
          type: 'viral_post',
          title: '¡Post viral detectado!',
          message: `Tu publicación más reciente está teniendo un rendimiento excepcional con ${newTopLikes.toLocaleString()} likes`,
          data: { post: newMetrics.top_post }
        });
      }
    }

    // Create notifications in database
    for (const notification of notifications) {
      await createNotification(djId, notification);
    }

    return {
      success: true,
      notifications: notifications.length,
      message: `${notifications.length} notificaciones creadas`
    };

  } catch (error) {
    console.error('[Notifications] Error analyzing metrics:', error);
    // Don't throw - this is non-critical
    return { success: false, error: error.message };
  }
};

/**
 * Create a notification in the database
 */
const createNotification = async (djId, notification) => {
  try {
    await db.query(
      `INSERT INTO notifications (dj_id, type, title, message, data, read)
       VALUES ($1, $2, $3, $4, $5, false)`,
      [
        djId,
        notification.type,
        notification.title,
        notification.message,
        JSON.stringify(notification.data || {})
      ]
    );
  } catch (error) {
    // If table doesn't exist, log but don't fail
    if (error.code === '42P01') {
      console.log('[Notifications] Table does not exist yet, notification not saved:', notification.title);
      return;
    }
    throw error;
  }
};

export default {
  sendSlackNotification,
  sendInternalNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  analyzeAndNotify
};
