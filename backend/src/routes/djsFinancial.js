import express from 'express';
import {
  getFinancialStats,
  getFinancialStatsById,
  getTopByRentabilidad,
  getPagosPendientes,
  getResumenPagosPendientes,
  getRendimientoMensual,
  getComparativaRendimiento,
  marcarEventoPagado,
  marcarEventosPagados
} from '../controllers/djsFinancialController.js';
import { shortCache, longCache } from '../middleware/cache.js';

const router = express.Router();

// IMPORTANTE: Rutas específicas PRIMERO, luego las dinámicas (/:id)
router.get('/', longCache, getFinancialStats); // Ruta raíz - lista todos
router.get('/financial-stats', longCache, getFinancialStats);

// Top DJs
router.get('/top-rentabilidad', longCache, getTopByRentabilidad);

// Pagos
router.get('/pagos-pendientes/resumen', shortCache, getResumenPagosPendientes);
router.get('/pagos-pendientes', shortCache, getPagosPendientes);

// Rendimiento
router.get('/rendimiento-mensual', longCache, getRendimientoMensual);
router.get('/comparativa-rendimiento', longCache, getComparativaRendimiento);

// PUT endpoints
router.put('/eventos/:eventoId/marcar-pagado', marcarEventoPagado);
router.put('/eventos/marcar-pagados', marcarEventosPagados);

// Rutas dinámicas al FINAL
router.get('/financial-stats/:id', shortCache, getFinancialStatsById);
router.get('/:id', shortCache, getFinancialStatsById); // Por ID directo - AL FINAL

export default router;
