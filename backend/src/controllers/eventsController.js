import Evento from '../models/Event.js';
import { formatPaginatedResponse, parseFilters } from '../middleware/pagination.js';
import { query } from '../config/database.js';

export const getEventos = async (req, res) => {
  try {
    const { limit, offset, page } = req.pagination;
    const filters = parseFilters(req.query);

    // Build WHERE clause
    let whereConditions = ['deleted_at IS NULL'];
    const values = [];
    let paramIndex = 1;

    // Filter by month
    if (req.query.mes) {
      whereConditions.push(`UPPER(mes) = UPPER($${paramIndex})`);
      values.push(req.query.mes);
      paramIndex++;
    }

    // Filter by DJ
    if (req.query.dj_id) {
      whereConditions.push(`dj_id = $${paramIndex}`);
      values.push(parseInt(req.query.dj_id));
      paramIndex++;
    }

    // Filter by estado
    if (req.query.estado) {
      whereConditions.push(`estado = $${paramIndex}`);
      values.push(req.query.estado);
      paramIndex++;
    }

    // Filter by client payment status
    if (req.query.cobrado_cliente !== undefined) {
      whereConditions.push(`cobrado_cliente = $${paramIndex}`);
      values.push(req.query.cobrado_cliente === 'true');
      paramIndex++;
    }

    // Filter by DJ payment status
    if (req.query.pagado_dj !== undefined) {
      whereConditions.push(`pagado_dj = $${paramIndex}`);
      values.push(req.query.pagado_dj === 'true');
      paramIndex++;
    }

    // Date range filters
    if (filters.dateFrom) {
      whereConditions.push(`fecha >= $${paramIndex}`);
      values.push(filters.dateFrom);
      paramIndex++;
    }

    if (filters.dateTo) {
      whereConditions.push(`fecha <= $${paramIndex}`);
      values.push(filters.dateTo);
      paramIndex++;
    }

    // Search by event name
    if (filters.search) {
      whereConditions.push(`evento ILIKE $${paramIndex}`);
      values.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countSql = `SELECT COUNT(*) FROM events WHERE ${whereClause}`;
    const countResult = await query(countSql, values);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated data
    const sortBy = filters.sortBy || 'fecha';
    const sortOrder = filters.sortOrder || 'DESC';
    const dataSql = `
      SELECT * FROM events
      WHERE ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    values.push(limit, offset);

    const result = await query(dataSql, values);

    res.json(formatPaginatedResponse(result.rows, total, req.pagination));
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener eventos',
      error: error.message
    });
  }
};

export const getEvento = async (req, res) => {
  try {
    const { id } = req.params;
    const evento = await Evento.findById(id);

    if (!evento) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    res.json({
      success: true,
      data: evento
    });
  } catch (error) {
    console.error('Error al obtener evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener evento',
      error: error.message
    });
  }
};

export const createEvento = async (req, res) => {
  try {
    const evento = await Evento.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Evento creado exitosamente',
      data: evento
    });
  } catch (error) {
    console.error('Error al crear evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear evento',
      error: error.message
    });
  }
};

export const updateEvento = async (req, res) => {
  try {
    const { id } = req.params;
    const evento = await Evento.update(id, req.body);

    if (!evento) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Evento actualizado exitosamente',
      data: evento
    });
  } catch (error) {
    console.error('Error al actualizar evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar evento',
      error: error.message
    });
  }
};

export const deleteEvento = async (req, res) => {
  try {
    const { id } = req.params;
    const evento = await Evento.delete(id);

    if (!evento) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Evento eliminado exitosamente',
      data: evento
    });
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar evento',
      error: error.message
    });
  }
};

export const getStatsByMonth = async (req, res) => {
  try {
    const { mes } = req.params;
    const stats = await Evento.getStatsByMonth(mes);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

export const getUpcomingEventos = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const eventos = await Evento.getUpcoming(days);

    res.json({
      success: true,
      count: eventos.length,
      data: eventos
    });
  } catch (error) {
    console.error('Error al obtener eventos próximos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener eventos próximos',
      error: error.message
    });
  }
};

// GET /api/eventos/:id/financial-breakdown - Desglose financiero de un evento
export const getFinancialBreakdown = async (req, res) => {
  try {
    const { id } = req.params;
    const breakdown = await Evento.getFinancialBreakdown(id);

    if (!breakdown) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    res.json({
      success: true,
      data: breakdown
    });
  } catch (error) {
    console.error('Error al obtener desglose financiero:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener desglose financiero',
      error: error.message
    });
  }
};

// GET /api/eventos/financial-summary/monthly - Resumen financiero mensual
export const getMonthlyFinancialSummary = async (req, res) => {
  try {
    const { year, month } = req.query;
    const summary = await Evento.getMonthlyFinancialSummary(
      year ? parseInt(year) : null,
      month ? parseInt(month) : null
    );

    res.json({
      success: true,
      count: summary.length,
      data: summary
    });
  } catch (error) {
    console.error('Error al obtener resumen mensual:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen mensual',
      error: error.message
    });
  }
};

// GET /api/eventos/financial-summary/partners - Resumen por socio
export const getPartnerSummary = async (req, res) => {
  try {
    const summary = await Evento.getPartnerSummary();

    res.json({
      success: true,
      count: summary.length,
      data: summary
    });
  } catch (error) {
    console.error('Error al obtener resumen por socio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen por socio',
      error: error.message
    });
  }
};
