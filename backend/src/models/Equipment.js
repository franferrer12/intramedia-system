import pool from '../config/database.js';

/**
 * Modelo para gestión de equipos de la agencia
 */
class Equipment {

  /**
   * Crear nuevo equipo
   */
  static async create(data) {
    const {
      agency_id,
      tipo,
      marca,
      modelo,
      cantidad = 1,
      precio_compra,
      precio_alquiler_dia,
      precio_alquiler_evento,
      estado = 'disponible',
      descripcion,
      especificaciones = {},
      foto_url,
      numero_serie,
      fecha_compra
    } = data;

    const sql = `
      INSERT INTO agency_equipment (
        agency_id, tipo, marca, modelo, cantidad,
        precio_compra, precio_alquiler_dia, precio_alquiler_evento,
        estado, descripcion, especificaciones, foto_url,
        numero_serie, fecha_compra
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const values = [
      agency_id, tipo, marca, modelo, cantidad,
      precio_compra, precio_alquiler_dia, precio_alquiler_evento,
      estado, descripcion, JSON.stringify(especificaciones),
      foto_url, numero_serie, fecha_compra
    ];

    const result = await pool.query(sql, values);
    return result.rows[0];
  }

  /**
   * Obtener todos los equipos de una agencia
   */
  static async findByAgency(agencyId, filters = {}) {
    let sql = `
      SELECT
        e.*,
        ea.cantidad_alquilada,
        ea.cantidad_disponible,
        ea.proximas_reservas
      FROM agency_equipment e
      LEFT JOIN vw_equipment_availability ea ON e.id = ea.id
      WHERE e.agency_id = $1 AND e.activo = true
    `;

    const values = [agencyId];
    let paramCount = 1;

    // Filtro por tipo
    if (filters.tipo) {
      paramCount++;
      sql += ` AND e.tipo = $${paramCount}`;
      values.push(filters.tipo);
    }

    // Filtro por estado
    if (filters.estado) {
      paramCount++;
      sql += ` AND e.estado = $${paramCount}`;
      values.push(filters.estado);
    }

    // Filtro por disponibilidad
    if (filters.solo_disponibles) {
      sql += ` AND ea.cantidad_disponible > 0`;
    }

    sql += ` ORDER BY e.tipo, e.marca, e.modelo`;

    const result = await pool.query(sql, values);
    return result.rows;
  }

  /**
   * Obtener equipo por ID
   */
  static async findById(id) {
    const sql = `
      SELECT
        e.*,
        ea.cantidad_alquilada,
        ea.cantidad_disponible,
        ea.proximas_reservas
      FROM agency_equipment e
      LEFT JOIN vw_equipment_availability ea ON e.id = ea.id
      WHERE e.id = $1
    `;

    const result = await pool.query(sql, [id]);
    return result.rows[0];
  }

  /**
   * Actualizar equipo
   */
  static async update(id, data) {
    const {
      tipo, marca, modelo, cantidad,
      precio_compra, precio_alquiler_dia, precio_alquiler_evento,
      estado, descripcion, especificaciones,
      foto_url, numero_serie,
      ultima_revision, proxima_revision
    } = data;

    const sql = `
      UPDATE agency_equipment
      SET
        tipo = COALESCE($1, tipo),
        marca = COALESCE($2, marca),
        modelo = COALESCE($3, modelo),
        cantidad = COALESCE($4, cantidad),
        precio_compra = COALESCE($5, precio_compra),
        precio_alquiler_dia = COALESCE($6, precio_alquiler_dia),
        precio_alquiler_evento = COALESCE($7, precio_alquiler_evento),
        estado = COALESCE($8, estado),
        descripcion = COALESCE($9, descripcion),
        especificaciones = COALESCE($10, especificaciones),
        foto_url = COALESCE($11, foto_url),
        numero_serie = COALESCE($12, numero_serie),
        ultima_revision = COALESCE($13, ultima_revision),
        proxima_revision = COALESCE($14, proxima_revision),
        fecha_actualizacion = NOW()
      WHERE id = $15
      RETURNING *
    `;

    const values = [
      tipo, marca, modelo, cantidad,
      precio_compra, precio_alquiler_dia, precio_alquiler_evento,
      estado, descripcion,
      especificaciones ? JSON.stringify(especificaciones) : null,
      foto_url, numero_serie,
      ultima_revision, proxima_revision,
      id
    ];

    const result = await pool.query(sql, values);
    return result.rows[0];
  }

  /**
   * Eliminar equipo (soft delete)
   */
  static async delete(id) {
    const sql = `
      UPDATE agency_equipment
      SET activo = false, fecha_actualizacion = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(sql, [id]);
    return result.rows[0];
  }

