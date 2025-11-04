import express from 'express';
import {
  getPeriodComparison,
  getClientComparison,
  getDJComparison,
  getSeasonalAnalysis,
  getTrendForecast,
  getTopPerformersComparison
} from '../controllers/comparativeAnalysisController.js';
import { shortCache, longCache } from '../middleware/cache.js';

const router = express.Router();

/**
 * @route   GET /api/comparative-analysis/period-comparison
 * @desc    Get period-over-period comparison
 * @query   metric, period, startDate, endDate
 * @access  Public
 * @cache   shortCache (1 min)
 */
router.get('/period-comparison', shortCache, getPeriodComparison);

/**
 * @route   GET /api/comparative-analysis/client/:clientId
 * @desc    Get client comparative analysis vs market
 * @access  Public
 * @cache   shortCache (1 min)
 */
router.get('/client/:clientId', shortCache, getClientComparison);

/**
 * @route   GET /api/comparative-analysis/dj/:djId
 * @desc    Get DJ comparative analysis vs market
 * @access  Public
 * @cache   shortCache (1 min)
 */
router.get('/dj/:djId', shortCache, getDJComparison);

/**
 * @route   GET /api/comparative-analysis/seasonal
 * @desc    Get seasonal analysis (patterns by month/season)
 * @access  Public
 * @cache   longCache (15 min)
 */
router.get('/seasonal', longCache, getSeasonalAnalysis);

/**
 * @route   GET /api/comparative-analysis/forecast
 * @desc    Get trend forecast using linear regression
 * @query   metric, periods
 * @access  Public
 * @cache   longCache (15 min)
 */
router.get('/forecast', longCache, getTrendForecast);

/**
 * @route   GET /api/comparative-analysis/top-performers
 * @desc    Get top performers comparison
 * @query   entity (client/dj), limit
 * @access  Public
 * @cache   shortCache (1 min)
 */
router.get('/top-performers', shortCache, getTopPerformersComparison);

export default router;
