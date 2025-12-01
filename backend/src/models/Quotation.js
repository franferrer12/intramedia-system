import pool from '../config/database.js';

/**
 * Quotation Model
 * Sistema completo de gestión de cotizaciones/presupuestos
 */
class Quotation {

  /**
   * Crear una nueva cotización
   */
  static async create(quotationData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        agency_id,
        cliente_id,
        dj_id,
        created_by,
        title,
        description,
        event_date,
        event_location,
        event_duration_hours,
        event_type,
        status = 'draft',
        discount_type = 'none',
        discount_value = 0,
        tax_percentage = 0,
        valid_until,
        contact_name,
        contact_email,
        contact_phone,
        notes,
        terms_and_conditions,
        payment_terms,
        items = []
      } = quotationData;

      // Insertar cotización principal
      const query = `
        INSERT INTO quotations (
          agency_id, cliente_id, dj_id, created_by,
          title, description,
          event_date, event_location, event_duration_hours, event_type,
          status,
          discount_type, discount_value, tax_percentage,
          valid_until,
          contact_name, contact_email, contact_phone,
          notes, terms_and_conditions, payment_terms
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        RETURNING *
      `;

      const values = [
        agency_id, cliente_id, dj_id, created_by,
        title, description,
        event_date, event_location, event_duration_hours, event_type,
        status,
        discount_type, discount_value, tax_percentage,
        valid_until,
        contact_name, contact_email, contact_phone,
        notes, terms_and_conditions, payment_terms
      ];

      const result = await client.query(query, values);
      const quotation = result.rows[0];

