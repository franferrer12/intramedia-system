import { query } from '../config/database.js';

// Dashboard financiero general de la agencia
export const getDashboardFinanciero = async (req, res) => {
  try {
    const { year } = req.query;
    const yearFilter = year ? parseInt(year) : new Date().getFullYear();

    // Estadísticas generales
    const statsGeneral = await query(`
      SELECT
        COUNT(*) as total_eventos,
        COUNT(DISTINCT dj_id) as djs_activos,
        COUNT(DISTINCT cliente_id) as clientes_activos,
        SUM(cache_total) as facturacion_total,
        SUM(parte_agencia) as comision_total,
        SUM(parte_dj) as pagado_djs_total,
        AVG(cache_total) as bolo_promedio,
        SUM(CASE WHEN cobrado_cliente = true THEN cache_total ELSE 0 END) as cobrado,
        SUM(CASE WHEN cobrado_cliente = false THEN cache_total ELSE 0 END) as pendiente_cobro
      FROM events
      WHERE EXTRACT(YEAR FROM fecha) = $1
    `, [yearFilter]);

    // Evolución mensual
    const evolucionMensual = await query(`
      SELECT
        TO_CHAR(fecha, 'YYYY-MM') as mes,
        COUNT(*) as eventos,
        SUM(cache_total) as facturacion,
        SUM(parte_agencia) as comision,
        AVG(cache_total) as bolo_promedio
      FROM events
      WHERE EXTRACT(YEAR FROM fecha) = $1
      GROUP BY TO_CHAR(fecha, 'YYYY-MM')
      ORDER BY mes
    `, [yearFilter]);

    // Comparativa año anterior
    const comparativaAnterior = await query(`
      SELECT
        EXTRACT(YEAR FROM fecha) as año,
        COUNT(*) as eventos,
        SUM(cache_total) as facturacion,
        SUM(parte_agencia) as comision
      FROM events
      WHERE EXTRACT(YEAR FROM fecha) IN ($1, $2)
      GROUP BY EXTRACT(YEAR FROM fecha)
      ORDER BY año
    `, [yearFilter - 1, yearFilter]);

    // Top locales/clientes
    const topClientes = await query(`
      SELECT
        c.nombre,
        COUNT(e.id) as eventos,
        SUM(e.cache_total) as facturacion
      FROM events e
      JOIN clients c ON e.cliente_id = c.id
      WHERE EXTRACT(YEAR FROM e.fecha) = $1
      GROUP BY c.id, c.nombre
      ORDER BY facturacion DESC
      LIMIT 10
    `, [yearFilter]);

    res.json({
      success: true,
      data: {
        year: yearFilter,
        general: statsGeneral.rows[0],
        evolucion_mensual: evolucionMensual.rows,
        comparativa_anterior: comparativaAnterior.rows,
        top_clientes: topClientes.rows
      }
    });
  } catch (error) {
    console.error('Error al obtener dashboard financiero:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener dashboard financiero',
      error: error.message
    });
  }
};

