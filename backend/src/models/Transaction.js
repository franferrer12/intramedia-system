import pool from '../config/database.js';

/**
 * Modelo para gestión de transacciones financieras
 * entre agencia, DJs y clientes
 */
class Transaction {

  /**
   * Crear una nueva transacción
   */
  static async create(data) {
    const {
      agency_id,
      dj_id,
      evento_id,
      tipo,
      monto_total,
      monto_agencia = 0,
      monto_dj = 0,
      monto_alquiler = 0,
      estado = 'pendiente',
      pagado_por,
      pagado_a,
      descripcion,
      concepto,
      metodo_pago,
      equipos_alquilados = [],
      fecha_transaccion,
      fecha_vencimiento,
      creado_por
    } = data;

    const sql = `
      INSERT INTO agency_transactions (
        agency_id, dj_id, evento_id, tipo,
        monto_total, monto_agencia, monto_dj, monto_alquiler,
        estado, pagado_por, pagado_a,
        descripcion, concepto, metodo_pago,
        equipos_alquilados, fecha_transaccion, fecha_vencimiento, creado_por
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;

    const values = [
      agency_id, dj_id, evento_id, tipo,
      monto_total, monto_agencia, monto_dj, monto_alquiler,
      estado, pagado_por, pagado_a,
      descripcion, concepto, metodo_pago,
      JSON.stringify(equipos_alquilados),
      fecha_transaccion || new Date(),
      fecha_vencimiento,
      creado_por
    ];

    const result = await pool.query(sql, values);
    return result.rows[0];
  }

  /**
   * Obtener todas las transacciones de una agencia
   */
  static async findByAgency(agencyId, filters = {}) {
    let sql = `
      SELECT
        t.*,
        d.nombre as dj_nombre,
        e.evento as evento_nombre,
        e.fecha as fecha_evento
      FROM agency_transactions t
      LEFT JOIN usuarios d ON t.dj_id = d.id
      LEFT JOIN events e ON t.evento_id = e.id
      WHERE t.agency_id = $1
    `;

    const values = [agencyId];
    let paramCount = 1;

    // Filtro por DJ
    if (filters.dj_id) {
      paramCount++;
      sql += ` AND t.dj_id = $${paramCount}`;
      values.push(filters.dj_id);
    }

    // Filtro por tipo
    if (filters.tipo) {
      paramCount++;
      sql += ` AND t.tipo = $${paramCount}`;
      values.push(filters.tipo);
    }

    // Filtro por estado
    if (filters.estado) {
      paramCount++;
      sql += ` AND t.estado = $${paramCount}`;
      values.push(filters.estado);
    }

    // Filtro por rango de fechas
    if (filters.fecha_desde) {
      paramCount++;
      sql += ` AND t.fecha_transaccion >= $${paramCount}`;
      values.push(filters.fecha_desde);
    }

    if (filters.fecha_hasta) {
      paramCount++;
      sql += ` AND t.fecha_transaccion <= $${paramCount}`;
      values.push(filters.fecha_hasta);
    }

    sql += ` ORDER BY t.fecha_transaccion DESC`;

    const result = await pool.query(sql, values);
    return result.rows;
  }

  /**
   * Obtener una transacción por ID
   */
  static async findById(id) {
    const sql = `
      SELECT
        t.*,
        d.nombre as dj_nombre,
        e.evento as evento_nombre
      FROM agency_transactions t
      LEFT JOIN usuarios d ON t.dj_id = d.id
      LEFT JOIN events e ON t.evento_id = e.id
      WHERE t.id = $1
    `;

    const result = await pool.query(sql, [id]);
    return result.rows[0];
  }

  /**
   * Marcar transacción como pagada
   */
  static async markAsPaid(id, data) {
    const { metodo_pago, fecha_pago, notas_internas } = data;

    const sql = `
      UPDATE agency_transactions
      SET
        estado = 'pagado',
        fecha_pago = $1,
        metodo_pago = COALESCE($2, metodo_pago),
        notas_internas = $3,
        fecha_actualizacion = NOW()
      WHERE id = $4
      RETURNING *
    `;

    const values = [
      fecha_pago || new Date(),
      metodo_pago,
      notas_internas,
      id
    ];

    const result = await pool.query(sql, values);
    return result.rows[0];
  }

  /**
   * Actualizar transacción
   */
  static async update(id, data) {
    const {
      estado,
      monto_total,
      monto_agencia,
      monto_dj,
      monto_alquiler,
      descripcion,
      concepto,
      metodo_pago,
      fecha_vencimiento,
      notas_internas
    } = data;

    const sql = `
      UPDATE agency_transactions
      SET
        estado = COALESCE($1, estado),
        monto_total = COALESCE($2, monto_total),
        monto_agencia = COALESCE($3, monto_agencia),
        monto_dj = COALESCE($4, monto_dj),
        monto_alquiler = COALESCE($5, monto_alquiler),
        descripcion = COALESCE($6, descripcion),
        concepto = COALESCE($7, concepto),
        metodo_pago = COALESCE($8, metodo_pago),
        fecha_vencimiento = COALESCE($9, fecha_vencimiento),
        notas_internas = COALESCE($10, notas_internas),
        fecha_actualizacion = NOW()
      WHERE id = $11
      RETURNING *
    `;

    const values = [
      estado, monto_total, monto_agencia, monto_dj, monto_alquiler,
      descripcion, concepto, metodo_pago, fecha_vencimiento,
      notas_internas, id
    ];

    const result = await pool.query(sql, values);
    return result.rows[0];
  }

  /**
   * Eliminar transacción (soft delete - cancelar)
   */
  static async cancel(id) {
    const sql = `
      UPDATE agency_transactions
      SET estado = 'cancelado', fecha_actualizacion = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(sql, [id]);
    return result.rows[0];
  }

