import pool from '../config/database.js';

/**
 * Executive Dashboard Model
 * Consolidates all financial metrics, KPIs, and alerts for executive decision-making
 */
class ExecutiveDashboard {

  /**
   * Get comprehensive executive dashboard data
   * @returns {Object} Complete dashboard metrics
   */
  static async getConsolidatedMetrics() {
    const client = await pool.connect();
    try {
      // Get all metrics in parallel for performance
      const [
        financialOverview,
        clientMetrics,
        djMetrics,
        alertsSummary,
        revenueByMonth,
        topClients,
        topDJs,
        pendingPayments,
        profitDistribution
      ] = await Promise.all([
        this.getFinancialOverview(client),
        this.getClientMetrics(client),
        this.getDJMetrics(client),
        this.getAlertsSummary(client),
        this.getRevenueByMonth(client),
        this.getTopClients(client),
        this.getTopDJs(client),
        this.getPendingPayments(client),
        this.getProfitDistribution(client)
      ]);

      return {
        success: true,
        data: {
          financialOverview,
          clientMetrics,
          djMetrics,
          alertsSummary,
          revenueByMonth,
          topClients,
          topDJs,
          pendingPayments,
          profitDistribution,
          lastUpdated: new Date()
        }
      };
    } catch (error) {
      console.error('Error getting consolidated metrics:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get financial overview KPIs
   */
  static async getFinancialOverview(client) {
    const query = `
      SELECT
        COUNT(DISTINCT e.id) as total_eventos,
        COUNT(DISTINCT CASE WHEN e.fecha >= CURRENT_DATE - INTERVAL '30 days' THEN e.id END) as eventos_ultimo_mes,

        -- Revenue metrics
        COALESCE(SUM(e.cache_total), 0) as facturacion_total,
        COALESCE(SUM(CASE WHEN e.fecha >= CURRENT_DATE - INTERVAL '30 days' THEN e.cache_total END), 0) as facturacion_ultimo_mes,
        COALESCE(AVG(e.cache_total), 0) as precio_medio_evento,

        -- Collection metrics
        COALESCE(SUM(CASE WHEN e.cobrado_cliente THEN e.cache_total ELSE 0 END), 0) as total_cobrado,
        COALESCE(SUM(CASE WHEN NOT e.cobrado_cliente THEN e.cache_total ELSE 0 END), 0) as total_pendiente_cobro,

        -- DJ Payment metrics
        COALESCE(SUM(e.parte_dj), 0) as total_costes_dj,
        COALESCE(SUM(CASE WHEN e.pagado_dj THEN e.parte_dj ELSE 0 END), 0) as total_pagado_dj,
        COALESCE(SUM(CASE WHEN NOT e.pagado_dj THEN e.parte_dj ELSE 0 END), 0) as total_pendiente_pago_dj,

        -- Profitability
        COALESCE(SUM(e.cache_total - e.parte_dj), 0) as rentabilidad_bruta,
        COALESCE(SUM(
          CASE
            WHEN e.cobrado_cliente AND e.pagado_dj
            THEN e.cache_total - e.parte_dj
            ELSE 0
          END
        ), 0) as rentabilidad_neta_realizada,

        -- Collection rates
        ROUND(
          100.0 * COUNT(CASE WHEN e.cobrado_cliente THEN 1 END)::numeric /
          NULLIF(COUNT(e.id), 0),
          2
        ) as tasa_cobro_eventos,

        -- Payment rates
        ROUND(
          100.0 * COUNT(CASE WHEN e.pagado_dj THEN 1 END)::numeric /
          NULLIF(COUNT(e.id), 0),
          2
        ) as tasa_pago_eventos,

        -- Margin
        ROUND(
          100.0 * SUM(e.cache_total - e.parte_dj)::numeric /
          NULLIF(SUM(e.cache_total), 0),
          2
        ) as margen_beneficio_porcentaje

      FROM events e
      WHERE 1=1
    `;

    const result = await client.query(query);
    return result.rows[0];
  }

  /**
   * Get client metrics summary
   */
  static async getClientMetrics(client) {
    const query = `
      SELECT
        COUNT(DISTINCT c.id) as total_clientes,
        COUNT(DISTINCT CASE WHEN c.activo THEN c.id END) as clientes_activos,
        COUNT(DISTINCT CASE WHEN EXISTS(
          SELECT 1 FROM events e
          WHERE e.cliente_id = c.id
          AND e.fecha >= CURRENT_DATE - INTERVAL '90 days'
        ) THEN c.id END) as clientes_activos_trimestre,

        -- VIP Classification
        COUNT(DISTINCT CASE
          WHEN (
            SELECT COUNT(*) FROM events e
            WHERE e.cliente_id = c.id
          ) >= 10
          THEN c.id
        END) as clientes_vip,

        -- New clients
        COUNT(DISTINCT CASE
          WHEN c.created_at >= CURRENT_DATE - INTERVAL '30 days'
          THEN c.id
        END) as clientes_nuevos_mes,

        -- Average metrics per client
        ROUND(AVG((
          SELECT COUNT(*) FROM events e
          WHERE e.cliente_id = c.id
        )), 2) as promedio_eventos_por_cliente,

        COALESCE(AVG((
          SELECT SUM(e.cache_total) FROM events e
          WHERE e.cliente_id = c.id
        )), 0) as facturacion_promedio_por_cliente

      FROM clients c
    `;

    const result = await client.query(query);
    return result.rows[0];
  }

  /**
   * Get DJ metrics summary
   */
  static async getDJMetrics(client) {
    const query = `
      SELECT
        COUNT(DISTINCT d.id) as total_djs,
        COUNT(DISTINCT CASE WHEN d.activo THEN d.id END) as djs_activos,
        COUNT(DISTINCT CASE WHEN EXISTS(
          SELECT 1 FROM events e
          WHERE e.dj_id = d.id
          AND e.fecha >= CURRENT_DATE - INTERVAL '90 days'
        ) THEN d.id END) as djs_activos_trimestre,

        -- Average metrics per DJ
        ROUND(AVG((
          SELECT COUNT(*) FROM events e
          WHERE e.dj_id = d.id
        )), 2) as promedio_eventos_por_dj,

        COALESCE(AVG((
          SELECT SUM(e.parte_dj) FROM events e
          WHERE e.dj_id = d.id
        )), 0) as pago_promedio_por_dj,

        -- Top performers
        (
          SELECT d2.nombre FROM djs d2
          JOIN events e ON e.dj_id = d2.id
          WHERE 1=1
          GROUP BY d2.id, d2.nombre
          ORDER BY COUNT(e.id) DESC
          LIMIT 1
        ) as dj_mas_eventos

      FROM djs d
    `;

    const result = await client.query(query);
    return result.rows[0];
  }

  /**
   * Get alerts summary
   */
  static async getAlertsSummary(client) {
    const query = `
      SELECT
        COUNT(*) as total_alertas,
        COUNT(CASE WHEN NOT is_resolved THEN 1 END) as alertas_activas,
        COUNT(CASE WHEN NOT is_read THEN 1 END) as alertas_no_leidas,
        COUNT(CASE WHEN severity = 'critical' AND NOT is_resolved THEN 1 END) as alertas_criticas,
        COUNT(CASE WHEN severity = 'warning' AND NOT is_resolved THEN 1 END) as alertas_warning,
        COUNT(CASE WHEN severity = 'info' AND NOT is_resolved THEN 1 END) as alertas_info,

        -- By type
        COUNT(CASE WHEN alert_type = 'cobro_critico' AND NOT is_resolved THEN 1 END) as cobros_criticos,
        COUNT(CASE WHEN alert_type = 'cobro_urgente' AND NOT is_resolved THEN 1 END) as cobros_urgentes,
        COUNT(CASE WHEN alert_type = 'pago_dj_pendiente' AND NOT is_resolved THEN 1 END) as pagos_dj_pendientes,
        COUNT(CASE WHEN alert_type = 'cliente_inactivo' AND NOT is_resolved THEN 1 END) as clientes_inactivos,
        COUNT(CASE WHEN alert_type = 'cliente_riesgo_perdida' AND NOT is_resolved THEN 1 END) as clientes_en_riesgo

      FROM financial_alerts
    `;

    const result = await client.query(query);
    return result.rows[0];
  }

  /**
   * Get revenue by month (last 12 months)
   */
  static async getRevenueByMonth(client) {
    const query = `
      SELECT
        TO_CHAR(e.fecha, 'YYYY-MM') as mes,
        TO_CHAR(e.fecha, 'Month YYYY') as mes_nombre,
        COUNT(e.id) as total_eventos,
        COALESCE(SUM(e.cache_total), 0) as facturacion,
        COALESCE(SUM(e.parte_dj), 0) as costes_dj,
        COALESCE(SUM(e.cache_total - e.parte_dj), 0) as beneficio_bruto,
        COALESCE(SUM(CASE WHEN e.cobrado_cliente THEN e.cache_total ELSE 0 END), 0) as cobrado,
        COALESCE(SUM(CASE WHEN e.pagado_dj THEN e.parte_dj ELSE 0 END), 0) as pagado_dj
      FROM events e
      WHERE
        e.fecha >= CURRENT_DATE - INTERVAL '12 months'
        AND e.fecha <= CURRENT_DATE
       
      GROUP BY TO_CHAR(e.fecha, 'YYYY-MM'), TO_CHAR(e.fecha, 'Month YYYY')
      ORDER BY mes ASC
    `;

    const result = await client.query(query);
    return result.rows;
  }

  /**
   * Get top 10 clients by revenue
   */
  static async getTopClients(client) {
    const query = `
      SELECT
        c.id,
        c.nombre,
        c.email,
        c.ciudad,
        COUNT(e.id) as total_eventos,
        COALESCE(SUM(e.cache_total), 0) as facturacion_total,
        COALESCE(SUM(CASE WHEN e.cobrado_cliente THEN e.cache_total ELSE 0 END), 0) as total_cobrado,
        COALESCE(SUM(CASE WHEN NOT e.cobrado_cliente THEN e.cache_total ELSE 0 END), 0) as pendiente_cobro,
        COALESCE(SUM(e.cache_total - e.parte_dj), 0) as rentabilidad,
        ROUND(
          100.0 * COUNT(CASE WHEN e.cobrado_cliente THEN 1 END)::numeric /
          NULLIF(COUNT(e.id), 0),
          1
        ) as tasa_cobro
      FROM clients c
      LEFT JOIN events e ON e.cliente_id = c.id
      WHERE c.activo = true
      GROUP BY c.id, c.nombre, c.email, c.ciudad
      HAVING COUNT(e.id) > 0
      ORDER BY facturacion_total DESC
      LIMIT 10
    `;

    const result = await client.query(query);
    return result.rows;
  }

  /**
   * Get top 10 DJs by events and revenue
   */
  static async getTopDJs(client) {
    const query = `
      SELECT
        d.id,
        d.nombre,
        d.email,
        COUNT(e.id) as total_eventos,
        COALESCE(SUM(e.parte_dj), 0) as total_cobrado,
        COALESCE(SUM(CASE WHEN e.pagado_dj THEN e.parte_dj ELSE 0 END), 0) as total_pagado,
        COALESCE(SUM(CASE WHEN NOT e.pagado_dj THEN e.parte_dj ELSE 0 END), 0) as pendiente_pago,
        COALESCE(AVG(e.parte_dj), 0) as precio_promedio,
        ROUND(
          100.0 * COUNT(CASE WHEN e.pagado_dj THEN 1 END)::numeric /
          NULLIF(COUNT(e.id), 0),
          1
        ) as tasa_pago
      FROM djs d
      LEFT JOIN events e ON e.dj_id = d.id
      WHERE d.activo = true
      GROUP BY d.id, d.nombre, d.email
      HAVING COUNT(e.id) > 0
      ORDER BY total_eventos DESC
      LIMIT 10
    `;

    const result = await client.query(query);
    return result.rows;
  }

  /**
   * Get pending payments summary
   */
  static async getPendingPayments(client) {
    const query = `
      SELECT
        -- Client collections
        (
          SELECT COUNT(*) FROM events
          WHERE NOT cobrado_cliente
        ) as eventos_pendiente_cobro_count,
        (
          SELECT COALESCE(SUM(cache_total), 0) FROM events
          WHERE NOT cobrado_cliente
        ) as eventos_pendiente_cobro_total,
        (
          SELECT COUNT(*) FROM events
          WHERE NOT cobrado_cliente
          AND fecha < CURRENT_DATE - INTERVAL '30 days'
         
        ) as eventos_vencidos_cobro_count,
        (
          SELECT COALESCE(SUM(cache_total), 0) FROM events
          WHERE NOT cobrado_cliente
          AND fecha < CURRENT_DATE - INTERVAL '30 days'
         
        ) as eventos_vencidos_cobro_total,

        -- DJ payments
        (
          SELECT COUNT(*) FROM events
          WHERE NOT pagado_dj
        ) as eventos_pendiente_pago_dj_count,
        (
          SELECT COALESCE(SUM(parte_dj), 0) FROM events
          WHERE NOT pagado_dj
        ) as eventos_pendiente_pago_dj_total,
        (
          SELECT COUNT(*) FROM events
          WHERE NOT pagado_dj
          AND fecha < CURRENT_DATE - INTERVAL '14 days'
         
        ) as eventos_vencidos_pago_dj_count,
        (
          SELECT COALESCE(SUM(parte_dj), 0) FROM events
          WHERE NOT pagado_dj
          AND fecha < CURRENT_DATE - INTERVAL '14 days'
         
        ) as eventos_vencidos_pago_dj_total
    `;

    const result = await client.query(query);
    return result.rows[0];
  }

  /**
   * Get profit distribution metrics
   */
  static async getProfitDistribution(client) {
    const query = `
      SELECT
        -- Total distributable
        COALESCE(SUM(CASE
          WHEN e.cobrado_cliente AND e.pagado_dj
          THEN e.cache_total - e.parte_dj
          ELSE 0
        END), 0) as beneficio_distribuible,

        -- Agency commission (10%)
        COALESCE(SUM(CASE
          WHEN e.cobrado_cliente AND e.pagado_dj
          THEN (e.cache_total - e.parte_dj) * 0.10
          ELSE 0
        END), 0) as parte_agencia,

        -- Owners profit (90%)
        COALESCE(SUM(CASE
          WHEN e.cobrado_cliente AND e.pagado_dj
          THEN (e.cache_total - e.parte_dj) * 0.90
          ELSE 0
        END), 0) as beneficio_propietarios,

        -- Individual owner shares (split 45% each)
        COALESCE(SUM(CASE
          WHEN e.cobrado_cliente AND e.pagado_dj
          THEN (e.cache_total - e.parte_dj) * 0.45
          ELSE 0
        END), 0) as beneficio_por_propietario,

        -- Count of completed transactions
        COUNT(CASE
          WHEN e.cobrado_cliente AND e.pagado_dj
          THEN 1
        END) as eventos_completados

      FROM events e
      WHERE 1=1
    `;

    const result = await client.query(query);
    return result.rows[0];
  }

  /**
   * Get financial health score (0-100)
   */
  static async getFinancialHealthScore(client) {
    const overview = await this.getFinancialOverview(client);
    const alerts = await this.getAlertsSummary(client);

    let score = 100;

    // Deduct points for collection issues
    const collectionRate = parseFloat(overview.tasa_cobro_eventos || 0);
    if (collectionRate < 50) score -= 30;
    else if (collectionRate < 70) score -= 20;
    else if (collectionRate < 85) score -= 10;

    // Deduct points for critical alerts
    const criticalAlerts = parseInt(alerts.alertas_criticas || 0);
    score -= Math.min(criticalAlerts * 2, 20);

    // Deduct points for profit margin
    const margin = parseFloat(overview.margen_beneficio_porcentaje || 0);
    if (margin < 10) score -= 20;
    else if (margin < 20) score -= 10;
    else if (margin < 30) score -= 5;

    // Deduct points for pending collections vs revenue
    const pendingRatio = (parseFloat(overview.total_pendiente_cobro) / parseFloat(overview.facturacion_total)) * 100;
    if (pendingRatio > 50) score -= 20;
    else if (pendingRatio > 30) score -= 10;
    else if (pendingRatio > 15) score -= 5;

    return Math.max(0, Math.min(100, score));
  }
}

export default ExecutiveDashboard;
