import Lead from '../models/Lead.js';
import Cliente from '../models/Cliente.js';
import { sendInternalNotification } from '../services/notificationService.js';

/**
 * Obtener todos los leads
 */
export const getAllLeads = async (req, res) => {
  try {
    const { estado, fuente, convertido } = req.query;

    const filters = {};
    if (estado) filters.estado = estado;
    if (fuente) filters.fuente = fuente;
    if (convertido !== undefined) filters.convertido = convertido === 'true';

    const leads = await Lead.findAll(filters);

    res.json({
      success: true,
      data: leads,
      total: leads.length
    });
  } catch (error) {
    console.error('Error al obtener leads:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener leads',
      error: error.message
    });
  }
};

/**
 * Obtener leads agrupados por estado (para vista Kanban)
 */
export const getLeadsByEstado = async (req, res) => {
  try {
    const leadsPorEstado = await Lead.findByEstado();

    res.json({
      success: true,
      data: leadsPorEstado
    });
  } catch (error) {
    console.error('Error al obtener leads por estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener leads por estado',
      error: error.message
    });
  }
};

/**
 * Obtener un lead por ID
 */
export const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await Lead.findById(id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead no encontrado'
      });
    }

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Error al obtener lead:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener lead',
      error: error.message
    });
  }
};

/**
 * Crear un nuevo lead
 */
export const createLead = async (req, res) => {
  try {
    const leadData = req.body;

    // Validación básica
    if (!leadData.nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es requerido'
      });
    }

    if (!leadData.email && !leadData.telefono) {
      return res.status(400).json({
        success: false,
        message: 'Email o teléfono es requerido'
      });
    }

    const nuevoLead = await Lead.create(leadData);

    // Enviar notificación interna al equipo
    await sendInternalNotification(nuevoLead);

    res.status(201).json({
      success: true,
      message: 'Lead creado exitosamente',
      data: nuevoLead
    });
  } catch (error) {
    console.error('Error al crear lead:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear lead',
      error: error.message
    });
  }
};

/**
 * Actualizar un lead
 */
export const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const leadData = req.body;

    const leadActualizado = await Lead.update(id, leadData);

    if (!leadActualizado) {
      return res.status(404).json({
        success: false,
        message: 'Lead no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Lead actualizado exitosamente',
      data: leadActualizado
    });
  } catch (error) {
    console.error('Error al actualizar lead:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar lead',
      error: error.message
    });
  }
};

/**
 * Actualizar estado de un lead
 */
export const updateLeadEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado) {
      return res.status(400).json({
        success: false,
        message: 'El estado es requerido'
      });
    }

    const estadosValidos = ['nuevo', 'contactado', 'propuesta', 'ganado', 'perdido'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido',
        estadosValidos
      });
    }

    const leadActualizado = await Lead.updateEstado(id, estado);

    if (!leadActualizado) {
      return res.status(404).json({
        success: false,
        message: 'Lead no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      data: leadActualizado
    });
  } catch (error) {
    console.error('Error al actualizar estado del lead:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado del lead',
      error: error.message
    });
  }
};

/**
 * Agregar nota a un lead
 */
export const addNotaToLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { nota } = req.body;

    if (!nota) {
      return res.status(400).json({
        success: false,
        message: 'La nota es requerida'
      });
    }

    const timestamp = new Date().toLocaleString('es-ES');
    const notaConFecha = `[${timestamp}] ${nota}`;

    const leadActualizado = await Lead.addNota(id, notaConFecha);

    if (!leadActualizado) {
      return res.status(404).json({
        success: false,
        message: 'Lead no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Nota agregada exitosamente',
      data: leadActualizado
    });
  } catch (error) {
    console.error('Error al agregar nota:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar nota',
      error: error.message
    });
  }
};

/**
 * Convertir lead a cliente
 */
export const convertLeadToCliente = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener datos del lead
    const lead = await Lead.findById(id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead no encontrado'
      });
    }

    if (lead.convertido_a_cliente) {
      return res.status(400).json({
        success: false,
        message: 'Este lead ya fue convertido a cliente',
        cliente_id: lead.cliente_id
      });
    }

    // Crear el cliente con los datos del lead
    const clienteData = {
      nombre: lead.empresa || lead.nombre,
      contacto: lead.nombre,
      email: lead.email,
      telefono: lead.telefono,
      ciudad: lead.ciudad,
      observaciones: `Convertido desde lead #${lead.id}. ${lead.notas || ''}`
    };

    const nuevoCliente = await Cliente.create(clienteData);

    // Actualizar el lead
    const leadActualizado = await Lead.convertToCliente(lead.id, nuevoCliente.id);

    res.json({
      success: true,
      message: 'Lead convertido a cliente exitosamente',
      data: {
        lead: leadActualizado,
        cliente: nuevoCliente
      }
    });
  } catch (error) {
    console.error('Error al convertir lead a cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al convertir lead a cliente',
      error: error.message
    });
  }
};

/**
 * Marcar lead como perdido
 */
export const markLeadAsPerdido = async (req, res) => {
  try {
    const { id } = req.params;
    const { razon } = req.body;

    const leadActualizado = await Lead.markAsPerdido(id, razon || 'Sin razón especificada');

    if (!leadActualizado) {
      return res.status(404).json({
        success: false,
        message: 'Lead no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Lead marcado como perdido',
      data: leadActualizado
    });
  } catch (error) {
    console.error('Error al marcar lead como perdido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar lead como perdido',
      error: error.message
    });
  }
};

/**
 * Obtener estadísticas de leads
 */
export const getLeadsStats = async (req, res) => {
  try {
    const stats = await Lead.getStats();

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
 * Eliminar lead (soft delete)
 */
export const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;

    const leadEliminado = await Lead.delete(id);

    if (!leadEliminado) {
      return res.status(404).json({
        success: false,
        message: 'Lead no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Lead eliminado exitosamente',
      data: leadEliminado
    });
  } catch (error) {
    console.error('Error al eliminar lead:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar lead',
      error: error.message
    });
  }
};

/**
 * Endpoint público para crear lead (desde formulario web)
 */
export const createLeadPublic = async (req, res) => {
  try {
    const leadData = {
      ...req.body,
      fuente: req.body.fuente || 'web'
    };

    // Validación básica
    if (!leadData.nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es requerido'
      });
    }

    if (!leadData.email && !leadData.telefono) {
      return res.status(400).json({
        success: false,
        message: 'Email o teléfono es requerido'
      });
    }

    const nuevoLead = await Lead.create(leadData);

    // Enviar notificación interna al equipo
    await sendInternalNotification(nuevoLead);

    res.status(201).json({
      success: true,
      message: '¡Gracias por tu interés! Nos pondremos en contacto contigo pronto.',
      data: {
        id: nuevoLead.id,
        nombre: nuevoLead.nombre
      }
    });
  } catch (error) {
    console.error('Error al crear lead público:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar tu solicitud. Por favor intenta de nuevo.',
      error: error.message
    });
  }
};
