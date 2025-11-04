import express from 'express';
import {
  getEventos,
  getEvento,
  createEvento,
  updateEvento,
  deleteEvento,
  getStatsByMonth,
  getUpcomingEventos,
  getFinancialBreakdown,
  getMonthlyFinancialSummary,
  getPartnerSummary
} from '../controllers/eventosController.js';
import { paginationMiddleware } from '../middleware/pagination.js';
import { field, validate } from '../middleware/validation.js';
import { softDeleteController, restoreController } from '../middleware/softDelete.js';
import { shortCache, longCache } from '../middleware/cache.js';
import { createRateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

// GET /api/eventos - Obtener todos los eventos (con paginación y filtros)
router.get('/', paginationMiddleware, shortCache, getEventos);

// GET /api/eventos/upcoming - Eventos próximos
router.get('/upcoming', shortCache, getUpcomingEventos);

// GET /api/eventos/stats/:mes - Estadísticas por mes
router.get('/stats/:mes', longCache, getStatsByMonth);

// GET /api/eventos/financial-summary/monthly - Resumen financiero mensual
router.get('/financial-summary/monthly', longCache, getMonthlyFinancialSummary);

// GET /api/eventos/financial-summary/partners - Resumen por socio
router.get('/financial-summary/partners', longCache, getPartnerSummary);

// GET /api/eventos/:id/financial-breakdown - Desglose financiero de un evento
router.get('/:id/financial-breakdown', longCache, getFinancialBreakdown);

// GET /api/eventos/:id - Obtener un evento específico
router.get('/:id', getEvento);

// POST /api/eventos - Crear nuevo evento
router.post('/',
  createRateLimit,
  validate([
    field('evento').required().minLength(3).maxLength(200),
    field('dj_id').required().numeric(),
    field('cliente_id').optional().numeric(),
    field('fecha').required().date(),
    field('mes').required().minLength(3).maxLength(20),
    field('estado').optional().isIn(['confirmado', 'pendiente', 'cancelado', 'completado']),
    field('horas').optional().numeric().positive(),
    field('precio_cliente').optional().numeric().min(0),
    field('cobrado_cliente').optional(),
    field('pagado_dj').optional(),
    field('parte_dj').optional().numeric().min(0),
    field('observaciones').optional().maxLength(500)
  ]),
  createEvento
);

// PUT /api/eventos/:id - Actualizar evento
router.put('/:id',
  validate([
    field('evento').optional().minLength(3).maxLength(200),
    field('dj_id').optional().numeric(),
    field('cliente_id').optional().numeric(),
    field('fecha').optional().date(),
    field('mes').optional().minLength(3).maxLength(20),
    field('estado').optional().isIn(['confirmado', 'pendiente', 'cancelado', 'completado']),
    field('horas').optional().numeric().positive(),
    field('precio_cliente').optional().numeric().min(0),
    field('cobrado_cliente').optional(),
    field('pagado_dj').optional(),
    field('parte_dj').optional().numeric().min(0),
    field('observaciones').optional().maxLength(500)
  ]),
  updateEvento
);

// DELETE /api/eventos/:id - Soft delete de evento
router.delete('/:id', softDeleteController('eventos', 'Evento'));

// POST /api/eventos/:id/restore - Restaurar evento eliminado
router.post('/:id/restore', restoreController('eventos', 'Evento'));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🍎 Jobs-Style Quick Actions (1 clic)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import pool from '../config/database.js';

// POST /api/eventos/:id/paid - Marcar como pagado al DJ (1 clic)
router.post('/:id/paid', async (req, res) => {
  try {
    await pool.query(
      'UPDATE eventos SET pagado_dj = true, updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL',
      [req.params.id]
    );
    res.ok(); // Solo código 200, sin body (Jobs-style)
  } catch (error) {
    res.simpleError('Algo salió mal', 500);
  }
});

// POST /api/eventos/:id/cobrado - Marcar como cobrado al cliente (1 clic)
router.post('/:id/cobrado', async (req, res) => {
  try {
    await pool.query(
      'UPDATE eventos SET cobrado_cliente = true, updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL',
      [req.params.id]
    );
    res.ok();
  } catch (error) {
    res.simpleError('Algo salió mal', 500);
  }
});

// POST /api/eventos/:id/duplicate - Duplicar evento (1 clic)
router.post('/:id/duplicate', async (req, res) => {
  try {
    const result = await pool.query(
      `INSERT INTO eventos (
        evento, dj_id, cliente_id, fecha, mes,
        horas, cache_total, parte_dj, parte_agencia,
        cobrado_cliente, pagado_dj, created_at
      )
      SELECT
        evento || ' (Copia)', dj_id, cliente_id, fecha, mes,
        horas, cache_total, parte_dj, parte_agencia,
        false, false, NOW()
      FROM eventos
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.simpleError('No encontrado', 404);
    }

    res.created({ id: result.rows[0].id }); // HTTP 201 con ID (Jobs-style)
  } catch (error) {
    console.error('Duplicate error:', error);
    res.simpleError('Algo salió mal', 500);
  }
});

export default router;
