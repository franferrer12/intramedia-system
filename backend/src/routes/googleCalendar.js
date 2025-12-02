/**
 * Google Calendar Routes
 * Sprint 5.2 - Google Calendar Integration
 */

import express from 'express';
import {
  getAuthUrl,
  handleOAuthCallback,
  getConnections,
  getConnectionById,
  updateConnection,
  deleteConnection,
  triggerSync,
  getSyncHistory,
  getSyncStats,
  getConflicts,
  resolveConflict,
  getEventMappings,
  checkEventConflicts,
} from '../controllers/googleCalendarController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/authorization.js';

const router = express.Router();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// OAUTH FLOW (Public callback)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/calendar/oauth/callback
 * Handle OAuth callback from Google
 */
router.get('/oauth/callback', handleOAuthCallback);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROTECTED ROUTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.use(authenticate);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// OAUTH & CONNECTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/calendar/oauth/auth-url
 * Get Google OAuth authorization URL
 */
router.get('/oauth/auth-url', getAuthUrl);

/**
 * GET /api/calendar/connections
 * Get all calendar connections for agency
 */
router.get('/connections', requirePermission('calendar', 'read'), getConnections);

/**
 * GET /api/calendar/connections/:id
 * Get calendar connection by ID
 */
router.get('/connections/:id', requirePermission('calendar', 'read'), getConnectionById);

/**
 * PUT /api/calendar/connections/:id
 * Update calendar connection settings
 */
router.put('/connections/:id', requirePermission('calendar', 'update'), updateConnection);

/**
 * DELETE /api/calendar/connections/:id
 * Delete/revoke calendar connection
 */
router.delete('/connections/:id', requirePermission('calendar', 'delete'), deleteConnection);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SYNC OPERATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * POST /api/calendar/connections/:id/sync
 * Trigger manual sync for connection
 */
router.post('/connections/:id/sync', requirePermission('calendar', 'update'), triggerSync);

/**
 * GET /api/calendar/connections/:id/sync-history
 * Get sync history for connection
 */
router.get('/connections/:id/sync-history', requirePermission('calendar', 'read'), getSyncHistory);

/**
 * GET /api/calendar/sync-stats
 * Get sync statistics for all connections
 */
router.get('/sync-stats', requirePermission('calendar', 'read'), getSyncStats);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFLICTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/calendar/conflicts
 * Get pending conflicts
 */
router.get('/conflicts', requirePermission('calendar', 'read'), getConflicts);

/**
 * POST /api/calendar/conflicts/:id/resolve
 * Resolve a conflict
 */
router.post('/conflicts/:id/resolve', requirePermission('calendar', 'update'), resolveConflict);

/**
 * POST /api/calendar/check-conflicts
 * Check for scheduling conflicts
 */
router.post('/check-conflicts', requirePermission('calendar', 'read'), checkEventConflicts);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EVENT MAPPINGS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/calendar/mappings
 * Get event mappings
 */
router.get('/mappings', requirePermission('calendar', 'read'), getEventMappings);

export default router;
