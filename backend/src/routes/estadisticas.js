import express from 'express';
import {
  getDashboardFinanciero,
  getEstadisticasDJ,
  getRankingDJs,
  getAnalisisCrecimiento,
  getKPIsPrincipales
} from '../controllers/estadisticasController.js';
import { longCache } from '../middleware/cache.js';

const router = express.Router();

// GET /api/estadisticas/dashboard-financiero - Dashboard financiero general
router.get('/dashboard-financiero', longCache, getDashboardFinanciero);

// GET /api/estadisticas/dj/:id - Estadísticas detalladas por DJ
router.get('/dj/:id', longCache, getEstadisticasDJ);

// GET /api/estadisticas/ranking - Ranking de DJs
router.get('/ranking', longCache, getRankingDJs);

// GET /api/estadisticas/crecimiento - Análisis de crecimiento
router.get('/crecimiento', longCache, getAnalisisCrecimiento);

// GET /api/estadisticas/kpis - KPIs principales
router.get('/kpis', longCache, getKPIsPrincipales);

export default router;
