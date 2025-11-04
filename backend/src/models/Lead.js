import { query } from '../config/database.js';

class Lead {
  /**
   * Crear un nuevo lead
   */
  static async create(leadData) {
    const {
      nombre,
      email,
      telefono,
      empresa,
      tipo_evento,
      fecha_evento,
      ciudad,
      presupuesto_estimado,
      num_invitados,
      fuente = 'web',
      notas
    } = leadData;

    const sql = `
      INSERT INTO leads (
        nombre, email, telefono, empresa,
        tipo_evento, fecha_evento, ciudad, presupuesto_estimado, num_invitados,
        fuente, notas
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = await query(sql, [
      nombre, email, telefono, empresa,
      tipo_evento, fecha_evento, ciudad, presupuesto_estimado, num_invitados,
      fuente, notas
    ]);

    return result.rows[0];
  }

  /**
   * Obtener todos los leads activos
   */
  static async findAll(filters = {}) {
    let sql = 'SELECT * FROM leads WHERE activo = true';
    const params = [];
    let paramIndex = 1;

    // Filtro por estado
    if (filters.estado) {
      sql += ` AND estado = $${paramIndex}`;
      params.push(filters.estado);
      paramIndex++;
    }

    // Filtro por fuente
    if (filters.fuente) {
      sql += ` AND fuente = $${paramIndex}`;
      params.push(filters.fuente);
      paramIndex++;
    }

    // Filtro por convertido
    if (filters.convertido !== undefined) {
      sql += ` AND convertido_a_cliente = $${paramIndex}`;
      params.push(filters.convertido);
      paramIndex++;
    }

    sql += ' ORDER BY fecha_creacion DESC';

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Obtener leads agrupados por estado (para Kanban)
   */
  static async findByEstado() {
    const estados = ['nuevo', 'contactado', 'propuesta', 'ganado', 'perdido'];
    const result = {};

    for (const estado of estados) {
      const sql = `
        SELECT * FROM leads
        WHERE activo = true AND estado = $1
        ORDER BY fecha_creacion DESC
      `;
      const data = await query(sql, [estado]);
      result[estado] = data.rows;
    }

    return result;
  }

  /**
   * Obtener un lead por ID
   */
  static async findById(id) {
    const sql = 'SELECT * FROM leads WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  /**
   * Actualizar un lead
   */
  static async update(id, leadData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Construir query dinámicamente
    Object.keys(leadData).forEach(key => {
      if (leadData[key] !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(leadData[key]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    values.push(id);
    const sql = `
      UPDATE leads
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  /**
   * Actualizar el estado de un lead
   */
  static async updateEstado(id, nuevoEstado) {
    const sql = `
      UPDATE leads
      SET estado = $1, ultima_interaccion = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await query(sql, [nuevoEstado, id]);
    return result.rows[0];
  }

  /**
   * Convertir lead a cliente
   */
  static async convertToCliente(leadId, clienteId) {
    const sql = `
      UPDATE leads
      SET
        convertido_a_cliente = true,
        cliente_id = $1,
        fecha_conversion = NOW(),
        estado = 'ganado'
      WHERE id = $2
      RETURNING *
    `;

    const result = await query(sql, [clienteId, leadId]);
    return result.rows[0];
  }

  /**
   * Agregar nota/interacción al lead
   */
  static async addNota(id, nota) {
    const sql = `
      UPDATE leads
      SET
        notas = CASE
          WHEN notas IS NULL OR notas = '' THEN $1
          ELSE notas || E'\n\n---\n' || $1
        END,
        ultima_interaccion = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await query(sql, [nota, id]);
    return result.rows[0];
  }

  /**
   * Marcar lead como perdido
   */
  static async markAsPerdido(id, razon = '') {
    const notaPerdido = `LEAD PERDIDO: ${razon}`;

    const sql = `
      UPDATE leads
      SET
        estado = 'perdido',
        notas = CASE
          WHEN notas IS NULL OR notas = '' THEN $1
          ELSE notas || E'\n\n---\n' || $1
        END,
        ultima_interaccion = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await query(sql, [notaPerdido, id]);
    return result.rows[0];
  }

  /**
   * Obtener estadísticas de leads
   */
  static async getStats() {
    const sql = `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN estado = 'nuevo' THEN 1 END) as nuevos,
        COUNT(CASE WHEN estado = 'contactado' THEN 1 END) as contactados,
        COUNT(CASE WHEN estado = 'propuesta' THEN 1 END) as propuestas,
        COUNT(CASE WHEN estado = 'ganado' THEN 1 END) as ganados,
        COUNT(CASE WHEN estado = 'perdido' THEN 1 END) as perdidos,
        COUNT(CASE WHEN convertido_a_cliente = true THEN 1 END) as convertidos,
        ROUND(
          (COUNT(CASE WHEN convertido_a_cliente = true THEN 1 END)::DECIMAL /
          NULLIF(COUNT(*), 0)) * 100,
          2
        ) as conversion_rate
      FROM leads
      WHERE activo = true
    `;

    const result = await query(sql);
    return result.rows[0];
  }

  /**
   * Soft delete - marcar como inactivo
   */
  static async delete(id) {
    const sql = `
      UPDATE leads
      SET activo = false
      WHERE id = $1
      RETURNING *
    `;

    const result = await query(sql, [id]);
    return result.rows[0];
  }
}

export default Lead;
