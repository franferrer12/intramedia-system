import { query } from '../config/database.js';

class Evento {
  // Crear evento
  static async create(eventoData) {
    const {
      fecha, mes, dj_id, cliente_id, evento, ciudad_lugar, categoria_id,
      horas, cache_total, parte_dj, parte_agencia, reserva,
      cobrado_cliente, pagado_dj, observaciones,
      costo_alquiler, otros_costos, descripcion_costos
    } = eventoData;

    const sql = `
      INSERT INTO events (
        fecha, mes, dj_id, cliente_id, evento, ciudad_lugar, categoria_id,
        horas, cache_total, parte_dj, parte_agencia, reserva,
        cobrado_cliente, pagado_dj, observaciones,
        costo_alquiler, otros_costos, descripcion_costos
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;

    const values = [
      fecha, mes, dj_id, cliente_id, evento, ciudad_lugar, categoria_id,
      horas, cache_total, parte_dj, parte_agencia, reserva || 0,
      cobrado_cliente || false, pagado_dj || false, observaciones,
      costo_alquiler || 0, otros_costos || 0, descripcion_costos
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Obtener todos los eventos con joins
  static async findAll(filters = {}) {
    let sql = `
      SELECT
        e.*,
        d.nombre as dj_nombre,
        c.nombre as cliente_nombre,
        cat.nombre as categoria_nombre,
        cat.color as categoria_color
      FROM events e
      LEFT JOIN djs d ON e.dj_id = d.id
      LEFT JOIN clients c ON e.cliente_id = c.id
      LEFT JOIN event_categories cat ON e.categoria_id = cat.id
      WHERE 1=1
    `;

    const values = [];
    let paramIndex = 1;

    // Filtros dinámicos
    if (filters.mes) {
      sql += ` AND UPPER(e.mes) = UPPER($${paramIndex})`;
      values.push(filters.mes);
      paramIndex++;
    }

    if (filters.dj_id) {
      sql += ` AND e.dj_id = $${paramIndex}`;
      values.push(filters.dj_id);
      paramIndex++;
    }

    if (filters.cobrado_cliente !== undefined) {
      sql += ` AND e.cobrado_cliente = $${paramIndex}`;
      values.push(filters.cobrado_cliente);
      paramIndex++;
    }

    if (filters.pagado_dj !== undefined) {
      sql += ` AND e.pagado_dj = $${paramIndex}`;
      values.push(filters.pagado_dj);
      paramIndex++;
    }

    sql += ` ORDER BY e.fecha DESC`;

    const result = await query(sql, values);
    return result.rows;
  }

  // Obtener evento por ID
  static async findById(id) {
    const sql = `
      SELECT
        e.*,
        d.nombre as dj_nombre,
        d.email as dj_email,
        c.nombre as cliente_nombre,
        c.email as cliente_email,
        cat.nombre as categoria_nombre
      FROM events e
      LEFT JOIN djs d ON e.dj_id = d.id
      LEFT JOIN clients c ON e.cliente_id = c.id
      LEFT JOIN event_categories cat ON e.categoria_id = cat.id
      WHERE e.id = $1
    `;

    const result = await query(sql, [id]);
    return result.rows[0];
  }

  // Actualizar evento
  static async update(id, eventoData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Construcción dinámica del UPDATE
    Object.keys(eventoData).forEach(key => {
      if (eventoData[key] !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(eventoData[key]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    values.push(id);
    const sql = `
      UPDATE events
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  // Eliminar evento
  static async delete(id) {
    const sql = 'DELETE FROM events WHERE id = $1 RETURNING *';
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  // Estadísticas por mes
  static async getStatsByMonth(mes) {
    const sql = `
      SELECT
        COUNT(*) as total_eventos,
        SUM(cache_total) as ingresos_totales,
        SUM(parte_agencia) as ingresos_agencia,
        SUM(parte_dj) as ingresos_djs,
        SUM(CASE WHEN NOT cobrado_cliente THEN cache_total - COALESCE(reserva, 0) ELSE 0 END) as pendiente_cobro,
        SUM(CASE WHEN NOT pagado_dj THEN parte_dj ELSE 0 END) as pendiente_pago_djs,
        AVG(parte_agencia) as rentabilidad_media_evento,
        AVG(euro_hora_dj) as rentabilidad_media_hora_dj
      FROM events
      WHERE UPPER(mes) = UPPER($1)
    `;

    const result = await query(sql, [mes]);
    return result.rows[0];
  }

  // Eventos próximos (para alertas)
  static async getUpcoming(days = 7) {
    const sql = `
      SELECT
        e.*,
        d.nombre as dj_nombre,
        d.email as dj_email,
        c.nombre as cliente_nombre
      FROM events e
      LEFT JOIN djs d ON e.dj_id = d.id
      LEFT JOIN clients c ON e.cliente_id = c.id
      WHERE e.fecha BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '1 day' * $1
      ORDER BY e.fecha ASC
    `;

    const result = await query(sql, [days]);
    return result.rows;
  }

  // Obtener desglose financiero completo de un evento
  static async getFinancialBreakdown(id) {
    const sql = `
      SELECT * FROM vw_eventos_desglose_financiero
      WHERE id = $1
    `;

    const result = await query(sql, [id]);
    return result.rows[0];
  }

  // Obtener resumen financiero mensual
  static async getMonthlyFinancialSummary(year = null, month = null) {
    let sql = `SELECT * FROM vw_resumen_financiero_mensual WHERE 1=1`;
    const values = [];
    let paramIndex = 1;

    if (year) {
      sql += ` AND año = $${paramIndex}`;
      values.push(year);
      paramIndex++;
    }

    if (month) {
      sql += ` AND mes_numero = $${paramIndex}`;
      values.push(month);
      paramIndex++;
    }

    sql += ` ORDER BY año DESC, mes_numero DESC`;

    const result = await query(sql, values);
    return result.rows;
  }

  // Obtener resumen por socio
  static async getPartnerSummary() {
    const sql = `SELECT * FROM vw_resumen_por_socio ORDER BY socio`;
    const result = await query(sql);
    return result.rows;
  }
}

export default Evento;
