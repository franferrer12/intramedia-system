import LeadInteraction from '../models/LeadInteraction.js';

/**
 * Controlador de Interacciones con Leads
 * Gestiona el timeline completo de actividades
 */

/**
 * Crear una nueva interacción
 * POST /api/interactions
 */
export const createInteraction = async (req, res) => {
  try {
    const {
      lead_id,
      tipo,
      descripcion,
      usuario_id,
      fecha_proxima_accion,
      recordatorio
    } = req.body;

    // Validación básica
    if (!lead_id) {
      return res.status(400).json({
        success: false,
        message: 'El ID del lead es requerido'
      });
    }

    if (!tipo) {
      return res.status(400).json({
        success: false,
        message: 'El tipo de interacción es requerido'
      });
    }

    // Validar tipo de interacción
    const tiposValidos = ['llamada', 'email', 'reunion', 'nota', 'estado_cambio', 'whatsapp'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de interacción inválido',
        tiposValidos
      });
    }

    if (!descripcion) {
      return res.status(400).json({
        success: false,
        message: 'La descripción es requerida'
      });
    }

    const interactionData = {
      lead_id,
      tipo,
      descripcion,
      usuario_id: usuario_id || req.user?.id, // Usar usuario autenticado si no se especifica
      fecha_proxima_accion,
      recordatorio: recordatorio || false
    };

    const nuevaInteraccion = await LeadInteraction.create(interactionData);

    res.status(201).json({
      success: true,
      message: 'Interacción creada exitosamente',
      data: nuevaInteraccion
    });
  } catch (error) {
    console.error('Error al crear interacción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear interacción',
      error: error.message
    });
  }
};

/**
 * Obtener timeline de interacciones de un lead
 * GET /api/interactions/lead/:leadId
 */
export const getInteractionsByLead = async (req, res) => {
  try {
    const { leadId } = req.params;

    if (!leadId) {
      return res.status(400).json({
        success: false,
        message: 'El ID del lead es requerido'
      });
    }

    const interacciones = await LeadInteraction.findByLeadId(leadId);

    res.json({
      success: true,
      data: interacciones,
      total: interacciones.length
    });
  } catch (error) {
    console.error('Error al obtener interacciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener interacciones',
      error: error.message
    });
  }
};

/**
 * Marcar interacción como completada
 * PATCH /api/interactions/:id/complete
 */
export const markAsCompleted = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'El ID de la interacción es requerido'
      });
    }

    const interaccionActualizada = await LeadInteraction.markAsCompleted(id);

    if (!interaccionActualizada) {
      return res.status(404).json({
        success: false,
        message: 'Interacción no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Interacción marcada como completada',
      data: interaccionActualizada
    });
  } catch (error) {
    console.error('Error al marcar interacción como completada:', error);
    res.status(500).json({
      success: false,
      message: 'Error al completar interacción',
      error: error.message
    });
  }
};

/**
 * Obtener recordatorios pendientes
 * GET /api/interactions/reminders
 */
export const getPendingReminders = async (req, res) => {
  try {
    const recordatorios = await LeadInteraction.findPendingReminders();

    res.json({
      success: true,
      data: recordatorios,
      total: recordatorios.length,
      message: recordatorios.length > 0
        ? `Tienes ${recordatorios.length} recordatorio(s) pendiente(s)`
        : 'No hay recordatorios pendientes'
    });
  } catch (error) {
    console.error('Error al obtener recordatorios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener recordatorios',
      error: error.message
    });
  }
};

/**
 * Obtener estadísticas de interacciones por lead
 * GET /api/interactions/stats/:leadId
 */
export const getInteractionStats = async (req, res) => {
  try {
    const { leadId } = req.params;

    if (!leadId) {
      return res.status(400).json({
        success: false,
        message: 'El ID del lead es requerido'
      });
    }

    const stats = await LeadInteraction.getStats(leadId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

/**
 * Eliminar una interacción
 * DELETE /api/interactions/:id
 */
export const deleteInteraction = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'El ID de la interacción es requerido'
      });
    }

    const interaccionEliminada = await LeadInteraction.delete(id);

    if (!interaccionEliminada) {
      return res.status(404).json({
        success: false,
        message: 'Interacción no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Interacción eliminada exitosamente',
      data: interaccionEliminada
    });
  } catch (error) {
    console.error('Error al eliminar interacción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar interacción',
      error: error.message
    });
  }
};

export default {
  createInteraction,
  getInteractionsByLead,
  markAsCompleted,
  getPendingReminders,
  getInteractionStats,
  deleteInteraction
};
