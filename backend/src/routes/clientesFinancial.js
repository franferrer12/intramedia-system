import express from 'express';
import {
  getFinancialStats,
  getFinancialStatsById,
  getCobrosPendientes,
  getResumenCobrosPendientes,
  marcarEventoCobrado,
  marcarEventosCobrados,
  getRendimientoMensual,
  getTopByRentabilidad,
  getComparativaRendimiento,
  getFidelidad
} from '../controllers/clientesFinancialController.js';
import { shortCache, longCache } from '../middleware/cache.js';

const router = express.Router();

// IMPORTANTE: Rutas específicas PRIMERO, luego las dinámicas (/:id)
router.get('/', longCache, getFinancialStats); // Ruta raíz - lista todos
router.get('/financial-stats', longCache, getFinancialStats);

// Cobros pendientes
router.get('/cobros-pendientes/resumen', shortCache, getResumenCobrosPendientes);
router.get('/cobros-pendientes', shortCache, getCobrosPendientes);

// Rendimiento y análisis
router.get('/rendimiento-mensual', longCache, getRendimientoMensual);
router.get('/top-rentabilidad', longCache, getTopByRentabilidad);
router.get('/comparativa-rendimiento', longCache, getComparativaRendimiento);
router.get('/fidelidad', longCache, getFidelidad);

// PUT endpoints
router.put('/eventos/:eventoId/marcar-cobrado', marcarEventoCobrado);
router.put('/eventos/marcar-cobrados', marcarEventosCobrados);

// Rutas dinámicas al FINAL
router.get('/financial-stats/:id', shortCache, getFinancialStatsById);
router.get('/:id', shortCache, getFinancialStatsById); // Por ID directo - AL FINAL

export default router;
