import agencyService from '../services/agencyService.js';
import authService from '../services/authService.js';

/**
 * Agency Controller
 * Handles agency management endpoints for multi-tenant system
 */

/**
 * Get current agency profile
 * GET /api/agencies/profile
 */
export const getAgencyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Verify user is an agency
    if (req.user.userType !== 'agency' && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo las agencias pueden acceder a este recurso'
      });
    }

    const result = await agencyService.getAgencyByUserId(userId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json({
      success: true,
      agency: result.agency
    });
  } catch (error) {
    console.error('Error in getAgencyProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil de la agencia',
      error: error.message
    });
  }
};

/**
 * Update agency profile
 * PUT /api/agencies/profile
 */
export const updateAgencyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Verify user is an agency
    if (req.user.userType !== 'agency') {
      return res.status(403).json({
        success: false,
        message: 'Solo las agencias pueden actualizar su perfil'
      });
    }

    // Get agency ID from user
    const agencyResult = await agencyService.getAgencyByUserId(userId);

    if (!agencyResult.success) {
      return res.status(404).json(agencyResult);
    }

    const agencyId = agencyResult.agency.id;

    // Update agency
    const result = await agencyService.updateAgency(agencyId, req.body);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Log action
    const ipAddress = req.ip || req.connection.remoteAddress;
    await authService.logAction(
      userId,
      'update',
      'agency',
      agencyId,
      agencyResult.agency,
      result.agency,
      ipAddress
    );

    res.json({
      success: true,
      message: 'Perfil de agencia actualizado exitosamente',
      agency: result.agency
    });
  } catch (error) {
    console.error('Error in updateAgencyProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil de la agencia',
      error: error.message
    });
  }
};

/**
 * Get agency dashboard stats
 * GET /api/agencies/stats
 */
export const getAgencyStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Verify user is an agency
    if (req.user.userType !== 'agency' && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo las agencias pueden acceder a este recurso'
      });
    }

    // Get agency ID
    const agencyResult = await agencyService.getAgencyByUserId(userId);

    if (!agencyResult.success) {
      return res.status(404).json(agencyResult);
    }

    const agencyId = agencyResult.agency.id;

    // Get stats
    const result = await agencyService.getAgencyStats(agencyId);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      stats: result.stats
    });
  } catch (error) {
    console.error('Error in getAgencyStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de la agencia',
      error: error.message
    });
  }
};

/**
 * Get all DJs managed by agency
 * GET /api/agencies/djs
 */
export const getAgencyDJs = async (req, res) => {
  try {
    const userId = req.user.id;
    const includeInactive = req.query.include_inactive === 'true';

    // Verify user is an agency
    if (req.user.userType !== 'agency' && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo las agencias pueden acceder a este recurso'
      });
    }

    // Get agency ID
    const agencyResult = await agencyService.getAgencyByUserId(userId);

    if (!agencyResult.success) {
      return res.status(404).json(agencyResult);
    }

    const agencyId = agencyResult.agency.id;

    // Get DJs
    const result = await agencyService.getAgencyDJs(agencyId, includeInactive);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      djs: result.djs,
      total: result.djs.length
    });
  } catch (error) {
    console.error('Error in getAgencyDJs:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener artistas de la agencia',
      error: error.message
    });
  }
};

/**
 * Get available DJs (not assigned to any agency)
 * GET /api/agencies/available-djs
 */
export const getAvailableDJs = async (req, res) => {
  try {
    // Verify user is an agency
    if (req.user.userType !== 'agency' && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo las agencias pueden acceder a este recurso'
      });
    }

    const result = await agencyService.getAvailableDJs();

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      djs: result.djs,
      total: result.djs.length
    });
  } catch (error) {
    console.error('Error in getAvailableDJs:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener artistas disponibles',
      error: error.message
    });
  }
};

/**
 * Add DJ to agency
 * POST /api/agencies/djs
 */
