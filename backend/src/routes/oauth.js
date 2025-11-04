import express from 'express';
import {
  initiateInstagramAuth,
  instagramCallback,
  disconnectInstagram,
  getInstagramStatus,
  getInstagramAnalytics,
  refreshInstagramToken
} from '../controllers/oauthController.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { shortCache } from '../middleware/cache.js';

const router = express.Router();

/**
 * @route   GET /api/oauth/instagram/authorize
 * @desc    Initiate Instagram OAuth flow
 * @access  Public (requires djId query param)
 */
router.get('/instagram/authorize', initiateInstagramAuth);

/**
 * @route   GET /api/oauth/instagram/callback
 * @desc    Handle Instagram OAuth callback
 * @access  Public (called by Instagram)
 */
router.get('/instagram/callback', instagramCallback);

/**
 * @route   GET /api/oauth/instagram/status/:djId
 * @desc    Get Instagram connection status for a DJ
 * @access  Public
 * @cache   shortCache (1 min)
 */
router.get('/instagram/status/:djId', shortCache, getInstagramStatus);

/**
 * @route   GET /api/oauth/instagram/analytics/:djId
 * @desc    Get Instagram analytics from OAuth connection
 * @access  Public (optionally authenticated for better permissions)
 * @cache   shortCache (1 min)
 */
router.get('/instagram/analytics/:djId', optionalAuthenticate, shortCache, getInstagramAnalytics);

/**
 * @route   DELETE /api/oauth/instagram/disconnect/:djId
 * @desc    Disconnect Instagram OAuth connection
 * @access  Private (DJ or Admin only)
 */
router.delete('/instagram/disconnect/:djId', authenticate, disconnectInstagram);

/**
 * @route   POST /api/oauth/instagram/refresh/:djId
 * @desc    Manually refresh Instagram token
 * @access  Private (DJ or Admin only)
 */
router.post('/instagram/refresh/:djId', authenticate, refreshInstagramToken);

export default router;
