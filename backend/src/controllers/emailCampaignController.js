import * as EmailCampaign from '../models/EmailCampaign.js';
import * as emailService from '../services/emailService.js';

/**
 * Email Campaign Controller
 * Handles marketing automation endpoints
 */

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

/**
 * Get all templates
 * GET /api/campaigns/templates
 */
export const getTemplates = async (req, res) => {
  try {
    const { agencyId } = req.user;
    const filters = {
      categoria: req.query.categoria,
      activo: req.query.activo === 'true'
    };

    const templates = await EmailCampaign.getTemplates(agencyId, filters);

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener templates',
      error: error.message
    });
  }
};

/**
 * Get template by ID
 * GET /api/campaigns/templates/:id
 */
export const getTemplateById = async (req, res) => {
  try {
    const { agencyId } = req.user;
    const { id } = req.params;

    const template = await EmailCampaign.getTemplateById(parseInt(id), agencyId);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template no encontrado'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error getting template:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener template',
      error: error.message
    });
  }
};

/**
 * Create template
 * POST /api/campaigns/templates
 */
export const createTemplate = async (req, res) => {
  try {
    const { agencyId } = req.user;
    const {
      nombre,
      descripcion,
      categoria,
      asunto,
      contenidoHtml,
      contenidoTexto,
      variablesDisponibles
    } = req.body;

    // Validation
    if (!nombre || !asunto || !contenidoHtml) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, asunto y contenido HTML son requeridos'
      });
    }

    const template = await EmailCampaign.createTemplate({
      agencyId,
      nombre,
      descripcion,
      categoria,
      asunto,
      contenidoHtml,
      contenidoTexto,
      variablesDisponibles
    });

    res.status(201).json({
      success: true,
      message: 'Template creado exitosamente',
      data: template
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear template',
      error: error.message
    });
  }
};

/**
 * Update template
 * PUT /api/campaigns/templates/:id
 */
export const updateTemplate = async (req, res) => {
  try {
    const { agencyId } = req.user;
    const { id } = req.params;

    const template = await EmailCampaign.updateTemplate(parseInt(id), agencyId, req.body);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Template actualizado exitosamente',
      data: template
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar template',
      error: error.message
    });
  }
};

/**
 * Delete template
 * DELETE /api/campaigns/templates/:id
 */
export const deleteTemplate = async (req, res) => {
  try {
    const { agencyId } = req.user;
    const { id } = req.params;

    const deleted = await EmailCampaign.deleteTemplate(parseInt(id), agencyId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Template no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Template eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar template',
      error: error.message
    });
  }
};

// ============================================================================
// EMAIL CAMPAIGNS
// ============================================================================

/**
 * Get all campaigns
 * GET /api/campaigns
 */
export const getCampaigns = async (req, res) => {
  try {
    const { agencyId } = req.user;
    const filters = {
      estado: req.query.estado
    };

    const campaigns = await EmailCampaign.getCampaigns(agencyId, filters);

    res.json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    console.error('Error getting campaigns:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener campañas',
      error: error.message
    });
  }
};

/**
 * Get campaign by ID
 * GET /api/campaigns/:id
 */
export const getCampaignById = async (req, res) => {
  try {
    const { agencyId } = req.user;
    const { id } = req.params;

    const campaign = await EmailCampaign.getCampaignById(parseInt(id), agencyId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaña no encontrada'
      });
    }

    res.json({
      success: true,
      data: campaign
    });
  } catch (error) {
    console.error('Error getting campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener campaña',
      error: error.message
    });
  }
};

/**
 * Create campaign
 * POST /api/campaigns
 */
