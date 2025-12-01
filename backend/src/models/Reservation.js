/**
 * Reservation Model
 * Sistema de gestión de reservas públicas con hold temporal
 */

import pool from '../config/database.js';
import logger from '../utils/logger.js';
import Availability from './Availability.js';

class Reservation {
  /**
   * Crear nueva reserva
   * @param {Object} reservationData - Datos de la reserva
   * @returns {Promise<Object>} Reserva creada
   */
  static async create(reservationData) {
    const {
      agency_id,
      dj_id,
      cliente_id,
      event_type,
      event_date,
      event_start_time,
      event_end_time,
      event_duration_hours,
      event_location,
      event_description,
      estimated_guests,
      client_name,
      client_email,
      client_phone,
      client_company,
      services_requested,
      budget_range,
      estimated_price,
      status = 'pending',
      source = 'web_form',
      ip_address,
      user_agent,
      referrer
    } = reservationData;

    try {
      const query = `
        INSERT INTO reservations (
          agency_id, dj_id, cliente_id, event_type,
          event_date, event_start_time, event_end_time, event_duration_hours,
          event_location, event_description, estimated_guests,
          client_name, client_email, client_phone, client_company,
          services_requested, budget_range, estimated_price,
          status, source, ip_address, user_agent, referrer
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        RETURNING *
      `;

      const values = [
        agency_id, dj_id || null, cliente_id || null, event_type,
        event_date, event_start_time || null, event_end_time || null, event_duration_hours || null,
        event_location || null, event_description || null, estimated_guests || null,
        client_name, client_email, client_phone, client_company || null,
        services_requested ? JSON.stringify(services_requested) : null,
        budget_range || null, estimated_price || null,
        status, source, ip_address || null, user_agent || null, referrer || null
      ];

      const result = await pool.query(query, values);

      logger.info('Reservation created:', {
        reservationId: result.rows[0].id,
        reservationNumber: result.rows[0].reservation_number
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating reservation:', error);
      throw error;
    }
  }

  /**
   * Obtener reserva por ID
   * @param {number} id - ID de la reserva
   * @returns {Promise<Object|null>} Reserva encontrada
   */
  static async findById(id) {
    try {
      const query = `SELECT * FROM reservations_complete WHERE id = $1`;
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding reservation:', error);
      throw error;
    }
  }

  /**
   * Obtener reserva por número
   * @param {string} reservationNumber - Número de reserva
   * @returns {Promise<Object|null>} Reserva encontrada
   */
  static async findByNumber(reservationNumber) {
    try {
      const query = `
        SELECT * FROM reservations_complete
        WHERE reservation_number = $1
      `;
      const result = await pool.query(query, [reservationNumber]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding reservation by number:', error);
      throw error;
    }
  }

  /**
   * Listar reservas con filtros
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<Object>} Resultados paginados
   */
  static async findAll(filters = {}) {
    const {
      agency_id,
      dj_id,
      cliente_id,
      status,
      event_type,
      date_from,
      date_to,
      search,
      page = 1,
      limit = 50
    } = filters;

    try {
      const conditions = [];
      const values = [];
      let paramCount = 1;

      if (agency_id) {
        conditions.push(`agency_id = $${paramCount++}`);
        values.push(agency_id);
      }

      if (dj_id) {
        conditions.push(`dj_id = $${paramCount++}`);
        values.push(dj_id);
      }

      if (cliente_id) {
        conditions.push(`cliente_id = $${paramCount++}`);
        values.push(cliente_id);
      }

      if (status) {
        if (Array.isArray(status)) {
          conditions.push(`status = ANY($${paramCount++})`);
          values.push(status);
        } else {
          conditions.push(`status = $${paramCount++}`);
          values.push(status);
        }
      }

      if (event_type) {
        conditions.push(`event_type = $${paramCount++}`);
        values.push(event_type);
      }

      if (date_from) {
        conditions.push(`event_date >= $${paramCount++}`);
        values.push(date_from);
      }

      if (date_to) {
        conditions.push(`event_date <= $${paramCount++}`);
        values.push(date_to);
      }

      if (search) {
        conditions.push(`(
          client_name ILIKE $${paramCount} OR
          client_email ILIKE $${paramCount} OR
          client_phone ILIKE $${paramCount} OR
          reservation_number ILIKE $${paramCount} OR
          event_description ILIKE $${paramCount}
        )`);
        values.push(`%${search}%`);
        paramCount++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const offset = (page - 1) * limit;

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM reservations
        ${whereClause}
      `;
      const countResult = await pool.query(countQuery, values);
      const total = parseInt(countResult.rows[0].total);

      // Main query
      const query = `
        SELECT * FROM reservations_complete
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;
      values.push(limit, offset);

      const result = await pool.query(query, values);

      return {
        success: true,
        data: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          total_pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error finding reservations:', error);
      throw error;
    }
  }

  /**
   * Actualizar reserva
   * @param {number} id - ID de la reserva
   * @param {Object} updates - Datos a actualizar
   * @returns {Promise<Object>} Reserva actualizada
   */
  static async update(id, updates) {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Reserva no encontrada');
      }

      const allowedFields = [
        'dj_id', 'cliente_id', 'event_type', 'event_date',
        'event_start_time', 'event_end_time', 'event_duration_hours',
        'event_location', 'event_description', 'estimated_guests',
        'client_name', 'client_email', 'client_phone', 'client_company',
        'services_requested', 'budget_range', 'estimated_price',
        'admin_notes', 'internal_notes'
      ];

      const filteredUpdates = {};
      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredUpdates[key] = updates[key];
        }
      });

      if (Object.keys(filteredUpdates).length === 0) {
        return existing;
      }

      const setClause = Object.keys(filteredUpdates)
        .map((key, idx) => `${key} = $${idx + 2}`)
        .join(', ');

      const query = `
        UPDATE reservations
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const values = [id, ...Object.values(filteredUpdates)];
      const result = await pool.query(query, values);

      logger.info('Reservation updated:', { id });
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating reservation:', error);
      throw error;
    }
  }

  /**
   * Eliminar reserva (soft delete)
   * @param {number} id - ID de la reserva
   * @returns {Promise<Object>} Resultado
   */
  static async delete(id) {
    try {
      // Cambiar a estado cancelled en vez de borrar
      return await this.cancel(id, null, 'Reserva eliminada');
    } catch (error) {
      logger.error('Error deleting reservation:', error);
      throw error;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MÉTODOS DEL WORKFLOW
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Verificar disponibilidad antes de reservar
   * @param {Object} criteria - Criterios de verificación
   * @returns {Promise<Object>} Resultado de disponibilidad
   */
  static async checkAvailability(criteria) {
    const { agency_id, dj_id, event_date, event_start_time, event_end_time } = criteria;

    try {
      // Si no hay DJ específico, buscar DJs disponibles
      if (!dj_id) {
        const availableDJs = await Availability.findAvailableDJs({
          fecha: event_date,
          hora_inicio: event_start_time,
          hora_fin: event_end_time,
          agency_id
        });

        return {
          is_available: availableDJs.length > 0,
          available_djs: availableDJs,
          conflicts: []
        };
      }

      // Verificar disponibilidad de DJ específico
      const conflicts = await Availability.detectConflicts(
        dj_id,
        event_date,
        event_start_time,
        event_end_time
      );

      return {
        is_available: !conflicts.has_conflicts,
        available_djs: conflicts.has_conflicts ? [] : [{ id: dj_id }],
        conflicts: conflicts.conflicts || []
      };
    } catch (error) {
      logger.error('Error checking availability:', error);
      throw error;
    }
  }

  /**
   * Crear hold temporal
   * @param {Object} reservationData - Datos de la reserva
   * @param {number} holdMinutes - Minutos de hold (default 30)
   * @returns {Promise<Object>} Reserva con hold
   */
  static async createHold(reservationData, holdMinutes = 30) {
    try {
      // Verificar disponibilidad primero
      const availability = await this.checkAvailability({
        agency_id: reservationData.agency_id,
        dj_id: reservationData.dj_id,
        event_date: reservationData.event_date,
        event_start_time: reservationData.event_start_time,
        event_end_time: reservationData.event_end_time
      });

      if (!availability.is_available) {
        throw new Error('No hay disponibilidad para la fecha y hora solicitadas');
      }

      // Crear reserva con hold
      const holdExpiresAt = new Date(Date.now() + holdMinutes * 60 * 1000);

      const reservation = await this.create({
        ...reservationData,
        status: 'hold',
        hold_expires_at: holdExpiresAt,
        hold_duration_minutes: holdMinutes
      });

      logger.info('Hold created:', {
        reservationId: reservation.id,
        expiresAt: holdExpiresAt
      });

      return reservation;
    } catch (error) {
      logger.error('Error creating hold:', error);
      throw error;
    }
  }

  /**
   * Confirmar reserva (cambiar de pending/hold a confirmed)
   * @param {number} id - ID de la reserva
   * @param {number} confirmedBy - Usuario que confirma
   * @returns {Promise<Object>} Reserva confirmada
   */
  static async confirm(id, confirmedBy) {
    try {
      const query = `
        UPDATE reservations
        SET status = 'confirmed',
            confirmed_at = CURRENT_TIMESTAMP,
            confirmed_by = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const result = await pool.query(query, [id, confirmedBy]);

      if (result.rows.length === 0) {
        throw new Error('Reserva no encontrada');
      }

      logger.info('Reservation confirmed:', { id, confirmedBy });
      return result.rows[0];
    } catch (error) {
      logger.error('Error confirming reservation:', error);
      throw error;
    }
  }

