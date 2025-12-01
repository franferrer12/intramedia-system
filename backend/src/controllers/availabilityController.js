/**
 * Availability Controller
 * Gestión de disponibilidad de DJs
 */

import Availability from '../models/Availability.js';
import logger from '../utils/logger.js';

/**
 * Obtener todas las disponibilidades con filtros
 */
export const getAllAvailabilities = async (req, res) => {
  try {
    const filters = {
      dj_id: req.query.dj_id,
      agency_id: req.agency?.id || req.query.agency_id,
      estado: req.query.estado,
      fecha_desde: req.query.fecha_desde,
      fecha_hasta: req.query.fecha_hasta,
      page: req.query.page || 1,
      limit: req.query.limit || 50
    };

    const result = await Availability.findAll(filters);

    res.json(result);
  } catch (error) {
    logger.error('Error getting availabilities:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener disponibilidades',
      error: error.message
    });
  }
};

/**
 * Obtener disponibilidad por ID
 */
export const getAvailabilityById = async (req, res) => {
  try {
    const { id } = req.params;
    const availability = await Availability.findById(id);

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'Disponibilidad no encontrada'
      });
    }

    res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    logger.error('Error getting availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener disponibilidad',
      error: error.message
    });
  }
};

/**
 * Crear/Actualizar disponibilidad
 */
export const upsertAvailability = async (req, res) => {
  try {
    const data = {
      ...req.body,
      created_by: req.user?.id
    };

    const availability = await Availability.upsert(data);

    res.status(201).json({
      success: true,
      message: 'Disponibilidad guardada exitosamente',
      data: availability
    });
  } catch (error) {
    logger.error('Error upserting availability:', error);

    if (error.message.includes('ya existe')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al guardar disponibilidad',
      error: error.message
    });
  }
};

/**
 * Actualizar disponibilidad
 */
export const updateAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const availability = await Availability.update(id, updates);

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'Disponibilidad no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Disponibilidad actualizada exitosamente',
      data: availability
    });
  } catch (error) {
    logger.error('Error updating availability:', error);

    if (error.message.includes('conflicto')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar disponibilidad',
      error: error.message
    });
  }
};

/**
 * Eliminar disponibilidad
 */
export const deleteAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    await Availability.delete(id);

    res.json({
      success: true,
      message: 'Disponibilidad eliminada exitosamente'
    });
  } catch (error) {
    logger.error('Error deleting availability:', error);

    if (error.message.includes('no encontrada')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al eliminar disponibilidad',
      error: error.message
    });
  }
};

/**
 * Verificar disponibilidad de DJ
 */
export const checkAvailability = async (req, res) => {
  try {
    const { dj_id, fecha, hora_inicio, hora_fin } = req.query;

    if (!dj_id || !fecha) {
      return res.status(400).json({
        success: false,
        message: 'dj_id y fecha son requeridos'
      });
    }

    const result = await Availability.checkAvailability(
      dj_id,
      fecha,
      hora_inicio,
      hora_fin
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar disponibilidad',
      error: error.message
    });
  }
};

/**
 * Detectar conflictos avanzados
 */
export const detectConflicts = async (req, res) => {
  try {
    const { dj_id, fecha, hora_inicio, hora_fin, exclude_id } = req.query;

    if (!dj_id || !fecha) {
      return res.status(400).json({
        success: false,
        message: 'dj_id y fecha son requeridos'
      });
    }

    const result = await Availability.detectConflicts(
      dj_id,
      fecha,
      hora_inicio,
      hora_fin,
      exclude_id
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error detecting conflicts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al detectar conflictos',
      error: error.message
    });
  }
};

/**
 * Buscar DJs disponibles
 */
export const findAvailableDJs = async (req, res) => {
  try {
    const { fecha, hora_inicio, hora_fin } = req.query;

    if (!fecha) {
      return res.status(400).json({
        success: false,
        message: 'fecha es requerida'
      });
    }

    const criteria = {
      fecha,
      hora_inicio,
      hora_fin,
      agency_id: req.agency?.id || req.query.agency_id
    };

    const djs = await Availability.findAvailableDJs(criteria);

    res.json({
      success: true,
      data: djs,
      count: djs.length
    });
  } catch (error) {
    logger.error('Error finding available DJs:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar DJs disponibles',
      error: error.message
    });
  }
};

