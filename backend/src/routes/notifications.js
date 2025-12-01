/**
 * Notifications Routes
 * Sistema completo de rutas para notificaciones
 */

import express from 'express';
import {
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
} from '../controllers/notificationsController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission, requireAdminOrManager } from '../middleware/authorization.js';
import { validate, field } from '../middleware/validation.js';
import { paginationMiddleware } from '../middleware/pagination.js';
import { shortCache, invalidateCache } from '../middleware/cache.js';
import { createRateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

// Middleware de autenticación en todas las rutas
router.use(authenticate);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUTAS DEL USUARIO ACTUAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/notifications/me
 * Obtener mis notificaciones
 */
router.get('/me',
  shortCache,
  getMyNotifications
);

/**
 * GET /api/notifications/me/unread-count
 * Obtener conteo de mis notificaciones no leídas
 */
router.get('/me/unread-count',
  shortCache,
  getMyUnreadCount
);

/**
 * POST /api/notifications/me/mark-all-read
 * Marcar todas mis notificaciones como leídas
 */
router.post('/me/mark-all-read',
  (req, res, next) => {
    invalidateCache('GET:/api/notifications/me');
    invalidateCache('GET:/api/notifications/me/unread-count');
    next();
  },
  markAllAsRead
);

/**
 * GET /api/notifications/me/preferences
 * Obtener mis preferencias de notificación
 */
router.get('/me/preferences',
  getMyPreferences
);

/**
 * PUT /api/notifications/me/preferences
 * Actualizar mis preferencias de notificación
 */
router.put('/me/preferences',
  validate([
    field('in_app_enabled').optional().boolean(),
    field('email_enabled').optional().boolean(),
    field('sms_enabled').optional().boolean(),
    field('preferences').optional().custom((value) => {
      if (typeof value !== 'object') {
        throw new Error('preferences debe ser un objeto');
      }
      return true;
    }),
    field('quiet_hours_enabled').optional().boolean(),
    field('quiet_hours_start').optional().matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/),
    field('quiet_hours_end').optional().matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/),
    field('email_digest_enabled').optional().boolean(),
    field('email_digest_frequency').optional().isIn(['daily', 'weekly'])
  ]),
  updateMyPreferences
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUTAS DE LECTURA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/notifications
 * Obtener todas las notificaciones con filtros
 */
router.get('/',
  requirePermission('notifications', 'read'),
  paginationMiddleware,
  shortCache,
  getAllNotifications
);

/**
 * GET /api/notifications/stats
 * Obtener estadísticas de notificaciones
 */
router.get('/stats',
  requireAdminOrManager,
  shortCache,
  getStats
);

/**
 * GET /api/notifications/:id
 * Obtener notificación por ID
 */
router.get('/:id',
  getNotificationById
);

/**
 * GET /api/notifications/users/:user_id
 * Obtener notificaciones de un usuario
 */
router.get('/users/:user_id',
  requirePermission('notifications', 'read'),
  getUserNotifications
);

/**
 * GET /api/notifications/djs/:dj_id
 * Obtener notificaciones de un DJ
 */
router.get('/djs/:dj_id',
  requirePermission('notifications', 'read'),
  getDJNotifications
);

/**
 * GET /api/notifications/agencies/:agency_id
 * Obtener notificaciones de una agencia
 */
router.get('/agencies/:agency_id',
  requirePermission('notifications', 'read'),
  getAgencyNotifications
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUTAS DE CREACIÓN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * POST /api/notifications
 * Crear nueva notificación
 */
router.post('/',
  requirePermission('notifications', 'create'),
  createRateLimit,
  validate([
    field('user_id').optional().numeric().positive(),
    field('dj_id').optional().numeric().positive(),
    field('agency_id').optional().numeric().positive(),
    field('type').required().isIn([
      'info', 'success', 'warning', 'error',
      'evento', 'payment', 'quotation', 'contract', 'lead', 'system'
    ]),
    field('title').required().minLength(3).maxLength(255),
    field('message').required().minLength(3).maxLength(2000),
    field('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
    field('action_url').optional().maxLength(500),
    field('action_text').optional().maxLength(100),
    field('related_entity_type').optional().maxLength(50),
    field('related_entity_id').optional().numeric().positive(),
    field('expires_at').optional().date()
  ]),
  (req, res, next) => {
    invalidateCache('GET:/api/notifications');
    next();
  },
  createNotification
);

/**
 * POST /api/notifications/templates/:template_key
 * Crear notificación desde template
 */
router.post('/templates/:template_key',
  requirePermission('notifications', 'create'),
  createRateLimit,
  validate([
    field('recipients').required().custom((value) => {
      if (typeof value !== 'object') {
        throw new Error('recipients debe ser un objeto');
      }
      if (!value.user_id && !value.dj_id) {
        throw new Error('recipients debe contener user_id o dj_id');
      }
      return true;
    }),
    field('variables').optional().custom((value) => {
      if (typeof value !== 'object') {
        throw new Error('variables debe ser un objeto');
      }
      return true;
    })
  ]),
  (req, res, next) => {
    invalidateCache('GET:/api/notifications');
    next();
  },
  createFromTemplate
);

/**
 * POST /api/notifications/queue-email
 * Encolar email para envío
 */
router.post('/queue-email',
  requirePermission('notifications', 'create'),
  createRateLimit,
  validate([
    field('recipient').required().email(),
    field('subject').required().minLength(3).maxLength(255),
    field('body').required().minLength(3),
    field('template_key').optional().maxLength(100),
    field('related_notification_id').optional().numeric().positive()
  ]),
  queueEmail
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUTAS DE ACTUALIZACIÓN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * PATCH /api/notifications/:id/mark-read
 * Marcar notificación como leída
 */
router.patch('/:id/mark-read',
  (req, res, next) => {
    invalidateCache('GET:/api/notifications');
    invalidateCache('GET:/api/notifications/me');
    invalidateCache('GET:/api/notifications/me/unread-count');
    next();
  },
  markAsRead
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUTAS ADMINISTRATIVAS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * POST /api/notifications/cleanup-old
 * Limpiar notificaciones antiguas (cron job)
 */
router.post('/cleanup-old',
  requireAdminOrManager,
  (req, res, next) => {
    invalidateCache('GET:/api/notifications');
    next();
  },
  cleanupOld
);

/**
 * POST /api/notifications/cleanup-expired
 * Limpiar notificaciones expiradas (cron job)
 */
router.post('/cleanup-expired',
  requireAdminOrManager,
  (req, res, next) => {
    invalidateCache('GET:/api/notifications');
    next();
  },
  cleanupExpired
);

/**
 * POST /api/notifications/retry-failed
 * Reintentar notificaciones fallidas (cron job)
 */
router.post('/retry-failed',
  requireAdminOrManager,
  retryFailed
);

/**
 * DELETE /api/notifications/:id
 * Eliminar notificación
 */
router.delete('/:id',
  requireAdminOrManager,
  (req, res, next) => {
    invalidateCache('GET:/api/notifications');
    invalidateCache('GET:/api/notifications/me');
    invalidateCache('GET:/api/notifications/me/unread-count');
    next();
  },
  deleteNotification
);

export default router;