export const createCampaign = async (req, res) => {
  try {
    const { agencyId, id: userId } = req.user;
    const {
      templateId,
      nombre,
      descripcion,
      asunto,
      contenidoHtml,
      contenidoTexto,
      tipoDestinatarios,
      filtros,
      destinatariosPersonalizados,
      fechaEnvioProgramada
    } = req.body;

    // Validation
    if (!nombre || !asunto || !contenidoHtml) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, asunto y contenido HTML son requeridos'
      });
    }

    if (!tipoDestinatarios) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de destinatarios es requerido'
      });
    }

    const campaign = await EmailCampaign.createCampaign({
      agencyId,
      templateId,
      nombre,
      descripcion,
      asunto,
      contenidoHtml,
      contenidoTexto,
      tipoDestinatarios,
      filtros,
      destinatariosPersonalizados,
      fechaEnvioProgramada,
      creadoPor: userId
    });

    res.status(201).json({
      success: true,
      message: 'Campaña creada exitosamente',
      data: campaign
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear campaña',
      error: error.message
    });
  }
};

/**
 * Update campaign
 * PUT /api/campaigns/:id
 */
export const updateCampaign = async (req, res) => {
  try {
    const { agencyId } = req.user;
    const { id } = req.params;

    // Check if campaign can be updated
    const existingCampaign = await EmailCampaign.getCampaignById(parseInt(id), agencyId);

    if (!existingCampaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaña no encontrada'
      });
    }

    if (existingCampaign.estado === 'sent') {
      return res.status(400).json({
        success: false,
        message: 'No se puede editar una campaña ya enviada'
      });
    }

    const campaign = await EmailCampaign.updateCampaign(parseInt(id), agencyId, req.body);

    res.json({
      success: true,
      message: 'Campaña actualizada exitosamente',
      data: campaign
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar campaña',
      error: error.message
    });
  }
};

/**
 * Delete campaign
 * DELETE /api/campaigns/:id
 */
export const deleteCampaign = async (req, res) => {
  try {
    const { agencyId } = req.user;
    const { id } = req.params;

    const deleted = await EmailCampaign.deleteCampaign(parseInt(id), agencyId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Campaña no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Campaña eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar campaña',
      error: error.message
    });
  }
};

// ============================================================================
// CAMPAIGN RECIPIENTS & SENDING
// ============================================================================

/**
 * Get campaign recipients
 * GET /api/campaigns/:id/recipients
 */
export const getCampaignRecipients = async (req, res) => {
  try {
    const { agencyId } = req.user;
    const { id } = req.params;

    // Verify campaign belongs to agency
    const campaign = await EmailCampaign.getCampaignById(parseInt(id), agencyId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaña no encontrada'
      });
    }

    const filters = {
      estado: req.query.estado
    };

    const recipients = await EmailCampaign.getCampaignRecipients(parseInt(id), filters);

    res.json({
      success: true,
      data: recipients
    });
  } catch (error) {
    console.error('Error getting campaign recipients:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener destinatarios',
      error: error.message
    });
  }
};

/**
 * Preview campaign recipients count
 * POST /api/campaigns/preview-recipients
 */
export const previewRecipientsCount = async (req, res) => {
  try {
    const { agencyId } = req.user;
    const { tipoDestinatarios, filtros, destinatariosPersonalizados } = req.body;

    if (!tipoDestinatarios) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de destinatarios es requerido'
      });
    }

    let count = 0;

    if (tipoDestinatarios === 'custom') {
      count = destinatariosPersonalizados ? destinatariosPersonalizados.length : 0;
    } else {
      count = await EmailCampaign.getPotentialRecipientsCount(agencyId, tipoDestinatarios, filtros);
    }

    res.json({
      success: true,
      data: {
        count,
        tipoDestinatarios,
        filtros
      }
    });
  } catch (error) {
    console.error('Error previewing recipients:', error);
    res.status(500).json({
      success: false,
      message: 'Error al previsualizar destinatarios',
      error: error.message
    });
  }
};

/**
 * Send campaign (schedule or immediate)
 * POST /api/campaigns/:id/send
 */
