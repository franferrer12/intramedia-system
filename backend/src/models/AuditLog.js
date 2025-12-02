import pool from '../config/database.js';

/**
 * AuditLog Model
 * Manages audit logging for all system operations
 */
class AuditLog {
  /**
   * Create a new audit log entry
   * @param {Object} logData - Audit log data
   * @returns {Promise<Object>} Created audit log
   */
  static async create(logData) {
    const {
      eventType,
      entityType,
      entityId,
      userId,
      userEmail,
      userRole,
      action,
      method,
      endpoint,
      ipAddress,
      userAgent,
      oldValues,
      newValues,
      changedFields,
      status = 'SUCCESS',
      errorMessage,
      durationMs,
      metadata,
      sessionId,
      requestId,
      impersonatedBy
    } = logData;

    const query = `
      INSERT INTO audit_logs (
        event_type, entity_type, entity_id,
        user_id, user_email, user_role, impersonated_by,
        action, method, endpoint,
        ip_address, user_agent,
        old_values, new_values, changed_fields,
        status, error_message, duration_ms, metadata,
        session_id, request_id
      ) VALUES (
        $1, $2, $3,
        $4, $5, $6, $7,
        $8, $9, $10,
        $11, $12,
        $13, $14, $15,
        $16, $17, $18, $19,
        $20, $21
      )
      RETURNING *
    `;

    const values = [
      eventType, entityType, entityId,
      userId, userEmail, userRole, impersonatedBy,
      action, method, endpoint,
      ipAddress, userAgent,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      changedFields,
      status, errorMessage, durationMs, metadata ? JSON.stringify(metadata) : null,
      sessionId, requestId
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      // Log to console but don't fail the request if audit logging fails
      console.error('Failed to create audit log:', error);
      return null;
    }
  }

  /**
   * Get audit logs with filters and pagination
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination params
   * @returns {Promise<Object>} Audit logs and metadata
   */
  static async find(filters = {}, pagination = {}) {
    const {
      eventType,
      entityType,
      entityId,
      userId,
      status,
      startDate,
      endDate,
      search,
      ipAddress
    } = filters;

    const {
      page = 1,
      limit = 50,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = pagination;

    let whereConditions = [];
    let values = [];
    let paramCounter = 1;

    // Build WHERE conditions
    if (eventType) {
      whereConditions.push(`event_type = $${paramCounter++}`);
      values.push(eventType);
    }

    if (entityType) {
      whereConditions.push(`entity_type = $${paramCounter++}`);
      values.push(entityType);
    }

    if (entityId) {
      whereConditions.push(`entity_id = $${paramCounter++}`);
      values.push(entityId);
    }

    if (userId) {
      whereConditions.push(`user_id = $${paramCounter++}`);
      values.push(userId);
    }

    if (status) {
      whereConditions.push(`status = $${paramCounter++}`);
      values.push(status);
    }

    if (startDate) {
      whereConditions.push(`created_at >= $${paramCounter++}`);
      values.push(startDate);
    }

    if (endDate) {
      whereConditions.push(`created_at <= $${paramCounter++}`);
      values.push(endDate);
    }

    if (ipAddress) {
      whereConditions.push(`ip_address = $${paramCounter++}`);
      values.push(ipAddress);
    }

    if (search) {
      whereConditions.push(`(
        action ILIKE $${paramCounter} OR
        user_email ILIKE $${paramCounter} OR
        endpoint ILIKE $${paramCounter}
      )`);
      values.push(`%${search}%`);
      paramCounter++;
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Validate sort column to prevent SQL injection
    const validSortColumns = [
      'created_at', 'event_type', 'entity_type', 'user_email', 'status', 'duration_ms'
    ];
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated data with user info
    const dataQuery = `
      SELECT
        al.*,
        u.nombre as user_name,
        u.nombre_artistico as user_dj_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.${safeSortBy} ${safeSortOrder}
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    values.push(limit, offset);
    const dataResult = await pool.query(dataQuery, values);

    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get audit trail for a specific entity
   * @param {string} entityType - Type of entity
   * @param {number} entityId - Entity ID
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Audit trail
   */
  static async getEntityTrail(entityType, entityId, limit = 50) {
    const query = `
      SELECT * FROM get_entity_audit_trail($1, $2, $3)
    `;

    const result = await pool.query(query, [entityType, entityId, limit]);
    return result.rows;
  }

  /**
   * Get recent activity (last 7 days)
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Recent activity
   */
  static async getRecentActivity(limit = 100) {
    const query = `
      SELECT * FROM recent_audit_activity
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  /**
   * Get failed operations
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Failed operations
   */
  static async getFailedOperations(limit = 100) {
    const query = `
      SELECT * FROM failed_audit_operations
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  /**
   * Get security events
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Security events
   */
  static async getSecurityEvents(limit = 100) {
    const query = `
      SELECT * FROM security_audit_events
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  /**
   * Get user activity summary
   * @param {number} userId - User ID (optional)
   * @returns {Promise<Array>} User activity summaries
   */
  static async getUserActivitySummary(userId = null) {
    let query = `SELECT * FROM user_activity_summary`;
    let values = [];

    if (userId) {
      query += ` WHERE user_id = $1`;
      values.push(userId);
    }

    query += ` ORDER BY total_actions DESC`;

    const result = await pool.query(query, values);
    return userId ? result.rows[0] : result.rows;
  }

  /**
   * Get audit statistics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Statistics
   */
  static async getStatistics(startDate = null, endDate = null) {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate || new Date();

    const query = `SELECT * FROM get_audit_statistics($1, $2)`;
    const result = await pool.query(query, [start, end]);

    return result.rows[0] || {
      total_events: 0,
      successful_events: 0,
      failed_events: 0,
      unique_users: 0,
      unique_ips: 0,
      events_by_type: {},
      events_by_entity: {},
      hourly_distribution: {}
    };
  }

  /**
   * Clean old audit logs
   * @param {number} retentionDays - Days to retain
   * @returns {Promise<number>} Number of deleted records
   */
  static async cleanup(retentionDays = 365) {
    const query = `SELECT cleanup_old_audit_logs($1)`;
    const result = await pool.query(query, [retentionDays]);
    return result.rows[0].cleanup_old_audit_logs;
  }

  /**
   * Get by ID
   * @param {number} id - Audit log ID
   * @returns {Promise<Object>} Audit log
   */
  static async findById(id) {
    const query = `
      SELECT
        al.*,
        u.nombre as user_name,
        u.nombre_artistico as user_dj_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Export audit logs to CSV format
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} Audit logs for export
   */
  static async exportToCSV(filters = {}) {
    const { data } = await this.find(filters, { limit: 10000, page: 1 });

    return data.map(log => ({
      ID: log.id,
      Fecha: log.created_at,
      Tipo: log.event_type,
      Acción: log.action,
      Usuario: log.user_email,
      Rol: log.user_role,
      Entidad: log.entity_type,
      'ID Entidad': log.entity_id,
      Estado: log.status,
      'IP': log.ip_address,
      Método: log.method,
      Endpoint: log.endpoint,
      'Duración (ms)': log.duration_ms
    }));
  }
}

export default AuditLog;
