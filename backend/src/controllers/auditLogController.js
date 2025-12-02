import AuditLog from '../models/AuditLog.js';
import { logAudit } from '../middleware/auditLogger.js';

/**
 * Audit Log Controller
 * Handles audit log queries and reports
 */

/**
 * Get audit logs with filters
 * GET /api/audit-logs
 */
export const getAuditLogs = async (req, res) => {
  try {
    const filters = {
      eventType: req.query.eventType,
      entityType: req.query.entityType,
      entityId: req.query.entityId ? parseInt(req.query.entityId) : null,
      userId: req.query.userId ? parseInt(req.query.userId) : null,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      search: req.query.search,
      ipAddress: req.query.ipAddress
    };

    const pagination = {
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 50,
      sortBy: req.query.sortBy || 'created_at',
      sortOrder: req.query.sortOrder || 'DESC'
    };

    const result = await AuditLog.find(filters, pagination);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching audit logs',
      error: error.message
    });
  }
};

/**
 * Get audit log by ID
 * GET /api/audit-logs/:id
 */
export const getAuditLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const auditLog = await AuditLog.findById(id);

    if (!auditLog) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      });
    }

    res.json({
      success: true,
      data: auditLog
    });
  } catch (error) {
    console.error('Get audit log by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching audit log',
      error: error.message
    });
  }
};

/**
 * Get entity audit trail
 * GET /api/audit-logs/entity/:entityType/:entityId
 */
export const getEntityAuditTrail = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;

    const trail = await AuditLog.getEntityTrail(entityType, parseInt(entityId), limit);

    res.json({
      success: true,
      data: trail,
      meta: {
        entityType,
        entityId: parseInt(entityId),
        count: trail.length
      }
    });
  } catch (error) {
    console.error('Get entity audit trail error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching entity audit trail',
      error: error.message
    });
  }
};

/**
 * Get recent activity
 * GET /api/audit-logs/recent
 */
export const getRecentActivity = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    const activity = await AuditLog.getRecentActivity(limit);

    res.json({
      success: true,
      data: activity,
      meta: {
        count: activity.length,
        period: 'Last 7 days'
      }
    });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent activity',
      error: error.message
    });
  }
};

/**
 * Get failed operations
 * GET /api/audit-logs/failed
 */
export const getFailedOperations = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    const failed = await AuditLog.getFailedOperations(limit);

    res.json({
      success: true,
      data: failed,
      meta: {
        count: failed.length
      }
    });
  } catch (error) {
    console.error('Get failed operations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching failed operations',
      error: error.message
    });
  }
};

/**
 * Get security events
 * GET /api/audit-logs/security
 */
export const getSecurityEvents = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    const events = await AuditLog.getSecurityEvents(limit);

    res.json({
      success: true,
      data: events,
      meta: {
        count: events.length
      }
    });
  } catch (error) {
    console.error('Get security events error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching security events',
      error: error.message
    });
  }
};

/**
 * Get user activity summary
 * GET /api/audit-logs/users/summary
 * GET /api/audit-logs/users/:userId/summary
 */
export const getUserActivitySummary = async (req, res) => {
  try {
    const userId = req.params.userId ? parseInt(req.params.userId) : null;
    const summary = await AuditLog.getUserActivitySummary(userId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get user activity summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user activity summary',
      error: error.message
    });
  }
};

/**
 * Get audit statistics
 * GET /api/audit-logs/statistics
 */
export const getAuditStatistics = async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    const stats = await AuditLog.getStatistics(startDate, endDate);

    res.json({
      success: true,
      data: stats,
      meta: {
        period: {
          start: startDate || 'Last 30 days',
          end: endDate || 'Now'
        }
      }
    });
  } catch (error) {
    console.error('Get audit statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching audit statistics',
      error: error.message
    });
  }
};

/**
 * Export audit logs to CSV
 * GET /api/audit-logs/export
 */
export const exportAuditLogs = async (req, res) => {
  try {
    const filters = {
      eventType: req.query.eventType,
      entityType: req.query.entityType,
      entityId: req.query.entityId ? parseInt(req.query.entityId) : null,
      userId: req.query.userId ? parseInt(req.query.userId) : null,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      search: req.query.search
    };

    const csvData = await AuditLog.exportToCSV(filters);

    // Convert to CSV format
    if (csvData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No audit logs found for export'
      });
    }

    const headers = Object.keys(csvData[0]);
    const csvRows = [
      headers.join(','),
      ...csvData.map(row =>
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes
          const escaped = String(value).replace(/"/g, '""');
          return value !== null && value !== undefined ? `"${escaped}"` : '';
        }).join(',')
      )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
    res.send(csvRows);

    // Log the export action
    await logAudit(req, {
      eventType: 'EXPORT',
      action: `Exported audit logs (${csvData.length} records)`,
      metadata: { filters, count: csvData.length }
    });
  } catch (error) {
    console.error('Export audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting audit logs',
      error: error.message
    });
  }
};

/**
 * Cleanup old audit logs (Admin only)
 * POST /api/audit-logs/cleanup
 */
export const cleanupAuditLogs = async (req, res) => {
  try {
    // Verify admin access
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can cleanup audit logs'
      });
    }

    const retentionDays = req.body.retentionDays || 365;
    const deletedCount = await AuditLog.cleanup(retentionDays);

    // Log the cleanup action
    await logAudit(req, {
      eventType: 'DELETE',
      action: `Cleaned up ${deletedCount} old audit logs (retention: ${retentionDays} days)`,
      metadata: { retentionDays, deletedCount }
    });

    res.json({
      success: true,
      message: `Deleted ${deletedCount} old audit log entries`,
      data: {
        deletedCount,
        retentionDays
      }
    });
  } catch (error) {
    console.error('Cleanup audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cleaning up audit logs',
      error: error.message
    });
  }
};

/**
 * Get my audit activity (current user)
 * GET /api/audit-logs/me
 */
export const getMyActivity = async (req, res) => {
  try {
    const userId = req.user.id;

    const filters = {
      userId,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const pagination = {
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 50,
      sortBy: 'created_at',
      sortOrder: 'DESC'
    };

    const result = await AuditLog.find(filters, pagination);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get my activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your activity',
      error: error.message
    });
  }
};

export default {
  getAuditLogs,
  getAuditLogById,
  getEntityAuditTrail,
  getRecentActivity,
  getFailedOperations,
  getSecurityEvents,
  getUserActivitySummary,
  getAuditStatistics,
  exportAuditLogs,
  cleanupAuditLogs,
  getMyActivity
};