  /**
   * Aprobar reserva (cambiar de confirmed a approved)
   * @param {number} id - ID de la reserva
   * @param {number} approvedBy - Usuario que aprueba
   * @returns {Promise<Object>} Reserva aprobada
   */
  static async approve(id, approvedBy) {
    try {
      const query = `
        UPDATE reservations
        SET status = 'approved',
            approved_at = CURRENT_TIMESTAMP,
            approved_by = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const result = await pool.query(query, [id, approvedBy]);

      if (result.rows.length === 0) {
        throw new Error('Reserva no encontrada');
      }

      logger.info('Reservation approved:', { id, approvedBy });
      return result.rows[0];
    } catch (error) {
      logger.error('Error approving reservation:', error);
      throw error;
    }
  }

  /**
   * Cancelar reserva
   * @param {number} id - ID de la reserva
   * @param {number} cancelledBy - Usuario que cancela
   * @param {string} reason - Motivo de cancelación
   * @returns {Promise<Object>} Reserva cancelada
   */
  static async cancel(id, cancelledBy, reason = null) {
    try {
      const query = `
        UPDATE reservations
        SET status = 'cancelled',
            cancelled_at = CURRENT_TIMESTAMP,
            cancelled_by = $2,
            cancellation_reason = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const result = await pool.query(query, [id, cancelledBy || null, reason]);

      if (result.rows.length === 0) {
        throw new Error('Reserva no encontrada');
      }

      logger.info('Reservation cancelled:', { id, cancelledBy, reason });
      return result.rows[0];
    } catch (error) {
      logger.error('Error cancelling reservation:', error);
      throw error;
    }
  }

