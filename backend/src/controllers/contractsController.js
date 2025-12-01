import Contract from '../models/Contract.js';
import logger from '../utils/logger.js';

/**
 * Contracts Controller
 * Gestión completa de contratos con firma digital
 */

// Obtener todos los contratos
export const getAllContracts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, contract_type, cliente_id, dj_id, search } = req.query;

    const result = await Contract.getAll({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      contract_type,
      cliente_id,
      dj_id,
      search
    });

    res.json({
      success: true,
      data: result.contracts,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Error getting contracts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener contratos',
      error: error.message
    });
  }
};

// Obtener contrato por ID
export const getContractById = async (req, res) => {
  try {
    const { id } = req.params;
    const contract = await Contract.getById(id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrato no encontrado'
      });
    }

    res.json({
      success: true,
      data: contract
    });
  } catch (error) {
    logger.error('Error getting contract:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener contrato',
      error: error.message
    });
  }
};

// Crear nuevo contrato
// IMPORTANT: This endpoint MUST have auth middleware applied in routes
export const createContract = async (req, res) => {
  try {
    // Auth middleware ensures req.user is populated
    const userId = req.user.id;
    const contractData = {
      ...req.body,
      created_by: userId
    };

    const contract = await Contract.create(contractData);

    logger.info('Contract created:', { contractId: contract.id, userId });

    res.status(201).json({
      success: true,
      message: 'Contrato creado exitosamente',
      data: contract
    });
  } catch (error) {
    logger.error('Error creating contract:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear contrato',
      error: error.message
    });
  }
};

// Actualizar contrato
// IMPORTANT: This endpoint MUST have auth middleware applied in routes
export const updateContract = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    const contract = await Contract.update(id, updates, userId);

    logger.info('Contract updated:', { contractId: id, userId });

    res.json({
      success: true,
      message: 'Contrato actualizado exitosamente',
      data: contract
    });
  } catch (error) {
    logger.error('Error updating contract:', error);
    
    if (error.message === 'Contract not found') {
      return res.status(404).json({
        success: false,
        message: 'Contrato no encontrado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar contrato',
      error: error.message
    });
  }
};

// Firmar contrato
export const signContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { party } = req.body; // 'a' or 'b'
    const userId = req.user.id;

    if (!['a', 'b'].includes(party)) {
      return res.status(400).json({
        success: false,
        message: 'Parte inválida. Debe ser "a" o "b"'
      });
    }

    const signatureData = {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId
    };

    const contract = await Contract.sign(id, party, signatureData, userId);

    logger.info('Contract signed:', { contractId: id, party, userId });

    res.json({
      success: true,
      message: `Contrato firmado por parte ${party.toUpperCase()}`,
      data: contract
    });
  } catch (error) {
    logger.error('Error signing contract:', error);
    res.status(500).json({
      success: false,
      message: 'Error al firmar contrato',
      error: error.message
    });
  }
};

// Cambiar estado del contrato
export const updateContractStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const userId = req.user.id;

    const validStatuses = ['draft', 'pending_review', 'pending_signature', 'signed', 'active', 'expired', 'cancelled', 'terminated'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido',
        validStatuses
      });
    }

    const contract = await Contract.updateStatus(id, status, userId, reason);

    logger.info('Contract status updated:', { contractId: id, status, userId });

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      data: contract
    });
  } catch (error) {
    logger.error('Error updating contract status:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado',
      error: error.message
    });
  }
};

// Eliminar contrato (soft delete)
export const deleteContract = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deleted = await Contract.delete(id, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Contrato no encontrado'
      });
    }

    logger.info('Contract deleted:', { contractId: id, userId });

    res.json({
      success: true,
      message: 'Contrato eliminado exitosamente'
    });
  } catch (error) {
    logger.error('Error deleting contract:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar contrato',
      error: error.message
    });
  }
};

// Obtener historial del contrato
export const getContractHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await Contract.getHistory(id);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('Error getting contract history:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial',
      error: error.message
    });
  }
};

// Obtener contratos próximos a vencer
export const getExpiringContracts = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const contracts = await Contract.getExpiringSoon(parseInt(days));

    res.json({
      success: true,
      count: contracts.length,
      data: contracts
    });
  } catch (error) {
    logger.error('Error getting expiring contracts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener contratos por vencer',
      error: error.message
    });
  }
};

// Obtener estadísticas de contratos
export const getContractStats = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'signed' THEN 1 END) as signed,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft,
        COUNT(CASE WHEN status = 'pending_signature' THEN 1 END) as pending_signature,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired,
        COUNT(CASE WHEN signed_by_party_a AND signed_by_party_b THEN 1 END) as fully_signed,
        AVG(total_amount) as avg_amount,
        SUM(total_amount) as total_amount
      FROM contracts
      WHERE deleted_at IS NULL
    `);

    res.json({
      success: true,
      data: stats.rows[0]
    });
  } catch (error) {
    logger.error('Error getting contract stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

export default {
  getAllContracts,
  getContractById,
  createContract,
  updateContract,
  signContract,
  updateContractStatus,
  deleteContract,
  getContractHistory,
  getExpiringContracts,
  getContractStats
};
