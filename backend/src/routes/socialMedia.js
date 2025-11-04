import express from 'express';
import {
  linkAccount,
  getLinkedAccounts,
  unlinkAccount,
  getSocialMetrics,
  refreshMetrics,
  getPlatformHistory,
  getSocialSummary,
  getInstagramData,
  getInstagramStatus,
  generateInstagramPDFReport,
  compareDJs,
  getInstagramHashtags,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getEngagementPredictions
} from '../controllers/socialMediaController.js';
import { shortCache, longCache } from '../middleware/cache.js';

const router = express.Router();

/**
 * Social Media Routes - Username-based (No OAuth)
 * Instagram routes use Unified Service (OAuth + Scraping)
 */

// ========== INSTAGRAM-SPECIFIC ROUTES (Unified Service) ==========

// GET /api/social-media/:djId/instagram
// Get Instagram data using unified service (auto-selects OAuth or Scraping)
// Query param: ?refresh=true to fetch fresh data
router.get('/:djId/instagram', shortCache, getInstagramData);

// GET /api/social-media/:djId/instagram/status
// Get Instagram connection status and method being used
router.get('/:djId/instagram/status', shortCache, getInstagramStatus);

// GET /api/social-media/:djId/instagram/report/pdf
// Generate and download PDF report for Instagram analytics
// No cache - always generate fresh PDF
router.get('/:djId/instagram/report/pdf', generateInstagramPDFReport);

// GET /api/social-media/:djId/instagram/hashtags
// Analyze hashtags from Instagram posts
router.get('/:djId/instagram/hashtags', longCache, getInstagramHashtags);

// GET /api/social-media/:djId/instagram/predictions
// Get AI-powered engagement predictions and recommendations
router.get('/:djId/instagram/predictions', longCache, getEngagementPredictions);

// ========== GENERAL ROUTES (All Platforms) ==========

// POST /api/social-media/compare
// Compare Instagram metrics across multiple DJs
router.post('/compare', compareDJs);

// POST /api/social-media/:djId/link
// Link a social media account by username
router.post('/:djId/link', linkAccount);

// GET /api/social-media/:djId/notifications
// Get notifications for a DJ
// Query params: ?limit=20&unreadOnly=true
router.get('/:djId/notifications', shortCache, getNotifications);

// GET /api/social-media/:djId/summary
// Get summary of all social media metrics
router.get('/:djId/summary', shortCache, getSocialSummary);

// GET /api/social-media/:djId/history/:platform
// Get historical data for a platform
// Query param: ?days=30 (default 30 days)
router.get('/:djId/history/:platform', longCache, getPlatformHistory);

// GET /api/social-media/:djId/metrics
// Get all social media metrics for a DJ
// Query param: ?refresh=true to fetch fresh data
router.get('/:djId/metrics', shortCache, getSocialMetrics);

// GET /api/social-media/:djId/linked
// Get all linked accounts for a DJ
router.get('/:djId/linked', shortCache, getLinkedAccounts);

// POST /api/social-media/:djId/refresh
// Force refresh metrics for all or specific platform
router.post('/:djId/refresh', refreshMetrics);

// DELETE /api/social-media/:djId/unlink/:platform
// Unlink a social media account
router.delete('/:djId/unlink/:platform', unlinkAccount);

// POST /api/social-media/:djId/notifications/:notificationId/read
// Mark specific notification as read
router.post('/:djId/notifications/:notificationId/read', markNotificationAsRead);

// POST /api/social-media/:djId/notifications/read-all
// Mark all notifications as read for a DJ
router.post('/:djId/notifications/read-all', markAllNotificationsAsRead);

export default router;