  /**
   * Rechazar reserva
   * @param {number} id - ID de la reserva
   * @param {number} rejectedBy - Usuario que rechaza
   * @param {string} reason - Motivo del rechazo
   * @returns {Promise<Object>} Reserva rechazada
   */
  static async reject(id, rejectedBy, reason) {
    try {
      const query = `
        UPDATE reservations
        SET status = 'rejected',
            rejected_at = CURRENT_TIMESTAMP,
            rejected_by = $2,
            rejection_reason = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const result = await pool.query(query, [id, rejectedBy, reason]);

      if (result.rows.length === 0) {
        throw new Error('Reserva no encontrada');
      }

      logger.info('Reservation rejected:', { id, rejectedBy, reason });
      return result.rows[0];
    } catch (error) {
      logger.error('Error rejecting reservation:', error);
      throw error;
    }
  }

  /**
   * Expirar holds antiguos
   * @returns {Promise<Object>} Resultado
   */
  static async expireOldHolds() {
    try {
      const query = `SELECT expire_old_holds() as expired_count`;
      const result = await pool.query(query);

      const expiredCount = result.rows[0].expired_count;

      logger.info('Old holds expired:', { count: expiredCount });

      return {
        success: true,
        expired: expiredCount
      };
    } catch (error) {
      logger.error('Error expiring old holds:', error);
      throw error;
    }
  }

  /**
   * Obtener reservas que requieren acción
   * @param {number} agency_id - ID de la agencia
   * @returns {Promise<Array>} Reservas pendientes
   */
  static async getRequiringAction(agency_id = null) {
    try {
      let query = `SELECT * FROM reservations_requiring_action`;

      if (agency_id) {
        query += ` WHERE agency_id = $1`;
        const result = await pool.query(query, [agency_id]);
        return result.rows;
      }

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error getting reservations requiring action:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de reservas
   * @param {number} agency_id - ID de la agencia
   * @returns {Promise<Object>} Estadísticas
   */
  static async getStats(agency_id) {
    try {
      const query = `
        SELECT * FROM reservation_stats_by_agency
        WHERE agency_id = $1
      `;

      const result = await pool.query(query, [agency_id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting reservation stats:', error);
      throw error;
    }
  }

  /**
   * Obtener historial de cambios de estado
   * @param {number} reservationId - ID de la reserva
   * @returns {Promise<Array>} Historial
   */
  static async getStatusHistory(reservationId) {
    try {
      const query = `
        SELECT * FROM reservation_status_history
        WHERE reservation_id = $1
        ORDER BY created_at ASC
      `;

      const result = await pool.query(query, [reservationId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting status history:', error);
      throw error;
    }
  }

  /**
   * Convertir reserva a evento
   * @param {number} reservationId - ID de la reserva
   * @param {number} eventoId - ID del evento creado
   * @returns {Promise<Object>} Reserva actualizada
   */
  static async convertToEvento(reservationId, eventoId) {
    try {
      const query = `
        UPDATE reservations
        SET evento_id = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const result = await pool.query(query, [reservationId, eventoId]);

      if (result.rows.length === 0) {
        throw new Error('Reserva no encontrada');
      }

      logger.info('Reservation converted to evento:', { reservationId, eventoId });
      return result.rows[0];
    } catch (error) {
      logger.error('Error converting reservation to evento:', error);
      throw error;
    }
  }
}

export default Reservation;
