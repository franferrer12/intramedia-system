import ComparativeAnalysis from '../models/ComparativeAnalysis.js';

/**
 * Comparative Analysis Controller
 * Handles advanced analytics and comparison requests
 */

/**
 * Get period-over-period comparison
 * @route GET /api/comparative-analysis/period-comparison
 * @query {string} metric - Metric to compare (revenue, events, etc)
 * @query {string} period - Period type (day, week, month, quarter, year)
 * @query {string} startDate - Start date (optional)
 * @query {string} endDate - End date (optional)
 */
export const getPeriodComparison = async (req, res) => {
  try {
    const { metric = 'revenue', period = 'month', startDate, endDate } = req.query;

    const data = await ComparativeAnalysis.getPeriodComparison({
      metric,
      period,
      startDate,
      endDate
    });

    res.json({
      success: true,
      data,
      params: { metric, period, startDate, endDate }
    });
  } catch (error) {
    console.error('Error in getPeriodComparison:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener comparación por período',
      details: error.message
    });
  }
};

/**
 * Get client comparative analysis
 * @route GET /api/comparative-analysis/client/:clientId
 */
export const getClientComparison = async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        error: 'ID de cliente requerido'
      });
    }

    const data = await ComparativeAnalysis.getClientComparison(clientId);

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in getClientComparison:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener análisis comparativo del cliente',
      details: error.message
    });
  }
};

/**
 * Get DJ comparative analysis
 * @route GET /api/comparative-analysis/dj/:djId
 */
export const getDJComparison = async (req, res) => {
  try {
    const { djId } = req.params;

    if (!djId) {
      return res.status(400).json({
        success: false,
        error: 'ID de DJ requerido'
      });
    }

    const data = await ComparativeAnalysis.getDJComparison(djId);

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'DJ no encontrado'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in getDJComparison:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener análisis comparativo del DJ',
      details: error.message
    });
  }
};

/**
 * Get seasonal analysis
 * @route GET /api/comparative-analysis/seasonal
 */
export const getSeasonalAnalysis = async (req, res) => {
  try {
    const data = await ComparativeAnalysis.getSeasonalAnalysis();

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in getSeasonalAnalysis:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener análisis estacional',
      details: error.message
    });
  }
};

/**
 * Get trend forecast
 * @route GET /api/comparative-analysis/forecast
 * @query {string} metric - Metric to forecast (revenue, events, profit)
 * @query {number} periods - Number of periods to forecast (default: 6)
 */
export const getTrendForecast = async (req, res) => {
  try {
    const { metric = 'revenue', periods = 6 } = req.query;
    const periodsNum = parseInt(periods, 10);

    if (isNaN(periodsNum) || periodsNum < 1 || periodsNum > 24) {
      return res.status(400).json({
        success: false,
        error: 'Períodos debe ser un número entre 1 y 24'
      });
    }

    const data = await ComparativeAnalysis.getTrendForecast({
      metric,
      periods: periodsNum
    });

    res.json({
      success: true,
      data,
      params: { metric, periods: periodsNum }
    });
  } catch (error) {
    console.error('Error in getTrendForecast:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener pronóstico de tendencias',
      details: error.message
    });
  }
};

/**
 * Get top performers comparison
 * @route GET /api/comparative-analysis/top-performers
 * @query {string} entity - Entity type (client or dj)
 * @query {number} limit - Number of top performers (default: 10)
 */
export const getTopPerformersComparison = async (req, res) => {
  try {
    const { entity = 'client', limit = 10 } = req.query;
    const limitNum = parseInt(limit, 10);

    if (!['client', 'dj'].includes(entity)) {
      return res.status(400).json({
        success: false,
        error: 'Entity debe ser "client" o "dj"'
      });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'Limit debe ser un número entre 1 y 100'
      });
    }

    const data = await ComparativeAnalysis.getTopPerformersComparison({
      entity,
      limit: limitNum
    });

    res.json({
      success: true,
      data,
      params: { entity, limit: limitNum }
    });
  } catch (error) {
    console.error('Error in getTopPerformersComparison:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener comparación de mejores performers',
      details: error.message
    });
  }
};

export default {
  getPeriodComparison,
  getClientComparison,
  getDJComparison,
  getSeasonalAnalysis,
  getTrendForecast,
  getTopPerformersComparison
};
