import * as AdvancedReports from '../models/AdvancedReports.js';

/**
 * Advanced Reports Controller
 * Handles all advanced financial reporting endpoints
 */

// ============================================================================
// P&L ENDPOINTS
// ============================================================================

/**
 * Get Profit & Loss Statement
 * GET /api/reports/profit-loss?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
 */
export const getProfitLoss = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        message: 'fechaInicio y fechaFin son requeridos'
      });
    }

    const profitLoss = await AdvancedReports.getProfitLoss(fechaInicio, fechaFin);
    const summary = await AdvancedReports.getProfitLossSummary(fechaInicio, fechaFin);

    res.json({
      success: true,
      data: {
        detail: profitLoss,
        summary
      }
    });
  } catch (error) {
    console.error('Error in getProfitLoss:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el estado de resultados',
      error: error.message
    });
  }
};

/**
 * Get P&L Summary Only
 * GET /api/reports/profit-loss/summary?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
 */
export const getProfitLossSummary = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        message: 'fechaInicio y fechaFin son requeridos'
      });
    }

    const summary = await AdvancedReports.getProfitLossSummary(fechaInicio, fechaFin);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error in getProfitLossSummary:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el resumen de P&L',
      error: error.message
    });
  }
};

// ============================================================================
// CASH FLOW ENDPOINTS
// ============================================================================

/**
 * Get Cash Flow Statement
 * GET /api/reports/cash-flow?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
 */
export const getCashFlow = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        message: 'fechaInicio y fechaFin son requeridos'
      });
    }

    const cashFlow = await AdvancedReports.getCashFlow(fechaInicio, fechaFin);
    const summary = await AdvancedReports.getCashFlowSummary(fechaInicio, fechaFin);

    res.json({
      success: true,
      data: {
        detail: cashFlow,
        summary
      }
    });
  } catch (error) {
    console.error('Error in getCashFlow:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el flujo de efectivo',
      error: error.message
    });
  }
};

/**
 * Get Cash Flow Summary Only
 * GET /api/reports/cash-flow/summary?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
 */
export const getCashFlowSummary = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        message: 'fechaInicio y fechaFin son requeridos'
      });
    }

    const summary = await AdvancedReports.getCashFlowSummary(fechaInicio, fechaFin);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error in getCashFlowSummary:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el resumen de flujo de efectivo',
      error: error.message
    });
  }
};

// ============================================================================
// KPI ENDPOINTS
// ============================================================================

/**
 * Get Financial KPIs
 * GET /api/reports/kpis?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
 */
export const getFinancialKPIs = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        message: 'fechaInicio y fechaFin son requeridos'
      });
    }

    const kpis = await AdvancedReports.getFinancialKPIs(fechaInicio, fechaFin);
    const summary = await AdvancedReports.getKPIsSummary(fechaInicio, fechaFin);

    res.json({
      success: true,
      data: {
        detail: kpis,
        summary
      }
    });
  } catch (error) {
    console.error('Error in getFinancialKPIs:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los KPIs financieros',
      error: error.message
    });
  }
};

/**
 * Get KPIs Summary Only
 * GET /api/reports/kpis/summary?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
 */
export const getKPIsSummary = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        message: 'fechaInicio y fechaFin son requeridos'
      });
    }

    const summary = await AdvancedReports.getKPIsSummary(fechaInicio, fechaFin);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error in getKPIsSummary:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el resumen de KPIs',
      error: error.message
    });
  }
};

// ============================================================================
// REVENUE ANALYSIS ENDPOINTS
// ============================================================================

/**
 * Get Revenue by Category
 * GET /api/reports/revenue-by-category?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
 */
export const getRevenueByCategory = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        message: 'fechaInicio y fechaFin son requeridos'
      });
    }

    const revenueByCategory = await AdvancedReports.getRevenueByCategory(fechaInicio, fechaFin);

    res.json({
      success: true,
      data: revenueByCategory
    });
  } catch (error) {
    console.error('Error in getRevenueByCategory:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los ingresos por categoría',
      error: error.message
    });
  }
};

/**
 * Get Top DJs by Revenue
 * GET /api/reports/top-djs?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD&limit=10
 */
export const getTopDJs = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, limit = 10 } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        message: 'fechaInicio y fechaFin son requeridos'
      });
    }

    const topDJs = await AdvancedReports.getTopDJsByRevenue(
      fechaInicio,
      fechaFin,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: topDJs
    });
  } catch (error) {
    console.error('Error in getTopDJs:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los top DJs',
      error: error.message
    });
  }
};

// ============================================================================
// EXPENSE ANALYSIS ENDPOINTS
// ============================================================================

/**
 * Get Expense Breakdown
 * GET /api/reports/expense-breakdown?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
 */
export const getExpenseBreakdown = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        message: 'fechaInicio y fechaFin son requeridos'
      });
    }

    const expenseBreakdown = await AdvancedReports.getExpenseBreakdown(fechaInicio, fechaFin);

    res.json({
      success: true,
      data: expenseBreakdown
    });
  } catch (error) {
    console.error('Error in getExpenseBreakdown:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el desglose de gastos',
      error: error.message
    });
  }
};

// ============================================================================
// TRENDING & COMPARISON ENDPOINTS
// ============================================================================

/**
 * Get Month-over-Month Growth
 * GET /api/reports/growth?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
 */
export const getMonthOverMonthGrowth = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        message: 'fechaInicio y fechaFin son requeridos'
      });
    }

    const growth = await AdvancedReports.getMonthOverMonthGrowth(fechaInicio, fechaFin);

    res.json({
      success: true,
      data: growth
    });
  } catch (error) {
    console.error('Error in getMonthOverMonthGrowth:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el crecimiento mes a mes',
      error: error.message
    });
  }
};

/**
 * Get Year-over-Year Comparison
 * GET /api/reports/year-over-year?año=YYYY
 */
export const getYearOverYearComparison = async (req, res) => {
  try {
    const { año } = req.query;

    if (!año) {
      return res.status(400).json({
        success: false,
        message: 'año es requerido'
      });
    }

    const comparison = await AdvancedReports.getYearOverYearComparison(parseInt(año));

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('Error in getYearOverYearComparison:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la comparación año a año',
      error: error.message
    });
  }
};

// ============================================================================
// DASHBOARD ENDPOINT
// ============================================================================

/**
 * Get Complete Financial Dashboard
 * GET /api/reports/dashboard?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
 */
export const getFinancialDashboard = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        message: 'fechaInicio y fechaFin son requeridos'
      });
    }

    const dashboard = await AdvancedReports.getFinancialDashboard(fechaInicio, fechaFin);

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Error in getFinancialDashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el dashboard financiero',
      error: error.message
    });
  }
};

export default {
  // P&L
  getProfitLoss,
  getProfitLossSummary,

  // Cash Flow
  getCashFlow,
  getCashFlowSummary,

  // KPIs
  getFinancialKPIs,
  getKPIsSummary,

  // Revenue Analysis
  getRevenueByCategory,
  getTopDJs,

  // Expense Analysis
  getExpenseBreakdown,

  // Trending & Comparison
  getMonthOverMonthGrowth,
  getYearOverYearComparison,

  // Dashboard
  getFinancialDashboard
};
