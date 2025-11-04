import express from 'express';
import {
  getConfig,
  updateConfig,
  recalculateEvents
} from '../controllers/profitDistributionController.js';
import { longCache } from '../middleware/cache.js';

const router = express.Router();

// GET /api/profit-distribution/config - Obtener configuración actual
router.get('/config', longCache, getConfig);

// PUT /api/profit-distribution/config - Actualizar configuración
router.put('/config', updateConfig);

// POST /api/profit-distribution/recalculate - Recalcular todos los eventos
router.post('/recalculate', recalculateEvents);

export default router;
