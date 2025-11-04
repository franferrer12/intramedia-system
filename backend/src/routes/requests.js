import express from 'express';
import {
  getRequest,
  createRequest,
  updateRequest,
  getRequestStats
} from '../controllers/requestsController.js';
import { paginationMiddleware, formatPaginatedResponse, parseFilters } from '../middleware/pagination.js';
import { field, validate } from '../middleware/validation.js';
import { softDeleteController, restoreController } from '../middleware/softDelete.js';
import { shortCache, longCache } from '../middleware/cache.js';
import { createRateLimit } from '../middleware/rateLimit.js';
import { query } from '../config/database.js';

const router = express.Router();

// GET /api/requests/stats - Estadísticas de solicitudes
router.get('/stats', longCache, getRequestStats);

// GET /api/requests - Obtener todas las solicitudes (con paginación y filtros)
router.get('/', paginationMiddleware, shortCache, async (req, res) => {
  try {
    const { limit, offset, page } = req.pagination;
    const filters = parseFilters(req.query);

    // Build WHERE clause
    let whereConditions = ['r.deleted_at IS NULL'];
    const values = [];
    let paramIndex = 1;

    // Search by client name or event type
    if (filters.search) {
      whereConditions.push(`(r.nombre_cliente ILIKE $${paramIndex} OR r.tipo_evento ILIKE $${paramIndex})`);
      values.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Filter by status
    if (req.query.status) {
      whereConditions.push(`r.status = $${paramIndex}`);
      values.push(req.query.status);
      paramIndex++;
    }

    // Filter by priority
    if (req.query.prioridad) {
      whereConditions.push(`r.prioridad = $${paramIndex}`);
      values.push(req.query.prioridad);
      paramIndex++;
    }

    // Filter by DJ
    if (req.query.dj_id) {
      whereConditions.push(`r.dj_id = $${paramIndex}`);
      values.push(parseInt(req.query.dj_id));
      paramIndex++;
    }

    // Filter by date range
    if (filters.dateFrom) {
      whereConditions.push(`r.fecha_evento >= $${paramIndex}`);
      values.push(filters.dateFrom);
      paramIndex++;
    }

    if (filters.dateTo) {
      whereConditions.push(`r.fecha_evento <= $${paramIndex}`);
      values.push(filters.dateTo);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countSql = `
      SELECT COUNT(*)
      FROM requests r
      WHERE ${whereClause}
    `;
    const countResult = await query(countSql, values);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated data
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'DESC';
    const dataSql = `
      SELECT
        r.*,
        d.nombre as dj_nombre
      FROM requests r
      LEFT JOIN djs d ON r.dj_id = d.id
      WHERE ${whereClause}
      ORDER BY r.${sortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    values.push(limit, offset);

    const result = await query(dataSql, values);

    res.json(formatPaginatedResponse(result.rows, total, req.pagination));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/requests/:id - Obtener una solicitud específica
router.get('/:id', shortCache, getRequest);

// POST /api/requests - Crear nueva solicitud
router.post('/',
  createRateLimit,
  validate([
    field('nombre_cliente').required().minLength(2).maxLength(100),
    field('email').optional().email(),
    field('telefono').optional().phone(),
    field('tipo_evento').required().maxLength(100),
    field('fecha_evento').required().date(),
    field('ubicacion').optional().maxLength(200),
    field('num_invitados').optional().numeric().positive(),
    field('presupuesto').optional().numeric().min(0),
    field('status').optional().isIn(['pending', 'reviewing', 'approved', 'rejected', 'assigned']),
    field('prioridad').optional().isIn(['baja', 'media', 'alta', 'urgente']),
    field('observaciones').optional().maxLength(1000)
  ]),
  createRequest
);

// PUT /api/requests/:id - Actualizar solicitud
router.put('/:id',
  validate([
    field('nombre_cliente').optional().minLength(2).maxLength(100),
    field('email').optional().email(),
    field('telefono').optional().phone(),
    field('tipo_evento').optional().maxLength(100),
    field('fecha_evento').optional().date(),
    field('ubicacion').optional().maxLength(200),
    field('num_invitados').optional().numeric().positive(),
    field('presupuesto').optional().numeric().min(0),
    field('status').optional().isIn(['pending', 'reviewing', 'approved', 'rejected', 'assigned']),
    field('prioridad').optional().isIn(['baja', 'media', 'alta', 'urgente']),
    field('dj_id').optional().numeric(),
    field('observaciones').optional().maxLength(1000)
  ]),
  updateRequest
);

// DELETE /api/requests/:id - Soft delete de solicitud
router.delete('/:id', softDeleteController('requests', 'Request'));

// POST /api/requests/:id/restore - Restaurar solicitud eliminada
router.post('/:id/restore', restoreController('requests', 'Request'));

export default router;
