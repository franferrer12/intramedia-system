import express from 'express';
import {
  createInteraction,
  getInteractionsByLead,
  markAsCompleted,
  getPendingReminders,
  getInteractionStats,
  deleteInteraction
} from '../controllers/interactionsController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { paginationMiddleware } from '../middleware/pagination.js';
import { field, validate } from '../middleware/validation.js';
import { softDeleteController, restoreController } from '../middleware/softDelete.js';
import { shortCache, longCache } from '../middleware/cache.js';
import { createRateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

/**
 * Rutas para gestión de interacciones con leads
 * Todas las rutas requieren autenticación
 */

// Obtener estadísticas de interacciones por lead
router.get('/stats/:leadId', authenticate, longCache, getInteractionStats);

// Obtener recordatorios pendientes (con paginación)
router.get('/reminders', authenticate, paginationMiddleware, shortCache, getPendingReminders);

// Obtener timeline de interacciones por lead (con paginación)
router.get('/lead/:leadId', authenticate, paginationMiddleware, shortCache, getInteractionsByLead);

// Crear nueva interacción
router.post('/', authenticate,
  createRateLimit,
  validate([
    field('lead_id').required().numeric(),
    field('tipo').required().isIn(['llamada', 'email', 'reunion', 'whatsapp', 'otro']),
    field('descripcion').required().minLength(5).maxLength(1000),
    field('resultado').optional().isIn(['exitoso', 'pendiente', 'sin_respuesta', 'rechazado']),
    field('next_followup_date').optional().date(),
    field('observaciones').optional().maxLength(500)
  ]),
  createInteraction
);

// Marcar interacción como completada
router.patch('/:id/complete', authenticate, markAsCompleted);

// Soft delete de interacción
router.delete('/:id', authenticate, softDeleteController('interactions', 'Interaction'));

// Restaurar interacción eliminada
router.post('/:id/restore', authenticate, restoreController('interactions', 'Interaction'));

export default router;