// Estadísticas detalladas por DJ
export const getEstadisticasDJ = async (req, res) => {
  try {
    const { id } = req.params;
    const { year } = req.query;
    const yearFilter = year ? parseInt(year) : new Date().getFullYear();

    // Estadísticas generales del DJ
    const statsGeneral = await query(`
      SELECT
        d.id,
        d.nombre,
        d.email,
        d.telefono,
        COUNT(e.id) as total_eventos,
        SUM(e.cache_total) as facturacion_total,
        SUM(e.parte_dj) as ingresos_dj,
        AVG(e.cache_total) as bolo_promedio,
        AVG(e.parte_dj) as ingreso_promedio_evento,
        MIN(e.fecha) as primer_evento,
        MAX(e.fecha) as ultimo_evento
      FROM djs d
      LEFT JOIN events e ON d.id = e.dj_id AND EXTRACT(YEAR FROM e.fecha) = $2
      WHERE d.id = $1
      GROUP BY d.id, d.nombre, d.email, d.telefono
    `, [id, yearFilter]);

    if (statsGeneral.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'DJ no encontrado'
      });
    }

    // Evolución mensual del DJ
    const evolucionMensual = await query(`
      SELECT
        TO_CHAR(fecha, 'YYYY-MM') as mes,
        COUNT(*) as eventos,
        SUM(cache_total) as facturacion,
        SUM(parte_dj) as ingresos,
        AVG(cache_total) as bolo_promedio
      FROM events
      WHERE dj_id = $1 AND EXTRACT(YEAR FROM fecha) = $2
      GROUP BY TO_CHAR(fecha, 'YYYY-MM')
      ORDER BY mes
    `, [id, yearFilter]);

    // Locales donde más trabaja
    const topLocales = await query(`
      SELECT
        c.nombre,
        COUNT(e.id) as eventos,
        SUM(e.cache_total) as facturacion
      FROM events e
      JOIN clients c ON e.cliente_id = c.id
      WHERE e.dj_id = $1 AND EXTRACT(YEAR FROM e.fecha) = $2
      GROUP BY c.id, c.nombre
      ORDER BY eventos DESC
      LIMIT 5
    `, [id, yearFilter]);

    // Comparativa con promedio de la agencia
    const comparativa = await query(`
      SELECT
        'DJ' as tipo,
        AVG(parte_dj) as ingreso_promedio
      FROM events
      WHERE dj_id = $1 AND EXTRACT(YEAR FROM fecha) = $2
      UNION ALL
      SELECT
        'Agencia' as tipo,
        AVG(parte_dj) as ingreso_promedio
      FROM events
      WHERE EXTRACT(YEAR FROM fecha) = $2
    `, [id, yearFilter]);

    // Distribución por categoría
    const porCategoria = await query(`
      SELECT
        cat.nombre as categoria,
        COUNT(e.id) as eventos,
        SUM(e.cache_total) as facturacion
      FROM events e
      LEFT JOIN event_categories cat ON e.categoria_id = cat.id
      WHERE e.dj_id = $1 AND EXTRACT(YEAR FROM e.fecha) = $2
      GROUP BY cat.nombre
      ORDER BY eventos DESC
    `, [id, yearFilter]);

    res.json({
      success: true,
      data: {
        dj: statsGeneral.rows[0],
        evolucion_mensual: evolucionMensual.rows,
        top_locales: topLocales.rows,
        comparativa_agencia: comparativa.rows,
        por_categoria: porCategoria.rows
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del DJ:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas del DJ',
      error: error.message
    });
  }
};

// Ranking de DJs por diferentes métricas
export const getRankingDJs = async (req, res) => {
  try {
    const { year, metric = 'eventos' } = req.query;
    const yearFilter = year ? parseInt(year) : new Date().getFullYear();

    let orderBy;
    switch (metric) {
      case 'facturacion':
        orderBy = 'facturacion_total DESC';
        break;
      case 'ingresos':
        orderBy = 'ingresos_dj DESC';
        break;
      case 'bolo_promedio':
        orderBy = 'bolo_promedio DESC';
        break;
      default:
        orderBy = 'total_eventos DESC';
    }

    const ranking = await query(`
      SELECT
        d.id,
        d.nombre,
        COUNT(e.id) as total_eventos,
        SUM(e.cache_total) as facturacion_total,
        SUM(e.parte_dj) as ingresos_dj,
        AVG(e.cache_total) as bolo_promedio,
        AVG(e.parte_dj) as ingreso_promedio
      FROM djs d
      LEFT JOIN events e ON d.id = e.dj_id AND EXTRACT(YEAR FROM e.fecha) = $1
      WHERE d.activo = true
      GROUP BY d.id, d.nombre
      HAVING COUNT(e.id) > 0
      ORDER BY ${orderBy}
      LIMIT 20
    `, [yearFilter]);

    res.json({
      success: true,
      data: ranking.rows
    });
  } catch (error) {
    console.error('Error al obtener ranking de DJs:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ranking de DJs',
      error: error.message
    });
  }
};

