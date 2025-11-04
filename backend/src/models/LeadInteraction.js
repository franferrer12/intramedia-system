import { query } from '../config/database.js';

/**
 * Modelo para interacciones con leads
 * Almacena el timeline completo de actividades:
 * - Llamadas, emails, reuniones
 * - Cambios de estado
 * - Notas y comentarios
 */
class LeadInteraction {
  /**
   * Crear una nueva interacción
   */
  static async create(interactionData) {
    const {
      lead_id,
      tipo, // 'llamada', 'email', 'reunion', 'nota', 'estado_cambio', 'whatsapp'
      descripcion,
      usuario_id,
      fecha_proxima_accion,
      recordatorio = false
    } = interactionData;

    const sql = `
      INSERT INTO lead_interactions (
        lead_id, tipo, descripcion, usuario_id,
        fecha_proxima_accion, recordatorio
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await query(sql, [
      lead_id,
      tipo,
      descripcion,
      usuario_id,
      fecha_proxima_accion,
      recordatorio
    ]);

    return result.rows[0];
  }

  /**
   * Obtener todas las interacciones de un lead (timeline)
   */
  static async findByLeadId(leadId) {
    const sql = `
      SELECT
        li.*,
        u.nombre as usuario_nombre,
        u.email as usuario_email
      FROM lead_interactions li
      LEFT JOIN usuarios u ON li.usuario_id = u.id
      WHERE li.lead_id = $1
      ORDER BY li.fecha_creacion DESC
    `;

    const result = await query(sql, [leadId]);
    return result.rows;
  }

  /**
   * Obtener interacciones pendientes (con recordatorio)
   */
  static async findPendingReminders() {
    const sql = `
      SELECT
        li.*,
        l.nombre as lead_nombre,
        l.email as lead_email,
        u.nombre as usuario_nombre,
        u.email as usuario_email
      FROM lead_interactions li
      INNER JOIN leads l ON li.lead_id = l.id
      LEFT JOIN usuarios u ON li.usuario_id = u.id
      WHERE
        li.recordatorio = true
        AND li.fecha_proxima_accion IS NOT NULL
        AND li.fecha_proxima_accion <= NOW()
        AND li.completado = false
      ORDER BY li.fecha_proxima_accion ASC
    `;

    const result = await query(sql);
    return result.rows;
  }

  /**
   * Marcar interacción como completada
   */
  static async markAsCompleted(id) {
    const sql = `
      UPDATE lead_interactions
      SET completado = true, fecha_completado = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await query(sql, [id]);
    return result.rows[0];
  }

  /**
   * Obtener estadísticas de interacciones por tipo
   */
  static async getStats(leadId) {
    const sql = `
      SELECT
        tipo,
        COUNT(*) as total,
        MAX(fecha_creacion) as ultima_interaccion
      FROM lead_interactions
      WHERE lead_id = $1
      GROUP BY tipo
    `;

    const result = await query(sql, [leadId]);
    return result.rows;
  }

  /**
   * Registrar cambio de estado automáticamente
   */
  static async logEstadoCambio(leadId, estadoAnterior, estadoNuevo, usuarioId) {
    const descripcion = `Estado cambiado de "${estadoAnterior}" a "${estadoNuevo}"`;

    return await this.create({
      lead_id: leadId,
      tipo: 'estado_cambio',
      descripcion,
      usuario_id: usuarioId
    });
  }

  /**
   * Eliminar interacción
   */
  static async delete(id) {
    const sql = `
      DELETE FROM lead_interactions
      WHERE id = $1
      RETURNING *
    `;

    const result = await query(sql, [id]);
    return result.rows[0];
  }
}

export default LeadInteraction;