  /**
   * Obtener balance de un DJ
   */
  static async getDJBalance(djId) {
    const sql = `
      SELECT
        dj_id,
        dj_nombre,
        debe_agencia_a_dj,
        debe_dj_a_agencia,
        balance_neto,
        total_transacciones,
        transacciones_pendientes
      FROM vw_dj_balances
      WHERE dj_id = $1
    `;

    const result = await pool.query(sql, [djId]);
    return result.rows[0] || {
      dj_id: djId,
      debe_agencia_a_dj: 0,
      debe_dj_a_agencia: 0,
      balance_neto: 0,
      total_transacciones: 0,
      transacciones_pendientes: 0
    };
  }

  /**
   * Obtener todos los balances de DJs de una agencia
   */
  static async getAllDJBalances(agencyId) {
    const sql = `
      SELECT
        b.*
      FROM vw_dj_balances b
      INNER JOIN agency_dj_relations ad ON b.dj_id = ad.dj_id
      WHERE ad.agency_id = $1
      ORDER BY ABS(b.balance_neto) DESC
    `;

    const result = await pool.query(sql, [agencyId]);
    return result.rows;
  }

  /**
   * Obtener resumen financiero de la agencia
   */
  static async getAgencySummary(agencyId) {
    const sql = `
      SELECT
        -- Total que debemos a DJs
        COALESCE(SUM(CASE
          WHEN tipo IN ('pago_cliente', 'pago_dj')
            AND pagado_a = 'agencia'
            AND estado = 'pendiente'
          THEN monto_dj
          ELSE 0
        END), 0) as total_deuda_a_djs,

        -- Total que nos deben DJs
        COALESCE(SUM(CASE
          WHEN tipo IN ('fee_agencia', 'alquiler_equipo')
            AND estado = 'pendiente'
          THEN monto_agencia + monto_alquiler
          WHEN tipo = 'pago_cliente'
            AND pagado_a = 'dj'
            AND estado = 'pendiente'
          THEN monto_agencia
          ELSE 0
        END), 0) as total_deuda_de_djs,

        -- Ingresos por equipos este mes
        COALESCE(SUM(CASE
          WHEN tipo = 'alquiler_equipo'
            AND fecha_transaccion >= DATE_TRUNC('month', CURRENT_DATE)
            AND estado != 'cancelado'
          THEN monto_alquiler
          ELSE 0
        END), 0) as ingresos_equipos_mes,

        -- Comisiones ganadas este mes
        COALESCE(SUM(CASE
          WHEN tipo IN ('fee_agencia', 'pago_cliente')
            AND fecha_transaccion >= DATE_TRUNC('month', CURRENT_DATE)
            AND estado != 'cancelado'
          THEN monto_agencia
          ELSE 0
        END), 0) as comisiones_mes,

        -- Total transacciones pendientes
        COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as transacciones_pendientes,

        -- Total eventos facturados
        COUNT(DISTINCT evento_id) as eventos_facturados

      FROM agency_transactions
      WHERE agency_id = $1
    `;

    const result = await pool.query(sql, [agencyId]);
    const summary = result.rows[0];

    // Calcular balance neto
    summary.balance_neto = summary.total_deuda_a_djs - summary.total_deuda_de_djs;

    return summary;
  }

  /**
   * Registrar pago de cliente a agencia
   */
  static async registerClientPayment(data) {
    const {
      agency_id,
      dj_id,
      evento_id,
      monto_total,
      commission_rate, // Porcentaje de comisión (ej: 15 para 15%)
      metodo_pago,
      descripcion,
      creado_por
    } = data;

    // Calcular distribución
    const monto_agencia = (monto_total * commission_rate) / 100;
    const monto_dj = monto_total - monto_agencia;

    return await this.create({
      agency_id,
      dj_id,
      evento_id,
      tipo: 'pago_cliente',
      monto_total,
      monto_agencia,
      monto_dj,
      estado: 'pendiente',
      pagado_por: 'cliente',
      pagado_a: 'agencia',
      metodo_pago,
      descripcion: descripcion || `Pago de cliente - Evento #${evento_id}`,
      concepto: 'Pago de evento',
      creado_por
    });
  }
}

export default Transaction;
