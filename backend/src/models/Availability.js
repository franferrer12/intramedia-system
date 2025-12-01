import pool from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Availability Model
 * Gestión completa de disponibilidad de DJs con detección de conflictos
 */
class Availability {

  /**
   * Crear/Actualizar disponibilidad
   */
  static async upsert(data) {
    const {
      dj_id,
      fecha,
      hora_inicio = '00:00',
      hora_fin = '23:59',
      todo_el_dia = true,
      estado = 'disponible',
      evento_id,
      motivo,
      notas,
      color
    } = data;

    // Verificar si ya existe
    const existing = await pool.query(
      'SELECT id FROM dj_availability WHERE dj_id = $1 AND fecha = $2 AND hora_inicio = $3',
      [dj_id, fecha, hora_inicio]
    );

    if (existing.rows.length > 0) {
      // Actualizar
      return await this.update(existing.rows[0].id, data);
    } else {
      // Crear
      const sql = `
        INSERT INTO dj_availability (
          dj_id, fecha, hora_inicio, hora_fin, todo_el_dia,
          estado, evento_id, motivo, notas, color
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const values = [
        dj_id, fecha, hora_inicio, hora_fin, todo_el_dia,
        estado, evento_id, motivo, notas, color
      ];

      const result = await pool.query(sql, values);
      return result.rows[0];
    }
  }

  /**
   * Obtener disponibilidad de un DJ por mes
   */
  static async getByMonth(djId, year, month) {
    const sql = `
      SELECT
        a.*,
        e.nombre as evento_nombre,
        e.ubicacion as evento_ubicacion
      FROM dj_availability a
      LEFT JOIN eventos e ON a.evento_id = e.id
      WHERE a.dj_id = $1
        AND EXTRACT(YEAR FROM a.fecha) = $2
        AND EXTRACT(MONTH FROM a.fecha) = $3
      ORDER BY a.fecha, a.hora_inicio
    `;

    const result = await pool.query(sql, [djId, year, month]);
    return result.rows;
  }

  /**
   * Obtener disponibilidad de un DJ por rango de fechas
   */
  static async getByDateRange(djId, fecha_inicio, fecha_fin) {
    const sql = `
      SELECT
        a.*,
        e.nombre as evento_nombre,
        e.ubicacion as evento_ubicacion
      FROM dj_availability a
      LEFT JOIN eventos e ON a.evento_id = e.id
      WHERE a.dj_id = $1
        AND a.fecha >= $2
        AND a.fecha <= $3
      ORDER BY a.fecha, a.hora_inicio
    `;

    const result = await pool.query(sql, [djId, fecha_inicio, fecha_fin]);
    return result.rows;
  }

  /**
   * Obtener disponibilidad de todos los DJs de una agencia por mes
   */
  static async getAgencyAvailability(agencyId, year, month) {
    const sql = `
      SELECT
        a.*,
        d.nombre as dj_nombre,
        e.nombre as evento_nombre
      FROM dj_availability a
      INNER JOIN agency_djs ad ON a.dj_id = ad.dj_id
      INNER JOIN usuarios d ON a.dj_id = d.id
      LEFT JOIN eventos e ON a.evento_id = e.id
      WHERE ad.agency_id = $1
        AND EXTRACT(YEAR FROM a.fecha) = $2
        AND EXTRACT(MONTH FROM a.fecha) = $3
      ORDER BY a.fecha, d.nombre
    `;

    const result = await pool.query(sql, [agencyId, year, month]);
    return result.rows;
  }

  /**
   * Verificar si un DJ está disponible en una fecha
   */
  static async checkAvailability(djId, fecha, hora_inicio = null, hora_fin = null) {
    let sql = `
      SELECT * FROM dj_availability
      WHERE dj_id = $1 AND fecha = $2
    `;

    const values = [djId, fecha];

    if (hora_inicio && hora_fin) {
      sql += ` AND (
        (hora_inicio <= $3 AND hora_fin >= $3) OR
        (hora_inicio <= $4 AND hora_fin >= $4) OR
        (hora_inicio >= $3 AND hora_fin <= $4)
      )`;
      values.push(hora_inicio, hora_fin);
    }

    const result = await pool.query(sql, values);

    // Si no hay registros, está disponible
    if (result.rows.length === 0) {
      return { disponible: true, conflictos: [] };
    }

    // Verificar si hay conflictos
    const conflictos = result.rows.filter(a =>
      a.estado === 'reservado' || a.estado === 'no_disponible'
    );

    return {
      disponible: conflictos.length === 0,
      conflictos: conflictos
    };
  }

  /**
   * Marcar fecha como no disponible
   */
  static async markUnavailable(djId, fecha, motivo = 'personal', notas = '') {
    return await this.upsert({
      dj_id: djId,
      fecha,
      estado: 'no_disponible',
      motivo,
      notas,
      color: '#ef4444' // Rojo
    });
  }

  /**
   * Marcar fecha como disponible
   */
  static async markAvailable(djId, fecha) {
    return await this.upsert({
      dj_id: djId,
      fecha,
      estado: 'disponible',
      color: '#10b981' // Verde
    });
  }

  /**
   * Reservar fecha para un evento
   */
  static async reserveForEvent(djId, fecha, eventoId, hora_inicio = null, hora_fin = null) {
    return await this.upsert({
      dj_id: djId,
      fecha,
      hora_inicio: hora_inicio || '00:00',
      hora_fin: hora_fin || '23:59',
      estado: 'reservado',
      evento_id: eventoId,
      motivo: 'evento',
      color: '#3b82f6' // Azul
    });
  }

  /**
   * Actualizar disponibilidad
   */
  static async update(id, data) {
    const {
      estado,
      evento_id,
      motivo,
      notas,
      color,
      hora_inicio,
      hora_fin
    } = data;

    const sql = `
      UPDATE dj_availability
      SET
        estado = COALESCE($1, estado),
        evento_id = COALESCE($2, evento_id),
        motivo = COALESCE($3, motivo),
        notas = COALESCE($4, notas),
        color = COALESCE($5, color),
        hora_inicio = COALESCE($6, hora_inicio),
        hora_fin = COALESCE($7, hora_fin),
        fecha_actualizacion = NOW()
      WHERE id = $8
      RETURNING *
    `;

    const values = [
      estado, evento_id, motivo, notas, color,
      hora_inicio, hora_fin, id
    ];

    const result = await pool.query(sql, values);
    return result.rows[0];
  }

  /**
   * Eliminar disponibilidad
   */
  static async delete(id) {
    const sql = 'DELETE FROM dj_availability WHERE id = $1 RETURNING *';
    const result = await pool.query(sql, [id]);
    return result.rows[0];
  }

  /**
   * Obtener estadísticas de disponibilidad de un DJ
   */
  static async getStats(djId, year, month) {
    const sql = `
      SELECT
        COUNT(*) as total_dias,
        COUNT(CASE WHEN estado = 'disponible' THEN 1 END) as dias_disponibles,
        COUNT(CASE WHEN estado = 'reservado' THEN 1 END) as dias_reservados,
        COUNT(CASE WHEN estado = 'no_disponible' THEN 1 END) as dias_no_disponibles,
        COUNT(DISTINCT evento_id) FILTER (WHERE evento_id IS NOT NULL) as eventos_mes
      FROM dj_availability
      WHERE dj_id = $1
        AND EXTRACT(YEAR FROM fecha) = $2
        AND EXTRACT(MONTH FROM fecha) = $3
    `;

    const result = await pool.query(sql, [djId, year, month]);
    return result.rows[0];
  }

  /**
   * Bloquear rango de fechas (vacaciones, etc.)
   */
  static async blockDateRange(djId, fecha_inicio, fecha_fin, motivo = 'vacaciones', notas = '') {
    const results = [];
    const start = new Date(fecha_inicio);
    const end = new Date(fecha_fin);

    // Iterar por cada día del rango
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const fecha = d.toISOString().split('T')[0];
      const availability = await this.markUnavailable(djId, fecha, motivo, notas);
      results.push(availability);
    }

    logger.info('Date range blocked:', { djId, fecha_inicio, fecha_fin, count: results.length });
    return results;
  }

  /**
   * Buscar DJs disponibles en fecha/hora específica
   * @param {Object} criteria - Criterios de búsqueda
   * @returns {Promise<Array>} Lista de DJs disponibles
   */
  static async findAvailableDJs(criteria) {
    const { fecha, hora_inicio, hora_fin, agency_id } = criteria;

    try {
      const query = `
        SELECT DISTINCT
          d.id,
          d.nombre,
          d.email,
          d.telefono,
          d.especialidad,
          d.tarifa_hora,
          d.rating,
          d.agency_id
        FROM djs d
        WHERE d.deleted_at IS NULL
          AND d.is_active = true
          ${agency_id ? 'AND d.agency_id = $4' : ''}
          AND NOT EXISTS (
            SELECT 1
            FROM dj_availability da
            WHERE da.dj_id = d.id
              AND da.fecha = $1
              AND da.estado IN ('reservado', 'no_disponible')
              AND (
                (da.hora_inicio <= $2 AND da.hora_fin >= $2) OR
                (da.hora_inicio <= $3 AND da.hora_fin >= $3) OR
                (da.hora_inicio >= $2 AND da.hora_fin <= $3) OR
                da.todo_el_dia = true
              )
          )
        ORDER BY d.rating DESC NULLS LAST, d.nombre
      `;

      const values = agency_id
        ? [fecha, hora_inicio || '00:00', hora_fin || '23:59', agency_id]
        : [fecha, hora_inicio || '00:00', hora_fin || '23:59'];

      const result = await pool.query(query, values);

      logger.info('Available DJs found:', {
        fecha,
        hora_inicio,
        hora_fin,
        count: result.rows.length
      });

      return result.rows;
    } catch (error) {
      logger.error('Error finding available DJs:', error);
      throw error;
    }
  }

  /**
   * Detección avanzada de conflictos con detalles
   * @param {number} djId - ID del DJ
   * @param {string} fecha - Fecha
   * @param {string} horaInicio - Hora inicio
   * @param {string} horaFin - Hora fin
   * @param {number} excludeId - ID a excluir
   * @returns {Promise<Object>} Resultado con conflictos detallados
   */
  static async detectConflicts(djId, fecha, horaInicio = '00:00', horaFin = '23:59', excludeId = null) {
    try {
      let query = `
        SELECT
          da.*,
          e.evento as evento_nombre,
          e.ubicacion as evento_ubicacion
        FROM dj_availability da
        LEFT JOIN eventos e ON da.evento_id = e.id
        WHERE da.dj_id = $1
          AND da.fecha = $2
          AND (
            (da.hora_inicio <= $3 AND da.hora_fin >= $3) OR
            (da.hora_inicio <= $4 AND da.hora_fin >= $4) OR
            (da.hora_inicio >= $3 AND da.hora_fin <= $4) OR
            da.todo_el_dia = true
          )
      `;

      const values = [djId, fecha, horaInicio, horaFin];

      if (excludeId) {
        query += ` AND da.id != $5`;
        values.push(excludeId);
      }

      const result = await pool.query(query, values);

      const conflicts = result.rows.map(row => ({
        id: row.id,
        fecha: row.fecha,
        hora_inicio: row.hora_inicio,
        hora_fin: row.hora_fin,
        estado: row.estado,
        evento_nombre: row.evento_nombre,
        evento_ubicacion: row.evento_ubicacion,
        motivo: row.motivo,
        notas: row.notas,
        severity: row.estado === 'reservado' ? 'high' : row.estado === 'no_disponible' ? 'medium' : 'low'
      }));

      return {
        has_conflicts: conflicts.length > 0,
        count: conflicts.length,
        conflicts
      };
    } catch (error) {
      logger.error('Error detecting conflicts:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las disponibilidades con paginación y filtros
   * @param {Object} filters - Filtros
   * @returns {Promise<Object>} Resultados paginados
   */
  static async findAll(filters = {}) {
    const {
      dj_id,
      agency_id,
      estado,
      fecha_desde,
      fecha_hasta,
      page = 1,
      limit = 50
    } = filters;

    try {
      let query = `
        SELECT
          da.*,
          d.nombre as dj_nombre,
          d.agency_id,
          e.evento as evento_nombre,
          e.ubicacion as evento_ubicacion
        FROM dj_availability da
        INNER JOIN djs d ON da.dj_id = d.id
        LEFT JOIN eventos e ON da.evento_id = e.id
        WHERE 1=1
      `;

      const conditions = [];
      const values = [];

      if (dj_id) {
        conditions.push(`da.dj_id = $${values.length + 1}`);
        values.push(dj_id);
      }

      if (agency_id) {
        conditions.push(`d.agency_id = $${values.length + 1}`);
        values.push(agency_id);
      }

      if (estado) {
        conditions.push(`da.estado = $${values.length + 1}`);
        values.push(estado);
      }

      if (fecha_desde) {
        conditions.push(`da.fecha >= $${values.length + 1}`);
        values.push(fecha_desde);
      }

      if (fecha_hasta) {
        conditions.push(`da.fecha <= $${values.length + 1}`);
        values.push(fecha_hasta);
      }

      if (conditions.length > 0) {
        query += ` AND ${conditions.join(' AND ')}`;
      }

      query += ` ORDER BY da.fecha DESC, da.hora_inicio`;

      // Paginación
      const offset = (page - 1) * limit;
      query += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
      values.push(limit, offset);

      const result = await pool.query(query, values);

      // Obtener total
      let countQuery = `
        SELECT COUNT(*) as total
        FROM dj_availability da
        INNER JOIN djs d ON da.dj_id = d.id
        WHERE 1=1
      `;

      if (conditions.length > 0) {
        countQuery += ` AND ${conditions.join(' AND ')}`;
      }

      const countResult = await pool.query(countQuery, values.slice(0, -2));
      const total = parseInt(countResult.rows[0].total);

      return {
        success: true,
        data: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          total_pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error finding availabilities:', error);
      throw error;
    }
  }

  /**
   * Limpiar registros antiguos
   * @param {number} daysToKeep - Días a mantener
   * @returns {Promise<Object>} Resultado
   */
  static async cleanupOld(daysToKeep = 90) {
    try {
      const query = `
        DELETE FROM dj_availability
        WHERE fecha < CURRENT_DATE - INTERVAL '${daysToKeep} days'
          AND estado NOT IN ('reservado')
        RETURNING id
      `;

      const result = await pool.query(query);

      logger.info('Old availability records cleaned up:', {
        count: result.rows.length,
        daysToKeep
      });

      return {
        success: true,
        cleaned: result.rows.length
      };
    } catch (error) {
      logger.error('Error cleaning up old availability:', error);
      throw error;
    }
  }

  /**
   * Obtener disponibilidad por ID
   * @param {number} id - ID de la disponibilidad
   * @returns {Promise<Object|null>} Disponibilidad encontrada
   */
  static async findById(id) {
    try {
      const query = `
        SELECT
          da.*,
          d.nombre as dj_nombre,
          d.agency_id,
          e.evento as evento_nombre,
          e.ubicacion as evento_ubicacion
        FROM dj_availability da
        INNER JOIN djs d ON da.dj_id = d.id
        LEFT JOIN eventos e ON da.evento_id = e.id
        WHERE da.id = $1
      `;

      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding availability by ID:', error);
      throw error;
    }
  }
}

export default Availability;
