import express from 'express';
import {
  getReporteIngresosSocios,
  getDashboardSocios,
  updateSocio
} from '../controllers/sociosController.js';
import { paginationMiddleware, formatPaginatedResponse, parseFilters } from '../middleware/pagination.js';
import { field, validate } from '../middleware/validation.js';
import { softDeleteController, restoreController } from '../middleware/softDelete.js';
import { shortCache, longCache } from '../middleware/cache.js';
import { query } from '../config/database.js';

const router = express.Router();

// GET /api/socios - Obtener todos los socios (con paginación)
router.get('/', paginationMiddleware, shortCache, async (req, res) => {
  try {
    const { limit, offset, page } = req.pagination;
    const filters = parseFilters(req.query);

    // Build WHERE clause
    let whereConditions = ['deleted_at IS NULL'];
    const values = [];
    let paramIndex = 1;

    // Search by name or email
    if (filters.search) {
      whereConditions.push(`(nombre ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
      values.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Filter by active status
    if (req.query.activo !== undefined) {
      whereConditions.push(`activo = $${paramIndex}`);
      values.push(req.query.activo === 'true');
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countSql = `SELECT COUNT(*) FROM partners WHERE ${whereClause}`;
    const countResult = await query(countSql, values);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated data
    const sortBy = filters.sortBy || 'nombre';
    const sortOrder = filters.sortOrder || 'ASC';
    const dataSql = `
      SELECT * FROM partners
      WHERE ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    values.push(limit, offset);

    const result = await query(dataSql, values);

    res.json(formatPaginatedResponse(result.rows, total, req.pagination));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/socios/dashboard - Dashboard financiero de socios
router.get('/dashboard', longCache, getDashboardSocios);

// GET /api/socios/reporte - Reporte de ingresos por socio
router.get('/reporte', longCache, getReporteIngresosSocios);

// PUT /api/socios/:id - Actualizar socio
router.put('/:id',
  validate([
    field('nombre').optional().minLength(2).maxLength(100),
    field('porcentaje_participacion').optional().numeric().min(0).max(100),
    field('activo').optional(),
    field('observaciones').optional().maxLength(500)
  ]),
  updateSocio
);

// DELETE /api/socios/:id - Soft delete de socio
router.delete('/:id', softDeleteController('socios', 'Socio'));

// POST /api/socios/:id/restore - Restaurar socio eliminado
router.post('/:id/restore', restoreController('socios', 'Socio'));

export default router;
