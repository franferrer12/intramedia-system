import pool from '../config/database.js';

/**
 * Comparative Analysis Model
 * Advanced analytics for period-over-period comparisons, trends, and forecasting
 */
class ComparativeAnalysis {

  /**
   * Get period-over-period comparison
   * @param {Object} params - Comparison parameters
   * @param {string} params.metric - Metric to compare (revenue, events, clients, etc)
   * @param {string} params.period - Period type (month, quarter, year)
   * @param {string} params.startDate - Start date
   * @param {string} params.endDate - End date
   */
  static async getPeriodComparison({ metric = 'revenue', period = 'month', startDate, endDate }) {
    const client = await pool.connect();
    try {
      let groupBy, dateFormat, periodLabel;

      switch (period) {
        case 'day':
          groupBy = "DATE(e.fecha)";
          dateFormat = "'YYYY-MM-DD'";
          periodLabel = "TO_CHAR(e.fecha, 'DD Mon YYYY')";
          break;
        case 'week':
          groupBy = "DATE_TRUNC('week', e.fecha)";
          dateFormat = "'YYYY-\"W\"IW'";
          periodLabel = "TO_CHAR(DATE_TRUNC('week', e.fecha), 'YYYY-\"W\"IW')";
          break;
        case 'month':
          groupBy = "DATE_TRUNC('month', e.fecha)";
          dateFormat = "'YYYY-MM'";
          periodLabel = "TO_CHAR(e.fecha, 'Month YYYY')";
          break;
        case 'quarter':
          groupBy = "DATE_TRUNC('quarter', e.fecha)";
          dateFormat = "'YYYY-Q'";
          periodLabel = "TO_CHAR(e.fecha, 'YYYY-Q')";
          break;
        case 'year':
          groupBy = "DATE_TRUNC('year', e.fecha)";
          dateFormat = "'YYYY'";
          periodLabel = "TO_CHAR(e.fecha, 'YYYY')";
          break;
        default:
          groupBy = "DATE_TRUNC('month', e.fecha)";
          dateFormat = "'YYYY-MM'";
          periodLabel = "TO_CHAR(e.fecha, 'Month YYYY')";
      }

      const query = `
        WITH period_data AS (
          SELECT
            ${groupBy} as period,
            TO_CHAR(${groupBy}, ${dateFormat}) as period_key,
            ${periodLabel} as period_label,

            -- Core metrics
            COUNT(e.id) as total_eventos,
            COUNT(DISTINCT e.cliente_id) as unique_clientes,
            COUNT(DISTINCT e.dj_id) as unique_djs,

            -- Revenue metrics
            COALESCE(SUM(e.cache_total), 0) as revenue,
            COALESCE(AVG(e.cache_total), 0) as avg_revenue_per_event,

            -- Collection metrics
            COALESCE(SUM(CASE WHEN e.cobrado_cliente THEN e.cache_total ELSE 0 END), 0) as revenue_collected,
            ROUND(
              100.0 * COUNT(CASE WHEN e.cobrado_cliente THEN 1 END)::numeric /
              NULLIF(COUNT(e.id), 0),
              2
            ) as collection_rate,

            -- Cost metrics
            COALESCE(SUM(e.parte_dj), 0) as costs,
            COALESCE(AVG(e.parte_dj), 0) as avg_cost_per_event,

            -- Profitability
            COALESCE(SUM(e.cache_total - e.parte_dj), 0) as profit,
            ROUND(
              100.0 * SUM(e.cache_total - e.parte_dj)::numeric /
              NULLIF(SUM(e.cache_total), 0),
              2
            ) as profit_margin

          FROM events e
          WHERE 1=1
            ${startDate ? `AND e.fecha >= '${startDate}'` : ''}
            ${endDate ? `AND e.fecha <= '${endDate}'` : ''}
          GROUP BY ${groupBy}, period_key, period_label
          ORDER BY period ASC
        ),
        period_comparison AS (
          SELECT
            *,
            LAG(total_eventos) OVER (ORDER BY period) as prev_eventos,
            LAG(revenue) OVER (ORDER BY period) as prev_revenue,
            LAG(profit) OVER (ORDER BY period) as prev_profit,
            LAG(collection_rate) OVER (ORDER BY period) as prev_collection_rate
          FROM period_data
        )
        SELECT
          period_key,
          period_label,
          total_eventos,
          unique_clientes,
          unique_djs,
          revenue,
          avg_revenue_per_event,
          revenue_collected,
          collection_rate,
          costs,
          avg_cost_per_event,
          profit,
          profit_margin,

          -- Growth calculations
          CASE
            WHEN prev_eventos IS NOT NULL AND prev_eventos > 0
            THEN ROUND(((total_eventos - prev_eventos)::numeric / prev_eventos) * 100, 2)
            ELSE NULL
          END as eventos_growth_pct,

          CASE
            WHEN prev_revenue IS NOT NULL AND prev_revenue > 0
            THEN ROUND(((revenue - prev_revenue)::numeric / prev_revenue) * 100, 2)
            ELSE NULL
          END as revenue_growth_pct,

          CASE
            WHEN prev_profit IS NOT NULL AND prev_profit > 0
            THEN ROUND(((profit - prev_profit)::numeric / prev_profit) * 100, 2)
            ELSE NULL
          END as profit_growth_pct,

          CASE
            WHEN prev_collection_rate IS NOT NULL
            THEN ROUND(collection_rate - prev_collection_rate, 2)
            ELSE NULL
          END as collection_rate_change

        FROM period_comparison
        ORDER BY period_key ASC
      `;

      const result = await client.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error in getPeriodComparison:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get client comparative analysis
   * Compare a specific client against averages and peers
   */
  static async getClientComparison(clientId) {
    const client = await pool.connect();
    try {
      const query = `
        WITH client_metrics AS (
          SELECT
            c.id as cliente_id,
            c.nombre as cliente_nombre,
            COUNT(e.id) as total_eventos,
            COALESCE(SUM(e.cache_total), 0) as total_revenue,
            COALESCE(AVG(e.cache_total), 0) as avg_revenue_per_event,
            COALESCE(SUM(e.cache_total - e.parte_dj), 0) as total_profit,
            ROUND(
              100.0 * COUNT(CASE WHEN e.cobrado_cliente THEN 1 END)::numeric /
              NULLIF(COUNT(e.id), 0),
              2
            ) as collection_rate,
            MIN(e.fecha) as first_event_date,
            MAX(e.fecha) as last_event_date,
            0 as days_active
          FROM clients c
          LEFT JOIN events e ON e.cliente_id = c.id
          GROUP BY c.id, c.nombre
        ),
        market_averages AS (
          SELECT
            AVG(total_eventos) as avg_eventos,
            AVG(total_revenue) as avg_revenue,
            AVG(avg_revenue_per_event) as avg_revenue_per_event,
            AVG(total_profit) as avg_profit,
            AVG(collection_rate) as avg_collection_rate,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_eventos) as median_eventos,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_revenue) as median_revenue
          FROM client_metrics
          WHERE total_eventos > 0
        )
        SELECT
          cm.*,
          ma.avg_eventos as market_avg_eventos,
          ma.avg_revenue as market_avg_revenue,
          ma.avg_revenue_per_event as market_avg_revenue_per_event,
          ma.avg_profit as market_avg_profit,
          ma.avg_collection_rate as market_avg_collection_rate,
          ma.median_eventos as market_median_eventos,
          ma.median_revenue as market_median_revenue,

          -- Comparison vs market
          ROUND(
            CASE
              WHEN ma.avg_eventos > 0
              THEN ((cm.total_eventos - ma.avg_eventos)::numeric / ma.avg_eventos) * 100
              ELSE 0
            END,
            2
          ) as eventos_vs_market_pct,

          ROUND(
            CASE
              WHEN ma.avg_revenue > 0
              THEN ((cm.total_revenue - ma.avg_revenue)::numeric / ma.avg_revenue) * 100
              ELSE 0
            END,
            2
          ) as revenue_vs_market_pct,

          ROUND(
            CASE
              WHEN ma.avg_collection_rate > 0
              THEN cm.collection_rate - ma.avg_collection_rate
              ELSE 0
            END,
            2
          ) as collection_rate_vs_market,

          -- Ranking
          (
            SELECT COUNT(*) + 1
            FROM client_metrics cm2
            WHERE cm2.total_revenue > cm.total_revenue
          ) as revenue_rank,

          (
            SELECT COUNT(*)
            FROM client_metrics
            WHERE total_eventos > 0
          ) as total_active_clients

        FROM client_metrics cm
        CROSS JOIN market_averages ma
        WHERE cm.cliente_id = $1
      `;

      const result = await client.query(query, [clientId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getClientComparison:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get DJ comparative analysis
   * Compare a specific DJ against averages and peers
   */
  static async getDJComparison(djId) {
    const client = await pool.connect();
    try {
      const query = `
        WITH dj_metrics AS (
          SELECT
            d.id as dj_id,
            d.nombre as dj_nombre,
            COUNT(e.id) as total_eventos,
            COALESCE(SUM(e.parte_dj), 0) as total_earnings,
            COALESCE(AVG(e.parte_dj), 0) as avg_earnings_per_event,
            COALESCE(SUM(e.horas * e.parte_dj), 0) / NULLIF(SUM(e.horas), 0) as avg_hourly_rate,
            ROUND(
              100.0 * COUNT(CASE WHEN e.pagado_dj THEN 1 END)::numeric /
              NULLIF(COUNT(e.id), 0),
              2
            ) as payment_rate,
            MIN(e.fecha) as first_event_date,
            MAX(e.fecha) as last_event_date,
            COUNT(DISTINCT e.cliente_id) as unique_clients,
            0 as days_active
          FROM djs d
          LEFT JOIN events e ON e.dj_id = d.id
          GROUP BY d.id, d.nombre
        ),
        market_averages AS (
          SELECT
            AVG(total_eventos) as avg_eventos,
            AVG(total_earnings) as avg_earnings,
            AVG(avg_earnings_per_event) as avg_earnings_per_event,
            AVG(avg_hourly_rate) as avg_hourly_rate,
            AVG(payment_rate) as avg_payment_rate,
            AVG(unique_clients) as avg_unique_clients,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_eventos) as median_eventos,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_earnings) as median_earnings
          FROM dj_metrics
          WHERE total_eventos > 0
        )
        SELECT
          dm.*,
          ma.avg_eventos as market_avg_eventos,
          ma.avg_earnings as market_avg_earnings,
          ma.avg_earnings_per_event as market_avg_earnings_per_event,
          ma.avg_hourly_rate as market_avg_hourly_rate,
          ma.avg_payment_rate as market_avg_payment_rate,
          ma.avg_unique_clients as market_avg_unique_clients,
          ma.median_eventos as market_median_eventos,
          ma.median_earnings as market_median_earnings,

          -- Comparison vs market
          ROUND(
            CASE
              WHEN ma.avg_eventos > 0
              THEN ((dm.total_eventos - ma.avg_eventos)::numeric / ma.avg_eventos) * 100
              ELSE 0
            END,
            2
          ) as eventos_vs_market_pct,

          ROUND(
            CASE
              WHEN ma.avg_earnings > 0
              THEN ((dm.total_earnings - ma.avg_earnings)::numeric / ma.avg_earnings) * 100
              ELSE 0
            END,
            2
          ) as earnings_vs_market_pct,

          ROUND(
            CASE
              WHEN ma.avg_payment_rate > 0
              THEN dm.payment_rate - ma.avg_payment_rate
              ELSE 0
            END,
            2
          ) as payment_rate_vs_market,

          -- Rankings
          (
            SELECT COUNT(*) + 1
            FROM dj_metrics dm2
            WHERE dm2.total_eventos > dm.total_eventos
          ) as eventos_rank,

          (
            SELECT COUNT(*) + 1
            FROM dj_metrics dm2
            WHERE dm2.total_earnings > dm.total_earnings
          ) as earnings_rank,

          (
            SELECT COUNT(*)
            FROM dj_metrics
            WHERE total_eventos > 0
          ) as total_active_djs

        FROM dj_metrics dm
        CROSS JOIN market_averages ma
        WHERE dm.dj_id = $1
      `;

      const result = await client.query(query, [djId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getDJComparison:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get seasonal analysis
   * Analyze performance by month/season to identify patterns
   */
  static async getSeasonalAnalysis() {
    const client = await pool.connect();
    try {
      const query = `
        WITH monthly_data AS (
          SELECT
            EXTRACT(MONTH FROM e.fecha)::int as month_number,
            TO_CHAR(e.fecha, 'Month') as month_name,
            EXTRACT(YEAR FROM e.fecha)::int as year,
            COUNT(e.id) as total_eventos,
            COALESCE(SUM(e.cache_total), 0) as total_revenue,
            COALESCE(AVG(e.cache_total), 0) as avg_revenue_per_event,
            COALESCE(SUM(e.cache_total - e.parte_dj), 0) as total_profit
          FROM events e
          WHERE 1=1
            AND e.fecha >= CURRENT_DATE - INTERVAL '3 years'
          GROUP BY month_number, month_name, year
        ),
        monthly_averages AS (
          SELECT
            month_number,
            month_name,
            AVG(total_eventos) as avg_eventos,
            AVG(total_revenue) as avg_revenue,
            AVG(avg_revenue_per_event) as avg_revenue_per_event,
            AVG(total_profit) as avg_profit,
            STDDEV(total_eventos) as stddev_eventos,
            STDDEV(total_revenue) as stddev_revenue,
            COUNT(*) as data_points
          FROM monthly_data
          GROUP BY month_number, month_name
        ),
        seasonal_grouping AS (
          SELECT
            month_number,
            month_name,
            CASE
              WHEN month_number IN (12, 1, 2) THEN 'Invierno'
              WHEN month_number IN (3, 4, 5) THEN 'Primavera'
              WHEN month_number IN (6, 7, 8) THEN 'Verano'
              WHEN month_number IN (9, 10, 11) THEN 'Otoño'
            END as season,
            avg_eventos,
            avg_revenue,
            avg_revenue_per_event,
            avg_profit,
            stddev_eventos,
            stddev_revenue,
            data_points
          FROM monthly_averages
        )
        SELECT
          season,
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'month_number', month_number,
              'month_name', TRIM(month_name),
              'avg_eventos', ROUND(avg_eventos::numeric, 2),
              'avg_revenue', ROUND(avg_revenue::numeric, 2),
              'avg_revenue_per_event', ROUND(avg_revenue_per_event::numeric, 2),
              'avg_profit', ROUND(avg_profit::numeric, 2),
              'stddev_eventos', ROUND(COALESCE(stddev_eventos, 0)::numeric, 2),
              'stddev_revenue', ROUND(COALESCE(stddev_revenue, 0)::numeric, 2),
              'data_points', data_points
            )
            ORDER BY month_number
          ) as months,
          ROUND(AVG(avg_eventos)::numeric, 2) as season_avg_eventos,
          ROUND(AVG(avg_revenue)::numeric, 2) as season_avg_revenue,
          ROUND(AVG(avg_profit)::numeric, 2) as season_avg_profit
        FROM seasonal_grouping
        GROUP BY season
        ORDER BY
          CASE season
            WHEN 'Primavera' THEN 1
            WHEN 'Verano' THEN 2
            WHEN 'Otoño' THEN 3
            WHEN 'Invierno' THEN 4
          END
      `;

      const result = await client.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error in getSeasonalAnalysis:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get trend forecast using simple linear regression
   * Predict future values based on historical data
   */
  static async getTrendForecast({ metric = 'revenue', periods = 6 }) {
    const client = await pool.connect();
    try {
      const query = `
        WITH historical_data AS (
          SELECT
            DATE_TRUNC('month', e.fecha) as period,
            TO_CHAR(e.fecha, 'YYYY-MM') as period_key,
            TO_CHAR(e.fecha, 'Month YYYY') as period_label,
            ROW_NUMBER() OVER (ORDER BY DATE_TRUNC('month', e.fecha)) as x,
            COALESCE(SUM(e.cache_total), 0) as revenue,
            COUNT(e.id) as eventos,
            COALESCE(SUM(e.cache_total - e.parte_dj), 0) as profit
          FROM events e
          WHERE 1=1
            AND e.fecha >= CURRENT_DATE - INTERVAL '18 months'
          GROUP BY period, period_key, period_label
          ORDER BY period
        ),
        regression_calc AS (
          SELECT
            COUNT(*) as n,
            SUM(x) as sum_x,
            SUM(revenue) as sum_y,
            SUM(x * revenue) as sum_xy,
            SUM(x * x) as sum_x2,
            AVG(revenue) as avg_y,
            STDDEV(revenue) as stddev_y
          FROM historical_data
        ),
        regression_params AS (
          SELECT
            (n * sum_xy - sum_x * sum_y) / NULLIF((n * sum_x2 - sum_x * sum_x), 0) as slope,
            avg_y - ((n * sum_xy - sum_x * sum_y) / NULLIF((n * sum_x2 - sum_x * sum_x), 0)) * (sum_x / n) as intercept,
            n,
            stddev_y
          FROM regression_calc
        )
        SELECT
          hd.period_key,
          hd.period_label,
          hd.revenue as actual_value,
          ROUND((rp.intercept + rp.slope * hd.x)::numeric, 2) as predicted_value,
          ROUND((hd.revenue - (rp.intercept + rp.slope * hd.x))::numeric, 2) as residual,
          'historical' as data_type
        FROM historical_data hd
        CROSS JOIN regression_params rp

        UNION ALL

        SELECT
          TO_CHAR(CURRENT_DATE + (i || ' months')::interval, 'YYYY-MM') as period_key,
          TO_CHAR(CURRENT_DATE + (i || ' months')::interval, 'Month YYYY') as period_label,
          NULL as actual_value,
          ROUND((rp.intercept + rp.slope * (rp.n + i))::numeric, 2) as predicted_value,
          NULL as residual,
          'forecast' as data_type
        FROM regression_params rp
        CROSS JOIN generate_series(1, $1) as i

        ORDER BY period_key
      `;

      const result = await client.query(query, [periods]);
      return result.rows;
    } catch (error) {
      console.error('Error in getTrendForecast:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get top performers comparison
   * Compare top clients/DJs across multiple dimensions
   */
  static async getTopPerformersComparison({ entity = 'client', limit = 10 }) {
    const client = await pool.connect();
    try {
      const isClient = entity === 'client';
      const entityTable = isClient ? 'clientes' : 'djs';
      const entityIdField = isClient ? 'cliente_id' : 'dj_id';
      const entityNameField = isClient ? 'cliente_nombre' : 'dj_nombre';

      const query = `
        SELECT
          e.${entityIdField} as entity_id,
          ${isClient ? 'c.nombre' : 'd.nombre'} as entity_name,
          COUNT(e.id) as total_eventos,
          COALESCE(SUM(e.cache_total), 0) as total_revenue,
          COALESCE(AVG(e.cache_total), 0) as avg_revenue_per_event,
          ${isClient
            ? `COALESCE(SUM(e.cache_total - e.parte_dj), 0) as total_profit,
               ROUND(100.0 * COUNT(CASE WHEN e.cobrado_cliente THEN 1 END)::numeric / NULLIF(COUNT(e.id), 0), 2) as collection_rate`
            : `COALESCE(SUM(e.parte_dj), 0) as total_earnings,
               ROUND(100.0 * COUNT(CASE WHEN e.pagado_dj THEN 1 END)::numeric / NULLIF(COUNT(e.id), 0), 2) as payment_rate`
          },
          MIN(e.fecha) as first_event,
          MAX(e.fecha) as last_event,
          0 as days_active,
          0 as eventos_per_day
        FROM events e
        INNER JOIN ${entityTable} ${isClient ? 'c' : 'd'} ON ${isClient ? 'c' : 'd'}.id = e.${entityIdField}
        WHERE 1=1
        GROUP BY e.${entityIdField}, entity_name
        HAVING COUNT(e.id) > 0
        ORDER BY total_revenue DESC
        LIMIT $1
      `;

      const result = await client.query(query, [limit]);
      return result.rows;
    } catch (error) {
      console.error('Error in getTopPerformersComparison:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

export default ComparativeAnalysis;
