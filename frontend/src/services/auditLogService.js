import api from './api';

/**
 * Audit Log Service
 * Manages audit log queries and reports
 */

/**
 * Get audit logs with filters
 * @param {Object} filters - Filter criteria
 * @param {Object} pagination - Pagination params
 * @returns {Promise<Object>} Audit logs data
 */
export const getAuditLogs = async (filters = {}, pagination = {}) => {
  const params = {
    ...filters,
    ...pagination
  };

  const response = await api.get('/audit-logs', { params });
  return response.data;
};

/**
 * Get audit log by ID
 * @param {number} id - Audit log ID
 * @returns {Promise<Object>} Audit log
 */
export const getAuditLogById = async (id) => {
  const response = await api.get(`/audit-logs/${id}`);
  return response.data;
};

/**
 * Get entity audit trail
 * @param {string} entityType - Entity type
 * @param {number} entityId - Entity ID
 * @param {number} limit - Max results
 * @returns {Promise<Array>} Audit trail
 */
export const getEntityAuditTrail = async (entityType, entityId, limit = 50) => {
  const response = await api.get(`/audit-logs/entity/${entityType}/${entityId}`, {
    params: { limit }
  });
  return response.data;
};

/**
 * Get recent activity (last 7 days)
 * @param {number} limit - Max results
 * @returns {Promise<Array>} Recent activity
 */
export const getRecentActivity = async (limit = 100) => {
  const response = await api.get('/audit-logs/recent', {
    params: { limit }
  });
  return response.data;
};

/**
 * Get failed operations
 * @param {number} limit - Max results
 * @returns {Promise<Array>} Failed operations
 */
export const getFailedOperations = async (limit = 100) => {
  const response = await api.get('/audit-logs/failed', {
    params: { limit }
  });
  return response.data;
};

/**
 * Get security events
 * @param {number} limit - Max results
 * @returns {Promise<Array>} Security events
 */
export const getSecurityEvents = async (limit = 100) => {
  const response = await api.get('/audit-logs/security', {
    params: { limit }
  });
  return response.data;
};

/**
 * Get user activity summary
 * @param {number} userId - User ID (optional)
 * @returns {Promise<Object>} Activity summary
 */
export const getUserActivitySummary = async (userId = null) => {
  const url = userId ? `/audit-logs/users/${userId}/summary` : '/audit-logs/users/summary';
  const response = await api.get(url);
  return response.data;
};

/**
 * Get audit statistics
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Statistics
 */
export const getAuditStatistics = async (startDate = null, endDate = null) => {
  const params = {};
  if (startDate) params.startDate = startDate.toISOString();
  if (endDate) params.endDate = endDate.toISOString();

  const response = await api.get('/audit-logs/statistics', { params });
  return response.data;
};

/**
 * Export audit logs to CSV
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Blob>} CSV file
 */
export const exportAuditLogs = async (filters = {}) => {
  const response = await api.get('/audit-logs/export', {
    params: filters,
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Cleanup old audit logs (Admin only)
 * @param {number} retentionDays - Days to retain
 * @returns {Promise<Object>} Cleanup result
 */
export const cleanupAuditLogs = async (retentionDays = 365) => {
  const response = await api.post('/audit-logs/cleanup', {retentionDays
  });
  return response.data;
};

/**
 * Get my activity (current user)
 * @param {Object} filters - Filter criteria
 * @param {Object} pagination - Pagination params
 * @returns {Promise<Object>} My activity
 */
export const getMyActivity = async (filters = {}, pagination = {}) => {
  const params = {
    ...filters,
    ...pagination
  };

  const response = await api.get('/audit-logs/me', { params });
  return response.data;
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