      // Insertar items si existen
      if (items && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          await client.query(`
            INSERT INTO quotation_items (
              quotation_id, item_order, item_type, name, description,
              quantity, unit_price, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            quotation.id,
            item.item_order || i + 1,
            item.item_type || 'service',
            item.name,
            item.description || null,
            item.quantity || 1,
            item.unit_price,
            item.metadata ? JSON.stringify(item.metadata) : null
          ]);
        }
      }

      await client.query('COMMIT');

      // Obtener cotización completa con items
      return await this.findById(quotation.id);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Buscar cotización por ID
   */
  static async findById(id) {
    const query = `
      SELECT q.*,
             json_agg(
               json_build_object(
                 'id', qi.id,
                 'item_order', qi.item_order,
                 'item_type', qi.item_type,
                 'name', qi.name,
                 'description', qi.description,
                 'quantity', qi.quantity,
                 'unit_price', qi.unit_price,
                 'total_price', qi.total_price,
                 'metadata', qi.metadata
               ) ORDER BY qi.item_order
             ) FILTER (WHERE qi.id IS NOT NULL) AS items
      FROM quotations q
      LEFT JOIN quotation_items qi ON q.id = qi.quotation_id
      WHERE q.id = $1
      GROUP BY q.id
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Listar cotizaciones con filtros y paginación
   */
  static async findAll(filters = {}) {
    const {
      agency_id,
      cliente_id,
      dj_id,
      status,
      event_type,
      from_date,
      to_date,
      search,
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = filters;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (agency_id) {
      conditions.push(`q.agency_id = $${paramCount++}`);
      values.push(agency_id);
    }

    if (cliente_id) {
      conditions.push(`q.cliente_id = $${paramCount++}`);
      values.push(cliente_id);
    }

    if (dj_id) {
      conditions.push(`q.dj_id = $${paramCount++}`);
      values.push(dj_id);
    }

    if (status) {
      conditions.push(`q.status = $${paramCount++}`);
      values.push(status);
    }

    if (event_type) {
      conditions.push(`q.event_type = $${paramCount++}`);
      values.push(event_type);
    }

    if (from_date) {
      conditions.push(`q.created_at >= $${paramCount++}`);
      values.push(from_date);
    }

    if (to_date) {
      conditions.push(`q.created_at <= $${paramCount++}`);
      values.push(to_date);
    }

    if (search) {
      conditions.push(`(
        q.title ILIKE $${paramCount} OR
        q.description ILIKE $${paramCount} OR
        q.quotation_number ILIKE $${paramCount} OR
        q.contact_name ILIKE $${paramCount}
      )`);
      values.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    // Validar sort_by para prevenir SQL injection
    const validSortFields = ['created_at', 'event_date', 'total', 'status', 'quotation_number'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM quotations q
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Query principal
    const query = `
      SELECT q.*,
             a.agency_name,
             c.nombre AS cliente_nombre,
             c.email AS cliente_email,
             d.nombre AS dj_nombre,
             u.email AS created_by_email,
             COUNT(qi.id) AS items_count
      FROM quotations q
      LEFT JOIN agencies a ON q.agency_id = a.id
      LEFT JOIN clientes c ON q.cliente_id = c.id
      LEFT JOIN djs d ON q.dj_id = d.id
      LEFT JOIN users u ON q.created_by = u.id
      LEFT JOIN quotation_items qi ON q.id = qi.quotation_id
      ${whereClause}
      GROUP BY q.id, a.agency_name, c.nombre, c.email, d.nombre, u.email
      ORDER BY q.${sortField} ${sortDirection}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    values.push(limit, offset);
    const result = await pool.query(query, values);

    return {
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Actualizar cotización
   */
  static async update(id, quotationData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Construir query de actualización dinámica
      const updates = [];
      const values = [];
      let paramCount = 1;

      const allowedFields = [
        'title', 'description', 'event_date', 'event_location',
        'event_duration_hours', 'event_type', 'status',
        'discount_type', 'discount_value', 'tax_percentage',
        'valid_until', 'contact_name', 'contact_email', 'contact_phone',
        'notes', 'terms_and_conditions', 'payment_terms',
        'rejected_reason'
      ];

      for (const field of allowedFields) {
        if (quotationData[field] !== undefined) {
          updates.push(`${field} = $${paramCount++}`);
          values.push(quotationData[field]);
        }
      }

      if (updates.length === 0) {
        throw new Error('No hay campos para actualizar');
      }

      values.push(id);
      const query = `
        UPDATE quotations
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Cotización no encontrada');
      }

      // Si se proporcionan items, actualizar
      if (quotationData.items) {
        // Eliminar items existentes
        await client.query('DELETE FROM quotation_items WHERE quotation_id = $1', [id]);

        // Insertar nuevos items
        for (let i = 0; i < quotationData.items.length; i++) {
          const item = quotationData.items[i];
          await client.query(`
            INSERT INTO quotation_items (
              quotation_id, item_order, item_type, name, description,
              quantity, unit_price, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            id,
            item.item_order || i + 1,
            item.item_type || 'service',
            item.name,
            item.description || null,
            item.quantity || 1,
            item.unit_price,
            item.metadata ? JSON.stringify(item.metadata) : null
          ]);
        }
      }

      await client.query('COMMIT');

      return await this.findById(id);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Eliminar cotización
   */
  static async delete(id) {
    const query = 'DELETE FROM quotations WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Cambiar estado de cotización
   */
  static async updateStatus(id, status, additionalData = {}) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const updates = ['status = $1'];
      const values = [status, id];
      let paramCount = 2;

      // Campos adicionales según el estado
      if (status === 'sent' && !additionalData.sent_at) {
        updates.push(`sent_at = CURRENT_TIMESTAMP`);
      }

      if (status === 'viewed' && !additionalData.viewed_at) {
        updates.push(`viewed_at = CURRENT_TIMESTAMP`);
      }

      if (status === 'accepted' && !additionalData.accepted_at) {
        updates.push(`accepted_at = CURRENT_TIMESTAMP`);
      }

      if (status === 'rejected') {
        updates.push(`rejected_at = CURRENT_TIMESTAMP`);
        if (additionalData.rejection_reason) {
          updates.push(`rejection_reason = $${++paramCount}`);
          values.splice(2, 0, additionalData.rejection_reason);
        }
      }

      if (status === 'converted' && additionalData.evento_id) {
        updates.push(`converted_to_evento_id = $${++paramCount}`);
        updates.push(`converted_at = CURRENT_TIMESTAMP`);
        values.splice(2, 0, additionalData.evento_id);
      }

      const query = `
        UPDATE quotations
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${values.length}
        RETURNING *
      `;

      const result = await client.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Cotización no encontrada');
      }

      await client.query('COMMIT');

      return await this.findById(id);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Duplicar cotización
   */
  static async duplicate(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Obtener cotización original
      const original = await this.findById(id);
      if (!original) {
        throw new Error('Cotización original no encontrada');
      }

      // Crear nueva cotización basada en la original
      const newQuotation = {
        agency_id: original.agency_id,
        cliente_id: original.cliente_id,
        dj_id: original.dj_id,
        created_by: original.created_by,
        title: `${original.title} (Copia)`,
        description: original.description,
        event_date: original.event_date,
        event_location: original.event_location,
        event_duration_hours: original.event_duration_hours,
        event_type: original.event_type,
        status: 'draft',
        discount_type: original.discount_type,
        discount_value: original.discount_value,
        tax_percentage: original.tax_percentage,
        contact_name: original.contact_name,
        contact_email: original.contact_email,
        contact_phone: original.contact_phone,
        notes: original.notes,
        terms_and_conditions: original.terms_and_conditions,
        payment_terms: original.payment_terms,
        items: original.items || []
      };

      await client.query('COMMIT');

      return await this.create(newQuotation);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtener historial de una cotización
   */
  static async getHistory(id) {
    const query = `
      SELECT qh.*,
             u.email AS user_email
      FROM quotation_history qh
      LEFT JOIN users u ON qh.user_id = u.id
      WHERE qh.quotation_id = $1
      ORDER BY qh.created_at DESC
    `;
    const result = await pool.query(query, [id]);
    return result.rows;
  }

  /**
   * Obtener estadísticas de cotizaciones por agencia
   */
  static async getStatsByAgency(agency_id, filters = {}) {
    const {
      from_date,
      to_date
    } = filters;

    const conditions = ['agency_id = $1'];
    const values = [agency_id];
    let paramCount = 2;

    if (from_date) {
      conditions.push(`created_at >= $${paramCount++}`);
      values.push(from_date);
    }

    if (to_date) {
      conditions.push(`created_at <= $${paramCount++}`);
      values.push(to_date);
    }

    const whereClause = conditions.join(' AND ');

    const query = `
      SELECT
        COUNT(*) AS total_quotations,
        COUNT(*) FILTER (WHERE status = 'draft') AS draft_count,
        COUNT(*) FILTER (WHERE status = 'sent') AS sent_count,
        COUNT(*) FILTER (WHERE status = 'accepted') AS accepted_count,
        COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_count,
        COUNT(*) FILTER (WHERE status = 'expired') AS expired_count,
        COUNT(*) FILTER (WHERE status = 'converted') AS converted_count,
        ROUND(AVG(total), 2) AS avg_quotation_amount,
        SUM(total) FILTER (WHERE status = 'accepted') AS accepted_total,
        ROUND(
          100.0 * COUNT(*) FILTER (WHERE status = 'accepted') /
          NULLIF(COUNT(*) FILTER (WHERE status IN ('accepted', 'rejected')), 0),
          2
        ) AS acceptance_rate
      FROM quotations
      WHERE ${whereClause}
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Expirar cotizaciones antiguas
   */
  static async expireOldQuotations() {
    const query = `
      UPDATE quotations
      SET status = 'expired'
      WHERE status IN ('draft', 'sent', 'viewed')
      AND valid_until < CURRENT_DATE
      RETURNING id, quotation_number
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Crear cotización desde template
   */
  static async createFromTemplate(template_id, quotationData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Obtener template
      const templateQuery = 'SELECT * FROM quotation_templates WHERE id = $1 AND is_active = true';
      const templateResult = await client.query(templateQuery, [template_id]);

      if (templateResult.rows.length === 0) {
        throw new Error('Template no encontrado o inactivo');
      }

      const template = templateResult.rows[0];
      const templateData = template.template_data;

      // Combinar datos del template con datos proporcionados
      const newQuotation = {
        ...quotationData,
        items: templateData.items || [],
        discount_type: templateData.discount_type || 'none',
        discount_value: templateData.discount_value || 0,
        tax_percentage: templateData.tax_percentage || 0,
        terms_and_conditions: templateData.terms_and_conditions || null,
        payment_terms: templateData.payment_terms || null
      };

      // Incrementar contador de uso del template
      await client.query(
        'UPDATE quotation_templates SET usage_count = usage_count + 1 WHERE id = $1',
        [template_id]
      );

      await client.query('COMMIT');

      return await this.create(newQuotation);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Buscar cotizaciones próximas a expirar
   */
  static async findExpiringSoon(days = 7) {
    const query = `
      SELECT q.*,
             c.nombre AS cliente_nombre,
             c.email AS cliente_email
      FROM quotations q
      LEFT JOIN clientes c ON q.cliente_id = c.id
      WHERE q.status IN ('sent', 'viewed')
      AND q.valid_until BETWEEN CURRENT_DATE AND CURRENT_DATE + $1
      ORDER BY q.valid_until ASC
    `;
    const result = await pool.query(query, [days]);
    return result.rows;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MÉTODOS SEMÁNTICOS PARA ESTADOS (Añadidos para mejor UX)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Marcar cotización como enviada
   * @param {number} id - ID de la cotización
   * @returns {Promise<Object>} Cotización actualizada
   */
  static async send(id) {
    return await this.updateStatus(id, 'sent');
  }

  /**
   * Aceptar cotización
   * @param {number} id - ID de la cotización
   * @returns {Promise<Object>} Cotización actualizada
   */
  static async accept(id) {
    return await this.updateStatus(id, 'accepted');
  }

  /**
   * Rechazar cotización
   * @param {number} id - ID de la cotización
   * @param {string} reason - Motivo del rechazo
   * @returns {Promise<Object>} Cotización actualizada
   */
  static async reject(id, reason = null) {
    return await this.updateStatus(id, 'rejected', { rejection_reason: reason });
  }

  /**
   * Marcar cotización como vista por el cliente
   * @param {number} id - ID de la cotización
   * @returns {Promise<Object>} Cotización actualizada
   */
  static async markAsViewed(id) {
    return await this.updateStatus(id, 'viewed');
  }

  /**
   * Convertir cotización a evento
   * @param {number} id - ID de la cotización
   * @param {number} eventoId - ID del evento creado
   * @returns {Promise<Object>} Cotización actualizada
   */
  static async convertToEvento(id, eventoId) {
    return await this.updateStatus(id, 'converted', { evento_id: eventoId });
  }

  /**
   * Expirar cotización manualmente
   * @param {number} id - ID de la cotización
   * @returns {Promise<Object>} Cotización actualizada
   */
  static async expire(id) {
    return await this.updateStatus(id, 'expired');
  }
}

export default Quotation;
