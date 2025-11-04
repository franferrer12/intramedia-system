import express from 'express';
import {
  getAgencySummary,
  getAllTransactions,
  getTransactionById,
  createTransaction,
  registerClientPayment,
  markAsPaid,
  updateTransaction,
  cancelTransaction,
  getDJBalance,
  getAllDJBalances
} from '../controllers/financialController.js';
import { authenticate } from '../middleware/auth.js';
import { shortCache, longCache } from '../middleware/cache.js';
import { createRateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Resumen financiero
router.get('/summary', longCache, getAgencySummary);

// Transacciones
router.get('/transactions/:id', shortCache, getTransactionById);
router.get('/transactions', shortCache, getAllTransactions);
router.post('/transactions', createRateLimit, createTransaction);
router.put('/transactions/:id', updateTransaction);
router.delete('/transactions/:id', cancelTransaction);

// Operaciones especiales
router.post('/transactions/client-payment', createRateLimit, registerClientPayment);
router.post('/transactions/:id/mark-paid', createRateLimit, markAsPaid);

// Balances
router.get('/balances/:dj_id', shortCache, getDJBalance);
router.get('/balances', shortCache, getAllDJBalances);

export default router;