/**
 * Obtener calendario mensual de DJ
 */
export const getCalendar = async (req, res) => {
  try {
    const { dj_id } = req.params;
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'year y month son requeridos'
      });
    }

    const calendar = await Availability.getByMonth(dj_id, year, month);

    res.json({
      success: true,
      data: calendar
    });
  } catch (error) {
    logger.error('Error getting calendar:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener calendario',
      error: error.message
    });
  }
};

/**
 * Obtener disponibilidad por rango de fechas
 */
export const getByDateRange = async (req, res) => {
  try {
    const { dj_id } = req.params;
    const { fecha_inicio, fecha_fin } = req.query;

    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({
        success: false,
        message: 'fecha_inicio y fecha_fin son requeridos'
      });
    }

    const availability = await Availability.getByDateRange(dj_id, fecha_inicio, fecha_fin);

    res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    logger.error('Error getting availability by date range:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener disponibilidad',
      error: error.message
    });
  }
};

/**
 * Obtener disponibilidad de agencia por mes
 */
export const getAgencyAvailability = async (req, res) => {
  try {
    const agencyId = req.agency?.id || req.params.agency_id;
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'year y month son requeridos'
      });
    }

    const availability = await Availability.getAgencyAvailability(agencyId, year, month);

    res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    logger.error('Error getting agency availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener disponibilidad de agencia',
      error: error.message
    });
  }
};

/**
 * Marcar fecha como no disponible
 */
export const markUnavailable = async (req, res) => {
  try {
    const { dj_id, fecha, motivo, notas } = req.body;

    if (!dj_id || !fecha) {
      return res.status(400).json({
        success: false,
        message: 'dj_id y fecha son requeridos'
      });
    }

    const availability = await Availability.markUnavailable(dj_id, fecha, motivo, notas);

    res.status(201).json({
      success: true,
      message: 'Fecha marcada como no disponible',
      data: availability
    });
  } catch (error) {
    logger.error('Error marking unavailable:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar fecha',
      error: error.message
    });
  }
};

/**
 * Marcar fecha como disponible
 */
export const markAvailable = async (req, res) => {
  try {
    const { dj_id, fecha } = req.body;

    if (!dj_id || !fecha) {
      return res.status(400).json({
        success: false,
        message: 'dj_id y fecha son requeridos'
      });
    }

    const availability = await Availability.markAvailable(dj_id, fecha);

    res.status(201).json({
      success: true,
      message: 'Fecha marcada como disponible',
      data: availability
    });
  } catch (error) {
    logger.error('Error marking available:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar fecha',
      error: error.message
    });
  }
};

/**
 * Reservar fecha para evento
 */
export const reserveForEvent = async (req, res) => {
  try {
    const { dj_id, fecha, evento_id, hora_inicio, hora_fin } = req.body;

    if (!dj_id || !fecha || !evento_id) {
      return res.status(400).json({
        success: false,
        message: 'dj_id, fecha y evento_id son requeridos'
      });
    }

    const availability = await Availability.reserveForEvent(
      dj_id,
      fecha,
      evento_id,
      hora_inicio,
      hora_fin
    );

    res.status(201).json({
      success: true,
      message: 'Fecha reservada para evento',
      data: availability
    });
  } catch (error) {
    logger.error('Error reserving for event:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reservar fecha',
      error: error.message
    });
  }
};

/**
 * Bloquear rango de fechas
 */
export const blockDateRange = async (req, res) => {
  try {
    const { dj_id, fecha_inicio, fecha_fin, motivo, notas } = req.body;

    if (!dj_id || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({
        success: false,
        message: 'dj_id, fecha_inicio y fecha_fin son requeridos'
      });
    }

    const results = await Availability.blockDateRange(
      dj_id,
      fecha_inicio,
      fecha_fin,
      motivo,
      notas
    );

    res.status(201).json({
      success: true,
      message: `${results.length} fechas bloqueadas exitosamente`,
      data: results
    });
  } catch (error) {
    logger.error('Error blocking date range:', error);
    res.status(500).json({
      success: false,
      message: 'Error al bloquear rango de fechas',
      error: error.message
    });
  }
};

