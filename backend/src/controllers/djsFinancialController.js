import DJ from '../models/DJ.js';

// ========================================
// ANÁLISIS FINANCIERO DE DJs
// ========================================

// Obtener estadísticas financieras de todos los DJs
export const getFinancialStats = async (req, res) => {
  try {
    const filters = {
      activo: req.query.activo !== undefined ? req.query.activo === 'true' : undefined,
      min_eventos: req.query.min_eventos ? parseInt(req.query.min_eventos) : undefined,
      orderBy: req.query.orderBy,
      orderDir: req.query.orderDir
    };

    const stats = await DJ.getFinancialStats(filters);

    res.json({
      success: true,
      count: stats.length,
      data: stats
    });
  } catch (error) {
    console.error('Error al obtener estadísticas financieras:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas financieras',
      error: error.message
    });
  }
};

// Obtener estadísticas financieras de un DJ específico
export const getFinancialStatsById = async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await DJ.getFinancialStatsById(parseInt(id));

    if (!stats) {
      return res.status(404).json({
        success: false,
        message: 'DJ no encontrado'
      });
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del DJ:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas del DJ',
      error: error.message
    });
  }
};

// Obtener top DJs por rentabilidad
export const getTopByRentabilidad = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const topDJs = await DJ.getTopByRentabilidad(limit);

    res.json({
      success: true,
      count: topDJs.length,
      data: topDJs
    });
  } catch (error) {
    console.error('Error al obtener top DJs:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener top DJs',
      error: error.message
    });
  }
};

// Obtener pagos pendientes
export const getPagosPendientes = async (req, res) => {
  try {
    const filters = {
      dj_id: req.query.dj_id ? parseInt(req.query.dj_id) : undefined,
      prioridad: req.query.prioridad
    };

    const pagos = await DJ.getPagosPendientes(filters);

    res.json({
      success: true,
      count: pagos.length,
      data: pagos
    });
  } catch (error) {
    console.error('Error al obtener pagos pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pagos pendientes',
      error: error.message
    });
  }
};

// Obtener resumen de pagos pendientes (agrupado por DJ)
export const getResumenPagosPendientes = async (req, res) => {
  try {
    const resumen = await DJ.getResumenPagosPendientes();

    res.json({
      success: true,
      count: resumen.length,
      data: resumen
    });
  } catch (error) {
    console.error('Error al obtener resumen de pagos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen de pagos',
      error: error.message
    });
  }
};

// Obtener rendimiento mensual
export const getRendimientoMensual = async (req, res) => {
  try {
    const filters = {
      dj_id: req.query.dj_id ? parseInt(req.query.dj_id) : undefined,
      año: req.query.año ? parseInt(req.query.año) : undefined,
      mes: req.query.mes ? parseInt(req.query.mes) : undefined
    };

    const rendimiento = await DJ.getRendimientoMensual(filters);

    res.json({
      success: true,
      count: rendimiento.length,
      data: rendimiento
    });
  } catch (error) {
    console.error('Error al obtener rendimiento mensual:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener rendimiento mensual',
      error: error.message
    });
  }
};

// Obtener comparativa de rendimiento
export const getComparativaRendimiento = async (req, res) => {
  try {
    const comparativa = await DJ.getComparativaRendimiento();

    res.json({
      success: true,
      count: comparativa.length,
      data: comparativa
    });
  } catch (error) {
    console.error('Error al obtener comparativa:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener comparativa de rendimiento',
      error: error.message
    });
  }
};

// Marcar evento como pagado
export const marcarEventoPagado = async (req, res) => {
  try {
    const { eventoId } = req.params;
    const evento = await DJ.marcarEventoPagado(parseInt(eventoId));

    if (!evento) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Evento marcado como pagado',
      data: evento
    });
  } catch (error) {
    console.error('Error al marcar evento como pagado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar evento como pagado',
      error: error.message
    });
  }
};

// Marcar múltiples eventos como pagados
export const marcarEventosPagados = async (req, res) => {
  try {
    const { eventoIds } = req.body;

    if (!Array.isArray(eventoIds) || eventoIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar un array de IDs de eventos'
      });
    }

    const eventos = await DJ.marcarEventosPagados(eventoIds);

    res.json({
      success: true,
      message: `${eventos.length} evento(s) marcado(s) como pagado(s)`,
      data: eventos
    });
  } catch (error) {
    console.error('Error al marcar eventos como pagados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar eventos como pagados',
      error: error.message
    });
  }
};
