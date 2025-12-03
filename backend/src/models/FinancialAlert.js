import pool from '../config/database.js';

class FinancialAlert {
  /**
   * Get all alerts with optional filters
   */
  static async getAll(filters = {}) {
    const {
      alert_type,
      severity,
      is_read,
      is_resolved,
      limit = 100,
      offset = 0
    } = filters;

    let query = `
      SELECT
        fa.*,
        c.nombre as cliente_nombre,
        c.email as cliente_email,
        d.nombre as dj_nombre,
        d.email as dj_email,
        e.evento as evento_nombre,
        e.fecha as evento_fecha
      FROM financial_alerts fa
      LEFT JOIN clients c ON fa.cliente_id = c.id
      LEFT JOIN djs d ON fa.dj_id = d.id
      LEFT JOIN events e ON fa.evento_id = e.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (alert_type) {
      query += ` AND fa.alert_type = $${paramCount}`;
      params.push(alert_type);
      paramCount++;
    }

    if (severity) {
      query += ` AND fa.severity = $${paramCount}`;
      params.push(severity);
      paramCount++;
    }

    if (is_read !== undefined) {
      query += ` AND fa.is_read = $${paramCount}`;
      params.push(is_read);
      paramCount++;
    }

    if (is_resolved !== undefined) {
      query += ` AND fa.is_resolved = $${paramCount}`;
      params.push(is_resolved);
      paramCount++;
    }

    query += `
      ORDER BY
        CASE fa.severity
          WHEN 'critical' THEN 1
          WHEN 'warning' THEN 2
          ELSE 3
        END,
        fa.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get active (unresolved) alerts view
   */
  static async getActive() {
    const query = 'SELECT * FROM vw_active_alerts';
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Get unread alerts (not read and not resolved)
   */
  static async getUnread() {
    const query = `
      SELECT
        fa.*,
        c.nombre as cliente_nombre,
        c.email as cliente_email,
        d.nombre as dj_nombre,
        d.email as dj_email,
        e.evento as evento_nombre,
        e.fecha as evento_fecha
      FROM financial_alerts fa
      LEFT JOIN clients c ON fa.cliente_id = c.id
      LEFT JOIN djs d ON fa.dj_id = d.id
      LEFT JOIN events e ON fa.evento_id = e.id
      WHERE fa.is_read = false AND fa.is_resolved = false
      ORDER BY
        CASE fa.severity
          WHEN 'critical' THEN 1
          WHEN 'warning' THEN 2
          ELSE 3
        END,
        fa.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Get alerts summary (grouped by type and severity)
   */
  static async getSummary() {
    const query = 'SELECT * FROM vw_alerts_summary';
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Get alert by ID
   */
  static async getById(id) {
    const query = `
      SELECT
        fa.*,
        c.nombre as cliente_nombre,
        c.email as cliente_email,
        d.nombre as dj_nombre,
        d.email as dj_email,
        e.evento as evento_nombre,
        e.fecha as evento_fecha
      FROM financial_alerts fa
      LEFT JOIN clients c ON fa.cliente_id = c.id
      LEFT JOIN djs d ON fa.dj_id = d.id
      LEFT JOIN events e ON fa.evento_id = e.id
      WHERE fa.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Mark alert as read
   */
  static async markAsRead(id) {
    const query = `
      UPDATE financial_alerts
      SET is_read = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Mark multiple alerts as read
   */
  static async markMultipleAsRead(ids) {
    const query = `
      UPDATE financial_alerts
      SET is_read = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = ANY($1)
      RETURNING *
    `;
    const result = await pool.query(query, [ids]);
    return result.rows;
  }

  /**
   * Mark alert as resolved
   */
  static async markAsResolved(id, resolvedBy = null) {
    const query = `
      UPDATE financial_alerts
      SET
        is_resolved = true,
        is_read = true,
        resolved_at = CURRENT_TIMESTAMP,
        resolved_by = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id, resolvedBy]);
    return result.rows[0];
  }

  /**
   * Mark multiple alerts as resolved
   */
  static async markMultipleAsResolved(ids, resolvedBy = null) {
    const query = `
      UPDATE financial_alerts
      SET
        is_resolved = true,
        is_read = true,
        resolved_at = CURRENT_TIMESTAMP,
        resolved_by = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ANY($1)
      RETURNING *
    `;
    const result = await pool.query(query, [ids, resolvedBy]);
    return result.rows;
  }

  /**
   * Generate all financial alerts (runs the automated alert generation)
   */
  static async generateAlerts() {
    const query = 'SELECT * FROM generate_all_financial_alerts()';
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Get count of unread alerts
   */
  static async getUnreadCount() {
    const query = `
      SELECT COUNT(*) as count
      FROM financial_alerts
      WHERE is_read = false AND is_resolved = false
    `;
    const result = await pool.query(query);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get count by severity for unresolved alerts
   */
  static async getCountBySeverity() {
    const query = `
      SELECT
        severity,
        COUNT(*) as count
      FROM financial_alerts
      WHERE is_resolved = false
      GROUP BY severity
      ORDER BY
        CASE severity
          WHEN 'critical' THEN 1
          WHEN 'warning' THEN 2
          ELSE 3
        END
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Delete alert (admin only)
   */
  static async delete(id) {
    const query = 'DELETE FROM financial_alerts WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Get alerts for specific cliente
   */
  static async getByCliente(clienteId) {
    const query = `
      SELECT fa.*
      FROM financial_alerts fa
      WHERE fa.cliente_id = $1
      AND fa.is_resolved = false
      ORDER BY fa.created_at DESC
    `;
    const result = await pool.query(query, [clienteId]);
    return result.rows;
  }

  /**
   * Get alerts for specific DJ
   */
  static async getByDJ(djId) {
    const query = `
      SELECT fa.*
      FROM financial_alerts fa
      WHERE fa.dj_id = $1
      AND fa.is_resolved = false
      ORDER BY fa.created_at DESC
    `;
    const result = await pool.query(query, [djId]);
    return result.rows;
  }

  /**
   * Get alerts for specific evento
   */
  static async getByEvento(eventoId) {
    const query = `
      SELECT fa.*
      FROM financial_alerts fa
      WHERE fa.evento_id = $1
      AND fa.is_resolved = false
      ORDER BY fa.created_at DESC
    `;
    const result = await pool.query(query, [eventoId]);
    return result.rows;
  }

  /**
   * Get dashboard stats
   */
  static async getDashboardStats() {
    const query = `
      SELECT
        COUNT(*) FILTER (WHERE is_resolved = false) as total_active,
        COUNT(*) FILTER (WHERE is_read = false AND is_resolved = false) as total_unread,
        COUNT(*) FILTER (WHERE severity = 'critical' AND is_resolved = false) as critical_count,
        COUNT(*) FILTER (WHERE severity = 'warning' AND is_resolved = false) as warning_count,
        COUNT(*) FILTER (WHERE severity = 'info' AND is_resolved = false) as info_count,
        COUNT(*) FILTER (WHERE alert_type = 'cobro_critico' AND is_resolved = false) as cobros_criticos,
        COUNT(*) FILTER (WHERE alert_type = 'cobro_urgente' AND is_resolved = false) as cobros_urgentes,
        COUNT(*) FILTER (WHERE alert_type = 'pago_dj_pendiente' AND is_resolved = false) as pagos_dj,
        COUNT(*) FILTER (WHERE alert_type = 'cliente_inactivo' AND is_resolved = false) as clientes_inactivos,
        COUNT(*) FILTER (WHERE alert_type = 'cliente_riesgo_perdida' AND is_resolved = false) as clientes_riesgo
      FROM financial_alerts
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }
}

export default FinancialAlert;
