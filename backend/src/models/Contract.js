import pool from '../config/database.js';

/**
 * Contract Model
 * Sistema completo de gestión de contratos con plantillas y firma digital
 */
class Contract {
  
  /**
   * Crear un nuevo contrato
   */
  static async create(contractData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        contract_type,
        template_id,
        cliente_id,
        dj_id,
        evento_id,
        party_a_name,
        party_a_id,
        party_a_address,
        party_b_name,
        party_b_id,
        party_b_address,
        party_b_email,
        party_b_phone,
        title,
        description,
        content,
        variables,
        total_amount,
        currency = 'EUR',
        payment_terms,
        start_date,
        end_date,
        expiration_date,
        auto_renew = false,
        renewal_period,
        notes,
        created_by
      } = contractData;

      const query = `
        INSERT INTO contracts (
          contract_type, template_id, cliente_id, dj_id, evento_id,
          party_a_name, party_a_id, party_a_address,
          party_b_name, party_b_id, party_b_address, party_b_email, party_b_phone,
          title, description, content, variables,
          total_amount, currency, payment_terms,
          start_date, end_date, expiration_date,
          auto_renew, renewal_period, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
        RETURNING *
      `;

      const values = [
        contract_type, template_id, cliente_id, dj_id, evento_id,
        party_a_name, party_a_id, party_a_address,
        party_b_name, party_b_id, party_b_address, party_b_email, party_b_phone,
        title, description, content, variables,
        total_amount, currency, payment_terms,
        start_date, end_date, expiration_date,
        auto_renew, renewal_period, notes, created_by
      ];

      const result = await client.query(query, values);
      const contract = result.rows[0];

      // Registrar en historial
      await client.query(`
        INSERT INTO contract_history (contract_id, action, changed_by)
        VALUES ($1, 'created', $2)
      `, [contract.id, created_by]);

      await client.query('COMMIT');
      return contract;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtener todos los contratos con paginación y filtros
   */
  static async getAll({ page = 1, limit = 20, status, contract_type, cliente_id, dj_id, search }) {
    const offset = (page - 1) * limit;
    const conditions = ['c.deleted_at IS NULL'];
    const values = [];
    let paramCount = 1;

    if (status) {
      conditions.push(`c.status = $${paramCount++}`);
      values.push(status);
    }

    if (contract_type) {
      conditions.push(`c.contract_type = $${paramCount++}`);
      values.push(contract_type);
    }

    if (cliente_id) {
      conditions.push(`c.cliente_id = $${paramCount++}`);
      values.push(cliente_id);
    }

    if (dj_id) {
      conditions.push(`c.dj_id = $${paramCount++}`);
      values.push(dj_id);
    }

    if (search) {
      conditions.push(`(c.title ILIKE $${paramCount} OR c.party_b_name ILIKE $${paramCount} OR c.contract_number ILIKE $${paramCount})`);
      values.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Query para contar total
    const countQuery = `
      SELECT COUNT(*)
      FROM contracts c
      LEFT JOIN clientes cl ON cl.id = c.cliente_id
      LEFT JOIN djs d ON d.id = c.dj_id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, values);
    const totalItems = parseInt(countResult.rows[0].count);

    // Query para obtener datos
    const dataQuery = `
      SELECT
        c.*,
        cl.nombre as cliente_nombre,
        d.nombre as dj_nombre
      FROM contracts c
      LEFT JOIN clientes cl ON cl.id = c.cliente_id
      LEFT JOIN djs d ON d.id = c.dj_id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    values.push(limit, offset);
    const result = await pool.query(dataQuery, values);

    return {
      contracts: result.rows,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
        itemsPerPage: limit,
      },
    };
  }

  /**
   * Obtener contrato por ID
   */
  static async getById(id) {
    const query = `
      SELECT 
        c.*,
        cl.nombre as cliente_nombre,
        cl.email as cliente_email,
        d.nombre as dj_nombre,
        d.email as dj_email,
        e.evento as evento_nombre,
        e.fecha as evento_fecha
      FROM contracts c
      LEFT JOIN clientes cl ON cl.id = c.cliente_id
      LEFT JOIN djs d ON d.id = c.dj_id
      LEFT JOIN eventos e ON e.id = c.evento_id
      WHERE c.id = $1 AND c.deleted_at IS NULL
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Actualizar contrato
   */
  static async update(id, updates, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const allowedFields = [
        'title', 'description', 'content', 'variables',
        'total_amount', 'payment_terms', 'start_date', 'end_date',
        'expiration_date', 'auto_renew', 'renewal_period', 'notes', 'internal_notes'
      ];

      const setClause = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          setClause.push(`${key} = $${paramCount++}`);
          values.push(updates[key]);
        }
      });

      if (setClause.length === 0) {
        throw new Error('No valid fields to update');
      }

      setClause.push(`updated_by = $${paramCount++}`);
      values.push(userId);
      setClause.push(`updated_at = CURRENT_TIMESTAMP`);

      values.push(id);

      const query = `
        UPDATE contracts 
        SET ${setClause.join(', ')}
        WHERE id = $${paramCount} AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await client.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Contract not found');
      }

