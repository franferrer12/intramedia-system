import api from './api';

/**
 * Reports Service
 * Handles all advanced financial reports API calls
 */

// ============================================================================
// P&L ENDPOINTS
// ============================================================================

/**
 * Get Profit & Loss statement
 * @param {string} fechaInicio - Start date (YYYY-MM-DD)
 * @param {string} fechaFin - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} P&L data with detail and summary
 */
export const getProfitLoss = async (fechaInicio, fechaFin) => {
  const response = await api.get('/reports/profit-loss', {
    params: { fechaInicio, fechaFin }
  });
  return response.data.data;
};

/**
 * Get P&L summary only
 * @param {string} fechaInicio - Start date (YYYY-MM-DD)
 * @param {string} fechaFin - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} P&L summary
 */
export const getProfitLossSummary = async (fechaInicio, fechaFin) => {
  const response = await api.get('/reports/profit-loss/summary', {
    params: { fechaInicio, fechaFin }
  });
  return response.data.data;
};

// ============================================================================
// CASH FLOW ENDPOINTS
// ============================================================================

/**
 * Get Cash Flow statement
 * @param {string} fechaInicio - Start date (YYYY-MM-DD)
 * @param {string} fechaFin - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Cash flow data with detail and summary
 */
export const getCashFlow = async (fechaInicio, fechaFin) => {
  const response = await api.get('/reports/cash-flow', {
    params: { fechaInicio, fechaFin }
  });
  return response.data.data;
};

/**
 * Get Cash Flow summary only
 * @param {string} fechaInicio - Start date (YYYY-MM-DD)
 * @param {string} fechaFin - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Cash flow summary
 */
export const getCashFlowSummary = async (fechaInicio, fechaFin) => {
  const response = await api.get('/reports/cash-flow/summary', {
    params: { fechaInicio, fechaFin }
  });
  return response.data.data;
};

// ============================================================================
// KPI ENDPOINTS
// ============================================================================

/**
 * Get Financial KPIs
 * @param {string} fechaInicio - Start date (YYYY-MM-DD)
 * @param {string} fechaFin - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} KPIs data with detail and summary
 */
export const getFinancialKPIs = async (fechaInicio, fechaFin) => {
  const response = await api.get('/reports/kpis', {
    params: { fechaInicio, fechaFin }
  });
  return response.data.data;
};

/**
 * Get KPIs summary only
 * @param {string} fechaInicio - Start date (YYYY-MM-DD)
 * @param {string} fechaFin - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} KPIs summary
 */
export const getKPIsSummary = async (fechaInicio, fechaFin) => {
  const response = await api.get('/reports/kpis/summary', {
    params: { fechaInicio, fechaFin }
  });
  return response.data.data;
};

// ============================================================================
// REVENUE ANALYSIS ENDPOINTS
// ============================================================================

/**
 * Get revenue breakdown by category
 * @param {string} fechaInicio - Start date (YYYY-MM-DD)
 * @param {string} fechaFin - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Revenue by category
 */
export const getRevenueByCategory = async (fechaInicio, fechaFin) => {
  const response = await api.get('/reports/revenue-by-category', {
    params: { fechaInicio, fechaFin }
  });
  return response.data.data;
};

/**
 * Get top DJs by revenue
 * @param {string} fechaInicio - Start date (YYYY-MM-DD)
 * @param {string} fechaFin - End date (YYYY-MM-DD)
 * @param {number} limit - Number of DJs to return (default: 10)
 * @returns {Promise<Array>} Top DJs
 */
export const getTopDJs = async (fechaInicio, fechaFin, limit = 10) => {
  const response = await api.get('/reports/top-djs', {
    params: { fechaInicio, fechaFin, limit }
  });
  return response.data.data;
};

// ============================================================================
// EXPENSE ANALYSIS ENDPOINTS
// ============================================================================

/**
 * Get expense breakdown by category
 * @param {string} fechaInicio - Start date (YYYY-MM-DD)
 * @param {string} fechaFin - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Expense breakdown
 */
export const getExpenseBreakdown = async (fechaInicio, fechaFin) => {
  const response = await api.get('/reports/expense-breakdown', {
    params: { fechaInicio, fechaFin }
  });
  return response.data.data;
};

// ============================================================================
// TRENDING & COMPARISON ENDPOINTS
// ============================================================================

/**
 * Get month-over-month growth
 * @param {string} fechaInicio - Start date (YYYY-MM-DD)
 * @param {string} fechaFin - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Growth data
 */
export const getMonthOverMonthGrowth = async (fechaInicio, fechaFin) => {
  const response = await api.get('/reports/growth', {
    params: { fechaInicio, fechaFin }
  });
  return response.data.data;
};

/**
 * Get year-over-year comparison
 * @param {number} año - Year to compare (YYYY)
 * @returns {Promise<Object>} YoY comparison
 */
export const getYearOverYearComparison = async (año) => {
  const response = await api.get('/reports/year-over-year', {
    params: { año }
  });
  return response.data.data;
};

// ============================================================================
// DASHBOARD ENDPOINT
// ============================================================================

/**
 * Get complete financial dashboard
 * @param {string} fechaInicio - Start date (YYYY-MM-DD)
 * @param {string} fechaFin - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Complete dashboard data
 */
export const getFinancialDashboard = async (fechaInicio, fechaFin) => {
  const response = await api.get('/reports/dashboard', {
    params: { fechaInicio, fechaFin }
  });
  return response.data.data;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
};

/**
 * Format percentage
 * @param {number} value - Value to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, decimals = 2) => {
  if (value === null || value === undefined) return '0.00%';
  return `${parseFloat(value).toFixed(decimals)}%`;
};

/**
 * Format number
 * @param {number} value - Value to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted number
 */
export const formatNumber = (value, decimals = 0) => {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

/**
 * Get default date range (current month)
 * @returns {Object} Date range with fechaInicio and fechaFin
 */
export const getDefaultDateRange = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    fechaInicio: firstDay.toISOString().split('T')[0],
    fechaFin: lastDay.toISOString().split('T')[0]
  };
};

/**
 * Get date range for last N months
 * @param {number} months - Number of months back
 * @returns {Object} Date range with fechaInicio and fechaFin
 */
export const getLastNMonths = (months = 3) => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    fechaInicio: firstDay.toISOString().split('T')[0],
    fechaFin: lastDay.toISOString().split('T')[0]
  };
};

/**
 * Get date range for year to date
 * @returns {Object} Date range with fechaInicio and fechaFin
 */
export const getYearToDate = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), 0, 1);
  const lastDay = new Date();

  return {
    fechaInicio: firstDay.toISOString().split('T')[0],
    fechaFin: lastDay.toISOString().split('T')[0]
  };
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
  getFinancialDashboard,

  // Utilities
  formatCurrency,
  formatPercentage,
  formatNumber,
  getDefaultDateRange,
  getLastNMonths,
  getYearToDate
};
