import express from 'express';
import DJ from '../models/DJ.js';
import { paginationMiddleware, formatPaginatedResponse, parseFilters } from '../middleware/pagination.js';
import { field, validate } from '../middleware/validation.js';
import { softDeleteController, restoreController } from '../middleware/softDelete.js';
import { query } from '../config/database.js';
import { shortCache, longCache } from '../middleware/cache.js';
import { createRateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

// GET /api/djs - Obtener todos los DJs (con paginación y filtros)
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
    const countSql = `SELECT COUNT(*) FROM djs WHERE ${whereClause}`;
    const countResult = await query(countSql, values);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated data
    const sortBy = filters.sortBy || 'nombre';
    const sortOrder = filters.sortOrder || 'ASC';
    const dataSql = `
      SELECT * FROM djs
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

// GET /api/djs/:id/stats/:mes - Estadísticas de un DJ por mes
router.get('/:id/stats/:mes', longCache, async (req, res) => {
  try {
    const stats = await DJ.getStatsByMonth(req.params.id, req.params.mes);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/djs/:id/eventos - Obtener eventos de un DJ
router.get('/:id/eventos', shortCache, async (req, res) => {
  try {
    const { mes } = req.query;
    const eventos = await DJ.getEventos(req.params.id, { mes });
    res.json({ success: true, data: eventos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/djs/:id - Obtener un DJ específico
router.get('/:id', shortCache, async (req, res) => {
  try {
    const dj = await DJ.findById(req.params.id);
    if (!dj) {
      return res.status(404).json({ success: false, message: 'DJ no encontrado' });
    }
    res.json({ success: true, data: dj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/djs - Crear nuevo DJ
router.post('/',
  createRateLimit,
  validate([
    field('nombre').required().minLength(3).maxLength(100),
    field('email').required().email(),
    field('telefono').optional().phone(),
    field('password_hash').optional().minLength(6),
    field('observaciones').optional().maxLength(500)
  ]),
  async (req, res) => {
    try {
      const dj = await DJ.create(req.body);
      res.status(201).json({ success: true, data: dj });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// PUT /api/djs/:id - Actualizar DJ
router.put('/:id',
  validate([
    field('nombre').optional().minLength(3).maxLength(100),
    field('email').optional().email(),
    field('telefono').optional().phone(),
    field('password_hash').optional().minLength(6),
    field('observaciones').optional().maxLength(500),
    field('activo').optional()
  ]),
  async (req, res) => {
    try {
      const dj = await DJ.update(req.params.id, req.body);
      if (!dj) {
        return res.status(404).json({ success: false, message: 'DJ no encontrado' });
      }
      res.json({ success: true, data: dj });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// DELETE /api/djs/:id - Soft delete de DJ
router.delete('/:id', softDeleteController('djs', 'DJ'));

// POST /api/djs/:id/restore - Restaurar DJ eliminado
router.post('/:id/restore', restoreController('djs', 'DJ'));

export default router;
