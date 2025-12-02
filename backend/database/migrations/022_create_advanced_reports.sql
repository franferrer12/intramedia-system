-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 📊 ADVANCED FINANCIAL REPORTS - P&L, CASH FLOW, BALANCE SHEET
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Migration: 022
-- Description: SQL views and functions for advanced financial reporting
-- Dependencies: eventos, monthly_expenses, profit_distribution tables
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Drop existing objects (idempotent)
DROP VIEW IF EXISTS vw_profit_loss CASCADE;
DROP VIEW IF EXISTS vw_cash_flow CASCADE;
DROP VIEW IF EXISTS vw_monthly_revenue CASCADE;
DROP VIEW IF EXISTS vw_monthly_expenses CASCADE;
DROP VIEW IF EXISTS vw_financial_kpis CASCADE;
DROP FUNCTION IF EXISTS get_profit_loss(DATE, DATE) CASCADE;
DROP FUNCTION IF EXISTS get_cash_flow(DATE, DATE) CASCADE;
DROP FUNCTION IF EXISTS get_financial_kpis(DATE, DATE) CASCADE;
DROP FUNCTION IF EXISTS get_revenue_by_category(DATE, DATE) CASCADE;

-- ============================================================================
-- REVENUE VIEWS
-- ============================================================================

-- Monthly revenue aggregated view
CREATE OR REPLACE VIEW vw_monthly_revenue AS
SELECT
    DATE_TRUNC('month', fecha) as mes,
    COUNT(*) as total_eventos,
    SUM(cache_total) as ingresos_brutos,
    SUM(parte_dj) as costos_dj,
    SUM(cache_total - parte_dj) as margen_bruto,
    CASE
        WHEN SUM(cache_total) > 0 THEN
            ROUND((SUM(cache_total - parte_dj) / SUM(cache_total) * 100), 2)
        ELSE 0
    END as porcentaje_margen,
    AVG(cache_total) as ticket_promedio
FROM eventos
WHERE deleted_at IS NULL
    AND cache_total > 0
GROUP BY DATE_TRUNC('month', fecha)
ORDER BY mes DESC;

-- ============================================================================
-- EXPENSE VIEWS
-- ============================================================================

-- Monthly expenses aggregated view
-- Monthly expenses aggregated view
CREATE OR REPLACE VIEW vw_monthly_expenses AS
SELECT
    make_date(año, mes, 1) as mes,
    COALESCE(gastos_fijos_reales, 0) + COALESCE(inversion_real, 0) as gastos_totales,
    1::INTEGER as cantidad_gastos,
    desglose_gastos as detalle_gastos
FROM monthly_expenses
WHERE gastos_fijos_reales IS NOT NULL OR inversion_real IS NOT NULL
ORDER BY año DESC, mes DESC;
