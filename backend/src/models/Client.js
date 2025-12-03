import { query } from '../config/database.js';

class Cliente {
  static async create(clienteData) {
    const { nombre, ciudad, contacto, email, telefono, observaciones } = clienteData;

    const sql = `
      INSERT INTO clients (nombre, ciudad, contacto, email, telefono, observaciones)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await query(sql, [nombre, ciudad, contacto, email, telefono, observaciones]);
    return result.rows[0];
  }

  static async findAll() {
    const sql = 'SELECT * FROM clients WHERE activo = true ORDER BY nombre ASC';
    const result = await query(sql);
    return result.rows;
  }

  static async findById(id) {
    const sql = 'SELECT * FROM clients WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async update(id, clienteData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(clienteData).forEach(key => {
      if (clienteData[key] !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(clienteData[key]);
        paramIndex++;
      }
    });

    values.push(id);
    const sql = `
      UPDATE clients
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Buscar o crear cliente por nombre (útil para migración)
  static async findOrCreate(nombre, ciudad = null) {
    // Buscar primero
    let sql = 'SELECT * FROM clients WHERE LOWER(nombre) = LOWER($1)';
    let result = await query(sql, [nombre]);

    if (result.rows.length > 0) {
      return result.rows[0];
    }

    // Si no existe, crear
    sql = `
      INSERT INTO clients (nombre, ciudad)
      VALUES ($1, $2)
      RETURNING *
    `;

    result = await query(sql, [nombre, ciudad]);
    return result.rows[0];
  }

  // =====================================================
  // MÉTODOS DE ANÁLISIS FINANCIERO
  // =====================================================

  // Obtener estadísticas financieras de clientes
  static async getFinancialStats(filters = {}) {
    let sql = `SELECT * FROM vw_cliente_financial_stats WHERE 1=1`;
    const values = [];
    let paramIndex = 1;

    // Filtros opcionales
    if (filters.activo !== undefined) {
      sql += ` AND cliente_activo = $${paramIndex}`;
      values.push(filters.activo);
      paramIndex++;
    }

    if (filters.clasificacion) {
      sql += ` AND clasificacion_cliente = $${paramIndex}`;
      values.push(filters.clasificacion);
      paramIndex++;
    }

    if (filters.estado_actividad) {
      sql += ` AND estado_actividad = $${paramIndex}`;
      values.push(filters.estado_actividad);
      paramIndex++;
    }

    if (filters.min_eventos) {
      sql += ` AND total_eventos >= $${paramIndex}`;
      values.push(parseInt(filters.min_eventos));
      paramIndex++;
    }

    // Ordenamiento
    const orderBy = filters.orderBy || 'facturacion_total';
    const orderDir = filters.orderDir || 'DESC';
    sql += ` ORDER BY ${orderBy} ${orderDir} NULLS LAST`;

    const result = await query(sql, values);
    return result.rows;
  }

  // Obtener estadísticas financieras de un cliente específico
  static async getFinancialStatsById(clienteId) {
    const sql = `SELECT * FROM vw_cliente_financial_stats WHERE cliente_id = $1`;
    const result = await query(sql, [clienteId]);
    return result.rows[0];
  }

  // Obtener cobros pendientes
  static async getCobrosPendientes(filters = {}) {
    let sql = `SELECT * FROM vw_clientes_cobros_pendientes WHERE 1=1`;
    const values = [];
    let paramIndex = 1;

    if (filters.prioridad) {
      sql += ` AND prioridad_cobro = $${paramIndex}`;
      values.push(filters.prioridad);
      paramIndex++;
    }

    if (filters.cliente_id) {
      sql += ` AND cliente_id = $${paramIndex}`;
      values.push(filters.cliente_id);
      paramIndex++;
    }

    if (filters.alto_riesgo !== undefined) {
      sql += ` AND alto_riesgo = $${paramIndex}`;
      values.push(filters.alto_riesgo);
      paramIndex++;
    }

    sql += ` ORDER BY dias_pendiente DESC, monto_pendiente DESC`;

    const result = await query(sql, values);
    return result.rows;
  }

  // Obtener resumen de cobros pendientes
  static async getResumenCobrosPendientes() {
    const sql = `SELECT * FROM obtener_resumen_cobros_pendientes_clientes()`;
    const result = await query(sql);
    return result.rows;
  }

  // Marcar evento como cobrado
  static async marcarEventoCobrado(eventoId) {
    const sql = `
      UPDATE events
      SET cobrado_cliente = true
      WHERE id = $1
      RETURNING *
    `;
    const result = await query(sql, [eventoId]);
    return result.rows[0];
  }

  // Marcar múltiples eventos como cobrados
  static async marcarEventosCobrados(eventoIds) {
    const placeholders = eventoIds.map((_, i) => `$${i + 1}`).join(',');
    const sql = `
      UPDATE events
      SET cobrado_cliente = true
      WHERE id IN (${placeholders})
      RETURNING *
    `;
    const result = await query(sql, eventoIds);
    return result.rows;
  }

  // Obtener rendimiento mensual
  static async getRendimientoMensual(filters = {}) {
    let sql = `SELECT * FROM vw_cliente_rendimiento_mensual WHERE 1=1`;
    const values = [];
    let paramIndex = 1;

    if (filters.cliente_id) {
      sql += ` AND cliente_id = $${paramIndex}`;
      values.push(filters.cliente_id);
      paramIndex++;
    }

    if (filters.año) {
      sql += ` AND año = $${paramIndex}`;
      values.push(parseInt(filters.año));
      paramIndex++;
    }

    if (filters.mes) {
      sql += ` AND mes = $${paramIndex}`;
      values.push(parseInt(filters.mes));
      paramIndex++;
    }

    sql += ` ORDER BY año DESC, mes DESC`;

    const result = await query(sql, values);
    return result.rows;
  }

  // Obtener top clientes por rentabilidad
  static async getTopByRentabilidad(limit = 10) {
    const sql = `
      SELECT * FROM vw_top_clientes_rentabilidad
      ORDER BY comision_total DESC
      LIMIT $1
    `;
    const result = await query(sql, [limit]);
    return result.rows;
  }

  // Obtener comparativa de rendimiento (mes actual vs anterior)
  static async getComparativaRendimiento() {
    const sql = `SELECT * FROM vw_clientes_comparativa_rendimiento`;
    const result = await query(sql);
    return result.rows;
  }

  // Obtener análisis de fidelidad de clientes
  static async getFidelidad(filters = {}) {
    let sql = `SELECT * FROM vw_clientes_fidelidad WHERE 1=1`;
    const values = [];
    let paramIndex = 1;

    if (filters.nivel_fidelidad) {
      sql += ` AND nivel_fidelidad = $${paramIndex}`;
      values.push(filters.nivel_fidelidad);
      paramIndex++;
    }

    if (filters.riesgo_perdida) {
      sql += ` AND riesgo_perdida = $${paramIndex}`;
      values.push(filters.riesgo_perdida);
      paramIndex++;
    }

    sql += ` ORDER BY valor_total_cliente DESC`;

    const result = await query(sql, values);
    return result.rows;
  }
}

export default Cliente;