export const addDJToAgency = async (req, res) => {
  try {
    const userId = req.user.id;
    const { djId, role, commissionRate, contractStartDate, contractEndDate } = req.body;

    // Validate required fields
    if (!djId) {
      return res.status(400).json({
        success: false,
        message: 'El ID del artista es requerido'
      });
    }

    // Verify user is an agency
    if (req.user.userType !== 'agency') {
      return res.status(403).json({
        success: false,
        message: 'Solo las agencias pueden añadir artistas'
      });
    }

    // Get agency ID
    const agencyResult = await agencyService.getAgencyByUserId(userId);

    if (!agencyResult.success) {
      return res.status(404).json(agencyResult);
    }

    const agencyId = agencyResult.agency.id;

    // Add DJ
    const result = await agencyService.addDJToAgency(agencyId, djId, {
      role,
      commission_rate: commissionRate,
      contract_start_date: contractStartDate,
      contract_end_date: contractEndDate
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Log action
    const ipAddress = req.ip || req.connection.remoteAddress;
    await authService.logAction(
      userId,
      'assign_dj',
      'agency',
      agencyId,
      null,
      { djId, role, commissionRate },
      ipAddress
    );

    res.status(201).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error in addDJToAgency:', error);
    res.status(500).json({
      success: false,
      message: 'Error al añadir artista a la agencia',
      error: error.message
    });
  }
};

/**
 * Remove DJ from agency
 * DELETE /api/agencies/djs/:djId
 */
export const removeDJFromAgency = async (req, res) => {
  try {
    const userId = req.user.id;
    const djId = parseInt(req.params.djId);

    if (!djId || isNaN(djId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de artista inválido'
      });
    }

    // Verify user is an agency
    if (req.user.userType !== 'agency') {
      return res.status(403).json({
        success: false,
        message: 'Solo las agencias pueden remover artistas'
      });
    }

    // Get agency ID
    const agencyResult = await agencyService.getAgencyByUserId(userId);

    if (!agencyResult.success) {
      return res.status(404).json(agencyResult);
    }

    const agencyId = agencyResult.agency.id;

    // Remove DJ
    const result = await agencyService.removeDJFromAgency(agencyId, djId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Log action
    const ipAddress = req.ip || req.connection.remoteAddress;
    await authService.logAction(
      userId,
      'remove_dj',
      'agency',
      agencyId,
      { djId },
      null,
      ipAddress
    );

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error in removeDJFromAgency:', error);
    res.status(500).json({
      success: false,
      message: 'Error al remover artista de la agencia',
      error: error.message
    });
  }
};

/**
 * Update DJ relationship (commission, role, contract)
 * PUT /api/agencies/djs/:djId
 */
export const updateDJRelation = async (req, res) => {
  try {
    const userId = req.user.id;
    const djId = parseInt(req.params.djId);
    const { role, commissionRate, contractStartDate, contractEndDate } = req.body;

    if (!djId || isNaN(djId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de artista inválido'
      });
    }

    // Verify user is an agency
    if (req.user.userType !== 'agency') {
      return res.status(403).json({
        success: false,
        message: 'Solo las agencias pueden actualizar relaciones con artistas'
      });
    }

    // Get agency ID
    const agencyResult = await agencyService.getAgencyByUserId(userId);

    if (!agencyResult.success) {
      return res.status(404).json(agencyResult);
    }

    const agencyId = agencyResult.agency.id;

    // Update relation
    const result = await agencyService.updateDJRelation(agencyId, djId, {
      role,
      commission_rate: commissionRate,
      contract_start_date: contractStartDate,
      contract_end_date: contractEndDate
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Log action
    const ipAddress = req.ip || req.connection.remoteAddress;
    await authService.logAction(
      userId,
      'update_dj_relation',
      'agency',
      agencyId,
      null,
      { djId, role, commissionRate },
      ipAddress
    );

    res.json({
      success: true,
      message: 'Relación con artista actualizada exitosamente',
      relation: result.relation
    });
  } catch (error) {
    console.error('Error in updateDJRelation:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar relación con artista',
      error: error.message
    });
  }
};

export default {
  getAgencyProfile,
  updateAgencyProfile,
  getAgencyStats,
  getAgencyDJs,
  getAvailableDJs,
  addDJToAgency,
  removeDJFromAgency,
  updateDJRelation
};
