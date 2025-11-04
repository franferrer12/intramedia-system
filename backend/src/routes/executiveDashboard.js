import express from 'express';
import {
  getConsolidatedMetrics,
  getFinancialHealthScore
} from '../controllers/executiveDashboardController.js';
import { longCache } from '../middleware/cache.js';

const router = express.Router();

/**
 * @route   GET /api/executive-dashboard/metrics
 * @desc    Get all consolidated executive metrics
 * @access  Public
 * @cache   15 minutes (longCache)
 */
router.get('/metrics', longCache, getConsolidatedMetrics);

/**
 * @route   GET /api/executive-dashboard/health-score
 * @desc    Get financial health score (0-100)
 * @access  Public
 * @cache   15 minutes (longCache)
 */
router.get('/health-score', longCache, getFinancialHealthScore);

export default router;
