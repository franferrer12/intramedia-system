import ExecutiveDashboard from '../models/ExecutiveDashboard.js';

/**
 * Executive Dashboard Controller
 * Handles requests for consolidated executive metrics
 */

/**
 * Get all consolidated metrics for executive dashboard
 * @route GET /api/executive-dashboard/metrics
 */
export const getConsolidatedMetrics = async (req, res) => {
  try {
    const result = await ExecutiveDashboard.getConsolidatedMetrics();
    res.json(result);
  } catch (error) {
    console.error('Error getting consolidated metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener métricas consolidadas',
      details: error.message
    });
  }
};

/**
 * Get financial health score
 * @route GET /api/executive-dashboard/health-score
 */
export const getFinancialHealthScore = async (req, res) => {
  try {
    const pool = await import('../config/database.js').then(m => m.default);
    const client = await pool.connect();

    try {
      const score = await ExecutiveDashboard.getFinancialHealthScore(client);

      // Determine health status based on score
      let status, color, message;
      if (score >= 80) {
        status = 'Excelente';
        color = 'green';
        message = 'La salud financiera del negocio es excelente. Continúa con las buenas prácticas.';
      } else if (score >= 60) {
        status = 'Buena';
        color = 'blue';
        message = 'La salud financiera es buena, pero hay áreas de mejora.';
      } else if (score >= 40) {
        status = 'Regular';
        color = 'yellow';
        message = 'Hay problemas que requieren atención inmediata.';
      } else {
        status = 'Crítica';
        color = 'red';
        message = 'La situación financiera requiere acción urgente.';
      }

      res.json({
        success: true,
        data: {
          score,
          status,
          color,
          message
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error getting financial health score:', error);
    res.status(500).json({
      success: false,
      error: 'Error al calcular índice de salud financiera',
      details: error.message
    });
  }
};

export default {
  getConsolidatedMetrics,
  getFinancialHealthScore
};
