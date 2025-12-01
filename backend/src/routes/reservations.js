/**
 * Reservations Routes
 * Sistema completo de rutas para reservas públicas con holds temporales
 */

import express from 'express';
import {
  getAllReservations,
  getReservationById,
  getReservationByNumber,
  createReservation,
  updateReservation,
  deleteReservation,
  checkAvailability,
  createReservationHold,
  extendHold,
  confirmReservation,
  approveReservation,
  cancelReservation,
  rejectReservation,
  convertToEvento,
  getRequiringAction,
  getReservationStats,
  getStatusHistory,
  expireOldHolds
} from '../controllers/reservationsController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission, requireAdminOrManager } from '../middleware/authorization.js';
import { validate, field } from '../middleware/validation.js';
import { paginationMiddleware } from '../middleware/pagination.js';
import { shortCache, invalidateCache } from '../middleware/cache.js';
import { createRateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUTAS PÚBLICAS (SIN AUTENTICACIÓN)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * POST /api/reservations/check-availability
 * Verificar disponibilidad en tiempo real (PÚBLICO)
 */
router.post('/check-availability',
  createRateLimit,
  validate([
    field('agency_id').required().numeric().positive(),
    field('event_date').required().date(),
    field('event_start_time').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    field('event_end_time').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    field('event_duration_hours').optional().numeric().positive().max(24),
    field('dj_id').optional().numeric().positive()
  ]),
  checkAvailability
);

/**
 * POST /api/reservations/hold
 * Crear reserva temporal - hold de 30 minutos (PÚBLICO)
 */
router.post('/hold',
  createRateLimit,
  validate([
    field('agency_id').required().numeric().positive(),
    field('event_type').required().minLength(3).maxLength(100),
    field('event_date').required().date(),
    field('event_start_time').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    field('event_end_time').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    field('event_duration_hours').optional().numeric().positive().max(24),
    field('event_location').optional().maxLength(255),
    field('event_description').optional().maxLength(2000),
    field('estimated_guests').optional().numeric().positive(),
    field('client_name').required().minLength(2).maxLength(255),
    field('client_email').required().email(),
    field('client_phone').required().minLength(5).maxLength(50),
    field('client_company').optional().maxLength(255),
    field('services_requested').optional().custom((value) => {
      if (value && !Array.isArray(value)) {
        throw new Error('services_requested debe ser un array');
      }
      return true;
    }),
    field('budget_range').optional().maxLength(50),
    field('hold_duration_minutes').optional().numeric().min(15).max(120),
    field('dj_id').optional().numeric().positive()
  ]),
  (req, res, next) => {
    invalidateCache('GET:/api/reservations');
    next();
  },
  createReservationHold
);

/**
 * POST /api/reservations
 * Crear nueva reserva sin hold (PÚBLICO)
 */
router.post('/',
  createRateLimit,
  validate([
    field('agency_id').required().numeric().positive(),
    field('event_type').required().minLength(3).maxLength(100),
    field('event_date').required().date(),
    field('event_start_time').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    field('event_end_time').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    field('event_duration_hours').optional().numeric().positive().max(24),
    field('event_location').optional().maxLength(255),
    field('event_description').optional().maxLength(2000),
    field('estimated_guests').optional().numeric().positive(),
    field('client_name').required().minLength(2).maxLength(255),
    field('client_email').required().email(),
    field('client_phone').required().minLength(5).maxLength(50),
    field('client_company').optional().maxLength(255),
    field('services_requested').optional().custom((value) => {
      if (value && !Array.isArray(value)) {
        throw new Error('services_requested debe ser un array');
      }
      return true;
    }),
    field('budget_range').optional().maxLength(50),
    field('estimated_price').optional().numeric().min(0),
    field('dj_id').optional().numeric().positive(),
    field('cliente_id').optional().numeric().positive()
  ]),
  (req, res, next) => {
    invalidateCache('GET:/api/reservations');
    next();
  },
  createReservation
);

/**
 * GET /api/reservations/number/:reservationNumber
 * Obtener reserva por número (PÚBLICO para tracking)
 */
router.get('/number/:reservationNumber',
  createRateLimit,
  getReservationByNumber
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MIDDLEWARE DE AUTENTICACIÓN PARA RUTAS ADMIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.use(authenticate);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUTAS DE LECTURA (ADMIN)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/reservations
 * Obtener todas las reservas con filtros y paginación
 */
router.get('/',
  requirePermission('bookings', 'read'),
  paginationMiddleware,
  shortCache,
  getAllReservations
);

/**
 * GET /api/reservations/requiring-action
 * Obtener reservas que requieren acción (pending o holds próximos a expirar)
 */
router.get('/requiring-action',
  requirePermission('bookings', 'read'),
  shortCache,
  getRequiringAction
);

/**
 * GET /api/reservations/stats/:agency_id
 * Obtener estadísticas de reservas por agencia
 */
router.get('/stats/:agency_id',
  requirePermission('bookings', 'read'),
  shortCache,
  getReservationStats
);

/**
 * GET /api/reservations/:id
 * Obtener reserva por ID
 */
router.get('/:id',
  requirePermission('bookings', 'read'),
  getReservationById
);

/**
 * GET /api/reservations/:id/history
 * Obtener historial de cambios de estado
 */
router.get('/:id/history',
  requirePermission('bookings', 'read'),
  getStatusHistory
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUTAS DE ACTUALIZACIÓN (ADMIN)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * PUT /api/reservations/:id
 * Actualizar reserva
 */
router.put('/:id',
  requirePermission('bookings', 'update'),
  validate([
    field('dj_id').optional().numeric().positive(),
    field('cliente_id').optional().numeric().positive(),
    field('evento_id').optional().numeric().positive(),
    field('quotation_id').optional().numeric().positive(),
    field('event_type').optional().minLength(3).maxLength(100),
    field('event_date').optional().date(),
    field('event_start_time').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    field('event_end_time').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
    field('event_duration_hours').optional().numeric().positive().max(24),
    field('event_location').optional().maxLength(255),
    field('event_description').optional().maxLength(2000),
    field('estimated_guests').optional().numeric().positive(),
    field('client_name').optional().minLength(2).maxLength(255),
    field('client_email').optional().email(),
    field('client_phone').optional().minLength(5).maxLength(50),
    field('client_company').optional().maxLength(255),
    field('services_requested').optional().custom((value) => {
      if (value && !Array.isArray(value)) {
        throw new Error('services_requested debe ser un array');
      }
      return true;
    }),
    field('budget_range').optional().maxLength(50),
    field('estimated_price').optional().numeric().min(0),
    field('admin_notes').optional().maxLength(2000),
    field('internal_notes').optional().maxLength(2000)
  ]),
  (req, res, next) => {
    invalidateCache('GET:/api/reservations');
    next();
  },
  updateReservation
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WORKFLOW DE ESTADOS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * POST /api/reservations/:id/extend-hold
 * Extender duración de un hold
 */
router.post('/:id/extend-hold',
  requirePermission('bookings', 'update'),
  validate([
    field('additional_minutes').optional().numeric().min(5).max(120)
  ]),
  (req, res, next) => {
    invalidateCache('GET:/api/reservations');
    next();
  },
  extendHold
);

/**
 * POST /api/reservations/:id/confirm
 * Confirmar reserva (pending/hold -> confirmed)
 */
router.post('/:id/confirm',
  requirePermission('bookings', 'update'),
  (req, res, next) => {
    invalidateCache('GET:/api/reservations');
    next();
  },
  confirmReservation
);

/**
 * POST /api/reservations/:id/approve
 * Aprobar reserva (confirmed -> approved)
 */
router.post('/:id/approve',
  requireAdminOrManager,
  (req, res, next) => {
    invalidateCache('GET:/api/reservations');
    next();
  },
  approveReservation
);

/**
 * POST /api/reservations/:id/cancel
 * Cancelar reserva
 */
router.post('/:id/cancel',
  requirePermission('bookings', 'update'),
  validate([
    field('cancellation_reason').optional().maxLength(1000)
  ]),
  (req, res, next) => {
    invalidateCache('GET:/api/reservations');
    next();
  },
  cancelReservation
);

/**
 * POST /api/reservations/:id/reject
 * Rechazar reserva
 */
router.post('/:id/reject',
  requirePermission('bookings', 'update'),
  validate([
    field('rejection_reason').required().minLength(5).maxLength(1000)
  ]),
  (req, res, next) => {
    invalidateCache('GET:/api/reservations');
    next();
  },
  rejectReservation
);

/**
 * POST /api/reservations/:id/convert-to-evento
 * Convertir reserva a evento
 */
router.post('/:id/convert-to-evento',
  requirePermission('eventos', 'create'),
  validate([
    field('evento_id').required().numeric().positive()
  ]),
  (req, res, next) => {
    invalidateCache('GET:/api/reservations');
    invalidateCache('GET:/api/eventos');
    next();
  },
  convertToEvento
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUTAS ADMINISTRATIVAS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * POST /api/reservations/expire-old-holds
 * Expirar holds antiguos (cron job)
 */
router.post('/expire-old-holds',
  requireAdminOrManager,
  (req, res, next) => {
    invalidateCache('GET:/api/reservations');
    next();
  },
  expireOldHolds
);

/**
 * DELETE /api/reservations/:id
 * Eliminar reserva (soft delete -> cancel)
 */
router.delete('/:id',
  requireAdminOrManager,
  (req, res, next) => {
    invalidateCache('GET:/api/reservations');
    next();
  },
  deleteReservation
);

export default router;