      // Registrar cambios en historial
      for (const [field, newValue] of Object.entries(updates)) {
        if (allowedFields.includes(field)) {
          await client.query(`
            INSERT INTO contract_history (contract_id, action, field_changed, new_value, changed_by)
            VALUES ($1, 'updated', $2, $3, $4)
          `, [id, field, JSON.stringify(newValue), userId]);
        }
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Firmar contrato
   */
  static async sign(contractId, party, signatureData, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const partyField = party === 'a' ? 'signed_by_party_a' : 'signed_by_party_b';
      const signatureField = party === 'a' ? 'signature_party_a_data' : 'signature_party_b_data';

      const query = `
        UPDATE contracts 
        SET 
          ${partyField} = true,
          ${signatureField} = $1,
          signature_date = CASE WHEN signature_date IS NULL THEN CURRENT_DATE ELSE signature_date END,
          status = CASE 
            WHEN signed_by_party_a AND signed_by_party_b THEN 'signed'::contract_status
            ELSE 'pending_signature'::contract_status
          END,
          updated_by = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3 AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await client.query(query, [JSON.stringify(signatureData), userId, contractId]);

      if (result.rows.length === 0) {
        throw new Error('Contract not found');
      }

      // Registrar en historial
      await client.query(`
        INSERT INTO contract_history (contract_id, action, changed_by)
        VALUES ($1, $2, $3)
      `, [contractId, `signed_by_party_${party}`, userId]);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Cambiar estado del contrato
   */
  static async updateStatus(contractId, newStatus, userId, reason = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
        UPDATE contracts
        SET
          status = $1::text,
          updated_by = $2,
          cancelled_by = CASE WHEN $1::text = 'cancelled' THEN $2 ELSE cancelled_by END,
          cancellation_reason = CASE WHEN $1::text = 'cancelled' THEN $3 ELSE cancellation_reason END,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4 AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await client.query(query, [newStatus, userId, reason, contractId]);

      if (result.rows.length === 0) {
        throw new Error('Contract not found');
      }

      // Registrar en historial
      await client.query(`
        INSERT INTO contract_history (contract_id, action, new_value, change_reason, changed_by)
        VALUES ($1, 'status_changed', $2, $3, $4)
      `, [contractId, newStatus, reason, userId]);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Soft delete
   */
  static async delete(id, userId) {
    const query = `
      UPDATE contracts 
      SET deleted_at = CURRENT_TIMESTAMP, updated_by = $2
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `;

    const result = await pool.query(query, [id, userId]);
    return result.rows.length > 0;
  }

  /**
   * Obtener historial de un contrato
   */
  static async getHistory(contractId) {
    const query = `
      SELECT
        h.*,
        h.created_at as changed_at,
        u.email as changed_by_email
      FROM contract_history h
      LEFT JOIN users u ON u.id = h.changed_by
      WHERE h.contract_id = $1
      ORDER BY h.created_at DESC
    `;

    const result = await pool.query(query, [contractId]);
    return result.rows;
  }

  /**
   * Obtener contratos próximos a vencer
   */
  static async getExpiringSoon(days = 30) {
    const query = `
      SELECT 
        c.*,
        cl.nombre as cliente_nombre,
        d.nombre as dj_nombre
      FROM contracts c
      LEFT JOIN clientes cl ON cl.id = c.cliente_id
      LEFT JOIN djs d ON d.id = c.dj_id
      WHERE 
        c.status = 'active'
        AND c.expiration_date IS NOT NULL
        AND c.expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${days} days'
        AND c.deleted_at IS NULL
      ORDER BY c.expiration_date ASC
    `;

    const result = await pool.query(query);
    return result.rows;
  }
}

export default Contract;
