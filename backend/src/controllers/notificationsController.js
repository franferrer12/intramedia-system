/**
 * Notifications Controller
 * Gestión completa de notificaciones del sistema
 */

import Notification from '../models/Notification.js';
import logger from '../utils/logger.js';

/**
 * Obtener todas las notificaciones con filtros
 */
export const getAllNotifications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      user_id,
      dj_id,
      agency_id,
      type,
      priority,
      is_read,
      from_date,
      to_date,
      sort_by,
      sort_order
    } = req.query;

    const result = await Notification.findAll({
      user_id,
      dj_id,
      agency_id,
      type,
      priority,
      is_read: is_read !== undefined ? is_read === 'true' : undefined,
      from_date,
      to_date,
      page: parseInt(page),
      limit: parseInt(limit),
      sort_by,
      sort_order
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones',
      error: error.message
    });
  }
};

/**
 * Obtener notificación por ID
 */
export const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    logger.error('Error getting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener notificación',
      error: error.message
    });
  }
};

/**
 * Obtener notificaciones del usuario actual
 */
export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { is_read, limit = 50 } = req.query;

    const notifications = await Notification.findByUser(userId, {
      is_read: is_read !== undefined ? is_read === 'true' : undefined,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    logger.error('Error getting my notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones',
      error: error.message
    });
  }
};

/**
 * Obtener conteo de notificaciones no leídas del usuario actual
 */
export const getMyUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.id;
    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      data: unreadCount
    });
  } catch (error) {
    logger.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener conteo de no leídas',
      error: error.message
    });
  }
};

/**
 * Obtener notificaciones de un usuario específico
 */
export const getUserNotifications = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { is_read, limit = 50 } = req.query;

    const notifications = await Notification.findByUser(user_id, {
      is_read: is_read !== undefined ? is_read === 'true' : undefined,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    logger.error('Error getting user notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones del usuario',
      error: error.message
    });
  }
};

/**
 * Obtener notificaciones de un DJ
 */
export const getDJNotifications = async (req, res) => {
  try {
    const { dj_id } = req.params;
    const { is_read, limit = 50 } = req.query;

    const notifications = await Notification.findByDJ(dj_id, {
      is_read: is_read !== undefined ? is_read === 'true' : undefined,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    logger.error('Error getting DJ notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones del DJ',
      error: error.message
    });
  }
};

/**
 * Obtener notificaciones de una agencia
 */
export const getAgencyNotifications = async (req, res) => {
  try {
    const { agency_id } = req.params;
    const { is_read, limit = 50 } = req.query;

    const notifications = await Notification.findByAgency(agency_id, {
      is_read: is_read !== undefined ? is_read === 'true' : undefined,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    logger.error('Error getting agency notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones de la agencia',
      error: error.message
    });
  }
};

/**
 * Crear nueva notificación
 */
export const createNotification = async (req, res) => {
  try {
    const notificationData = req.body;
    const notification = await Notification.create(notificationData);

    logger.info('Notification created:', { notificationId: notification.id });

    res.status(201).json({
      success: true,
      message: 'Notificación creada exitosamente',
      data: notification
    });
  } catch (error) {
    logger.error('Error creating notification:', error);

    if (error.message.includes('user_id o dj_id')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear notificación',
      error: error.message
    });
  }
};

/**
 * Crear notificación desde template
 */
export const createFromTemplate = async (req, res) => {
  try {
    const { template_key } = req.params;
    const { variables, recipients } = req.body;

    if (!recipients || (!recipients.user_id && !recipients.dj_id)) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere al menos user_id o dj_id en recipients'
      });
    }

    const notification = await Notification.createFromTemplate(
      template_key,
      variables || {},
      recipients
    );

    logger.info('Notification created from template:', {
      templateKey: template_key,
      notificationId: notification.id
    });

    res.status(201).json({
      success: true,
      message: 'Notificación creada desde template exitosamente',
      data: notification
    });
  } catch (error) {
    logger.error('Error creating notification from template:', error);

    if (error.message.includes('Template') && error.message.includes('no encontrado')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear notificación desde template',
      error: error.message
    });
  }
};

