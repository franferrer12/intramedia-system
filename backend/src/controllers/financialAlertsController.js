import FinancialAlert from '../models/FinancialAlert.js';

/**
 * Get all alerts with optional filters
 */
export const getAllAlerts = async (req, res) => {
  try {
    const filters = {
      alert_type: req.query.alert_type,
      severity: req.query.severity,
      is_read: req.query.is_read === 'true' ? true : req.query.is_read === 'false' ? false : undefined,
      is_resolved: req.query.is_resolved === 'true' ? true : req.query.is_resolved === 'false' ? false : undefined,
      limit: parseInt(req.query.limit) || 100,
      offset: parseInt(req.query.offset) || 0
    };

    const alerts = await FinancialAlert.getAll(filters);

    res.json({
      success: true,
      data: alerts,
      count: alerts.length,
      filters: filters
    });
  } catch (error) {
    console.error('Error al obtener alertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener alertas',
      error: error.message
    });
  }
};

/**
 * Get active (unresolved) alerts
 */
export const getActiveAlerts = async (req, res) => {
  try {
    const alerts = await FinancialAlert.getActive();

    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    console.error('Error al obtener alertas activas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener alertas activas',
      error: error.message
    });
  }
};

/**
 * Get unread alerts
 */
export const getUnreadAlerts = async (req, res) => {
  try {
    const alerts = await FinancialAlert.getUnread();

    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    console.error('Error al obtener alertas no leídas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener alertas no leídas',
      error: error.message
    });
  }
};

/**
 * Get alerts summary
 */
export const getAlertsSummary = async (req, res) => {
  try {
    const summary = await FinancialAlert.getSummary();

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error al obtener resumen de alertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen de alertas',
      error: error.message
    });
  }
};

/**
 * Get dashboard stats
 */
export const getDashboardStats = async (req, res) => {
  try {
    const stats = await FinancialAlert.getDashboardStats();

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

/**
 * Get alert by ID
 */
export const getAlertById = async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await FinancialAlert.getById(id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alerta no encontrada'
      });
    }

    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    console.error('Error al obtener alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener alerta',
      error: error.message
    });
  }
};

/**
 * Mark alert as read
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await FinancialAlert.markAsRead(id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alerta no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Alerta marcada como leída',
      data: alert
    });
  } catch (error) {
    console.error('Error al marcar alerta como leída:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar alerta como leída',
      error: error.message
    });
  }
};

/**
 * Mark multiple alerts as read
 */
export const markMultipleAsRead = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de IDs'
      });
    }

    const alerts = await FinancialAlert.markMultipleAsRead(ids);

    res.json({
      success: true,
      message: `${alerts.length} alertas marcadas como leídas`,
      data: alerts
    });
  } catch (error) {
    console.error('Error al marcar alertas como leídas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar alertas como leídas',
      error: error.message
    });
  }
};

/**
 * Mark alert as resolved
 */
export const markAsResolved = async (req, res) => {
  try {
    const { id } = req.params;
    const resolvedBy = req.user?.id || null; // Assuming we have user info from auth middleware

    const alert = await FinancialAlert.markAsResolved(id, resolvedBy);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alerta no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Alerta marcada como resuelta',
      data: alert
    });
  } catch (error) {
    console.error('Error al marcar alerta como resuelta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar alerta como resuelta',
      error: error.message
    });
  }
};

/**
 * Mark multiple alerts as resolved
 */
export const markMultipleAsResolved = async (req, res) => {
  try {
    const { ids } = req.body;
    const resolvedBy = req.user?.id || null;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de IDs'
      });
    }

    const alerts = await FinancialAlert.markMultipleAsResolved(ids, resolvedBy);

    res.json({
      success: true,
      message: `${alerts.length} alertas marcadas como resueltas`,
      data: alerts
    });
  } catch (error) {
    console.error('Error al marcar alertas como resueltas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar alertas como resueltas',
      error: error.message
    });
  }
};

/**
 * Generate new alerts (run automated alert generation)
 */
export const generateAlerts = async (req, res) => {
  try {
    const results = await FinancialAlert.generateAlerts();

    res.json({
      success: true,
      message: 'Alertas generadas correctamente',
      data: results
    });
  } catch (error) {
    console.error('Error al generar alertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar alertas',
      error: error.message
    });
  }
};

/**
 * Get unread count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const count = await FinancialAlert.getUnreadCount();

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Error al obtener contador de alertas no leídas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener contador',
      error: error.message
    });
  }
};

/**
 * Get count by severity
 */
export const getCountBySeverity = async (req, res) => {
  try {
    const counts = await FinancialAlert.getCountBySeverity();

    res.json({
      success: true,
      data: counts
    });
  } catch (error) {
    console.error('Error al obtener contador por severidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener contador por severidad',
      error: error.message
    });
  }
};

/**
 * Delete alert (admin only)
 */
export const deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await FinancialAlert.delete(id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alerta no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Alerta eliminada correctamente',
      data: alert
    });
  } catch (error) {
    console.error('Error al eliminar alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar alerta',
      error: error.message
    });
  }
};

/**
 * Get alerts by cliente
 */
export const getAlertsByCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const alerts = await FinancialAlert.getByCliente(clienteId);

    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    console.error('Error al obtener alertas del cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener alertas del cliente',
      error: error.message
    });
  }
};

/**
 * Get alerts by DJ
 */
export const getAlertsByDJ = async (req, res) => {
  try {
    const { djId } = req.params;
    const alerts = await FinancialAlert.getByDJ(djId);

    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    console.error('Error al obtener alertas del DJ:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener alertas del DJ',
      error: error.message
    });
  }
};

/**
 * Get alerts by evento
 */
export const getAlertsByEvento = async (req, res) => {
  try {
    const { eventoId } = req.params;
    const alerts = await FinancialAlert.getByEvento(eventoId);

    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    console.error('Error al obtener alertas del evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener alertas del evento',
      error: error.message
    });
  }
};
