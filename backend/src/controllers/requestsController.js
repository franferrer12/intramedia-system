import db from '../config/database.js';

/**
 * Obtener todas las solicitudes (con filtros opcionales)
 * Query params: status, dj_id, priority
 */
export const getRequests = async (req, res) => {
  try {
    const { status, dj_id, priority } = req.query;

    let query = `
      SELECT
        r.*,
        d.nombre as dj_nombre,
        e.evento as evento_nombre,
        e.fecha as evento_fecha
      FROM requests r
      LEFT JOIN djs d ON r.dj_id = d.id
      LEFT JOIN events e ON r.evento_id = e.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Filtro por status
    if (status) {
      query += ` AND r.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    // Filtro por DJ
    if (dj_id) {
      query += ` AND r.dj_id = $${paramCount}`;
      params.push(dj_id);
      paramCount++;
    }

    // Filtro por prioridad
    if (priority) {
      query += ` AND r.priority = $${paramCount}`;
      params.push(priority);
      paramCount++;
    }

    query += ` ORDER BY r.created_at DESC`;

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error al obtener requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener solicitudes',
      error: error.message
    });
  }
};

/**
 * Obtener una solicitud específica por ID
 */
export const getRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        r.*,
        d.nombre as dj_nombre,
        d.email as dj_email,
        d.telefono as dj_telefono,
        e.evento as evento_nombre,
        e.fecha as evento_fecha,
        e.ciudad_lugar as evento_lugar,
        c.nombre as cliente_nombre
      FROM requests r
      LEFT JOIN djs d ON r.dj_id = d.id
      LEFT JOIN events e ON r.evento_id = e.id
      LEFT JOIN clients c ON e.cliente_id = c.id
      WHERE r.id = $1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error al obtener request:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener solicitud',
      error: error.message
    });
  }
};

/**
 * Crear una nueva solicitud
 */
export const createRequest = async (req, res) => {
  try {
    const {
      dj_id,
      evento_id,
      title,
      description,
      priority = 'medium',
      budget
    } = req.body;

    // Validaciones
    if (!dj_id || !title) {
      return res.status(400).json({
        success: false,
        message: 'dj_id y title son requeridos'
      });
    }

    const query = `
      INSERT INTO requests (dj_id, evento_id, title, description, priority, budget)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await db.query(query, [
      dj_id,
      evento_id || null,
      title,
      description || null,
      priority,
      budget || null
    ]);

    res.status(201).json({
      success: true,
      message: 'Solicitud creada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear request:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear solicitud',
      error: error.message
    });
  }
};

/**
 * Actualizar una solicitud (principalmente para cambiar status)
 */
export const updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, title, description, priority, budget } = req.body;

    // Verificar que el request existe
    const checkQuery = 'SELECT id FROM requests WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    // Construir query dinámicamente
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (status !== undefined) {
      updates.push(`status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (title !== undefined) {
      updates.push(`title = $${paramCount}`);
      values.push(title);
      paramCount++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }

    if (priority !== undefined) {
      updates.push(`priority = $${paramCount}`);
      values.push(priority);
      paramCount++;
    }

    if (budget !== undefined) {
      updates.push(`budget = $${paramCount}`);
      values.push(budget);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE requests
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    values.push(id);

    const result = await db.query(query, values);

    res.json({
      success: true,
      message: 'Solicitud actualizada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar request:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar solicitud',
      error: error.message
    });
  }
};

/**
 * Eliminar una solicitud
 */
export const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'DELETE FROM requests WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Solicitud eliminada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al eliminar request:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar solicitud',
      error: error.message
    });
  }
};

/**
 * Obtener estadísticas de solicitudes
 */
export const getRequestStats = async (req, res) => {
  try {
    const query = `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN priority = 'urgent' AND status = 'pending' THEN 1 END) as urgent_pending
      FROM requests
    `;

    const result = await db.query(query);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener stats de requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};
