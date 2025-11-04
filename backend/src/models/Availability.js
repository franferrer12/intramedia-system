import pool from '../config/database.js';

/**
 * Modelo para gestión de disponibilidad de DJs
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

    return results;
  }
}

export default Availability;
