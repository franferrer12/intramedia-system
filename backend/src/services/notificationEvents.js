/**
 * Notification Events Service
 * Sistema de eventos para disparar notificaciones automáticamente
 */

import { EventEmitter } from 'events';
import Notification from '../models/Notification.js';
import logger from '../utils/logger.js';

class NotificationEvents extends EventEmitter {
  constructor() {
    super();
    this.setupListeners();
  }

  /**
   * Configurar listeners para eventos
   */
  setupListeners() {
    // Eventos de Quotations
    this.on('quotation:created', this.handleQuotationCreated.bind(this));
    this.on('quotation:sent', this.handleQuotationSent.bind(this));
    this.on('quotation:accepted', this.handleQuotationAccepted.bind(this));
    this.on('quotation:rejected', this.handleQuotationRejected.bind(this));
    this.on('quotation:expired', this.handleQuotationExpired.bind(this));
    this.on('quotation:converted', this.handleQuotationConverted.bind(this));

    // Eventos de Eventos
    this.on('evento:created', this.handleEventoCreated.bind(this));
    this.on('evento:updated', this.handleEventoUpdated.bind(this));
    this.on('evento:cancelled', this.handleEventoCancelled.bind(this));
    this.on('evento:confirmed', this.handleEventoConfirmed.bind(this));

    // Eventos de Pagos
    this.on('payment:received', this.handlePaymentReceived.bind(this));
    this.on('payment:pending', this.handlePaymentPending.bind(this));
    this.on('payment:late', this.handlePaymentLate.bind(this));

    // Eventos de Contratos
    this.on('contract:signed', this.handleContractSigned.bind(this));
    this.on('contract:expired', this.handleContractExpired.bind(this));
    this.on('contract:expiring_soon', this.handleContractExpiringSoon.bind(this));

    // Eventos de Leads
    this.on('lead:new', this.handleLeadNew.bind(this));
    this.on('lead:converted', this.handleLeadConverted.bind(this));
    this.on('lead:lost', this.handleLeadLost.bind(this));

    // Eventos del Sistema
    this.on('system:error', this.handleSystemError.bind(this));
    this.on('system:maintenance', this.handleSystemMaintenance.bind(this));

    logger.info('Notification event listeners configured');
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HANDLERS - QUOTATIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async handleQuotationCreated(data) {
    try {
      const { quotation, user_id, agency_id } = data;

      await Notification.create({
        user_id,
        agency_id,
        type: 'quotation',
        title: `Nueva cotización creada: ${quotation.quotation_number}`,
        message: `Se ha creado la cotización ${quotation.quotation_number} para ${quotation.contact_name || 'cliente'}`,
        priority: 'normal',
        action_url: `/quotations/${quotation.id}`,
        action_text: 'Ver cotización',
        related_entity_type: 'quotation',
        related_entity_id: quotation.id
      });

      logger.info('Notification created for quotation:created', { quotationId: quotation.id });
    } catch (error) {
      logger.error('Error handling quotation:created event:', error);
    }
  }

  async handleQuotationSent(data) {
    try {
      const { quotation, user_id, agency_id } = data;

      await Notification.createFromTemplate(
        'quotation_sent',
        {
          quotation_number: quotation.quotation_number,
          client_name: quotation.contact_name,
          email: quotation.contact_email,
          entity_type: 'quotation',
          entity_id: quotation.id
        },
        { user_id, agency_id }
      );

      logger.info('Notification created for quotation:sent', { quotationId: quotation.id });
    } catch (error) {
      logger.error('Error handling quotation:sent event:', error);
    }
  }

  async handleQuotationAccepted(data) {
    try {
      const { quotation, user_id, agency_id } = data;

      await Notification.createFromTemplate(
        'quotation_accepted',
        {
          quotation_number: quotation.quotation_number,
          client_name: quotation.contact_name,
          amount: `€${quotation.total}`,
          entity_type: 'quotation',
          entity_id: quotation.id
        },
        { user_id, agency_id }
      );

      logger.info('Notification created for quotation:accepted', { quotationId: quotation.id });
    } catch (error) {
      logger.error('Error handling quotation:accepted event:', error);
    }
  }

  async handleQuotationRejected(data) {
    try {
      const { quotation, user_id, agency_id, rejection_reason } = data;

      await Notification.create({
        user_id,
        agency_id,
        type: 'warning',
        title: `Cotización rechazada: ${quotation.quotation_number}`,
        message: `La cotización ${quotation.quotation_number} ha sido rechazada${rejection_reason ? `: ${rejection_reason}` : ''}`,
        priority: 'high',
        action_url: `/quotations/${quotation.id}`,
        action_text: 'Ver detalles',
        related_entity_type: 'quotation',
        related_entity_id: quotation.id
      });

      logger.info('Notification created for quotation:rejected', { quotationId: quotation.id });
    } catch (error) {
      logger.error('Error handling quotation:rejected event:', error);
    }
  }

  async handleQuotationExpired(data) {
    try {
      const { quotation, user_id, agency_id } = data;

      await Notification.create({
        user_id,
        agency_id,
        type: 'warning',
        title: `Cotización expirada: ${quotation.quotation_number}`,
        message: `La cotización ${quotation.quotation_number} ha expirado sin ser aceptada`,
        priority: 'normal',
        action_url: `/quotations/${quotation.id}`,
        action_text: 'Ver cotización',
        related_entity_type: 'quotation',
        related_entity_id: quotation.id
      });

      logger.info('Notification created for quotation:expired', { quotationId: quotation.id });
    } catch (error) {
      logger.error('Error handling quotation:expired event:', error);
    }
  }

  async handleQuotationConverted(data) {
    try {
      const { quotation, evento, user_id, agency_id } = data;

      await Notification.create({
        user_id,
        agency_id,
        type: 'success',
        title: `Cotización convertida a evento: ${quotation.quotation_number}`,
        message: `La cotización ${quotation.quotation_number} se ha convertido exitosamente al evento "${evento.nombre}"`,
        priority: 'high',
        action_url: `/eventos/${evento.id}`,
        action_text: 'Ver evento',
        related_entity_type: 'evento',
        related_entity_id: evento.id
      });

      logger.info('Notification created for quotation:converted', {
        quotationId: quotation.id,
        eventoId: evento.id
      });
    } catch (error) {
      logger.error('Error handling quotation:converted event:', error);
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HANDLERS - EVENTOS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async handleEventoCreated(data) {
    try {
      const { evento, dj_id, agency_id, user_id } = data;

      await Notification.createFromTemplate(
        'evento_created',
        {
          event_name: evento.nombre,
          event_date: new Date(evento.fecha).toLocaleDateString('es-ES'),
          location: evento.ubicacion || 'Por confirmar',
          dj_name: evento.dj_nombre || 'Por asignar',
          entity_type: 'evento',
          entity_id: evento.id
        },
        { user_id, dj_id, agency_id }
      );

      logger.info('Notification created for evento:created', { eventoId: evento.id });
    } catch (error) {
      logger.error('Error handling evento:created event:', error);
    }
  }

  async handleEventoUpdated(data) {
    try {
      const { evento, dj_id, agency_id, user_id, changes } = data;

      const changesList = Object.keys(changes).join(', ');

      await Notification.create({
        user_id,
        dj_id,
        agency_id,
        type: 'info',
        title: `Evento actualizado: ${evento.nombre}`,
        message: `Se han actualizado los siguientes campos: ${changesList}`,
        priority: 'normal',
        action_url: `/eventos/${evento.id}`,
        action_text: 'Ver evento',
        related_entity_type: 'evento',
        related_entity_id: evento.id
      });

      logger.info('Notification created for evento:updated', { eventoId: evento.id });
    } catch (error) {
      logger.error('Error handling evento:updated event:', error);
    }
  }

  async handleEventoCancelled(data) {
    try {
      const { evento, dj_id, agency_id, user_id, reason } = data;

      await Notification.create({
        user_id,
        dj_id,
        agency_id,
        type: 'error',
        title: `Evento cancelado: ${evento.nombre}`,
        message: `El evento "${evento.nombre}" ha sido cancelado${reason ? `: ${reason}` : ''}`,
        priority: 'urgent',
        action_url: `/eventos/${evento.id}`,
        action_text: 'Ver detalles',
        related_entity_type: 'evento',
        related_entity_id: evento.id
      });

      logger.info('Notification created for evento:cancelled', { eventoId: evento.id });
    } catch (error) {
      logger.error('Error handling evento:cancelled event:', error);
    }
  }

  async handleEventoConfirmed(data) {
    try {
      const { evento, dj_id, agency_id, user_id } = data;

      await Notification.create({
        user_id,
        dj_id,
        agency_id,
        type: 'success',
        title: `Evento confirmado: ${evento.nombre}`,
        message: `El evento "${evento.nombre}" ha sido confirmado para el ${new Date(evento.fecha).toLocaleDateString('es-ES')}`,
        priority: 'high',
        action_url: `/eventos/${evento.id}`,
        action_text: 'Ver evento',
        related_entity_type: 'evento',
        related_entity_id: evento.id
      });

      logger.info('Notification created for evento:confirmed', { eventoId: evento.id });
    } catch (error) {
      logger.error('Error handling evento:confirmed event:', error);
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HANDLERS - PAYMENTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async handlePaymentReceived(data) {
    try {
      const { payment, evento, user_id, agency_id } = data;

      await Notification.createFromTemplate(
        'payment_received',
        {
          amount: `€${payment.amount}`,
          event_name: evento?.nombre || 'evento',
          payment_date: new Date(payment.date).toLocaleDateString('es-ES'),
          entity_type: 'payment',
          entity_id: payment.id
        },
        { user_id, agency_id }
      );

      logger.info('Notification created for payment:received', { paymentId: payment.id });
    } catch (error) {
      logger.error('Error handling payment:received event:', error);
    }
  }

  async handlePaymentPending(data) {
    try {
      const { payment, evento, user_id, agency_id } = data;

      await Notification.create({
        user_id,
        agency_id,
        type: 'warning',
        title: `Pago pendiente: ${evento?.nombre || 'evento'}`,
        message: `Hay un pago de €${payment.amount} pendiente para el evento "${evento?.nombre}"`,
        priority: 'high',
        action_url: `/financial/payments/${payment.id}`,
        action_text: 'Ver pago',
        related_entity_type: 'payment',
        related_entity_id: payment.id
      });

      logger.info('Notification created for payment:pending', { paymentId: payment.id });
    } catch (error) {
      logger.error('Error handling payment:pending event:', error);
    }
  }

  async handlePaymentLate(data) {
    try {
      const { payment, evento, user_id, agency_id, days_late } = data;

      await Notification.create({
        user_id,
        agency_id,
        type: 'error',
        title: `Pago atrasado: ${evento?.nombre || 'evento'}`,
        message: `El pago de €${payment.amount} lleva ${days_late} días de retraso`,
        priority: 'urgent',
        action_url: `/financial/payments/${payment.id}`,
        action_text: 'Gestionar pago',
        related_entity_type: 'payment',
        related_entity_id: payment.id
      });

      logger.info('Notification created for payment:late', { paymentId: payment.id });
    } catch (error) {
      logger.error('Error handling payment:late event:', error);
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HANDLERS - CONTRACTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async handleContractSigned(data) {
    try {
      const { contract, user_id, agency_id } = data;

      await Notification.create({
        user_id,
        agency_id,
        type: 'success',
        title: `Contrato firmado: ${contract.contract_number}`,
        message: `El contrato ${contract.contract_number} ha sido firmado exitosamente`,
        priority: 'high',
        action_url: `/contracts/${contract.id}`,
        action_text: 'Ver contrato',
        related_entity_type: 'contract',
        related_entity_id: contract.id
      });

      logger.info('Notification created for contract:signed', { contractId: contract.id });
    } catch (error) {
      logger.error('Error handling contract:signed event:', error);
    }
  }

  async handleContractExpired(data) {
    try {
      const { contract, user_id, agency_id } = data;

      await Notification.create({
        user_id,
        agency_id,
        type: 'warning',
        title: `Contrato expirado: ${contract.contract_number}`,
        message: `El contrato ${contract.contract_number} ha expirado`,
        priority: 'high',
        action_url: `/contracts/${contract.id}`,
        action_text: 'Renovar contrato',
        related_entity_type: 'contract',
        related_entity_id: contract.id
      });

      logger.info('Notification created for contract:expired', { contractId: contract.id });
    } catch (error) {
      logger.error('Error handling contract:expired event:', error);
    }
  }

  async handleContractExpiringSoon(data) {
    try {
      const { contract, user_id, agency_id, days_until_expiration } = data;

      await Notification.create({
        user_id,
        agency_id,
        type: 'warning',
        title: `Contrato próximo a expirar: ${contract.contract_number}`,
        message: `El contrato ${contract.contract_number} expira en ${days_until_expiration} días`,
        priority: 'high',
        action_url: `/contracts/${contract.id}`,
        action_text: 'Ver contrato',
        related_entity_type: 'contract',
        related_entity_id: contract.id
      });

      logger.info('Notification created for contract:expiring_soon', { contractId: contract.id });
    } catch (error) {
      logger.error('Error handling contract:expiring_soon event:', error);
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HANDLERS - LEADS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async handleLeadNew(data) {
    try {
      const { lead, user_id, agency_id } = data;

      await Notification.createFromTemplate(
        'lead_new',
        {
          lead_name: lead.nombre,
          lead_email: lead.email,
          lead_phone: lead.telefono || 'No proporcionado',
          email: lead.email,
          entity_type: 'lead',
          entity_id: lead.id
        },
        { user_id, agency_id }
      );

      logger.info('Notification created for lead:new', { leadId: lead.id });
    } catch (error) {
      logger.error('Error handling lead:new event:', error);
    }
  }

  async handleLeadConverted(data) {
    try {
      const { lead, cliente, user_id, agency_id } = data;

      await Notification.create({
        user_id,
        agency_id,
        type: 'success',
        title: `Lead convertido: ${lead.nombre}`,
        message: `El lead "${lead.nombre}" ha sido convertido a cliente exitosamente`,
        priority: 'high',
        action_url: `/clientes/${cliente.id}`,
        action_text: 'Ver cliente',
        related_entity_type: 'cliente',
        related_entity_id: cliente.id
      });

      logger.info('Notification created for lead:converted', { leadId: lead.id });
    } catch (error) {
      logger.error('Error handling lead:converted event:', error);
    }
  }

  async handleLeadLost(data) {
    try {
      const { lead, user_id, agency_id, reason } = data;

      await Notification.create({
        user_id,
        agency_id,
        type: 'info',
        title: `Lead perdido: ${lead.nombre}`,
        message: `El lead "${lead.nombre}" se ha marcado como perdido${reason ? `: ${reason}` : ''}`,
        priority: 'low',
        action_url: `/leads/${lead.id}`,
        action_text: 'Ver detalles',
        related_entity_type: 'lead',
        related_entity_id: lead.id
      });

      logger.info('Notification created for lead:lost', { leadId: lead.id });
    } catch (error) {
      logger.error('Error handling lead:lost event:', error);
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HANDLERS - SYSTEM
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  async handleSystemError(data) {
    try {
      const { error, context, user_id, agency_id } = data;

      await Notification.create({
        user_id,
        agency_id,
        type: 'error',
        title: 'Error del sistema',
        message: `Ha ocurrido un error: ${error.message || 'Error desconocido'}`,
        priority: 'urgent',
        related_entity_type: 'system',
        related_entity_id: null
      });

      logger.info('Notification created for system:error');
    } catch (error) {
      logger.error('Error handling system:error event:', error);
    }
  }

  async handleSystemMaintenance(data) {
    try {
      const { scheduled_at, duration, user_id, agency_id } = data;

      await Notification.create({
        user_id,
        agency_id,
        type: 'warning',
        title: 'Mantenimiento programado',
        message: `El sistema estará en mantenimiento el ${new Date(scheduled_at).toLocaleDateString('es-ES')} durante aproximadamente ${duration}`,
        priority: 'high',
        related_entity_type: 'system',
        related_entity_id: null
      });

      logger.info('Notification created for system:maintenance');
    } catch (error) {
      logger.error('Error handling system:maintenance event:', error);
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // UTILITY METHODS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Emitir evento con manejo de errores
   * @param {string} event - Nombre del evento
   * @param {Object} data - Datos del evento
   */
  emitSafe(event, data) {
    try {
      this.emit(event, data);
    } catch (error) {
      logger.error(`Error emitting event ${event}:`, error);
    }
  }

  /**
   * Obtener lista de eventos disponibles
   * @returns {Array<string>} Lista de eventos
   */
  getAvailableEvents() {
    return this.eventNames();
  }
}

// Exportar instancia singleton
const notificationEvents = new NotificationEvents();
export default notificationEvents;
