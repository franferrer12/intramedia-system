import Reservation from '../models/Reservation.js';
import Availability from '../models/Availability.js';
import { sendEmail } from '../services/emailService.js';
import logger from '../utils/logger.js';

/**
 * Reservations Controller
 * Sistema completo de reservas públicas con holds temporales
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CRUD BÁSICO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/reservations
 * Obtener todas las reservas con filtros y paginación
 */
export const getAllReservations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      agency_id,
      dj_id,
      cliente_id,
      status,
      event_type,
      from_date,
      to_date,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    const result = await Reservation.findAll({
      agency_id,
      dj_id,
      cliente_id,
      status,
      event_type,
      from_date,
      to_date,
      search,
      page: parseInt(page),
      limit: parseInt(limit),
      sort_by,
      sort_order
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Error getting reservations:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reservas',
      error: error.message
    });
  }
};

/**
 * GET /api/reservations/:id
 * Obtener reserva por ID
 */
export const getReservationById = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findById(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada'
      });
    }

    res.json({
      success: true,
      data: reservation
    });
  } catch (error) {
    logger.error('Error getting reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reserva',
      error: error.message
    });
  }
};

/**
 * GET /api/reservations/number/:reservationNumber
 * Obtener reserva por número (RES-YYYYMM-XXXX)
 */
export const getReservationByNumber = async (req, res) => {
  try {
    const { reservationNumber } = req.params;
    const reservation = await Reservation.findByNumber(reservationNumber);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada'
      });
    }

    res.json({
      success: true,
      data: reservation
    });
  } catch (error) {
    logger.error('Error getting reservation by number:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reserva',
      error: error.message
    });
  }
};

/**
 * POST /api/reservations
 * Crear nueva reserva (sin hold, status: pending)
 */
export const createReservation = async (req, res) => {
  try {
    const reservationData = {
      ...req.body,
      source: req.body.source || 'api',
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      referrer: req.get('referer')
    };

    const reservation = await Reservation.create(reservationData);

    logger.info('Reservation created:', {
      reservationId: reservation.id,
      reservationNumber: reservation.reservation_number,
      clientEmail: reservation.client_email
    });

    // Enviar notificación por email
    try {
      await sendReservationCreatedEmail(reservation);
    } catch (emailError) {
      logger.error('Error sending reservation email:', emailError);
      // No fallar la request si el email falla
    }

    res.status(201).json({
      success: true,
      message: 'Reserva creada exitosamente',
      data: reservation
    });
  } catch (error) {
    logger.error('Error creating reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear reserva',
      error: error.message
    });
  }
};

/**
 * PUT /api/reservations/:id
 * Actualizar reserva
 */
export const updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // No permitir cambiar ciertos campos críticos vía update genérico
    delete updates.status;
    delete updates.reservation_number;
    delete updates.confirmed_by;
    delete updates.approved_by;

    const reservation = await Reservation.update(id, updates);

    logger.info('Reservation updated:', { reservationId: id });

    res.json({
      success: true,
      message: 'Reserva actualizada exitosamente',
      data: reservation
    });
  } catch (error) {
    logger.error('Error updating reservation:', error);

    if (error.message === 'Reserva no encontrada') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar reserva',
      error: error.message
    });
  }
};

/**
 * DELETE /api/reservations/:id
 * Eliminar reserva (soft delete -> cancel)
 */
export const deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const reservation = await Reservation.cancel(id, userId, 'Eliminada por usuario');

    logger.info('Reservation deleted:', { reservationId: id });

    res.json({
      success: true,
      message: 'Reserva eliminada exitosamente',
      data: reservation
    });
  } catch (error) {
    logger.error('Error deleting reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar reserva',
      error: error.message
    });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DISPONIBILIDAD Y HOLDS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * POST /api/reservations/check-availability
 * Verificar disponibilidad en tiempo real
 */
export const checkAvailability = async (req, res) => {
  try {
    const {
      agency_id,
      dj_id,
      event_date,
      event_start_time,
      event_end_time,
      event_duration_hours
    } = req.body;

    if (!agency_id || !event_date) {
      return res.status(400).json({
        success: false,
        message: 'agency_id y event_date son requeridos'
      });
    }

    const availability = await Reservation.checkAvailability({
      agency_id,
      dj_id,
      event_date,
      event_start_time,
      event_end_time,
      event_duration_hours
    });

    res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    logger.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar disponibilidad',
      error: error.message
    });
  }
};

/**
 * POST /api/reservations/hold
 * Crear reserva temporal (hold de 30 minutos por defecto)
 */
