import express from 'express';
import {
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
} from '../controllers/auditLogController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route GET /api/audit-logs
 * @desc Get audit logs with filters and pagination
 * @access Private (ADMIN only)
 * @query eventType, entityType, entityId, userId, status, startDate, endDate, search, page, limit, sortBy, sortOrder
 */
router.get('/', requireRole(['ADMIN']), getAuditLogs);

/**
 * @route GET /api/audit-logs/me
 * @desc Get current user's activity
 * @access Private
 * @query startDate, endDate, page, limit
 */
router.get('/me', getMyActivity);

/**
 * @route GET /api/audit-logs/recent
 * @desc Get recent activity (last 7 days)
 * @access Private (ADMIN only)
 * @query limit
 */
router.get('/recent', requireRole(['ADMIN']), getRecentActivity);

/**
 * @route GET /api/audit-logs/failed
 * @desc Get failed operations
 * @access Private (ADMIN only)
 * @query limit
 */
router.get('/failed', requireRole(['ADMIN']), getFailedOperations);

/**
 * @route GET /api/audit-logs/security
 * @desc Get security events
 * @access Private (ADMIN only)
 * @query limit
 */
router.get('/security', requireRole(['ADMIN']), getSecurityEvents);

/**
 * @route GET /api/audit-logs/statistics
 * @desc Get audit statistics
 * @access Private (ADMIN only)
 * @query startDate, endDate
 */
router.get('/statistics', requireRole(['ADMIN']), getAuditStatistics);

/**
 * @route GET /api/audit-logs/users/summary
 * @desc Get all users activity summary
 * @access Private (ADMIN only)
 */
router.get('/users/summary', requireRole(['ADMIN']), getUserActivitySummary);

/**
 * @route GET /api/audit-logs/users/:userId/summary
 * @desc Get specific user activity summary
 * @access Private (ADMIN only)
 */
router.get('/users/:userId/summary', requireRole(['ADMIN']), getUserActivitySummary);

/**
 * @route GET /api/audit-logs/export
 * @desc Export audit logs to CSV
 * @access Private (ADMIN only)
 * @query eventType, entityType, entityId, userId, status, startDate, endDate, search
 */
router.get('/export', requireRole(['ADMIN']), exportAuditLogs);

/**
 * @route GET /api/audit-logs/entity/:entityType/:entityId
 * @desc Get audit trail for a specific entity
 * @access Private (ADMIN only)
 * @query limit
 */
router.get('/entity/:entityType/:entityId', requireRole(['ADMIN']), getEntityAuditTrail);

/**
 * @route GET /api/audit-logs/:id
 * @desc Get audit log by ID
 * @access Private (ADMIN only)
 */
router.get('/:id', requireRole(['ADMIN']), getAuditLogById);

/**
 * @route POST /api/audit-logs/cleanup
 * @desc Cleanup old audit logs
 * @access Private (ADMIN only)
 * @body retentionDays (optional, default 365)
 */
router.post('/cleanup', requireRole(['ADMIN']), cleanupAuditLogs);

export default router;
