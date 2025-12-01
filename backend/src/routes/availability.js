/**
 * Availability Routes
 * Rutas para gestión de disponibilidad de DJs
 */

import express from 'express';
import {
  getAllAvailabilities,
  getAvailabilityById,
  upsertAvailability,
  updateAvailability,
  deleteAvailability,
  checkAvailability,
  detectConflicts,
  findAvailableDJs,
  getCalendar,
  getByDateRange,
  getAgencyAvailability,
  markUnavailable,
  markAvailable,
  reserveForEvent,
  blockDateRange,
  getStats,
  cleanupOld
} from '../controllers/availabilityController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission, requireAdminOrManager } from '../middleware/authorization.js';
import { validate, field } from '../middleware/validation.js';
import { shortCache, invalidateCache } from '../middleware/cache.js';
import { createRateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

// Middleware de autenticación en todas las rutas
router.use(authenticate);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUTAS DE LECTURA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/availability
 * Obtener todas las disponibilidades con filtros
 */
router.get('/',
  requirePermission('availability', 'read'),
  shortCache,
  getAllAvailabilities
);

/**
 * GET /api/availability/check
 * Verificar disponibilidad de DJ
 */
router.get('/check',
  requirePermission('availability', 'read'),
  validate([
    field('dj_id').required().numeric().positive(),
    field('fecha').required().date(),
    field('hora_inicio').optional(),
    field('hora_fin').optional()
  ]),
  checkAvailability
);

/**
 * GET /api/availability/conflicts
 * Detectar conflictos avanzados
 */
router.get('/conflicts',
  requirePermission('availability', 'read'),
  validate([
    field('dj_id').required().numeric().positive(),
    field('fecha').required().date(),
    field('hora_inicio').optional(),
    field('hora_fin').optional(),
    field('exclude_id').optional().numeric().positive()
  ]),
  detectConflicts
);

/**
 * GET /api/availability/available-djs
 * Buscar DJs disponibles en fecha/hora específica
 */
router.get('/available-djs',
  requirePermission('availability', 'read'),
  validate([
    field('fecha').required().date(),
    field('hora_inicio').optional(),
    field('hora_fin').optional(),
    field('agency_id').optional().numeric().positive()
  ]),
  shortCache,
  findAvailableDJs
);

/**
 * GET /api/availability/agency
 * Obtener disponibilidad de agencia por mes
 */
router.get('/agency',
  requirePermission('availability', 'read'),
  validate([
    field('year').required().numeric().positive(),
    field('month').required().numeric().min(1).max(12)
  ]),
  shortCache,
  getAgencyAvailability
);

/**
 * GET /api/availability/dj/:dj_id/calendar
 * Obtener calendario mensual de DJ
 */
router.get('/dj/:dj_id/calendar',
  requirePermission('availability', 'read'),
  validate([
    field('year').required().numeric().positive(),
    field('month').required().numeric().min(1).max(12)
  ]),
  shortCache,
  getCalendar
);

/**
 * GET /api/availability/dj/:dj_id/range
 * Obtener disponibilidad por rango de fechas
 */
router.get('/dj/:dj_id/range',
  requirePermission('availability', 'read'),
  validate([
    field('fecha_inicio').required().date(),
    field('fecha_fin').required().date()
  ]),
  getByDateRange
);

/**
 * GET /api/availability/dj/:dj_id/stats
 * Obtener estadísticas de disponibilidad
 */
router.get('/dj/:dj_id/stats',
  requirePermission('availability', 'read'),
  validate([
    field('year').required().numeric().positive(),
    field('month').required().numeric().min(1).max(12)
  ]),
  shortCache,
  getStats
);

/**
 * GET /api/availability/:id
 * Obtener disponibilidad por ID
 */
router.get('/:id',
  requirePermission('availability', 'read'),
  getAvailabilityById
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUTAS DE CREACIÓN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * POST /api/availability
 * Crear/Actualizar disponibilidad
 */
router.post('/',
  requirePermission('availability', 'create'),
  createRateLimit,
  validate([
    field('dj_id').required().numeric().positive(),
    field('fecha').required().date(),
    field('hora_inicio').optional(),
    field('hora_fin').optional(),
    field('todo_el_dia').optional().boolean(),
    field('estado').optional().oneOf(['disponible', 'reservado', 'no_disponible', 'tentativo']),
    field('evento_id').optional().numeric().positive(),
    field('motivo').optional().maxLength(100),
    field('notas').optional().maxLength(500),
    field('color').optional().matches(/^#[0-9A-Fa-f]{6}$/)
  ]),
  (req, res, next) => {
    invalidateCache('GET:/api/availability');
    next();
  },
  upsertAvailability
);

/**
 * POST /api/availability/mark-unavailable
 * Marcar fecha como no disponible
 */
router.post('/mark-unavailable',
  requirePermission('availability', 'create'),
  createRateLimit,
  validate([
    field('dj_id').required().numeric().positive(),
    field('fecha').required().date(),
    field('motivo').optional().maxLength(100),
    field('notas').optional().maxLength(500)
  ]),
  (req, res, next) => {
    invalidateCache('GET:/api/availability');
    next();
  },
  markUnavailable
);

/**
 * POST /api/availability/mark-available
 * Marcar fecha como disponible
 */
router.post('/mark-available',
  requirePermission('availability', 'create'),
  createRateLimit,
  validate([
    field('dj_id').required().numeric().positive(),
    field('fecha').required().date()
  ]),
  (req, res, next) => {
    invalidateCache('GET:/api/availability');
    next();
  },
  markAvailable
);

/**
 * POST /api/availability/reserve
 * Reservar fecha para evento
 */
router.post('/reserve',
  requirePermission('availability', 'create'),
  createRateLimit,
  validate([
    field('dj_id').required().numeric().positive(),
    field('fecha').required().date(),
    field('evento_id').required().numeric().positive(),
    field('hora_inicio').optional(),
    field('hora_fin').optional()
  ]),
  (req, res, next) => {
    invalidateCache('GET:/api/availability');
    next();
  },
  reserveForEvent
);

/**
 * POST /api/availability/block-range
 * Bloquear rango de fechas
 */
router.post('/block-range',
  requirePermission('availability', 'create'),
  createRateLimit,
  validate([
    field('dj_id').required().numeric().positive(),
    field('fecha_inicio').required().date(),
    field('fecha_fin').required().date(),
    field('motivo').optional().maxLength(100),
    field('notas').optional().maxLength(500)
  ]),
  (req, res, next) => {
    invalidateCache('GET:/api/availability');
    next();
  },
  blockDateRange
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUTAS DE ACTUALIZACIÓN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * PUT /api/availability/:id
 * Actualizar disponibilidad
 */
router.put('/:id',
  requirePermission('availability', 'update'),
  validate([
    field('estado').optional().oneOf(['disponible', 'reservado', 'no_disponible', 'tentativo']),
    field('evento_id').optional().numeric().positive(),
    field('motivo').optional().maxLength(100),
    field('notas').optional().maxLength(500),
    field('color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
    field('hora_inicio').optional(),
    field('hora_fin').optional()
  ]),
  (req, res, next) => {
    invalidateCache('GET:/api/availability');
    next();
  },
  updateAvailability
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUTAS DE ELIMINACIÓN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * DELETE /api/availability/:id
 * Eliminar disponibilidad
 */
router.delete('/:id',
  requirePermission('availability', 'delete'),
  (req, res, next) => {
    invalidateCache('GET:/api/availability');
    next();
  },
  deleteAvailability
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUTAS ADMINISTRATIVAS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * POST /api/availability/cleanup
 * Limpiar registros antiguos (solo admin/manager)
 */
router.post('/cleanup',
  requireAdminOrManager,
  cleanupOld
);

export default router;