export const createReservationHold = async (req, res) => {
  try {
    const { hold_duration_minutes = 30, ...reservationData } = req.body;

    const holdData = {
      ...reservationData,
      source: req.body.source || 'api',
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      referrer: req.get('referer')
    };

    const reservation = await Reservation.createHold(
      holdData,
      parseInt(hold_duration_minutes)
    );

    logger.info('Reservation hold created:', {
      reservationId: reservation.id,
      reservationNumber: reservation.reservation_number,
      expiresAt: reservation.hold_expires_at
    });

    // Enviar email con info del hold
    try {
      await sendReservationHoldEmail(reservation);
    } catch (emailError) {
      logger.error('Error sending hold email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: `Reserva temporal creada. Expira en ${hold_duration_minutes} minutos`,
      data: reservation
    });
  } catch (error) {
    logger.error('Error creating reservation hold:', error);

    if (error.message.includes('No hay disponibilidad')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear reserva temporal',
      error: error.message
    });
  }
};

/**
 * POST /api/reservations/:id/extend-hold
 * Extender duración de un hold existente
 */
export const extendHold = async (req, res) => {
  try {
    const { id } = req.params;
    const { additional_minutes = 30 } = req.body;

    const reservation = await Reservation.findById(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada'
      });
    }

    if (reservation.status !== 'hold') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden extender reservas en estado hold'
      });
    }

    // Extender hold_expires_at
    const currentExpiry = new Date(reservation.hold_expires_at);
    const newExpiry = new Date(currentExpiry.getTime() + additional_minutes * 60 * 1000);

    const updated = await Reservation.update(id, {
      hold_expires_at: newExpiry
    });

    logger.info('Hold extended:', {
      reservationId: id,
      additionalMinutes: additional_minutes,
      newExpiry
    });

    res.json({
      success: true,
      message: `Hold extendido por ${additional_minutes} minutos adicionales`,
      data: updated
    });
  } catch (error) {
    logger.error('Error extending hold:', error);
    res.status(500).json({
      success: false,
      message: 'Error al extender hold',
      error: error.message
    });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WORKFLOW DE ESTADOS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * POST /api/reservations/:id/confirm
 * Confirmar reserva (pending/hold -> confirmed)
 */
export const confirmReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const reservation = await Reservation.confirm(id, userId);

    logger.info('Reservation confirmed:', {
      reservationId: id,
      confirmedBy: userId
    });

    // Enviar email de confirmación
    try {
      await sendReservationConfirmedEmail(reservation);
    } catch (emailError) {
      logger.error('Error sending confirmation email:', emailError);
    }

    res.json({
      success: true,
      message: 'Reserva confirmada exitosamente',
      data: reservation
    });
  } catch (error) {
    logger.error('Error confirming reservation:', error);

    if (error.message === 'Reserva no encontrada' ||
        error.message.includes('No se puede confirmar')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al confirmar reserva',
      error: error.message
    });
  }
};

/**
 * POST /api/reservations/:id/approve
 * Aprobar reserva (confirmed -> approved)
 */
export const approveReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const reservation = await Reservation.approve(id, userId);

    logger.info('Reservation approved:', {
      reservationId: id,
      approvedBy: userId
    });

    // Enviar email de aprobación
    try {
      await sendReservationApprovedEmail(reservation);
    } catch (emailError) {
      logger.error('Error sending approval email:', emailError);
    }

    res.json({
      success: true,
      message: 'Reserva aprobada exitosamente',
      data: reservation
    });
  } catch (error) {
    logger.error('Error approving reservation:', error);

    if (error.message === 'Reserva no encontrada' ||
        error.message.includes('No se puede aprobar')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al aprobar reserva',
      error: error.message
    });
  }
};

/**
 * POST /api/reservations/:id/cancel
 * Cancelar reserva
 */
export const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;
    const userId = req.user?.id;

    const reservation = await Reservation.cancel(id, userId, cancellation_reason);

    logger.info('Reservation cancelled:', {
      reservationId: id,
      cancelledBy: userId,
      reason: cancellation_reason
    });

    // Enviar email de cancelación
    try {
      await sendReservationCancelledEmail(reservation);
    } catch (emailError) {
      logger.error('Error sending cancellation email:', emailError);
    }

    res.json({
      success: true,
      message: 'Reserva cancelada exitosamente',
      data: reservation
    });
  } catch (error) {
    logger.error('Error cancelling reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar reserva',
      error: error.message
    });
  }
};

/**
 * POST /api/reservations/:id/reject
 * Rechazar reserva
 */
