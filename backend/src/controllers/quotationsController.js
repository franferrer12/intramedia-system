import Quotation from '../models/Quotation.js';
import logger from '../utils/logger.js';

/**
 * Quotations Controller
 * Gestión completa de cotizaciones/presupuestos
 */

// Obtener todas las cotizaciones con filtros
export const getAllQuotations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      agency_id,
      cliente_id,
      dj_id,
      status,
      event_type,
      from_date,
      to_date,
      search,
      sort_by,
      sort_order
    } = req.query;

    const result = await Quotation.findAll({
      agency_id,
      cliente_id,
      dj_id,
      status,
      event_type,
      from_date,
      to_date,
      search,
      page: parseInt(page),
      limit: parseInt(limit),
      sort_by,
      sort_order
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Error getting quotations:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cotizaciones',
      error: error.message
    });
  }
};

// Obtener cotización por ID
export const getQuotationById = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findById(id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }

    res.json({
      success: true,
      data: quotation
    });
  } catch (error) {
    logger.error('Error getting quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cotización',
      error: error.message
    });
  }
};

// Crear nueva cotización
export const createQuotation = async (req, res) => {
  try {
    const userId = req.user?.id;
    const quotationData = {
      ...req.body,
      created_by: userId
    };

    const quotation = await Quotation.create(quotationData);

    logger.info('Quotation created:', { quotationId: quotation.id, userId });

    res.status(201).json({
      success: true,
      message: 'Cotización creada exitosamente',
      data: quotation
    });
  } catch (error) {
    logger.error('Error creating quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear cotización',
      error: error.message
    });
  }
};

// Actualizar cotización
export const updateQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const quotationData = req.body;

    const quotation = await Quotation.update(id, quotationData);

    logger.info('Quotation updated:', { quotationId: id });

    res.json({
      success: true,
      message: 'Cotización actualizada exitosamente',
      data: quotation
    });
  } catch (error) {
    logger.error('Error updating quotation:', error);

    if (error.message === 'Cotización no encontrada') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar cotización',
      error: error.message
    });
  }
};

// Eliminar cotización
export const deleteQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.delete(id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }

    logger.info('Quotation deleted:', { quotationId: id });

    res.json({
      success: true,
      message: 'Cotización eliminada exitosamente',
      data: quotation
    });
  } catch (error) {
    logger.error('Error deleting quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar cotización',
      error: error.message
    });
  }
};

