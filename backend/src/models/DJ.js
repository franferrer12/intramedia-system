import { query } from '../config/database.js';

class DJ {
  static async create(djData) {
    const { nombre, email, telefono, password_hash, observaciones } = djData;

    const sql = `
      INSERT INTO djs (nombre, email, telefono, password_hash, observaciones)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await query(sql, [nombre, email, telefono, password_hash, observaciones]);
    return result.rows[0];
  }

  static async findAll() {
    const sql = 'SELECT * FROM djs WHERE activo = true ORDER BY nombre ASC';
    const result = await query(sql);
    return result.rows;
  }

  static async findById(id) {
    const sql = 'SELECT * FROM djs WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const sql = 'SELECT * FROM djs WHERE email = $1';
    const result = await query(sql, [email]);
    return result.rows[0];
  }

  static async update(id, djData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(djData).forEach(key => {
      if (djData[key] !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(djData[key]);
        paramIndex++;
      }
    });

    values.push(id);
    const sql = `
      UPDATE djs
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Obtener estadísticas de un DJ por mes
  static async getStatsByMonth(djId, mes) {
    const sql = `
      SELECT
        COUNT(*) as total_eventos,
        SUM(parte_dj) as total_a_pagar,
        AVG(parte_dj) as media_por_evento,
        SUM(CASE WHEN pagado_dj = true THEN 1 ELSE 0 END) as eventos_pagados
      FROM events
      WHERE dj_id = $1 AND UPPER(mes) = UPPER($2)
    `;

    const result = await query(sql, [djId, mes]);
    return result.rows[0];
  }

  // Obtener eventos de un DJ
  static async getEventos(djId, filters = {}) {
    let sql = `
      SELECT
        e.*,
        c.nombre as cliente_nombre,
        cat.nombre as categoria_nombre
      FROM events e
      LEFT JOIN clients c ON e.cliente_id = c.id
      LEFT JOIN event_categories cat ON e.categoria_id = cat.id
      WHERE e.dj_id = $1
    `;

    const values = [djId];
    let paramIndex = 2;

    if (filters.mes) {
      sql += ` AND UPPER(e.mes) = UPPER($${paramIndex})`;
      values.push(filters.mes);
      paramIndex++;
    }

    sql += ` ORDER BY e.fecha DESC`;

    const result = await query(sql, values);
    return result.rows;
  }

  // ========================================
  // MÉTODOS FINANCIEROS
  // ========================================

  // Obtener estadísticas financieras completas de todos los DJs
  static async getFinancialStats(filters = {}) {
    let sql = `SELECT * FROM vw_dj_financial_stats WHERE 1=1`;
    const values = [];
    let paramIndex = 1;

    // Filtro por DJ activo/inactivo
    if (filters.activo !== undefined) {
      sql += ` AND dj_activo = $${paramIndex}`;
      values.push(filters.activo);
      paramIndex++;
    }

    // Filtro por eventos mínimos
    if (filters.min_eventos) {
      sql += ` AND total_eventos >= $${paramIndex}`;
      values.push(filters.min_eventos);
      paramIndex++;
    }

    // Ordenamiento
    const orderBy = filters.orderBy || 'total_cobrado';
    const orderDir = filters.orderDir || 'DESC';
    sql += ` ORDER BY ${orderBy} ${orderDir}`;

    const result = await query(sql, values);
    return result.rows;
  }

  // Obtener estadísticas financieras de un DJ específico
  static async getFinancialStatsById(djId) {
    const sql = `SELECT * FROM vw_dj_financial_stats WHERE dj_id = $1`;
    const result = await query(sql, [djId]);
    return result.rows[0];
  }

  // Obtener top DJs por rentabilidad
  static async getTopByRentabilidad(limit = 10) {
    const sql = `
      SELECT * FROM vw_top_djs_rentabilidad
      LIMIT $1
    `;
    const result = await query(sql, [limit]);
    return result.rows;
  }

  // Obtener pagos pendientes de todos los DJs
  static async getPagosPendientes(filters = {}) {
    let sql = `SELECT * FROM vw_djs_pagos_pendientes WHERE 1=1`;
    const values = [];
    let paramIndex = 1;

    // Filtro por DJ
    if (filters.dj_id) {
      sql += ` AND dj_id = $${paramIndex}`;
      values.push(filters.dj_id);
      paramIndex++;
    }

    // Filtro por prioridad
    if (filters.prioridad) {
      sql += ` AND prioridad_pago = $${paramIndex}`;
      values.push(filters.prioridad);
      paramIndex++;
    }

    sql += ` ORDER BY evento_fecha ASC`;

    const result = await query(sql, values);
    return result.rows;
  }

  // Obtener resumen de pagos pendientes (agrupado por DJ)
  static async getResumenPagosPendientes() {
    const sql = `SELECT * FROM obtener_resumen_pagos_pendientes()`;
    const result = await query(sql);
    return result.rows;
  }

  // Obtener rendimiento mensual de DJs
  static async getRendimientoMensual(filters = {}) {
    let sql = `SELECT * FROM vw_dj_rendimiento_mensual WHERE 1=1`;
    const values = [];
    let paramIndex = 1;

    // Filtro por DJ
    if (filters.dj_id) {
      sql += ` AND dj_id = $${paramIndex}`;
      values.push(filters.dj_id);
      paramIndex++;
    }

    // Filtro por año
    if (filters.año) {
      sql += ` AND año = $${paramIndex}`;
      values.push(filters.año);
      paramIndex++;
    }

    // Filtro por mes
    if (filters.mes) {
      sql += ` AND mes = $${paramIndex}`;
      values.push(filters.mes);
      paramIndex++;
    }

    sql += ` ORDER BY año DESC, mes DESC, total_cobrado_mes DESC`;

    const result = await query(sql, values);
    return result.rows;
  }

  // Obtener comparativa de rendimiento entre DJs (últimos 3 meses)
  static async getComparativaRendimiento() {
    const sql = `
      SELECT
        dj_nombre,
        total_eventos,
        eventos_ultimo_trimestre,
        precio_hora_medio,
        precio_hora_ultimo_trimestre,
        total_pendiente_pago,
        rentabilidad_total_agencia,
        margen_beneficio_porcentaje,

        -- Tendencia (comparar precio hora actual vs último trimestre)
        CASE
          WHEN precio_hora_ultimo_trimestre > precio_hora_medio THEN 'Alza'
          WHEN precio_hora_ultimo_trimestre < precio_hora_medio THEN 'Baja'
          ELSE 'Estable'
        END as tendencia_precio

      FROM vw_dj_financial_stats
      WHERE total_eventos > 0
        AND dj_activo = true
      ORDER BY eventos_ultimo_trimestre DESC, rentabilidad_total_agencia DESC
    `;

    const result = await query(sql);
    return result.rows;
  }

  // Marcar evento como pagado a DJ
  static async marcarEventoPagado(eventoId) {
    const sql = `
      UPDATE events
      SET pagado_dj = true
      WHERE id = $1
      RETURNING *
    `;
    const result = await query(sql, [eventoId]);
    return result.rows[0];
  }

  // Marcar múltiples eventos como pagados
  static async marcarEventosPagados(eventoIds) {
    const sql = `
      UPDATE events
      SET pagado_dj = true
      WHERE id = ANY($1)
      RETURNING id, evento, parte_dj
    `;
    const result = await query(sql, [eventoIds]);
    return result.rows;
  }
}

export default DJ;
