/**
 * Quotations Routes
 * Rutas para el sistema de cotizaciones
 */

import express from 'express';
import {
  getAllQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  changeQuotationState,
  convertToEvent,
  getQuotationsStats,
  markExpiredQuotations,
  deleteQuotation,
  restoreQuotation
} from '../controllers/quotationsController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission, requireAdminOrManager } from '../middleware/authorization.js';
import { validate, field } from '../middleware/validation.js';
import { paginationMiddleware } from '../middleware/pagination.js';
import { shortCache, invalidateCache } from '../middleware/cache.js';
import { createRateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

// Middleware de autenticación en todas las rutas
router.use(authenticate);

/**
 * GET /api/quotations
 * Obtener todas las cotizaciones con paginación
 */
router.get('/',
  requirePermission('financial', 'read'),
  paginationMiddleware,
  shortCache,
  getAllQuotations
);

/**
 * GET /api/quotations/stats
 * Obtener estadísticas de cotizaciones
 */
router.get('/stats',
  requirePermission('financial', 'read'),
  shortCache,
  getQuotationsStats
);

/**
 * GET /api/quotations/:id
 * Obtener una cotización por ID
 */
router.get('/:id',
  requirePermission('financial', 'read'),
  getQuotationById
);

/**
 * POST /api/quotations
 * Crear nueva cotización
 */
router.post('/',
  requirePermission('financial', 'update'),
  createRateLimit,
  validate([
    field('cliente_nombre').required().minLength(2).maxLength(100),
    field('cliente_email').optional().email(),
    field('cliente_telefono').optional().phone(),
    field('cliente_empresa').optional().maxLength(100),
    field('tipo_evento').required().maxLength(100),
    field('fecha_evento').required().date(),
    field('hora_inicio').optional(),
    field('hora_fin').optional(),
    field('ubicacion').optional().maxLength(500),
    field('num_invitados').optional().numeric().positive(),
    field('descuento_porcentaje').optional().numeric().min(0).max(100),
    field('iva_porcentaje').optional().numeric().min(0).max(100),
    field('fecha_vencimiento').required().date(),
    field('observaciones').optional().maxLength(1000),
    field('terminos_condiciones').optional().maxLength(2000),
    field('items').optional().custom((value) => {
      if (!Array.isArray(value)) {
        throw new Error('items debe ser un array');
      }
      for (const item of value) {
        if (!item.concepto || typeof item.concepto !== 'string') {
          throw new Error('Cada item debe tener un concepto');
        }
        if (!item.cantidad || item.cantidad <= 0) {
          throw new Error('Cada item debe tener cantidad mayor a 0');
        }
        if (item.precio_unitario === undefined || item.precio_unitario < 0) {
          throw new Error('Cada item debe tener precio_unitario válido');
        }
      }
      return true;
    })
  ]),
  (req, res, next) => {
    invalidateCache('GET:/api/quotations');
    next();
  },
  createQuotation
);

/**
 * PUT /api/quotations/:id
 * Actualizar cotización
 */
router.put('/:id',
  requirePermission('financial', 'update'),
  validate([
    field('cliente_nombre').optional().minLength(2).maxLength(100),
    field('cliente_email').optional().email(),
    field('cliente_telefono').optional().phone(),
    field('cliente_empresa').optional().maxLength(100),
    field('tipo_evento').optional().maxLength(100),
    field('fecha_evento').optional().date(),
    field('hora_inicio').optional(),
    field('hora_fin').optional(),
    field('ubicacion').optional().maxLength(500),
    field('num_invitados').optional().numeric().positive(),
    field('descuento_porcentaje').optional().numeric().min(0).max(100),
    field('iva_porcentaje').optional().numeric().min(0).max(100),
    field('fecha_vencimiento').optional().date(),
    field('observaciones').optional().maxLength(1000),
    field('terminos_condiciones').optional().maxLength(2000),
    field('items').optional().custom((value) => {
      if (!Array.isArray(value)) {
        throw new Error('items debe ser un array');
      }
      for (const item of value) {
        if (!item.concepto || typeof item.concepto !== 'string') {
          throw new Error('Cada item debe tener un concepto');
        }
        if (!item.cantidad || item.cantidad <= 0) {
          throw new Error('Cada item debe tener cantidad mayor a 0');
        }
        if (item.precio_unitario === undefined || item.precio_unitario < 0) {
          throw new Error('Cada item debe tener precio_unitario válido');
        }
      }
      return true;
    })
  ]),
  (req, res, next) => {
    invalidateCache('GET:/api/quotations');
    next();
  },
  updateQuotation
);

/**
 * POST /api/quotations/:id/state
 * Cambiar estado de cotización
 */
router.post('/:id/state',
  requirePermission('financial', 'update'),
  validate([
    field('estado').required().isIn(['borrador', 'enviada', 'aceptada', 'rechazada']),
    field('motivo_rechazo').optional().maxLength(500)
  ]),
  (req, res, next) => {
    invalidateCache('GET:/api/quotations');
    next();
  },
  changeQuotationState
);

/**
 * POST /api/quotations/:id/convert
 * Convertir cotización aceptada a evento
 */
router.post('/:id/convert',
  requirePermission('eventos', 'create'),
  (req, res, next) => {
    invalidateCache('GET:/api/quotations');
    invalidateCache('GET:/api/eventos');
    next();
  },
  convertToEvent
);

/**
 * POST /api/quotations/mark-expired
 * Marcar cotizaciones expiradas (admin/cron only)
 */
router.post('/mark-expired',
  requireAdminOrManager,
  (req, res, next) => {
    invalidateCache('GET:/api/quotations');
    next();
  },
  markExpiredQuotations
);

/**
 * DELETE /api/quotations/:id
 * Eliminar cotización (soft delete)
 */
router.delete('/:id',
  requireAdminOrManager,
  (req, res, next) => {
    invalidateCache('GET:/api/quotations');
    next();
  },
  deleteQuotation
);

/**
 * POST /api/quotations/:id/restore
 * Restaurar cotización eliminada
 */
router.post('/:id/restore',
  requireAdminOrManager,
  (req, res, next) => {
    invalidateCache('GET:/api/quotations');
    next();
  },
  restoreQuotation
);

export default router;