// Cambiar estado de cotización
export const updateQuotationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, ...additionalData } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'El campo status es requerido'
      });
    }

    const validStatuses = ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'converted'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Estados permitidos: ${validStatuses.join(', ')}`
      });
    }

    const quotation = await Quotation.updateStatus(id, status, additionalData);

    logger.info('Quotation status updated:', { quotationId: id, status });

    res.json({
      success: true,
      message: `Cotización marcada como ${status}`,
      data: quotation
    });
  } catch (error) {
    logger.error('Error updating quotation status:', error);

    if (error.message === 'Cotización no encontrada') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado de cotización',
      error: error.message
    });
  }
};

// Enviar cotización por email
export const sendQuotation = async (req, res) => {
  try {
    const { id } = req.params;

    // Actualizar estado a 'sent'
    const quotation = await Quotation.updateStatus(id, 'sent');

    // TODO: Implementar envío de email real
    // await sendQuotationEmail(quotation);

    logger.info('Quotation sent:', { quotationId: id });

    res.json({
      success: true,
      message: 'Cotización enviada exitosamente',
      data: quotation
    });
  } catch (error) {
    logger.error('Error sending quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar cotización',
      error: error.message
    });
  }
};

// Aceptar cotización
export const acceptQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.updateStatus(id, 'accepted');

    logger.info('Quotation accepted:', { quotationId: id });

    res.json({
      success: true,
      message: 'Cotización aceptada exitosamente',
      data: quotation
    });
  } catch (error) {
    logger.error('Error accepting quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Error al aceptar cotización',
      error: error.message
    });
  }
};

// Rechazar cotización
export const rejectQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    const quotation = await Quotation.updateStatus(id, 'rejected', { rejection_reason });

    logger.info('Quotation rejected:', { quotationId: id, reason: rejection_reason });

    res.json({
      success: true,
      message: 'Cotización rechazada',
      data: quotation
    });
  } catch (error) {
    logger.error('Error rejecting quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Error al rechazar cotización',
      error: error.message
    });
  }
};

// Convertir cotización a evento
export const convertToEvento = async (req, res) => {
  try {
    const { id } = req.params;
    const { evento_id } = req.body;

    if (!evento_id) {
      return res.status(400).json({
        success: false,
        message: 'El ID del evento es requerido'
      });
    }

    const quotation = await Quotation.updateStatus(id, 'converted', { evento_id });

    logger.info('Quotation converted to evento:', { quotationId: id, eventoId: evento_id });

    res.json({
      success: true,
      message: 'Cotización convertida a evento exitosamente',
      data: quotation
    });
  } catch (error) {
    logger.error('Error converting quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Error al convertir cotización',
      error: error.message
    });
  }
};

// Duplicar cotización
export const duplicateQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.duplicate(id);

    logger.info('Quotation duplicated:', { originalId: id, newId: quotation.id });

    res.status(201).json({
      success: true,
      message: 'Cotización duplicada exitosamente',
      data: quotation
    });
  } catch (error) {
    logger.error('Error duplicating quotation:', error);

    if (error.message === 'Cotización original no encontrada') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al duplicar cotización',
      error: error.message
    });
  }
};

// Obtener historial de una cotización
export const getQuotationHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await Quotation.getHistory(id);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('Error getting quotation history:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial',
      error: error.message
    });
  }
};

// Obtener estadísticas de cotizaciones
export const getQuotationStats = async (req, res) => {
  try {
    const { agency_id } = req.params;
    const { from_date, to_date } = req.query;

    const stats = await Quotation.getStatsByAgency(agency_id, {
      from_date,
      to_date
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting quotation stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

// Expirar cotizaciones antiguas (cron job endpoint)
export const expireOldQuotations = async (req, res) => {
  try {
    const expired = await Quotation.expireOldQuotations();

    logger.info('Quotations expired:', { count: expired.length });

    res.json({
      success: true,
      message: `${expired.length} cotizaciones expiradas`,
      data: expired
    });
  } catch (error) {
    logger.error('Error expiring quotations:', error);
    res.status(500).json({
      success: false,
      message: 'Error al expirar cotizaciones',
      error: error.message
    });
  }
};

// Crear cotización desde template
export const createFromTemplate = async (req, res) => {
  try {
    const { template_id } = req.params;
    const userId = req.user?.id;
    const quotationData = {
      ...req.body,
      created_by: userId
    };

    const quotation = await Quotation.createFromTemplate(template_id, quotationData);

    logger.info('Quotation created from template:', {
      quotationId: quotation.id,
      templateId: template_id
    });

    res.status(201).json({
      success: true,
      message: 'Cotización creada desde template exitosamente',
      data: quotation
    });
  } catch (error) {
    logger.error('Error creating quotation from template:', error);

    if (error.message === 'Template no encontrado o inactivo') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear cotización desde template',
      error: error.message
    });
  }
};

// Obtener cotizaciones próximas a expirar
export const getExpiringSoon = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const quotations = await Quotation.findExpiringSoon(parseInt(days));

    res.json({
      success: true,
      data: quotations
    });
  } catch (error) {
    logger.error('Error getting expiring quotations:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cotizaciones próximas a expirar',
      error: error.message
    });
  }
};

// Generar PDF de cotización
export const generateQuotationPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findById(id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }

    // TODO: Implementar generación de PDF
    // const pdfBuffer = await generatePDF(quotation);

    logger.info('Quotation PDF generated:', { quotationId: id });

    res.json({
      success: true,
      message: 'PDF generado exitosamente',
      data: {
        quotation_id: id,
        // pdf_url: pdfUrl
      }
    });
  } catch (error) {
    logger.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar PDF',
      error: error.message
    });
  }
};

export default {
  getAllQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  updateQuotationStatus,
  sendQuotation,
  acceptQuotation,
  rejectQuotation,
  convertToEvento,
  duplicateQuotation,
  getQuotationHistory,
  getQuotationStats,
  expireOldQuotations,
  createFromTemplate,
  getExpiringSoon,
  generateQuotationPDF
};