// Análisis de crecimiento (MoM y YoY)
export const getAnalisisCrecimiento = async (req, res) => {
  try {
    // Crecimiento mes a mes (últimos 12 meses)
    const crecimientoMensual = await query(`
      WITH monthly_stats AS (
        SELECT
          DATE_TRUNC('month', fecha) as mes,
          COUNT(*) as eventos,
          SUM(cache_total) as facturacion,
          SUM(parte_agencia) as comision
        FROM events
        WHERE fecha >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', fecha)
        ORDER BY mes
      )
      SELECT
        TO_CHAR(mes, 'YYYY-MM') as mes,
        eventos,
        facturacion,
        comision,
        LAG(facturacion) OVER (ORDER BY mes) as facturacion_anterior,
        CASE
          WHEN LAG(facturacion) OVER (ORDER BY mes) > 0
          THEN ROUND(((facturacion - LAG(facturacion) OVER (ORDER BY mes)) / LAG(facturacion) OVER (ORDER BY mes) * 100)::numeric, 2)
          ELSE 0
        END as crecimiento_porcentual
      FROM monthly_stats
    `);

    // Crecimiento año a año
    const crecimientoAnual = await query(`
      SELECT
        EXTRACT(YEAR FROM fecha) as año,
        COUNT(*) as eventos,
        SUM(cache_total) as facturacion,
        SUM(parte_agencia) as comision,
        AVG(cache_total) as bolo_promedio
      FROM events
      GROUP BY EXTRACT(YEAR FROM fecha)
      ORDER BY año
    `);

    res.json({
      success: true,
      data: {
        crecimiento_mensual: crecimientoMensual.rows,
        crecimiento_anual: crecimientoAnual.rows
      }
    });
  } catch (error) {
    console.error('Error al obtener análisis de crecimiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener análisis de crecimiento',
      error: error.message
    });
  }
};

// KPIs principales para el dashboard
export const getKPIsPrincipales = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const kpis = await query(`
      SELECT
        -- KPIs del mes actual
        (SELECT COUNT(*) FROM events WHERE EXTRACT(YEAR FROM fecha) = $1 AND EXTRACT(MONTH FROM fecha) = $2) as eventos_mes_actual,
        (SELECT SUM(cache_total) FROM events WHERE EXTRACT(YEAR FROM fecha) = $1 AND EXTRACT(MONTH FROM fecha) = $2) as facturacion_mes_actual,
        (SELECT AVG(cache_total) FROM events WHERE EXTRACT(YEAR FROM fecha) = $1 AND EXTRACT(MONTH FROM fecha) = $2) as bolo_promedio_mes,

        -- KPIs del año actual
        (SELECT COUNT(*) FROM events WHERE EXTRACT(YEAR FROM fecha) = $1) as eventos_año_actual,
        (SELECT SUM(cache_total) FROM events WHERE EXTRACT(YEAR FROM fecha) = $1) as facturacion_año_actual,
        (SELECT SUM(parte_agencia) FROM events WHERE EXTRACT(YEAR FROM fecha) = $1) as comision_año_actual,

        -- KPIs globales
        (SELECT COUNT(*) FROM events WHERE cobrado_cliente = false) as eventos_pendiente_cobro,
        (SELECT SUM(cache_total) FROM events WHERE cobrado_cliente = false) as monto_pendiente_cobro,
        (SELECT COUNT(*) FROM events WHERE pagado_dj = false) as eventos_pendiente_pago_dj,
        (SELECT SUM(parte_dj) FROM events WHERE pagado_dj = false) as monto_pendiente_pago_dj,

        -- Próximos eventos
        (SELECT COUNT(*) FROM events WHERE fecha >= CURRENT_DATE AND fecha <= CURRENT_DATE + INTERVAL '7 days') as eventos_proximos_7dias,
        (SELECT COUNT(*) FROM events WHERE fecha >= CURRENT_DATE AND fecha <= CURRENT_DATE + INTERVAL '30 days') as eventos_proximos_30dias
    `, [currentYear, currentMonth]);

    res.json({
      success: true,
      data: kpis.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener KPIs principales:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener KPIs principales',
      error: error.message
    });
  }
};

export default {
  getDashboardFinanciero,
  getEstadisticasDJ,
  getRankingDJs,
  getAnalisisCrecimiento,
  getKPIsPrincipales
};
