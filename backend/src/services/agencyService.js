import pool from '../config/database.js';

/**
 * Agency Service
 * Handles business logic for agency management, DJ assignments, and relationships
 */

class AgencyService {
  /**
   * Get agency by user ID
   */
  async getAgencyByUserId(userId) {
    try {
      const result = await pool.query(
        `SELECT
          a.*,
          COUNT(DISTINCT r.dj_id) as total_djs,
          COUNT(DISTINCT CASE WHEN r.active = true THEN r.dj_id END) as active_djs
         FROM agencies a
         LEFT JOIN agency_dj_relations r ON a.id = r.agency_id
         WHERE a.user_id = $1
         GROUP BY a.id`,
        [userId]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Agencia no encontrada'
        };
      }

      return {
        success: true,
        agency: result.rows[0]
      };
    } catch (error) {
      console.error('Error in getAgencyByUserId:', error);
      return {
        success: false,
        error: 'Error al obtener información de la agencia'
      };
    }
  }

  /**
   * Get agency by ID
   */
  async getAgencyById(agencyId) {
    try {
      const result = await pool.query(
        `SELECT
          a.*,
          COUNT(DISTINCT r.dj_id) as total_djs,
          COUNT(DISTINCT CASE WHEN r.active = true THEN r.dj_id END) as active_djs
         FROM agencies a
         LEFT JOIN agency_dj_relations r ON a.id = r.agency_id
         WHERE a.id = $1
         GROUP BY a.id`,
        [agencyId]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Agencia no encontrada'
        };
      }

      return {
        success: true,
        agency: result.rows[0]
      };
    } catch (error) {
      console.error('Error in getAgencyById:', error);
      return {
        success: false,
        error: 'Error al obtener información de la agencia'
      };
    }
  }

  /**
   * Update agency profile
   */
  async updateAgency(agencyId, updateData) {
    const {
      agency_name,
      legal_name,
      tax_id,
      contact_person,
      phone,
      address,
      website,
      logo_url
    } = updateData;

    try {
      const result = await pool.query(
        `UPDATE agencies SET
          agency_name = COALESCE($1, agency_name),
          legal_name = COALESCE($2, legal_name),
          tax_id = COALESCE($3, tax_id),
          contact_person = COALESCE($4, contact_person),
          phone = COALESCE($5, phone),
          address = COALESCE($6, address),
          website = COALESCE($7, website),
          logo_url = COALESCE($8, logo_url),
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $9
         RETURNING *`,
        [
          agency_name,
          legal_name,
          tax_id,
          contact_person,
          phone,
          address,
          website,
          logo_url,
          agencyId
        ]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Agencia no encontrada'
        };
      }

      return {
        success: true,
        agency: result.rows[0]
      };
    } catch (error) {
      console.error('Error in updateAgency:', error);
      return {
        success: false,
        error: 'Error al actualizar información de la agencia'
      };
    }
  }

  /**
   * Get all DJs managed by agency
   */
  async getAgencyDJs(agencyId, includeInactive = false) {
    try {
      let query = `
        SELECT
          d.*,
          r.role as agency_role,
          r.commission_rate,
          r.contract_start_date,
          r.contract_end_date,
          r.active as relation_active,
          COUNT(DISTINCT e.id) as total_events,
          COUNT(DISTINCT CASE WHEN e.cobrado_cliente = true THEN e.id END) as paid_events,
          COALESCE(SUM(e.cache_total), 0) as total_revenue
        FROM djs d
        INNER JOIN agency_dj_relations r ON d.id = r.dj_id
        LEFT JOIN events e ON d.id = e.dj_id
        WHERE r.agency_id = $1
      `;

      if (!includeInactive) {
        query += ' AND r.active = true';
      }

      query += `
        GROUP BY d.id, r.role, r.commission_rate, r.contract_start_date, r.contract_end_date, r.active
        ORDER BY d.nombre
      `;

      const result = await pool.query(query, [agencyId]);

      return {
        success: true,
        djs: result.rows
      };
    } catch (error) {
      console.error('Error in getAgencyDJs:', error);
      return {
        success: false,
        error: 'Error al obtener DJs de la agencia'
      };
    }
  }

  /**
   * Add DJ to agency
   */
  async addDJToAgency(agencyId, djId, relationData) {
    const {
      role = 'managed',
      commission_rate,
      contract_start_date,
      contract_end_date
    } = relationData;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if agency exists and has capacity
      const agencyResult = await client.query(
        `SELECT a.*, COUNT(r.dj_id) as current_djs
         FROM agencies a
         LEFT JOIN agency_dj_relations r ON a.id = r.agency_id AND r.active = true
         WHERE a.id = $1
         GROUP BY a.id`,
        [agencyId]
      );

      if (agencyResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return {
          success: false,
          error: 'Agencia no encontrada'
        };
      }

      const agency = agencyResult.rows[0];

      if (agency.current_djs >= agency.max_djs) {
        await client.query('ROLLBACK');
        return {
          success: false,
          error: `Has alcanzado el límite de artistas para tu plan (${agency.max_djs} artistas). Actualiza tu suscripción para gestionar más artistas.`
        };
      }

      // Check if DJ exists
      const djResult = await client.query(
        'SELECT id, nombre FROM djs WHERE id = $1',
        [djId]
      );

      if (djResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return {
          success: false,
          error: 'DJ no encontrado'
        };
      }

      // Check if relationship already exists
      const existingRelation = await client.query(
        'SELECT id, active FROM agency_dj_relations WHERE agency_id = $1 AND dj_id = $2',
        [agencyId, djId]
      );

      if (existingRelation.rows.length > 0) {
        // If inactive, reactivate it
        if (!existingRelation.rows[0].active) {
          await client.query(
            `UPDATE agency_dj_relations SET
              active = true,
              role = $1,
              commission_rate = $2,
              contract_start_date = $3,
              contract_end_date = $4,
              updated_at = CURRENT_TIMESTAMP
             WHERE agency_id = $5 AND dj_id = $6`,
            [role, commission_rate, contract_start_date, contract_end_date, agencyId, djId]
          );
        } else {
          await client.query('ROLLBACK');
          return {
            success: false,
            error: 'Este artista ya está asignado a tu agencia'
          };
        }
      } else {
        // Create new relationship
        await client.query(
          `INSERT INTO agency_dj_relations (agency_id, dj_id, role, commission_rate, contract_start_date, contract_end_date, active)
           VALUES ($1, $2, $3, $4, $5, $6, true)`,
          [agencyId, djId, role, commission_rate, contract_start_date, contract_end_date]
        );
      }

      // Update DJ's agency_id and managed_by
      await client.query(
        `UPDATE djs SET
          agency_id = $1,
          managed_by = 'agency'
         WHERE id = $2`,
        [agencyId, djId]
      );

      await client.query('COMMIT');

      return {
        success: true,
        message: `${djResult.rows[0].nombre} ha sido añadido a tu agencia`
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in addDJToAgency:', error);
      return {
        success: false,
        error: 'Error al añadir artista a la agencia'
      };
    } finally {
      client.release();
    }
  }

  /**
   * Remove DJ from agency (deactivate relationship)
   */
  async removeDJFromAgency(agencyId, djId) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if relationship exists
      const relationResult = await client.query(
        'SELECT id FROM agency_dj_relations WHERE agency_id = $1 AND dj_id = $2 AND active = true',
        [agencyId, djId]
      );

      if (relationResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return {
          success: false,
          error: 'Este artista no está asignado a tu agencia'
        };
      }

      // Deactivate relationship
      await client.query(
        'UPDATE agency_dj_relations SET active = false, updated_at = CURRENT_TIMESTAMP WHERE agency_id = $1 AND dj_id = $2',
        [agencyId, djId]
      );

      // Update DJ to self-managed
      await client.query(
        `UPDATE djs SET
          agency_id = NULL,
          managed_by = 'self'
         WHERE id = $1`,
        [djId]
      );

      await client.query('COMMIT');

      return {
        success: true,
        message: 'Artista removido de la agencia exitosamente'
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in removeDJFromAgency:', error);
      return {
        success: false,
        error: 'Error al remover artista de la agencia'
      };
    } finally {
      client.release();
    }
  }

  /**
   * Update DJ relationship data (commission, role, contract dates)
   */
  async updateDJRelation(agencyId, djId, updateData) {
    const {
      role,
      commission_rate,
      contract_start_date,
      contract_end_date
    } = updateData;

    try {
      const result = await pool.query(
        `UPDATE agency_dj_relations SET
          role = COALESCE($1, role),
          commission_rate = COALESCE($2, commission_rate),
          contract_start_date = COALESCE($3, contract_start_date),
          contract_end_date = COALESCE($4, contract_end_date),
          updated_at = CURRENT_TIMESTAMP
         WHERE agency_id = $5 AND dj_id = $6 AND active = true
         RETURNING *`,
        [role, commission_rate, contract_start_date, contract_end_date, agencyId, djId]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Relación no encontrada o inactiva'
        };
      }

      return {
        success: true,
        relation: result.rows[0]
      };
    } catch (error) {
      console.error('Error in updateDJRelation:', error);
      return {
        success: false,
        error: 'Error al actualizar relación con el artista'
      };
    }
  }

  /**
   * Get agency dashboard stats
   */
  async getAgencyStats(agencyId) {
    try {
      // Get total DJs
      const djStats = await pool.query(
        `SELECT
          COUNT(*) as total_djs,
          COUNT(CASE WHEN r.active = true THEN 1 END) as active_djs
         FROM agency_dj_relations r
         WHERE r.agency_id = $1`,
        [agencyId]
      );

      // Get event stats
      const eventStats = await pool.query(
        `SELECT
          COUNT(DISTINCT e.id) as total_events,
          COUNT(DISTINCT CASE WHEN e.cobrado_cliente = false THEN e.id END) as pending_payment,
          COUNT(DISTINCT CASE WHEN e.cobrado_cliente = true THEN e.id END) as paid_events,
          COUNT(DISTINCT CASE WHEN e.pagado_dj = false THEN e.id END) as pending_dj_payment,
          COALESCE(SUM(e.cache_total), 0) as total_revenue,
          COALESCE(SUM(e.parte_agencia), 0) as total_commission
         FROM events e
         INNER JOIN djs d ON e.dj_id = d.id
         INNER JOIN agency_dj_relations r ON d.id = r.dj_id AND r.agency_id = $1
         WHERE r.active = true`,
        [agencyId]
      );

      // Get top performing DJs (by event count and revenue)
      const topDJs = await pool.query(
        `SELECT
          d.id,
          d.nombre,
          COUNT(DISTINCT e.id) as total_events,
          COALESCE(SUM(e.cache_total), 0) as total_revenue,
          COALESCE(AVG(e.cache_total), 0) as avg_event_price
         FROM djs d
         INNER JOIN agency_dj_relations r ON d.id = r.dj_id
         LEFT JOIN events e ON d.id = e.dj_id
         WHERE r.agency_id = $1 AND r.active = true
         GROUP BY d.id, d.nombre
         ORDER BY total_events DESC
         LIMIT 5`,
        [agencyId]
      );

      // Get recent events
      const recentEvents = await pool.query(
        `SELECT
          e.*,
          d.nombre as dj_nombre,
          c.nombre as cliente_nombre
         FROM events e
         INNER JOIN djs d ON e.dj_id = d.id
         LEFT JOIN clients c ON e.cliente_id = c.id
         INNER JOIN agency_dj_relations r ON d.id = r.dj_id
         WHERE r.agency_id = $1 AND r.active = true
         ORDER BY e.fecha DESC
         LIMIT 10`,
        [agencyId]
      );

      return {
        success: true,
        stats: {
          djs: djStats.rows[0],
          events: eventStats.rows[0],
          topDJs: topDJs.rows,
          recentEvents: recentEvents.rows
        }
      };
    } catch (error) {
      console.error('Error in getAgencyStats:', error);
      return {
        success: false,
        error: 'Error al obtener estadísticas de la agencia'
      };
    }
  }

  /**
   * Get available DJs (not assigned to any agency)
   */
  async getAvailableDJs() {
    try {
      const result = await pool.query(
        `SELECT
          d.id,
          d.nombre,
          d.email,
          d.telefono,
          d.instagram_username,
          COUNT(DISTINCT e.id) as total_events
         FROM djs d
         LEFT JOIN events e ON d.id = e.dj_id
         WHERE d.managed_by = 'self'
           AND d.agency_id IS NULL
           AND d.active = true
         GROUP BY d.id
         ORDER BY d.nombre`
      );

      return {
        success: true,
        djs: result.rows
      };
    } catch (error) {
      console.error('Error in getAvailableDJs:', error);
      return {
        success: false,
        error: 'Error al obtener artistas disponibles'
      };
    }
  }
}

export default new AgencyService();
