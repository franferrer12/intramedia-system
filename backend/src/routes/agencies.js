import express from 'express';
import {
  getAgencyProfile,
  updateAgencyProfile,
  getAgencyStats,
  getAgencyDJs,
  getAvailableDJs,
  addDJToAgency,
  removeDJFromAgency,
  updateDJRelation
} from '../controllers/agencyController.js';
import { authenticate, requireUserType } from '../middleware/authMiddleware.js';
import { shortCache, longCache } from '../middleware/cache.js';

const router = express.Router();

/**
 * Agency Routes - Multi-Tenant System
 * All routes require authentication and agency user type
 */

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route   GET /api/agencies/profile
 * @desc    Get current agency profile
 * @access  Private (Agency only)
 * @cache   shortCache (1 min)
 */
router.get('/profile', requireUserType('agency', 'admin'), shortCache, getAgencyProfile);

/**
 * @route   PUT /api/agencies/profile
 * @desc    Update agency profile
 * @access  Private (Agency only)
 */
router.put('/profile', requireUserType('agency'), updateAgencyProfile);

/**
 * @route   GET /api/agencies/stats
 * @desc    Get agency dashboard statistics
 * @access  Private (Agency only)
 * @cache   longCache (15 min)
 */
router.get('/stats', requireUserType('agency', 'admin'), longCache, getAgencyStats);

/**
 * @route   GET /api/agencies/available-djs
 * @desc    Get available DJs (not assigned to any agency)
 * @access  Private (Agency only)
 * @cache   shortCache (1 min)
 */
router.get('/available-djs', requireUserType('agency', 'admin'), shortCache, getAvailableDJs);

/**
 * @route   GET /api/agencies/djs
 * @desc    Get all DJs managed by agency
 * @query   include_inactive - Include inactive DJ relationships (optional)
 * @access  Private (Agency only)
 * @cache   shortCache (1 min)
 */
router.get('/djs', requireUserType('agency', 'admin'), shortCache, getAgencyDJs);

/**
 * @route   POST /api/agencies/djs
 * @desc    Add DJ to agency
 * @body    djId, role, commissionRate, contractStartDate, contractEndDate
 * @access  Private (Agency only)
 */
router.post('/djs', requireUserType('agency'), addDJToAgency);

/**
 * @route   PUT /api/agencies/djs/:djId
 * @desc    Update DJ relationship (commission, role, contract)
 * @params  djId - DJ ID
 * @body    role, commissionRate, contractStartDate, contractEndDate
 * @access  Private (Agency only)
 */
router.put('/djs/:djId', requireUserType('agency'), updateDJRelation);

/**
 * @route   DELETE /api/agencies/djs/:djId
 * @desc    Remove DJ from agency
 * @params  djId - DJ ID
 * @access  Private (Agency only)
 */
router.delete('/djs/:djId', requireUserType('agency'), removeDJFromAgency);

export default router;