export const rejectReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;
    const userId = req.user?.id;

    if (!rejection_reason) {
      return res.status(400).json({
        success: false,
        message: 'El motivo de rechazo es requerido'
      });
    }

    const reservation = await Reservation.reject(id, userId, rejection_reason);

    logger.info('Reservation rejected:', {
      reservationId: id,
      rejectedBy: userId,
      reason: rejection_reason
    });

    // Enviar email de rechazo
    try {
      await sendReservationRejectedEmail(reservation);
    } catch (emailError) {
      logger.error('Error sending rejection email:', emailError);
    }

    res.json({
      success: true,
      message: 'Reserva rechazada',
      data: reservation
    });
  } catch (error) {
    logger.error('Error rejecting reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Error al rechazar reserva',
      error: error.message
    });
  }
};

/**
 * POST /api/reservations/:id/convert-to-evento
 * Convertir reserva a evento (vincular con evento creado)
 */
export const convertToEvento = async (req, res) => {
  try {
    const { id } = req.params;
    const { evento_id } = req.body;

    if (!evento_id) {
      return res.status(400).json({
        success: false,
        message: 'El ID del evento es requerido'
      });
    }

    const reservation = await Reservation.convertToEvento(id, evento_id);

    logger.info('Reservation converted to evento:', {
      reservationId: id,
      eventoId: evento_id
    });

    res.json({
      success: true,
      message: 'Reserva vinculada al evento exitosamente',
      data: reservation
    });
  } catch (error) {
    logger.error('Error converting reservation to evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al convertir reserva',
      error: error.message
    });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UTILIDADES Y REPORTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/reservations/requiring-action
 * Obtener reservas que requieren acción (pending o holds próximos a expirar)
 */
export const getRequiringAction = async (req, res) => {
  try {
    const { agency_id } = req.query;
    const reservations = await Reservation.getRequiringAction(agency_id);

    res.json({
      success: true,
      data: reservations
    });
  } catch (error) {
    logger.error('Error getting reservations requiring action:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reservas pendientes',
      error: error.message
    });
  }
};

/**
 * GET /api/reservations/stats/:agency_id
 * Obtener estadísticas de reservas por agencia
 */
export const getReservationStats = async (req, res) => {
  try {
    const { agency_id } = req.params;
    const stats = await Reservation.getStats(agency_id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting reservation stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

/**
 * GET /api/reservations/:id/history
 * Obtener historial de cambios de estado de una reserva
 */
export const getStatusHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await Reservation.getStatusHistory(id);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('Error getting status history:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial',
      error: error.message
    });
  }
};

/**
 * POST /api/reservations/expire-old-holds
 * Expirar holds antiguos (endpoint para cron jobs)
 */
