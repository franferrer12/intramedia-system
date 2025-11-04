/**
 * Quotations Controller
 * Controlador para el sistema de cotizaciones
 */

import pool from '../config/database.js';

/**
 * Obtener todas las cotizaciones con paginación
 */
export const getAllQuotations = async (req, res) => {
  try {
    const { page = 1, limit = 10, estado, busqueda } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE c.deleted_at IS NULL';
    const queryParams = [];
    let paramCount = 1;

    if (estado) {
      whereClause += ` AND c.estado = $${paramCount}`;
      queryParams.push(estado);
      paramCount++;
    }

    if (busqueda) {
      whereClause += ` AND (
        c.numero_cotizacion ILIKE $${paramCount} OR
        c.cliente_nombre ILIKE $${paramCount} OR
        c.cliente_email ILIKE $${paramCount}
      )`;
      queryParams.push(`%${busqueda}%`);
      paramCount++;
    }

    // Count total
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM cotizaciones c ${whereClause}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0].total);

    // Get data
    queryParams.push(limit, offset);
    const result = await pool.query(
      `SELECT * FROM vw_cotizaciones_completas
       ${whereClause.replace('c.deleted_at', 'false')}
       ORDER BY fecha_emision DESC, id DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      queryParams
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo cotizaciones:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener cotizaciones'
    });
  }
};

/**
 * Obtener una cotización por ID con sus items
 */
export const getQuotationById = async (req, res) => {
  try {
    const { id } = req.params;

    const quotationResult = await pool.query(
      'SELECT * FROM cotizaciones WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );

    if (quotationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cotización no encontrada'
      });
    }

    const itemsResult = await pool.query(
      'SELECT * FROM cotizacion_items WHERE cotizacion_id = $1 ORDER BY orden, id',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...quotationResult.rows[0],
        items: itemsResult.rows
      }
    });
  } catch (error) {
    console.error('Error obteniendo cotización:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener cotización'
    });
  }
};

/**
 * Crear nueva cotización con items
 */
export const createQuotation = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      lead_id,
      request_id,
      cliente_nombre,
      cliente_email,
      cliente_telefono,
      cliente_empresa,
      tipo_evento,
      fecha_evento,
      hora_inicio,
      hora_fin,
      ubicacion,
      num_invitados,
      descuento_porcentaje = 0,
      iva_porcentaje = 21,
      fecha_vencimiento,
      observaciones,
      terminos_condiciones,
      items = []
    } = req.body;

    // Generar número de cotización
    const numeroResult = await client.query('SELECT generate_quotation_number()');
    const numero_cotizacion = numeroResult.rows[0].generate_quotation_number;

    // Crear cotización
    const quotationResult = await client.query(
      `INSERT INTO cotizaciones (
        numero_cotizacion, lead_id, request_id,
        cliente_nombre, cliente_email, cliente_telefono, cliente_empresa,
        tipo_evento, fecha_evento, hora_inicio, hora_fin, ubicacion, num_invitados,
        descuento_porcentaje, iva_porcentaje, fecha_vencimiento,
        observaciones, terminos_condiciones, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        numero_cotizacion, lead_id, request_id,
        cliente_nombre, cliente_email, cliente_telefono, cliente_empresa,
        tipo_evento, fecha_evento, hora_inicio, hora_fin, ubicacion, num_invitados,
        descuento_porcentaje, iva_porcentaje, fecha_vencimiento,
        observaciones, terminos_condiciones, req.user?.id
      ]
    );

    const cotizacion_id = quotationResult.rows[0].id;

    // Crear items
    const createdItems = [];
    for (const item of items) {
      const subtotal = item.cantidad * item.precio_unitario;
      const itemResult = await client.query(
        `INSERT INTO cotizacion_items (
          cotizacion_id, concepto, descripcion, cantidad, precio_unitario, subtotal, orden
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          cotizacion_id,
          item.concepto,
          item.descripcion,
          item.cantidad,
          item.precio_unitario,
          subtotal,
          item.orden || 0
        ]
      );
      createdItems.push(itemResult.rows[0]);
    }

    await client.query('COMMIT');

    // Obtener cotización completa
    const finalResult = await pool.query(
      'SELECT * FROM cotizaciones WHERE id = $1',
      [cotizacion_id]
    );

    res.status(201).json({
      success: true,
      data: {
        ...finalResult.rows[0],
        items: createdItems
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creando cotización:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear cotización'
    });
  } finally {
    client.release();
  }
};

/**
 * Actualizar cotización
 */
export const updateQuotation = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const {
      cliente_nombre,
      cliente_email,
      cliente_telefono,
      cliente_empresa,
      tipo_evento,
      fecha_evento,
      hora_inicio,
      hora_fin,
      ubicacion,
      num_invitados,
      descuento_porcentaje,
      iva_porcentaje,
      fecha_vencimiento,
      observaciones,
      terminos_condiciones,
      items
    } = req.body;

    // Verificar que existe y está en estado editable
    const checkResult = await client.query(
      'SELECT estado FROM cotizaciones WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Cotización no encontrada'
      });
    }

    const estado = checkResult.rows[0].estado;
    if (!['borrador', 'enviada'].includes(estado)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'No se puede editar una cotización en este estado'
      });
    }

    // Actualizar cotización
    const result = await client.query(
      `UPDATE cotizaciones SET
        cliente_nombre = COALESCE($1, cliente_nombre),
        cliente_email = COALESCE($2, cliente_email),
        cliente_telefono = COALESCE($3, cliente_telefono),
        cliente_empresa = COALESCE($4, cliente_empresa),
        tipo_evento = COALESCE($5, tipo_evento),
        fecha_evento = COALESCE($6, fecha_evento),
        hora_inicio = COALESCE($7, hora_inicio),
        hora_fin = COALESCE($8, hora_fin),
        ubicacion = COALESCE($9, ubicacion),
        num_invitados = COALESCE($10, num_invitados),
        descuento_porcentaje = COALESCE($11, descuento_porcentaje),
        iva_porcentaje = COALESCE($12, iva_porcentaje),
        fecha_vencimiento = COALESCE($13, fecha_vencimiento),
        observaciones = COALESCE($14, observaciones),
        terminos_condiciones = COALESCE($15, terminos_condiciones),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $16
      RETURNING *`,
      [
        cliente_nombre, cliente_email, cliente_telefono, cliente_empresa,
        tipo_evento, fecha_evento, hora_inicio, hora_fin, ubicacion, num_invitados,
        descuento_porcentaje, iva_porcentaje, fecha_vencimiento,
        observaciones, terminos_condiciones, id
      ]
    );

    // Si se enviaron items, actualizarlos
    let updatedItems = [];
    if (items && Array.isArray(items)) {
      // Eliminar items antiguos
      await client.query('DELETE FROM cotizacion_items WHERE cotizacion_id = $1', [id]);

      // Crear nuevos items
      for (const item of items) {
        const subtotal = item.cantidad * item.precio_unitario;
        const itemResult = await client.query(
          `INSERT INTO cotizacion_items (
            cotizacion_id, concepto, descripcion, cantidad, precio_unitario, subtotal, orden
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *`,
          [id, item.concepto, item.descripcion, item.cantidad, item.precio_unitario, subtotal, item.orden || 0]
        );
        updatedItems.push(itemResult.rows[0]);
      }
    } else {
      // Obtener items existentes
      const itemsResult = await client.query(
        'SELECT * FROM cotizacion_items WHERE cotizacion_id = $1 ORDER BY orden, id',
        [id]
      );
      updatedItems = itemsResult.rows;
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        items: updatedItems
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error actualizando cotización:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar cotización'
    });
  } finally {
    client.release();
  }
};

/**
 * Cambiar estado de la cotización
 */
export const changeQuotationState = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, motivo_rechazo } = req.body;

    const validStates = ['borrador', 'enviada', 'aceptada', 'rechazada'];
    if (!validStates.includes(estado)) {
      return res.status(400).json({
        success: false,
        error: 'Estado no válido'
      });
    }

    let query = `
      UPDATE cotizaciones SET
        estado = $1,
        updated_at = CURRENT_TIMESTAMP
    `;
    const params = [estado];

    if (estado === 'aceptada') {
      query += ', fecha_aceptacion = CURRENT_TIMESTAMP';
    } else if (estado === 'rechazada') {
      query += ', fecha_rechazo = CURRENT_TIMESTAMP, motivo_rechazo = $2';
      params.push(motivo_rechazo);
    }

    query += ` WHERE id = $${params.length + 1} AND deleted_at IS NULL RETURNING *`;
    params.push(id);

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cotización no encontrada'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error cambiando estado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cambiar estado de cotización'
    });
  }
};

/**
 * Convertir cotización a evento
 */
export const convertToEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT convert_quotation_to_event($1) as event_id',
      [id]
    );

    const eventId = result.rows[0].event_id;

    res.json({
      success: true,
      message: 'Cotización convertida a evento exitosamente',
      data: {
        event_id: eventId
      }
    });
  } catch (error) {
    console.error('Error convirtiendo a evento:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Error al convertir cotización a evento'
    });
  }
};

/**
 * Obtener estadísticas de cotizaciones
 */
export const getQuotationsStats = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vw_cotizaciones_stats');

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas'
    });
  }
};

/**
 * Marcar cotizaciones expiradas (puede llamarse desde un cron job)
 */
export const markExpiredQuotations = async (req, res) => {
  try {
    const result = await pool.query('SELECT mark_expired_quotations() as count');
    const count = result.rows[0].count;

    res.json({
      success: true,
      message: `${count} cotizaciones marcadas como expiradas`
    });
  } catch (error) {
    console.error('Error marcando expiradas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al marcar cotizaciones expiradas'
    });
  }
};

/**
 * Soft delete
 */
export const deleteQuotation = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE cotizaciones SET
        deleted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cotización no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Cotización eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando cotización:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar cotización'
    });
  }
};

/**
 * Restaurar cotización eliminada
 */
export const restoreQuotation = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE cotizaciones SET
        deleted_at = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NOT NULL
      RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cotización no encontrada o no estaba eliminada'
      });
    }

    res.json({
      success: true,
      message: 'Cotización restaurada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error restaurando cotización:', error);
    res.status(500).json({
      success: false,
      error: 'Error al restaurar cotización'
    });
  }
};

export default {
  getAllQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  changeQuotationState,
  convertToEvent,
  getQuotationsStats,
  markExpiredQuotations,
  deleteQuotation,
  restoreQuotation
};
