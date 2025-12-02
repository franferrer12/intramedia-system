import pool from '../config/database.js';

/**
 * Advanced Reports Model
 * Provides access to financial reports (P&L, Cash Flow, KPIs)
 */

// ============================================================================
// PROFIT & LOSS (P&L)
// ============================================================================

/**
 * Get Profit & Loss statement
 * @param {Date} fechaInicio - Start date
 * @param {Date} fechaFin - End date
 * @returns {Promise<Array>} P&L data
 */
export const getProfitLoss = async (fechaInicio, fechaFin) => {
  const result = await pool.query(
    'SELECT * FROM get_profit_loss($1, $2)',
    [fechaInicio, fechaFin]
  );
  return result.rows;
};

/**
 * Get P&L summary (totals)
 * @param {Date} fechaInicio - Start date
 * @param {Date} fechaFin - End date
 * @returns {Promise<Object>} P&L summary
 */
export const getProfitLossSummary = async (fechaInicio, fechaFin) => {
  const result = await pool.query(
    `SELECT
      SUM(ingresos_brutos) as total_ingresos,
      SUM(costo_djs) as total_costos_dj,
      SUM(margen_bruto) as total_margen_bruto,
      SUM(gastos_operativos) as total_gastos_operativos,
      SUM(utilidad_operativa) as total_utilidad_operativa,
      SUM(utilidad_neta) as total_utilidad_neta,
      AVG(porcentaje_margen_bruto) as avg_margen_bruto,
      AVG(porcentaje_margen_operativo) as avg_margen_operativo,
      SUM(total_eventos) as total_eventos
    FROM get_profit_loss($1, $2)`,
    [fechaInicio, fechaFin]
  );
  return result.rows[0];
};

// ============================================================================
// CASH FLOW
// ============================================================================

/**
 * Get Cash Flow statement
 * @param {Date} fechaInicio - Start date
 * @param {Date} fechaFin - End date
 * @returns {Promise<Array>} Cash flow data
 */
export const getCashFlow = async (fechaInicio, fechaFin) => {
  const result = await pool.query(
    'SELECT * FROM get_cash_flow($1, $2)',
    [fechaInicio, fechaFin]
  );
  return result.rows;
};

/**
 * Get Cash Flow summary
 * @param {Date} fechaInicio - Start date
 * @param {Date} fechaFin - End date
 * @returns {Promise<Object>} Cash flow summary
 */
export const getCashFlowSummary = async (fechaInicio, fechaFin) => {
  const result = await pool.query(
    `SELECT
      SUM(entrada_efectivo_operaciones) as total_entradas,
      SUM(salida_efectivo_operaciones) as total_salidas,
      SUM(flujo_efectivo_operativo) as total_flujo_operativo,
      SUM(flujo_efectivo_neto) as total_flujo_neto,
      MAX(efectivo_acumulado) as efectivo_final
    FROM get_cash_flow($1, $2)`,
    [fechaInicio, fechaFin]
  );
  return result.rows[0];
};

// ============================================================================
// FINANCIAL KPIs
// ============================================================================

/**
 * Get Financial KPIs
 * @param {Date} fechaInicio - Start date
 * @param {Date} fechaFin - End date
 * @returns {Promise<Array>} KPIs data
 */
export const getFinancialKPIs = async (fechaInicio, fechaFin) => {
  const result = await pool.query(
    'SELECT * FROM get_financial_kpis($1, $2)',
    [fechaInicio, fechaFin]
  );
  return result.rows;
};

/**
 * Get KPIs summary (averages)
 * @param {Date} fechaInicio - Start date
 * @param {Date} fechaFin - End date
 * @returns {Promise<Object>} KPIs summary
 */
export const getKPIsSummary = async (fechaInicio, fechaFin) => {
  const result = await pool.query(
    `SELECT
      SUM(ingresos_brutos) as total_revenue,
      SUM(utilidad_neta) as total_profit,
      SUM(total_eventos) as total_events,
      AVG(roi_porcentaje) as avg_roi,
      AVG(margen_contribucion) as avg_margin,
      AVG(revenue_per_event) as avg_revenue_per_event,
      AVG(cost_per_event) as avg_cost_per_event,
      AVG(profit_per_event) as avg_profit_per_event,
      AVG(break_even_events) as avg_break_even
    FROM get_financial_kpis($1, $2)`,
    [fechaInicio, fechaFin]
  );
  return result.rows[0];
};

