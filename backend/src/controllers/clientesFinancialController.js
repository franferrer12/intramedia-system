import Cliente from '../models/Cliente.js';

// =====================================================
// Estadísticas Financieras de Clientes
// =====================================================

// GET /api/clientes-financial/financial-stats
export const getFinancialStats = async (req, res) => {
  try {
    const filters = {
      activo: req.query.activo !== undefined ? req.query.activo === 'true' : undefined,
      clasificacion: req.query.clasificacion,
      estado_actividad: req.query.estado_actividad,
      min_eventos: req.query.min_eventos ? parseInt(req.query.min_eventos) : undefined,
      orderBy: req.query.orderBy,
      orderDir: req.query.orderDir
    };

    const stats = await Cliente.getFinancialStats(filters);

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

// GET /api/clientes-financial/financial-stats/:id
export const getFinancialStatsById = async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await Cliente.getFinancialStatsById(id);

    if (!stats) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas del cliente',
      error: error.message
    });
  }
};

// =====================================================
// Cobros Pendientes
// =====================================================

// GET /api/clientes-financial/cobros-pendientes
export const getCobrosPendientes = async (req, res) => {
  try {
    const filters = {
      prioridad: req.query.prioridad,
      cliente_id: req.query.cliente_id,
      alto_riesgo: req.query.alto_riesgo !== undefined ? req.query.alto_riesgo === 'true' : undefined
    };

    const cobros = await Cliente.getCobrosPendientes(filters);

    res.json({
      success: true,
      count: cobros.length,
      data: cobros
    });
  } catch (error) {
    console.error('Error al obtener cobros pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cobros pendientes',
      error: error.message
    });
  }
};

// GET /api/clientes-financial/cobros-pendientes/resumen
export const getResumenCobrosPendientes = async (req, res) => {
  try {
    const resumen = await Cliente.getResumenCobrosPendientes();

    res.json({
      success: true,
      data: resumen
    });
  } catch (error) {
    console.error('Error al obtener resumen de cobros pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen de cobros pendientes',
      error: error.message
    });
  }
};

// PUT /api/clientes-financial/eventos/:eventoId/marcar-cobrado
export const marcarEventoCobrado = async (req, res) => {
  try {
    const { eventoId } = req.params;
    const evento = await Cliente.marcarEventoCobrado(eventoId);

    if (!evento) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Evento marcado como cobrado exitosamente',
      data: evento
    });
  } catch (error) {
    console.error('Error al marcar evento como cobrado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar evento como cobrado',
      error: error.message
    });
  }
};

// PUT /api/clientes-financial/eventos/marcar-cobrados
export const marcarEventosCobrados = async (req, res) => {
  try {
    const { eventoIds } = req.body;

    if (!eventoIds || !Array.isArray(eventoIds) || eventoIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de IDs de eventos'
      });
    }

    const eventos = await Cliente.marcarEventosCobrados(eventoIds);

    res.json({
      success: true,
      message: `${eventos.length} evento(s) marcado(s) como cobrado(s)`,
      data: eventos
    });
  } catch (error) {
    console.error('Error al marcar eventos como cobrados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar eventos como cobrados',
      error: error.message
    });
  }
};

// =====================================================
// Rendimiento y Análisis
// =====================================================

// GET /api/clientes-financial/rendimiento-mensual
export const getRendimientoMensual = async (req, res) => {
  try {
    const filters = {
      cliente_id: req.query.cliente_id,
      año: req.query.año,
      mes: req.query.mes
    };

    const rendimiento = await Cliente.getRendimientoMensual(filters);

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

// GET /api/clientes-financial/top-rentabilidad
export const getTopByRentabilidad = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const topClientes = await Cliente.getTopByRentabilidad(limit);

    res.json({
      success: true,
      count: topClientes.length,
      data: topClientes
    });
  } catch (error) {
    console.error('Error al obtener top clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener top clientes por rentabilidad',
      error: error.message
    });
  }
};

// GET /api/clientes-financial/comparativa-rendimiento
export const getComparativaRendimiento = async (req, res) => {
  try {
    const comparativa = await Cliente.getComparativaRendimiento();

    res.json({
      success: true,
      count: comparativa.length,
      data: comparativa
    });
  } catch (error) {
    console.error('Error al obtener comparativa de rendimiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener comparativa de rendimiento',
      error: error.message
    });
  }
};

// GET /api/clientes-financial/fidelidad
export const getFidelidad = async (req, res) => {
  try {
    const filters = {
      nivel_fidelidad: req.query.nivel_fidelidad,
      riesgo_perdida: req.query.riesgo_perdida
    };

    const fidelidad = await Cliente.getFidelidad(filters);

    res.json({
      success: true,
      count: fidelidad.length,
      data: fidelidad
    });
  } catch (error) {
    console.error('Error al obtener análisis de fidelidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener análisis de fidelidad',
      error: error.message
    });
  }
};