export const sendCampaign = async (req, res) => {
  try {
    const { agencyId } = req.user;
    const { id } = req.params;
    const { immediate = false } = req.body;

    // Get campaign
    const campaign = await EmailCampaign.getCampaignById(parseInt(id), agencyId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaña no encontrada'
      });
    }

    if (campaign.estado !== 'draft' && campaign.estado !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'La campaña ya fue enviada o está en proceso de envío'
      });
    }

    // Update campaign status
    const newEstado = immediate ? 'sending' : 'scheduled';
    await EmailCampaign.updateCampaign(parseInt(id), agencyId, {
      estado: newEstado,
      ...(immediate && { fechaEnvioProgramada: new Date() })
    });

    // If immediate sending, trigger email service (async)
    if (immediate) {
      // NOTE: This should be handled by a background job queue (Bull, Agenda, etc.)
      // For now, we'll just update the status and return
      // The actual sending would be handled by a separate worker process

      res.json({
        success: true,
        message: 'Campaña programada para envío inmediato',
        data: {
          campaignId: parseInt(id),
          estado: 'sending',
          note: 'El envío se está procesando en segundo plano'
        }
      });
    } else {
      res.json({
        success: true,
        message: 'Campaña programada exitosamente',
        data: {
          campaignId: parseInt(id),
          estado: 'scheduled',
          fechaEnvioProgramada: campaign.fecha_envio_programada
        }
      });
    }
  } catch (error) {
    console.error('Error sending campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar campaña',
      error: error.message
    });
  }
};

/**
 * Cancel scheduled campaign
 * POST /api/campaigns/:id/cancel
 */
export const cancelCampaign = async (req, res) => {
  try {
    const { agencyId } = req.user;
    const { id } = req.params;

    const campaign = await EmailCampaign.getCampaignById(parseInt(id), agencyId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaña no encontrada'
      });
    }

    if (campaign.estado !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden cancelar campañas programadas'
      });
    }

    await EmailCampaign.updateCampaign(parseInt(id), agencyId, {
      estado: 'cancelled'
    });

    res.json({
      success: true,
      message: 'Campaña cancelada exitosamente'
    });
  } catch (error) {
    console.error('Error canceling campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar campaña',
      error: error.message
    });
  }
};

// ============================================================================
// CAMPAIGN STATS
// ============================================================================

/**
 * Get campaign stats
 * GET /api/campaigns/:id/stats
 */
export const getCampaignStats = async (req, res) => {
  try {
    const { agencyId } = req.user;
    const { id } = req.params;

    // Verify campaign belongs to agency
    const campaign = await EmailCampaign.getCampaignById(parseInt(id), agencyId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaña no encontrada'
      });
    }

    const stats = await EmailCampaign.getCampaignStats(parseInt(id));

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting campaign stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

/**
 * Get overall campaign stats summary
 * GET /api/campaigns/stats/summary
 */
export const getCampaignsSummary = async (req, res) => {
  try {
    const { agencyId } = req.user;

    const campaigns = await EmailCampaign.getCampaigns(agencyId);

    const summary = {
      total_campaigns: campaigns.length,
      draft: campaigns.filter(c => c.estado === 'draft').length,
      scheduled: campaigns.filter(c => c.estado === 'scheduled').length,
      sent: campaigns.filter(c => c.estado === 'sent').length,
      total_emails_sent: campaigns.reduce((sum, c) => sum + (c.enviados || 0), 0),
      avg_open_rate: 0,
      avg_click_rate: 0
    };

    // Calculate average rates
    const sentCampaigns = campaigns.filter(c => c.estado === 'sent' && c.enviados > 0);

    if (sentCampaigns.length > 0) {
      const totalOpenRate = sentCampaigns.reduce((sum, c) => {
        return sum + ((c.abiertos || 0) / c.enviados * 100);
      }, 0);

      const totalClickRate = sentCampaigns.reduce((sum, c) => {
        const opens = c.abiertos || 0;
        if (opens === 0) return sum;
        return sum + ((c.clicks || 0) / opens * 100);
      }, 0);

      summary.avg_open_rate = (totalOpenRate / sentCampaigns.length).toFixed(2);
      summary.avg_click_rate = (totalClickRate / sentCampaigns.length).toFixed(2);
    }

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting campaigns summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen',
      error: error.message
    });
  }
};

export default {
  // Templates
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,

  // Campaigns
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,

  // Recipients & Sending
  getCampaignRecipients,
  previewRecipientsCount,
  sendCampaign,
  cancelCampaign,

  // Stats
  getCampaignStats,
  getCampaignsSummary
};