// ============================================================================
// REVENUE ANALYSIS
// ============================================================================

/**
 * Get Revenue by Category
 * @param {Date} fechaInicio - Start date
 * @param {Date} fechaFin - End date
 * @returns {Promise<Array>} Revenue by category
 */
export const getRevenueByCategory = async (fechaInicio, fechaFin) => {
  const result = await pool.query(
    `SELECT
      COALESCE(e.tipo, 'Sin categoría') as tipo_evento,
      COUNT(*) as total_eventos,
      SUM(e.cache_total) as ingresos_totales,
      ROUND(
        (SUM(e.cache_total) / (
          SELECT SUM(cache_total)
          FROM eventos
          WHERE fecha >= $1 AND fecha <= $2 AND deleted_at IS NULL
        ) * 100), 2
      ) as porcentaje_total
    FROM eventos e
    WHERE e.fecha >= $1
      AND e.fecha <= $2
      AND e.deleted_at IS NULL
      AND e.cache_total > 0
    GROUP BY e.tipo
    ORDER BY ingresos_totales DESC`,
    [fechaInicio, fechaFin]
  );
  return result.rows;
};

/**
 * Get Top DJs by Revenue
 * @param {Date} fechaInicio - Start date
 * @param {Date} fechaFin - End date
 * @param {number} limit - Number of DJs to return
 * @returns {Promise<Array>} Top DJs
 */
export const getTopDJsByRevenue = async (fechaInicio, fechaFin, limit = 10) => {
  const result = await pool.query(
    `SELECT
      d.id as dj_id,
      d.nombre as dj_nombre,
      COUNT(*) as total_eventos,
      SUM(e.cache_total) as ingresos_generados,
      SUM(e.parte_dj) as costo_total_dj,
      SUM(e.cache_total - e.parte_dj) as margen_generado
    FROM eventos e
    JOIN djs d ON e.dj_id = d.id
    WHERE e.fecha >= $1
      AND e.fecha <= $2
      AND e.deleted_at IS NULL
      AND d.deleted_at IS NULL
      AND e.cache_total > 0
    GROUP BY d.id, d.nombre
    ORDER BY ingresos_generados DESC
    LIMIT $3`,
    [fechaInicio, fechaFin, limit]
  );
  return result.rows;
};

// ============================================================================
// EXPENSE ANALYSIS
// ============================================================================

/**
 * Get Expense Breakdown
 * @param {Date} fechaInicio - Start date
 * @param {Date} fechaFin - End date
 * @returns {Promise<Array>} Expense breakdown
 */
export const getExpenseBreakdown = async (fechaInicio, fechaFin) => {
  const result = await pool.query(
    `SELECT
      'Gastos Fijos' as categoria,
      SUM(COALESCE(me.gastos_fijos_reales, 0)) as total_gastos,
      COUNT(*)::INTEGER as cantidad,
      100.0 as porcentaje_total
    FROM monthly_expenses me
    WHERE make_date(me.año, me.mes, 1) >= $1
      AND make_date(me.año, me.mes, 1) <= $2
    GROUP BY 'Gastos Fijos'

    UNION ALL

    SELECT
      'Inversión' as categoria,
      SUM(COALESCE(me.inversion_real, 0)) as total_gastos,
      COUNT(*)::INTEGER as cantidad,
      0.0 as porcentaje_total
    FROM monthly_expenses me
    WHERE make_date(me.año, me.mes, 1) >= $1
      AND make_date(me.año, me.mes, 1) <= $2
    GROUP BY 'Inversión'`,
    [fechaInicio, fechaFin]
  );
  return result.rows;
};

// ============================================================================
// TRENDING & COMPARISON
// ============================================================================

/**
 * Get Month-over-Month Growth
 * @param {Date} fechaInicio - Start date
 * @param {Date} fechaFin - End date
 * @returns {Promise<Array>} Growth data
 */
