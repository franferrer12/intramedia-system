import express from 'express';
import { validate, validateId, sanitizeBody, validatePagination } from '../middleware/validate.js';
import {
  createContractSchema,
  updateContractSchema,
  signContractSchema,
  updateStatusSchema,
  listContractsQuerySchema,
  contractIdSchema
} from '../schemas/contract.schema.js';
import { shortCache, longCache } from '../middleware/cache.js';
import { createRateLimit } from '../middleware/rateLimit.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  createContract,
  getAllContracts,
  getContractById,
  updateContract,
  signContract,
  updateContractStatus,
  deleteContract,
  getContractHistory,
  getExpiringSoonContracts
} from '../controllers/contractsController.js';

const router = express.Router();

/**
 * IMPORTANT: All contract routes require authentication
 * The authenticateToken middleware ensures req.user is populated
 */

// GET /api/contracts - Obtener todos los contratos (con paginación y filtros)
router.get('/',
  authenticateToken,
  validate({ query: listContractsQuerySchema }),
  validatePagination({ maxLimit: 50 }),
  shortCache,
  getAllContracts
);

// GET /api/contracts/expiring-soon - Contratos próximos a vencer
router.get('/expiring-soon',
  authenticateToken,
  longCache,
  getExpiringSoonContracts
);

// GET /api/contracts/:id - Obtener un contrato específico
router.get('/:id',
  authenticateToken,
  validate({ params: contractIdSchema }),
  shortCache,
  getContractById
);

// GET /api/contracts/:id/history - Obtener historial de cambios
router.get('/:id/history',
  authenticateToken,
  validate({ params: contractIdSchema }),
  longCache,
  getContractHistory
);

// POST /api/contracts - Crear nuevo contrato
router.post('/',
  authenticateToken,
  createRateLimit,
  sanitizeBody,
  validate({ body: createContractSchema }),
  createContract
);

// PUT /api/contracts/:id - Actualizar contrato
router.put('/:id',
  authenticateToken,
  validate({
    params: contractIdSchema,
    body: updateContractSchema
  }),
  sanitizeBody,
  updateContract
);

// POST /api/contracts/:id/sign - Firmar contrato
router.post('/:id/sign',
  authenticateToken,
  validate({
    params: contractIdSchema,
    body: signContractSchema
  }),
  signContract
);

// PATCH /api/contracts/:id/status - Cambiar estado del contrato
router.patch('/:id/status',
  authenticateToken,
  validate({
    params: contractIdSchema,
    body: updateStatusSchema
  }),
  updateContractStatus
);

// DELETE /api/contracts/:id - Soft delete de contrato
router.delete('/:id',
  authenticateToken,
  validateId,
  deleteContract
);

export default router;
