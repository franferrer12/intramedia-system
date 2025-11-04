import express from 'express';
import {
  getAllAlerts,
  getActiveAlerts,
  getUnreadAlerts,
  getAlertsSummary,
  getDashboardStats,
  getAlertById,
  markAsRead,
  markMultipleAsRead,
  markAsResolved,
  markMultipleAsResolved,
  generateAlerts,
  getUnreadCount,
  getCountBySeverity,
  deleteAlert,
  getAlertsByCliente,
  getAlertsByDJ,
  getAlertsByEvento
} from '../controllers/financialAlertsController.js';
import { shortCache, longCache } from '../middleware/cache.js';

const router = express.Router();

// Get routes - IMPORTANT: Specific routes FIRST, dynamic /:id LAST
router.get('/', shortCache, getAllAlerts);
router.get('/active', shortCache, getActiveAlerts);
router.get('/unread', shortCache, getUnreadAlerts);
router.get('/summary', shortCache, getAlertsSummary);
router.get('/stats', longCache, getDashboardStats);
router.get('/unread-count', shortCache, getUnreadCount);
router.get('/count-by-severity', longCache, getCountBySeverity);
router.get('/cliente/:clienteId', shortCache, getAlertsByCliente);
router.get('/dj/:djId', shortCache, getAlertsByDJ);
router.get('/evento/:eventoId', shortCache, getAlertsByEvento);
router.get('/:id', shortCache, getAlertById);

// Update routes
router.patch('/:id/read', markAsRead);
router.patch('/:id/resolve', markAsResolved);
router.patch('/bulk/read', markMultipleAsRead);
router.patch('/bulk/resolve', markMultipleAsResolved);

// Generate alerts (admin action)
router.post('/generate', generateAlerts);

// Delete route (admin only)
router.delete('/:id', deleteAlert);

export default router;
