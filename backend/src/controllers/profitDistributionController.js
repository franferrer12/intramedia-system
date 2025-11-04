import ProfitDistribution from '../models/ProfitDistribution.js';

// GET /api/profit-distribution/config - Obtener configuración actual
export const getConfig = async (req, res) => {
  try {
    const config = await ProfitDistribution.getConfig();

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró configuración activa'
      });
    }

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración',
      error: error.message
    });
  }
};

// PUT /api/profit-distribution/config - Actualizar configuración
export const updateConfig = async (req, res) => {
  try {
    const {
      porcentaje_socios,
      porcentaje_agencia,
      porcentaje_impuestos,
      porcentaje_costos_fijos
    } = req.body;

    // Validar que todos los campos estén presentes
    if (porcentaje_socios === undefined || porcentaje_agencia === undefined ||
        porcentaje_impuestos === undefined || porcentaje_costos_fijos === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Todos los porcentajes son requeridos'
      });
    }

    const config = await ProfitDistribution.update(req.body);

    res.json({
      success: true,
      message: 'Configuración actualizada exitosamente',
      data: config
    });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar configuración',
      error: error.message
    });
  }
};

// POST /api/profit-distribution/recalculate - Recalcular todos los eventos
export const recalculateEvents = async (req, res) => {
  try {
    const stats = await ProfitDistribution.recalculateAllEvents();

    res.json({
      success: true,
      message: 'Recálculo completado exitosamente',
      data: stats
    });
  } catch (error) {
    console.error('Error al recalcular eventos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al recalcular eventos',
      error: error.message
    });
  }
};
