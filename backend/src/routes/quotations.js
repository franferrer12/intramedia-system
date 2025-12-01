/**
 * Quotations Routes
 * Sistema completo de rutas para cotizaciones
 */

import express from 'express';
import {
  getAllQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  updateQuotationStatus,
  sendQuotation,
  acceptQuotation,
  rejectQuotation,
  convertToEvento,
  duplicateQuotation,
  getQuotationHistory,
  getQuotationStats,
  expireOldQuotations,
  createFromTemplate,
  getExpiringSoon,
  generateQuotationPDF
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUTAS DE LECTURA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/quotations
 * Obtener todas las cotizaciones con filtros y paginación
 */
router.get('/',
  requirePermission('financial', 'read'),
  paginationMiddleware,
  shortCache,
  getAllQuotations
);

/**
 * GET /api/quotations/expiring-soon
 * Obtener cotizaciones próximas a expirar
 */
router.get('/expiring-soon',
  requirePermission('financial', 'read'),
  shortCache,
  getExpiringSoon
);

/**
 * GET /api/quotations/:id
 * Obtener una cotización por ID con items
 */
router.get('/:id',
  requirePermission('financial', 'read'),
  getQuotationById
);

/**
 * GET /api/quotations/:id/history
 * Obtener historial de cambios de una cotización
 */
router.get('/:id/history',
  requirePermission('financial', 'read'),
  getQuotationHistory
);

/**
 * GET /api/quotations/agencies/:agency_id/stats
 * Obtener estadísticas de cotizaciones por agencia
 */
router.get('/agencies/:agency_id/stats',
  requirePermission('financial', 'read'),
  shortCache,
  getQuotationStats
);

/**
 * GET /api/quotations/:id/pdf
 * Generar y descargar PDF de cotización
 */
router.get('/:id/pdf',
  requirePermission('financial', 'read'),
  generateQuotationPDF
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUTAS DE CREACIÓN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * POST /api/quotations
 * Crear nueva cotización
 */
router.post('/',
  requirePermission('financial', 'update'),
  createRateLimit,
  validate([
    field('agency_id').required().numeric().positive(),
    field('cliente_id').optional().numeric().positive(),
    field('dj_id').optional().numeric().positive(),
    field('title').required().minLength(3).maxLength(255),
    field('description').optional().maxLength(1000),
    field('event_date').optional().date(),
    field('event_location').optional().maxLength(255),
    field('event_duration_hours').optional().numeric().positive(),
    field('event_type').optional().maxLength(100),
    field('status').optional().isIn(['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'converted']),
    field('discount_type').optional().isIn(['none', 'percentage', 'fixed']),
    field('discount_value').optional().numeric().min(0),
    field('tax_percentage').optional().numeric().min(0).max(100),
    field('valid_until').optional().date(),
    field('contact_name').optional().maxLength(255),
    field('contact_email').optional().email(),
    field('contact_phone').optional().maxLength(50),
    field('notes').optional().maxLength(2000),
    field('terms_and_conditions').optional().maxLength(5000),
    field('payment_terms').optional().maxLength(2000),
    field('items').optional().custom((value) => {
      if (!Array.isArray(value)) {
        throw new Error('items debe ser un array');
      }
      for (const item of value) {
        if (!item.name || typeof item.name !== 'string') {
          throw new Error('Cada item debe tener un nombre');
        }
        if (!item.quantity || item.quantity <= 0) {
          throw new Error('Cada item debe tener cantidad mayor a 0');
        }
        if (item.unit_price === undefined || item.unit_price < 0) {
          throw new Error('Cada item debe tener unit_price válido');
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
 * POST /api/quotations/templates/:template_id
 * Crear cotización desde template
 */
router.post('/templates/:template_id',
  requirePermission('financial', 'update'),
  createRateLimit,
  validate([
    field('agency_id').required().numeric().positive(),
    field('cliente_id').optional().numeric().positive(),
    field('dj_id').optional().numeric().positive(),
    field('title').required().minLength(3).maxLength(255),
    field('event_date').optional().date(),
    field('valid_until').optional().date()
  ]),
  (req, res, next) => {
    invalidateCache('GET:/api/quotations');
    next();
  },
  createFromTemplate
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUTAS DE ACTUALIZACIÓN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * PUT /api/quotations/:id
 * Actualizar cotización completa
 */
router.put('/:id',
  requirePermission('financial', 'update'),
  validate([
    field('title').optional().minLength(3).maxLength(255),
    field('description').optional().maxLength(1000),
    field('event_date').optional().date(),
    field('event_location').optional().maxLength(255),
    field('event_duration_hours').optional().numeric().positive(),
    field('event_type').optional().maxLength(100),
    field('discount_type').optional().isIn(['none', 'percentage', 'fixed']),
    field('discount_value').optional().numeric().min(0),
    field('tax_percentage').optional().numeric().min(0).max(100),
    field('valid_until').optional().date(),
    field('contact_name').optional().maxLength(255),
    field('contact_email').optional().email(),
    field('contact_phone').optional().maxLength(50),
    field('notes').optional().maxLength(2000),
    field('terms_and_conditions').optional().maxLength(5000),
    field('payment_terms').optional().maxLength(2000),
    field('items').optional().custom((value) => {
      if (!Array.isArray(value)) {
        throw new Error('items debe ser un array');
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
 * PATCH /api/quotations/:id/status
 * Cambiar estado de cotización
 */
router.patch('/:id/status',
  requirePermission('financial', 'update'),
  validate([
    field('status').required().isIn(['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'converted']),
    field('rejection_reason').optional().maxLength(1000),
    field('evento_id').optional().numeric().positive()
  ]),
  (req, res, next) => {
    invalidateCache('GET:/api/quotations');
    next();
  },
  updateQuotationStatus
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ACCIONES ESPECÍFICAS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * POST /api/quotations/:id/send
 * Enviar cotización por email
 */
router.post('/:id/send',
  requirePermission('financial', 'update'),
  (req, res, next) => {
    invalidateCache('GET:/api/quotations');
    next();
  },
  sendQuotation
);

/**
 * POST /api/quotations/:id/accept
 * Marcar cotización como aceptada
 */
router.post('/:id/accept',
  requirePermission('financial', 'update'),
  (req, res, next) => {
    invalidateCache('GET:/api/quotations');
    next();
  },
  acceptQuotation
);

/**
 * POST /api/quotations/:id/reject
 * Rechazar cotización
 */
router.post('/:id/reject',
  requirePermission('financial', 'update'),
  validate([
    field('rejection_reason').optional().maxLength(1000)
  ]),
  (req, res, next) => {
    invalidateCache('GET:/api/quotations');
    next();
  },
  rejectQuotation
);

/**
 * POST /api/quotations/:id/convert-to-evento
 * Convertir cotización aceptada a evento
 */
router.post('/:id/convert-to-evento',
  requirePermission('eventos', 'create'),
  validate([
    field('evento_id').required().numeric().positive()
  ]),
  (req, res, next) => {
    invalidateCache('GET:/api/quotations');
    invalidateCache('GET:/api/eventos');
    next();
  },
  convertToEvento
);

/**
 * POST /api/quotations/:id/duplicate
 * Duplicar cotización
 */
router.post('/:id/duplicate',
  requirePermission('financial', 'update'),
  createRateLimit,
  (req, res, next) => {
    invalidateCache('GET:/api/quotations');
    next();
  },
  duplicateQuotation
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUTAS ADMINISTRATIVAS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * POST /api/quotations/expire-old
 * Expirar cotizaciones antiguas (cron job)
 */
router.post('/expire-old',
  requireAdminOrManager,
  (req, res, next) => {
    invalidateCache('GET:/api/quotations');
    next();
  },
  expireOldQuotations
);

/**
 * DELETE /api/quotations/:id
 * Eliminar cotización
 */
router.delete('/:id',
  requireAdminOrManager,
  (req, res, next) => {
    invalidateCache('GET:/api/quotations');
    next();
  },
  deleteQuotation
);

export default router;
