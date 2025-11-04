import express from 'express';
import {
  getAll,
  getByPeriod,
  create,
  update,
  calculateBudget,
  redistribute,
  closePeriod,
  getBudgetVsReal
} from '../controllers/monthlyExpensesController.js';
import { shortCache, longCache } from '../middleware/cache.js';

const router = express.Router();

// GET /api/monthly-expenses/budget-vs-real - Comparativa presupuesto vs real
// IMPORTANTE: Esta ruta debe ir antes de /:year/:month para evitar conflictos
router.get('/budget-vs-real', longCache, getBudgetVsReal);

// GET /api/monthly-expenses/:year/:month - Obtener registro de un mes específico
router.get('/:year/:month', shortCache, getByPeriod);

// GET /api/monthly-expenses - Obtener todos los registros mensuales
router.get('/', shortCache, getAll);

// POST /api/monthly-expenses - Crear registro mensual
router.post('/', create);

// PUT /api/monthly-expenses/:year/:month - Actualizar gastos reales
router.put('/:year/:month', update);

// POST /api/monthly-expenses/:year/:month/calculate-budget - Calcular presupuesto del mes
router.post('/:year/:month/calculate-budget', calculateBudget);

// POST /api/monthly-expenses/:year/:month/redistribute - Redistribuir excedente
router.post('/:year/:month/redistribute', redistribute);

// POST /api/monthly-expenses/:year/:month/close - Cerrar mes
router.post('/:year/:month/close', closePeriod);

export default router;