  /**
   * Crear alquiler de equipo
   */
  static async createRental(data) {
    const {
      equipment_id,
      evento_id,
      dj_id,
      cantidad,
      fecha_inicio,
      fecha_fin,
      precio_unitario,
      notas
    } = data;

    // Calcular precio total
    const dias = Math.ceil((new Date(fecha_fin) - new Date(fecha_inicio)) / (1000 * 60 * 60 * 24)) + 1;
    const precio_total = precio_unitario * cantidad * dias;

    const sql = `
      INSERT INTO equipment_rentals (
        equipment_id, evento_id, dj_id, cantidad,
        fecha_inicio, fecha_fin,
        precio_unitario, precio_total,
        estado, notas
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      equipment_id, evento_id, dj_id, cantidad,
      fecha_inicio, fecha_fin,
      precio_unitario, precio_total,
      'reservado', notas
    ];

    const result = await pool.query(sql, values);
    return result.rows[0];
  }

  /**
   * Obtener alquileres de un equipo
   */
  static async getRentals(equipmentId, estado = null) {
    let sql = `
      SELECT
        r.*,
        e.nombre as evento_nombre,
        d.nombre as dj_nombre,
        eq.tipo as equipo_tipo,
        eq.marca as equipo_marca,
        eq.modelo as equipo_modelo
      FROM equipment_rentals r
      LEFT JOIN events e ON r.evento_id = e.id
      LEFT JOIN usuarios d ON r.dj_id = d.id
      LEFT JOIN agency_equipment eq ON r.equipment_id = eq.id
      WHERE r.equipment_id = $1
    `;

    const values = [equipmentId];

    if (estado) {
      sql += ` AND r.estado = $2`;
      values.push(estado);
    }

    sql += ` ORDER BY r.fecha_inicio DESC`;

    const result = await pool.query(sql, values);
    return result.rows;
  }

  /**
   * Marcar equipo como entregado
   */
  static async markAsDelivered(rentalId, entregadoPor) {
    const sql = `
      UPDATE equipment_rentals
      SET
        estado = 'entregado',
        fecha_entrega = NOW(),
        entregado_por = $1,
        fecha_actualizacion = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(sql, [entregadoPor, rentalId]);
    return result.rows[0];
  }

  /**
   * Marcar equipo como devuelto
   */
  static async markAsReturned(rentalId, recibidoPor, condicion) {
    const sql = `
      UPDATE equipment_rentals
      SET
        estado = 'devuelto',
        fecha_devolucion = NOW(),
        recibido_por = $1,
        condicion_devolucion = $2,
        fecha_actualizacion = NOW()
      WHERE id = $3
      RETURNING *
    `;

    const result = await pool.query(sql, [recibidoPor, condicion, rentalId]);
    return result.rows[0];
  }

  /**
   * Obtener estadísticas de equipos
   */
  static async getStats(agencyId) {
    const sql = `
      SELECT
        COUNT(*) as total_equipos,
        COUNT(CASE WHEN estado = 'disponible' THEN 1 END) as disponibles,
        COUNT(CASE WHEN estado = 'alquilado' THEN 1 END) as alquilados,
        COUNT(CASE WHEN estado = 'mantenimiento' THEN 1 END) as en_mantenimiento,

        SUM(precio_compra) as valor_total_equipos,

        -- Ingresos por alquileres este mes
        COALESCE((
          SELECT SUM(r.precio_total)
          FROM equipment_rentals r
          WHERE r.equipment_id IN (
            SELECT id FROM agency_equipment WHERE agency_id = $1
          )
          AND r.fecha_inicio >= DATE_TRUNC('month', CURRENT_DATE)
          AND r.estado != 'cancelado'
        ), 0) as ingresos_mes,

        -- Alquileres activos
        (
          SELECT COUNT(*)
          FROM equipment_rentals r
          WHERE r.equipment_id IN (
            SELECT id FROM agency_equipment WHERE agency_id = $1
          )
          AND r.estado IN ('reservado', 'entregado')
          AND r.fecha_inicio <= CURRENT_DATE
          AND r.fecha_fin >= CURRENT_DATE
        ) as alquileres_activos

      FROM agency_equipment
      WHERE agency_id = $1 AND activo = true
    `;

    const result = await pool.query(sql, [agencyId]);
    return result.rows[0];
  }

  /**
   * Verificar disponibilidad de equipo en fechas
   */
  static async checkAvailability(equipmentId, fecha_inicio, fecha_fin, cantidad_necesaria = 1) {
    const sql = `
      SELECT
        e.cantidad as cantidad_total,
        COALESCE(SUM(r.cantidad), 0) as cantidad_reservada
      FROM agency_equipment e
      LEFT JOIN equipment_rentals r ON e.id = r.equipment_id
        AND r.estado IN ('reservado', 'entregado')
        AND (
          (r.fecha_inicio <= $2 AND r.fecha_fin >= $2) OR
          (r.fecha_inicio <= $3 AND r.fecha_fin >= $3) OR
          (r.fecha_inicio >= $2 AND r.fecha_fin <= $3)
        )
      WHERE e.id = $1
      GROUP BY e.id, e.cantidad
    `;

    const result = await pool.query(sql, [equipmentId, fecha_inicio, fecha_fin]);

    if (result.rows.length === 0) {
      return { disponible: false, cantidad_disponible: 0 };
    }

    const { cantidad_total, cantidad_reservada } = result.rows[0];
    const cantidad_disponible = cantidad_total - cantidad_reservada;

    return {
      disponible: cantidad_disponible >= cantidad_necesaria,
      cantidad_disponible,
      cantidad_total,
      cantidad_reservada: parseInt(cantidad_reservada)
    };
  }
}

export default Equipment;
