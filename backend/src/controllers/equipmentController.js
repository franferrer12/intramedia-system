import Equipment from '../models/Equipment.js';
import pool from '../config/database.js';

/**
 * Equipment Controller
 * Handles all equipment management operations
 */

/**
 * Get all equipment for agency
 * GET /api/equipment
 */
export const getEquipment = async (req, res) => {
  try {
    const { agencyId } = req.user; // Assuming user has agencyId
    const filters = {
      tipo: req.query.tipo,
      estado: req.query.estado,
      solo_disponibles: req.query.solo_disponibles === 'true'
    };

    const equipment = await Equipment.findByAgency(agencyId, filters);

    res.json({
      success: true,
      data: equipment,
      count: equipment.length
    });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener equipos',
      error: error.message
    });
  }
};

/**
 * Get equipment by ID
 * GET /api/equipment/:id
 */
export const getEquipmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const equipment = await Equipment.findById(id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado'
      });
    }

    res.json({
      success: true,
      data: equipment
    });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener equipo',
      error: error.message
    });
  }
};

/**
 * Create new equipment
 * POST /api/equipment
 */
export const createEquipment = async (req, res) => {
  try {
    const { agencyId } = req.user;
    const equipmentData = {
      ...req.body,
      agency_id: agencyId
    };

    const equipment = await Equipment.create(equipmentData);

    res.status(201).json({
      success: true,
      message: 'Equipo creado exitosamente',
      data: equipment
    });
  } catch (error) {
    console.error('Error creating equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear equipo',
      error: error.message
    });
  }
};

/**
 * Update equipment
 * PUT /api/equipment/:id
 */
export const updateEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const equipment = await Equipment.update(id, req.body);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Equipo actualizado exitosamente',
      data: equipment
    });
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar equipo',
      error: error.message
    });
  }
};

/**
 * Delete equipment (soft delete)
 * DELETE /api/equipment/:id
 */
export const deleteEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const equipment = await Equipment.delete(id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Equipo eliminado exitosamente',
      data: equipment
    });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar equipo',
      error: error.message
    });
  }
};

/**
 * Get equipment statistics
 * GET /api/equipment/stats
 */
export const getEquipmentStats = async (req, res) => {
  try {
    const { agencyId } = req.user;
    const stats = await Equipment.getStats(agencyId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching equipment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

/**
 * Check equipment availability
 * POST /api/equipment/:id/check-availability
 */
export const checkAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha_inicio, fecha_fin, cantidad = 1 } = req.body;

    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({
        success: false,
        message: 'Fecha de inicio y fin son requeridas'
      });
    }

    const availability = await Equipment.checkAvailability(
      id,
      fecha_inicio,
      fecha_fin,
      cantidad
    );

    res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar disponibilidad',
      error: error.message
    });
  }
};

// ============================================================================
// RENTAL ENDPOINTS
// ============================================================================

/**
 * Get rentals for equipment
 * GET /api/equipment/:id/rentals
 */
export const getEquipmentRentals = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.query;

    const rentals = await Equipment.getRentals(id, estado || null);

    res.json({
      success: true,
      data: rentals,
      count: rentals.length
    });
  } catch (error) {
    console.error('Error fetching rentals:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener alquileres',
      error: error.message
    });
  }
};

/**
 * Create new rental
 * POST /api/equipment/rentals
 */
export const createRental = async (req, res) => {
  try {
    const rentalData = req.body;

    // Validate required fields
    const required = ['equipment_id', 'cantidad', 'fecha_inicio', 'fecha_fin', 'precio_unitario'];
    const missing = required.filter(field => !rentalData[field]);

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Campos requeridos faltantes: ${missing.join(', ')}`
      });
    }

    // Check availability before creating rental
    const availability = await Equipment.checkAvailability(
      rentalData.equipment_id,
      rentalData.fecha_inicio,
      rentalData.fecha_fin,
      rentalData.cantidad
    );

    if (!availability.disponible) {
      return res.status(400).json({
        success: false,
        message: 'Cantidad de equipos no disponible para las fechas seleccionadas',
        data: availability
      });
    }

    const rental = await Equipment.createRental(rentalData);

    res.status(201).json({
      success: true,
      message: 'Alquiler creado exitosamente',
      data: rental
    });
  } catch (error) {
    console.error('Error creating rental:', error);

    // Handle trigger validation errors
    if (error.message && error.message.includes('Insufficient equipment availability')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear alquiler',
      error: error.message
    });
  }
};

/**
 * Mark rental as delivered
 * POST /api/equipment/rentals/:id/deliver
 */
export const markAsDelivered = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    const rental = await Equipment.markAsDelivered(id, userId);

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Alquiler no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Equipo marcado como entregado',
      data: rental
    });
  } catch (error) {
    console.error('Error marking as delivered:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar como entregado',
      error: error.message
    });
  }
};

/**
 * Mark rental as returned
 * POST /api/equipment/rentals/:id/return
 */
export const markAsReturned = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const { condicion } = req.body;

    if (!condicion || !['excelente', 'bueno', 'regular', 'dañado'].includes(condicion)) {
      return res.status(400).json({
        success: false,
        message: 'Condición de devolución inválida. Debe ser: excelente, bueno, regular, o dañado'
      });
    }

    const rental = await Equipment.markAsReturned(id, userId, condicion);

    if (!rental) {
      return res.status(404).json({
        success: false,
        message: 'Alquiler no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Equipo marcado como devuelto',
      data: rental
    });
  } catch (error) {
    console.error('Error marking as returned:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar como devuelto',
      error: error.message
    });
  }
};

/**
 * Get all rentals (admin view)
 * GET /api/equipment/rentals
 */
export const getAllRentals = async (req, res) => {
  try {
    const { estado, fecha_inicio, fecha_fin } = req.query;

    // Build query dynamically
    let query = `
      SELECT
        r.*,
        e.nombre as evento_nombre,
        e.fecha as evento_fecha,
        d.email as dj_email,
        u.email as dj_usuario_email,
        eq.tipo as equipo_tipo,
        eq.marca as equipo_marca,
        eq.modelo as equipo_modelo,
        eq.foto_url as equipo_foto
      FROM equipment_rentals r
      LEFT JOIN eventos e ON r.evento_id = e.id
      LEFT JOIN djs d ON r.dj_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN agency_equipment eq ON r.equipment_id = eq.id
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 0;

    if (estado) {
      paramCount++;
      query += ` AND r.estado = $${paramCount}`;
      values.push(estado);
    }

    if (fecha_inicio) {
      paramCount++;
      query += ` AND r.fecha_inicio >= $${paramCount}`;
      values.push(fecha_inicio);
    }

    if (fecha_fin) {
      paramCount++;
      query += ` AND r.fecha_fin <= $${paramCount}`;
      values.push(fecha_fin);
    }

    query += ` ORDER BY r.fecha_inicio DESC`;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching all rentals:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener alquileres',
      error: error.message
    });
  }
};

export default {
  getEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getEquipmentStats,
  checkAvailability,
  getEquipmentRentals,
  createRental,
  markAsDelivered,
  markAsReturned,
  getAllRentals
};