export const getMonthOverMonthGrowth = async (fechaInicio, fechaFin) => {
  const result = await pool.query(
    `WITH monthly_data AS (
      SELECT
        periodo,
        ingresos_brutos,
        utilidad_neta,
        total_eventos,
        LAG(ingresos_brutos) OVER (ORDER BY periodo) as prev_ingresos,
        LAG(utilidad_neta) OVER (ORDER BY periodo) as prev_utilidad,
        LAG(total_eventos) OVER (ORDER BY periodo) as prev_eventos
      FROM vw_profit_loss
      WHERE periodo >= $1 AND periodo <= $2
    )
    SELECT
      periodo,
      ingresos_brutos,
      utilidad_neta,
      total_eventos,
      CASE
        WHEN prev_ingresos > 0 THEN
          ROUND(((ingresos_brutos - prev_ingresos) / prev_ingresos * 100), 2)
        ELSE NULL
      END as crecimiento_ingresos,
      CASE
        WHEN prev_utilidad > 0 THEN
          ROUND(((utilidad_neta - prev_utilidad) / prev_utilidad * 100), 2)
        ELSE NULL
      END as crecimiento_utilidad,
      CASE
        WHEN prev_eventos > 0 THEN
          ROUND(((total_eventos - prev_eventos)::NUMERIC / prev_eventos * 100), 2)
        ELSE NULL
      END as crecimiento_eventos
    FROM monthly_data
    ORDER BY periodo DESC`,
    [fechaInicio, fechaFin]
  );
  return result.rows;
};

/**
 * Get Year-over-Year Comparison
 * @param {number} año - Year to compare
 * @returns {Promise<Object>} YoY comparison
 */
export const getYearOverYearComparison = async (año) => {
  const result = await pool.query(
    `SELECT
      EXTRACT(YEAR FROM periodo) as año,
      SUM(ingresos_brutos) as total_ingresos,
      SUM(utilidad_neta) as total_utilidad,
      SUM(total_eventos) as total_eventos,
      AVG(porcentaje_margen_bruto) as avg_margen
    FROM vw_profit_loss
    WHERE EXTRACT(YEAR FROM periodo) IN ($1, $1 - 1)
    GROUP BY EXTRACT(YEAR FROM periodo)
    ORDER BY año DESC`,
    [año]
  );

  if (result.rows.length === 2) {
    const currentYear = result.rows[0];
    const previousYear = result.rows[1];

    return {
      current_year: currentYear,
      previous_year: previousYear,
      growth: {
        ingresos: ((currentYear.total_ingresos - previousYear.total_ingresos) /
                   previousYear.total_ingresos * 100).toFixed(2),
        utilidad: ((currentYear.total_utilidad - previousYear.total_utilidad) /
                   previousYear.total_utilidad * 100).toFixed(2),
        eventos: ((currentYear.total_eventos - previousYear.total_eventos) /
                  previousYear.total_eventos * 100).toFixed(2)
      }
    };
  }

  return { current_year: result.rows[0] || null, previous_year: null, growth: null };
};

// ============================================================================
// DASHBOARD SUMMARY
// ============================================================================

/**
 * Get Complete Financial Dashboard
 * @param {Date} fechaInicio - Start date
 * @param {Date} fechaFin - End date
 * @returns {Promise<Object>} Complete dashboard data
 */
export const getFinancialDashboard = async (fechaInicio, fechaFin) => {
  const [
    pl_summary,
    cf_summary,
    kpis_summary,
    revenue_by_category,
    top_djs,
    expense_breakdown,
    growth
  ] = await Promise.all([
    getProfitLossSummary(fechaInicio, fechaFin),
    getCashFlowSummary(fechaInicio, fechaFin),
    getKPIsSummary(fechaInicio, fechaFin),
    getRevenueByCategory(fechaInicio, fechaFin),
    getTopDJsByRevenue(fechaInicio, fechaFin, 5),
    getExpenseBreakdown(fechaInicio, fechaFin),
    getMonthOverMonthGrowth(fechaInicio, fechaFin)
  ]);

  return {
    profit_loss: pl_summary,
    cash_flow: cf_summary,
    kpis: kpis_summary,
    revenue_by_category,
    top_djs,
    expense_breakdown,
    growth
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
  getTopDJsByRevenue,

  // Expense Analysis
  getExpenseBreakdown,

  // Trending
  getMonthOverMonthGrowth,
  getYearOverYearComparison,

  // Dashboard
  getFinancialDashboard
};
