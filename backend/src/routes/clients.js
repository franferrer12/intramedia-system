import express from 'express';
import Cliente from '../models/Client.js';
import { paginationMiddleware, formatPaginatedResponse, parseFilters } from '../middleware/pagination.js';
import { field, validate } from '../middleware/validation.js';
import { softDeleteController, restoreController } from '../middleware/softDelete.js';
import { query } from '../config/database.js';
import { shortCache } from '../middleware/cache.js';
import { createRateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

// GET /api/clientes - Obtener todos los clientes (con paginación y filtros)
router.get('/', paginationMiddleware, shortCache, async (req, res) => {
  try {
    const { limit, offset, page } = req.pagination;
    const filters = parseFilters(req.query);

    // Build WHERE clause
    let whereConditions = ['deleted_at IS NULL'];
    const values = [];
    let paramIndex = 1;

    // Search by name, email, or phone
    if (filters.search) {
      whereConditions.push(`(nombre ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR telefono ILIKE $${paramIndex})`);
      values.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Filter by client type
    if (req.query.tipo_cliente) {
      whereConditions.push(`tipo_cliente = $${paramIndex}`);
      values.push(req.query.tipo_cliente);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countSql = `SELECT COUNT(*) FROM clients WHERE ${whereClause}`;
    const countResult = await query(countSql, values);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated data
    const sortBy = filters.sortBy || 'nombre';
    const sortOrder = filters.sortOrder || 'ASC';
    const dataSql = `
      SELECT * FROM clients
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

// GET /api/clientes/:id - Obtener un cliente específico
router.get('/:id', shortCache, async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }
    res.json({ success: true, data: cliente });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/clientes - Crear nuevo cliente
router.post('/',
  createRateLimit,
  validate([
    field('nombre').required().minLength(3).maxLength(100),
    field('email').optional().email(),
    field('telefono').optional().phone(),
    field('tipo_cliente').optional().isIn(['particular', 'empresa', 'promotora']),
    field('direccion').optional().maxLength(200),
    field('nif_cif').optional().maxLength(20),
    field('observaciones').optional().maxLength(500)
  ]),
  async (req, res) => {
    try {
      const cliente = await Cliente.create(req.body);
      res.status(201).json({ success: true, data: cliente });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// PUT /api/clientes/:id - Actualizar cliente
router.put('/:id',
  validate([
    field('nombre').optional().minLength(3).maxLength(100),
    field('email').optional().email(),
    field('telefono').optional().phone(),
    field('tipo_cliente').optional().isIn(['particular', 'empresa', 'promotora']),
    field('direccion').optional().maxLength(200),
    field('nif_cif').optional().maxLength(20),
    field('observaciones').optional().maxLength(500)
  ]),
  async (req, res) => {
    try {
      const cliente = await Cliente.update(req.params.id, req.body);
      if (!cliente) {
        return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
      }
      res.json({ success: true, data: cliente });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// DELETE /api/clientes/:id - Soft delete de cliente
router.delete('/:id', softDeleteController('clientes', 'Cliente'));

// POST /api/clientes/:id/restore - Restaurar cliente eliminado
router.post('/:id/restore', restoreController('clientes', 'Cliente'));

export default router;