export const expireOldHolds = async (req, res) => {
  try {
    const result = await Reservation.expireOldHolds();

    logger.info('Old holds expired:', { count: result.expired_count });

    res.json({
      success: true,
      message: `${result.expired_count} holds expirados`,
      data: result
    });
  } catch (error) {
    logger.error('Error expiring old holds:', error);
    res.status(500).json({
      success: false,
      message: 'Error al expirar holds',
      error: error.message
    });
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FUNCIONES AUXILIARES DE EMAIL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function sendReservationCreatedEmail(reservation) {
  const subject = `Nueva Reserva: ${reservation.reservation_number}`;
  const html = `
    <h2>Nueva Reserva Recibida</h2>
    <p>Se ha recibido una nueva solicitud de reserva.</p>
    <h3>Detalles:</h3>
    <ul>
      <li><strong>Número de Reserva:</strong> ${reservation.reservation_number}</li>
      <li><strong>Cliente:</strong> ${reservation.client_name}</li>
      <li><strong>Email:</strong> ${reservation.client_email}</li>
      <li><strong>Teléfono:</strong> ${reservation.client_phone}</li>
      <li><strong>Tipo de Evento:</strong> ${reservation.event_type}</li>
      <li><strong>Fecha:</strong> ${reservation.event_date}</li>
      <li><strong>Ubicación:</strong> ${reservation.event_location || 'Por definir'}</li>
    </ul>
    <p>Por favor, revisa la reserva en el panel de administración.</p>
  `;

  await sendEmail({
    to: reservation.client_email,
    subject,
    html
  });
}

async function sendReservationHoldEmail(reservation) {
  const expiryDate = new Date(reservation.hold_expires_at);
  const subject = `Reserva Temporal: ${reservation.reservation_number}`;
  const html = `
    <h2>Reserva Temporal Creada</h2>
    <p>Tu solicitud de reserva ha sido procesada como una reserva temporal.</p>
    <h3>Detalles:</h3>
    <ul>
      <li><strong>Número de Reserva:</strong> ${reservation.reservation_number}</li>
      <li><strong>Expira:</strong> ${expiryDate.toLocaleString()}</li>
      <li><strong>Tipo de Evento:</strong> ${reservation.event_type}</li>
      <li><strong>Fecha:</strong> ${reservation.event_date}</li>
    </ul>
    <p><strong>Importante:</strong> Esta reserva es temporal y expirará en ${reservation.hold_duration_minutes} minutos.</p>
    <p>Por favor, completa tu reserva antes de que expire.</p>
  `;

  await sendEmail({
    to: reservation.client_email,
    subject,
    html
  });
}

async function sendReservationConfirmedEmail(reservation) {
  const subject = `Reserva Confirmada: ${reservation.reservation_number}`;
  const html = `
    <h2>¡Reserva Confirmada!</h2>
    <p>Tu reserva ha sido confirmada por nuestro equipo.</p>
    <h3>Detalles:</h3>
    <ul>
      <li><strong>Número de Reserva:</strong> ${reservation.reservation_number}</li>
      <li><strong>Tipo de Evento:</strong> ${reservation.event_type}</li>
      <li><strong>Fecha:</strong> ${reservation.event_date}</li>
      <li><strong>Ubicación:</strong> ${reservation.event_location || 'Por definir'}</li>
    </ul>
    <p>Nos pondremos en contacto contigo pronto para finalizar los detalles.</p>
  `;

  await sendEmail({
    to: reservation.client_email,
    subject,
    html
  });
}

async function sendReservationApprovedEmail(reservation) {
  const subject = `Reserva Aprobada: ${reservation.reservation_number}`;
  const html = `
    <h2>¡Reserva Aprobada!</h2>
    <p>Tu reserva ha sido aprobada completamente.</p>
    <h3>Detalles Finales:</h3>
    <ul>
      <li><strong>Número de Reserva:</strong> ${reservation.reservation_number}</li>
      <li><strong>Tipo de Evento:</strong> ${reservation.event_type}</li>
      <li><strong>Fecha:</strong> ${reservation.event_date}</li>
      <li><strong>Ubicación:</strong> ${reservation.event_location}</li>
      ${reservation.estimated_price ? `<li><strong>Precio Estimado:</strong> $${reservation.estimated_price}</li>` : ''}
    </ul>
    <p>¡Todo listo! Estamos emocionados de ser parte de tu evento.</p>
  `;

  await sendEmail({
    to: reservation.client_email,
    subject,
    html
  });
}

async function sendReservationCancelledEmail(reservation) {
  const subject = `Reserva Cancelada: ${reservation.reservation_number}`;
  const html = `
    <h2>Reserva Cancelada</h2>
    <p>Tu reserva ha sido cancelada.</p>
    <h3>Detalles:</h3>
    <ul>
      <li><strong>Número de Reserva:</strong> ${reservation.reservation_number}</li>
      <li><strong>Tipo de Evento:</strong> ${reservation.event_type}</li>
      <li><strong>Fecha:</strong> ${reservation.event_date}</li>
      ${reservation.cancellation_reason ? `<li><strong>Motivo:</strong> ${reservation.cancellation_reason}</li>` : ''}
    </ul>
    <p>Si tienes preguntas, no dudes en contactarnos.</p>
  `;

  await sendEmail({
    to: reservation.client_email,
    subject,
    html
  });
}

async function sendReservationRejectedEmail(reservation) {
  const subject = `Reserva No Disponible: ${reservation.reservation_number}`;
  const html = `
    <h2>Reserva No Disponible</h2>
    <p>Lamentamos informarte que no podemos procesar tu reserva en las fechas solicitadas.</p>
    <h3>Detalles:</h3>
    <ul>
      <li><strong>Número de Reserva:</strong> ${reservation.reservation_number}</li>
      <li><strong>Fecha Solicitada:</strong> ${reservation.event_date}</li>
      ${reservation.rejection_reason ? `<li><strong>Motivo:</strong> ${reservation.rejection_reason}</li>` : ''}
    </ul>
    <p>Por favor, contáctanos para explorar fechas alternativas.</p>
  `;

  await sendEmail({
    to: reservation.client_email,
    subject,
    html
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default {
  // CRUD
  getAllReservations,
  getReservationById,
  getReservationByNumber,
  createReservation,
  updateReservation,
  deleteReservation,

  // Disponibilidad y Holds
  checkAvailability,
  createReservationHold,
  extendHold,

  // Workflow
  confirmReservation,
  approveReservation,
  cancelReservation,
  rejectReservation,
  convertToEvento,

  // Utilidades
  getRequiringAction,
  getReservationStats,
  getStatusHistory,
  expireOldHolds
};