/**
 * Obtener estadísticas de disponibilidad
 */
export const getStats = async (req, res) => {
  try {
    const { dj_id } = req.params;
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'year y month son requeridos'
      });
    }

    const stats = await Availability.getStats(dj_id, year, month);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

/**
 * Limpiar registros antiguos
 */
export const cleanupOld = async (req, res) => {
  try {
    const { days } = req.query;
    const daysToKeep = days ? parseInt(days) : 90;

    const result = await Availability.cleanupOld(daysToKeep);

    res.json({
      success: true,
      message: `${result.cleaned} registros antiguos eliminados`,
      data: result
    });
  } catch (error) {
    logger.error('Error cleaning up old records:', error);
    res.status(500).json({
      success: false,
      message: 'Error al limpiar registros antiguos',
      error: error.message
    });
  }
};

/**
 * Obtener sugerencias inteligentes de DJs alternativos
 * Usa algoritmo de similitud para recomendar DJs cuando el original no está disponible
 */
export const getSmartSuggestions = async (req, res) => {
  try {
    const { original_dj_id, fecha, hora_inicio, hora_fin, agency_id } = req.query;

    if (!original_dj_id || !fecha) {
      return res.status(400).json({
        success: false,
        message: 'original_dj_id y fecha son requeridos'
      });
    }

    const criteria = {
      original_dj_id: parseInt(original_dj_id),
      fecha,
      hora_inicio,
      hora_fin,
      agency_id: agency_id || req.agency?.id
    };

    const suggestions = await Availability.findSmartSuggestions(criteria);

    res.json({
      success: true,
      data: suggestions,
      count: suggestions.length,
      message: suggestions.length > 0
        ? `Se encontraron ${suggestions.length} DJs alternativos disponibles`
        : 'No se encontraron DJs alternativos disponibles'
    });
  } catch (error) {
    logger.error('Error getting smart suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener sugerencias inteligentes',
      error: error.message
    });
  }
};

/**
 * Obtener resumen completo del calendario mensual
 * Incluye todos los días del mes con estadísticas agregadas
 */
export const getCalendarSummary = async (req, res) => {
  try {
    const { year, month } = req.query;
    const { dj_id, agency_id } = req.params;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'year y month son requeridos (formato: YYYY y MM)'
      });
    }

    // Validar formato de year y month
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (yearNum < 2020 || yearNum > 2100 || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        message: 'year o month inválidos'
      });
    }

    const summary = await Availability.getCalendarSummary(
      dj_id || null,
      agency_id || req.agency?.id || null,
      year,
      month
    );

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Error getting calendar summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen del calendario',
      error: error.message
    });
  }
};

/**
 * Notificar conflictos de disponibilidad
 * Crea notificaciones automáticas cuando se detectan conflictos
 */
export const notifyConflicts = async (req, res) => {
  try {
    const { dj_id, fecha, conflicts } = req.body;

    if (!dj_id || !fecha || !conflicts) {
      return res.status(400).json({
        success: false,
        message: 'dj_id, fecha y conflicts son requeridos'
      });
    }

    if (!Array.isArray(conflicts)) {
      return res.status(400).json({
        success: false,
        message: 'conflicts debe ser un array'
      });
    }

    const result = await Availability.notifyConflicts(
      parseInt(dj_id),
      fecha,
      conflicts
    );

    res.json({
      success: true,
      message: result.message || 'Notificaciones enviadas exitosamente',
      data: result
    });
  } catch (error) {
    logger.error('Error notifying conflicts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar notificaciones de conflictos',
      error: error.message
    });
  }
};

export default {
  getAllAvailabilities,
  getAvailabilityById,
  upsertAvailability,
  updateAvailability,
  deleteAvailability,
  checkAvailability,
  detectConflicts,
  findAvailableDJs,
  getCalendar,
  getByDateRange,
  getAgencyAvailability,
  markUnavailable,
  markAvailable,
  reserveForEvent,
  blockDateRange,
  getStats,
  cleanupOld,
  getSmartSuggestions,
  getCalendarSummary,
  notifyConflicts
};
