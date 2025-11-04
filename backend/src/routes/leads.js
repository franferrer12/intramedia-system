import express from 'express';
import {
  getLeadsByEstado,
  getLeadById,
  createLead,
  updateLead,
  updateLeadEstado,
  addNotaToLead,
  convertLeadToCliente,
  markLeadAsPerdido,
  getLeadsStats,
  createLeadPublic
} from '../controllers/leadsController.js';
import { authenticate } from '../middleware/auth.js';
import { paginationMiddleware, formatPaginatedResponse, parseFilters } from '../middleware/pagination.js';
import { field, validate } from '../middleware/validation.js';
import { softDeleteController, restoreController } from '../middleware/softDelete.js';
import { shortCache, longCache } from '../middleware/cache.js';
import { strictRateLimit, createRateLimit } from '../middleware/rateLimit.js';
import { query } from '../config/database.js';

const router = express.Router();

// Rutas públicas (sin autenticación)
router.post('/public',
  strictRateLimit,
  validate([
    field('nombre').required().minLength(2).maxLength(100),
    field('email').optional().email(),
    field('telefono').optional().phone(),
    field('source').optional().maxLength(100),
    field('mensaje').optional().maxLength(1000)
  ]),
  createLeadPublic
);

// Rutas protegidas (requieren autenticación)
router.use(authenticate);

// Estadísticas
router.get('/stats', longCache, getLeadsStats);

// CRUD básico
router.get('/by-estado', shortCache, getLeadsByEstado);

// GET /api/leads - Obtener todos los leads (con paginación y filtros)
router.get('/', paginationMiddleware, shortCache, async (req, res) => {
  try {
    const { limit, offset, page } = req.pagination;
    const filters = parseFilters(req.query);

    // Build WHERE clause
    let whereConditions = ['deleted_at IS NULL'];
    const values = [];
    let paramIndex = 1;

    // Search by name, email or phone
    if (filters.search) {
      whereConditions.push(`(nombre ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR telefono ILIKE $${paramIndex})`);
      values.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Filter by status
    if (req.query.status) {
      whereConditions.push(`status = $${paramIndex}`);
      values.push(req.query.status);
      paramIndex++;
    }

    // Filter by priority
    if (req.query.prioridad) {
      whereConditions.push(`prioridad = $${paramIndex}`);
      values.push(req.query.prioridad);
      paramIndex++;
    }

    // Filter by source
    if (req.query.source) {
      whereConditions.push(`source = $${paramIndex}`);
      values.push(req.query.source);
      paramIndex++;
    }

    // Filter by converted
    if (req.query.convertido !== undefined) {
      whereConditions.push(`convertido = $${paramIndex}`);
      values.push(req.query.convertido === 'true');
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countSql = `SELECT COUNT(*) FROM leads WHERE ${whereClause}`;
    const countResult = await query(countSql, values);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated data
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'DESC';
    const dataSql = `
      SELECT * FROM leads
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

router.get('/:id', shortCache, getLeadById);
router.post('/',
  createRateLimit,
  validate([
    field('nombre').required().minLength(2).maxLength(100),
    field('email').optional().email(),
    field('telefono').optional().phone(),
    field('source').optional().maxLength(100),
    field('status').optional().isIn(['nuevo', 'contactado', 'calificado', 'negociacion', 'ganado', 'perdido']),
    field('prioridad').optional().isIn(['baja', 'media', 'alta']),
    field('observaciones').optional().maxLength(1000)
  ]),
  createLead
);
router.put('/:id',
  validate([
    field('nombre').optional().minLength(2).maxLength(100),
    field('email').optional().email(),
    field('telefono').optional().phone(),
    field('source').optional().maxLength(100),
    field('status').optional().isIn(['nuevo', 'contactado', 'calificado', 'negociacion', 'ganado', 'perdido']),
    field('prioridad').optional().isIn(['baja', 'media', 'alta']),
    field('observaciones').optional().maxLength(1000)
  ]),
  updateLead
);
router.delete('/:id', softDeleteController('leads', 'Lead'));

// Operaciones específicas
router.patch('/:id/estado',
  validate([
    field('status').required().isIn(['nuevo', 'contactado', 'calificado', 'negociacion', 'ganado', 'perdido'])
  ]),
  updateLeadEstado
);
router.post('/:id/nota',
  validate([
    field('nota').required().minLength(1).maxLength(1000)
  ]),
  addNotaToLead
);
router.post('/:id/convert-to-cliente', convertLeadToCliente);
router.post('/:id/mark-as-perdido',
  validate([
    field('motivo').optional().maxLength(500)
  ]),
  markLeadAsPerdido
);

// Restaurar lead eliminado
router.post('/:id/restore', restoreController('leads', 'Lead'));

export default router;