/**
 * Marcar notificación como leída
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.markAsRead(id);

    logger.info('Notification marked as read:', { notificationId: id });

    res.json({
      success: true,
      message: 'Notificación marcada como leída',
      data: notification
    });
  } catch (error) {
    logger.error('Error marking notification as read:', error);

    if (error.message === 'Notificación no encontrada') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al marcar notificación como leída',
      error: error.message
    });
  }
};

/**
 * Marcar todas las notificaciones del usuario como leídas
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    const count = await Notification.markAllAsRead(userId);

    logger.info('All notifications marked as read:', { userId, count });

    res.json({
      success: true,
      message: `${count} notificaciones marcadas como leídas`,
      data: { count }
    });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar todas las notificaciones como leídas',
      error: error.message
    });
  }
};

/**
 * Eliminar notificación
 */
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.delete(id);

    logger.info('Notification deleted:', { notificationId: id });

    res.json({
      success: true,
      message: 'Notificación eliminada exitosamente',
      data: notification
    });
  } catch (error) {
    logger.error('Error deleting notification:', error);

    if (error.message === 'Notificación no encontrada') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al eliminar notificación',
      error: error.message
    });
  }
};

/**
 * Obtener estadísticas de notificaciones
 */
export const getStats = async (req, res) => {
  try {
    const stats = await Notification.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

/**
 * Limpiar notificaciones antiguas
 */
export const cleanupOld = async (req, res) => {
  try {
    const { days_to_keep = 90 } = req.query;
    const deletedCount = await Notification.cleanupOld(parseInt(days_to_keep));

    logger.info('Old notifications cleaned up:', { deletedCount });

    res.json({
      success: true,
      message: `${deletedCount} notificaciones antiguas eliminadas`,
      data: { deleted_count: deletedCount }
    });
  } catch (error) {
    logger.error('Error cleaning up old notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error al limpiar notificaciones antiguas',
      error: error.message
    });
  }
};

/**
 * Limpiar notificaciones expiradas
 */
export const cleanupExpired = async (req, res) => {
  try {
    const deletedCount = await Notification.cleanupExpired();

    logger.info('Expired notifications cleaned up:', { deletedCount });

    res.json({
      success: true,
      message: `${deletedCount} notificaciones expiradas eliminadas`,
      data: { deleted_count: deletedCount }
    });
  } catch (error) {
    logger.error('Error cleaning up expired notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error al limpiar notificaciones expiradas',
      error: error.message
    });
  }
};

/**
 * Reintentar notificaciones fallidas en la cola
 */
export const retryFailed = async (req, res) => {
  try {
    const retryCount = await Notification.retryFailed();

    logger.info('Failed notifications retried:', { retryCount });

    res.json({
      success: true,
      message: `${retryCount} notificaciones reintentadas`,
      data: { retry_count: retryCount }
    });
  } catch (error) {
    logger.error('Error retrying failed notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reintentar notificaciones fallidas',
      error: error.message
    });
  }
};

/**
 * Obtener preferencias de notificación del usuario actual
 */
export const getMyPreferences = async (req, res) => {
  try {
    const userId = req.user?.id;
    const preferences = await Notification.getUserPreferences(userId);

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    logger.error('Error getting user preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener preferencias',
      error: error.message
    });
  }
};

/**
 * Actualizar preferencias de notificación del usuario actual
 */
export const updateMyPreferences = async (req, res) => {
  try {
    const userId = req.user?.id;
    const preferences = req.body;

    const updated = await Notification.updateUserPreferences(userId, preferences);

    logger.info('User preferences updated:', { userId });

    res.json({
      success: true,
      message: 'Preferencias actualizadas exitosamente',
      data: updated
    });
  } catch (error) {
    logger.error('Error updating user preferences:', error);

    if (error.message === 'No hay preferencias para actualizar') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar preferencias',
      error: error.message
    });
  }
};

/**
 * Encolar email para envío
 */
export const queueEmail = async (req, res) => {
  try {
    const emailData = req.body;

    if (!emailData.recipient || !emailData.subject || !emailData.body) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere recipient, subject y body'
      });
    }

    const queued = await Notification.queueEmail(emailData);

    logger.info('Email queued:', { queueId: queued.id });

    res.status(201).json({
      success: true,
      message: 'Email encolado exitosamente',
      data: queued
    });
  } catch (error) {
    logger.error('Error queueing email:', error);
    res.status(500).json({
      success: false,
      message: 'Error al encolar email',
      error: error.message
    });
  }
};

export default {
  getAllNotifications,
  getNotificationById,
  getMyNotifications,
  getMyUnreadCount,
  getUserNotifications,
  getDJNotifications,
  getAgencyNotifications,
  createNotification,
  createFromTemplate,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getStats,
  cleanupOld,
  cleanupExpired,
  retryFailed,
  getMyPreferences,
  updateMyPreferences,
  queueEmail
};
