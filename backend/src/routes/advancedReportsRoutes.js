import express from 'express';
import * as advancedReportsController from '../controllers/advancedReportsController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Advanced Reports Routes
 * All routes require authentication and staff/admin role
 */

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireRole(['staff', 'admin']));

// ============================================================================
// P&L ROUTES
// ============================================================================

/**
 * @route   GET /api/reports/profit-loss
 * @desc    Get Profit & Loss statement with detail and summary
 * @access  Private (Staff, Admin)
 * @query   fechaInicio (YYYY-MM-DD), fechaFin (YYYY-MM-DD)
 */
router.get('/profit-loss', advancedReportsController.getProfitLoss);

/**
 * @route   GET /api/reports/profit-loss/summary
 * @desc    Get P&L summary only (totals)
 * @access  Private (Staff, Admin)
 * @query   fechaInicio (YYYY-MM-DD), fechaFin (YYYY-MM-DD)
 */
router.get('/profit-loss/summary', advancedReportsController.getProfitLossSummary);

// ============================================================================
// CASH FLOW ROUTES
// ============================================================================

/**
 * @route   GET /api/reports/cash-flow
 * @desc    Get Cash Flow statement with detail and summary
 * @access  Private (Staff, Admin)
 * @query   fechaInicio (YYYY-MM-DD), fechaFin (YYYY-MM-DD)
 */
router.get('/cash-flow', advancedReportsController.getCashFlow);

/**
 * @route   GET /api/reports/cash-flow/summary
 * @desc    Get Cash Flow summary only
 * @access  Private (Staff, Admin)
 * @query   fechaInicio (YYYY-MM-DD), fechaFin (YYYY-MM-DD)
 */
router.get('/cash-flow/summary', advancedReportsController.getCashFlowSummary);

// ============================================================================
// KPI ROUTES
// ============================================================================

/**
 * @route   GET /api/reports/kpis
 * @desc    Get Financial KPIs with detail and summary
 * @access  Private (Staff, Admin)
 * @query   fechaInicio (YYYY-MM-DD), fechaFin (YYYY-MM-DD)
 */
router.get('/kpis', advancedReportsController.getFinancialKPIs);

/**
 * @route   GET /api/reports/kpis/summary
 * @desc    Get KPIs summary only (averages)
 * @access  Private (Staff, Admin)
 * @query   fechaInicio (YYYY-MM-DD), fechaFin (YYYY-MM-DD)
 */
router.get('/kpis/summary', advancedReportsController.getKPIsSummary);

// ============================================================================
// REVENUE ANALYSIS ROUTES
// ============================================================================

/**
 * @route   GET /api/reports/revenue-by-category
 * @desc    Get revenue breakdown by event category
 * @access  Private (Staff, Admin)
 * @query   fechaInicio (YYYY-MM-DD), fechaFin (YYYY-MM-DD)
 */
router.get('/revenue-by-category', advancedReportsController.getRevenueByCategory);

/**
 * @route   GET /api/reports/top-djs
 * @desc    Get top DJs by revenue generation
 * @access  Private (Staff, Admin)
 * @query   fechaInicio (YYYY-MM-DD), fechaFin (YYYY-MM-DD), limit (default: 10)
 */
router.get('/top-djs', advancedReportsController.getTopDJs);

// ============================================================================
// EXPENSE ANALYSIS ROUTES
// ============================================================================

/**
 * @route   GET /api/reports/expense-breakdown
 * @desc    Get expense breakdown by category
 * @access  Private (Staff, Admin)
 * @query   fechaInicio (YYYY-MM-DD), fechaFin (YYYY-MM-DD)
 */
router.get('/expense-breakdown', advancedReportsController.getExpenseBreakdown);

// ============================================================================
// TRENDING & COMPARISON ROUTES
// ============================================================================

/**
 * @route   GET /api/reports/growth
 * @desc    Get month-over-month growth analysis
 * @access  Private (Staff, Admin)
 * @query   fechaInicio (YYYY-MM-DD), fechaFin (YYYY-MM-DD)
 */
router.get('/growth', advancedReportsController.getMonthOverMonthGrowth);

/**
 * @route   GET /api/reports/year-over-year
 * @desc    Get year-over-year comparison
 * @access  Private (Staff, Admin)
 * @query   año (YYYY)
 */
router.get('/year-over-year', advancedReportsController.getYearOverYearComparison);

// ============================================================================
// DASHBOARD ROUTE
// ============================================================================

/**
 * @route   GET /api/reports/dashboard
 * @desc    Get complete financial dashboard (all reports combined)
 * @access  Private (Staff, Admin)
 * @query   fechaInicio (YYYY-MM-DD), fechaFin (YYYY-MM-DD)
 */
router.get('/dashboard', advancedReportsController.getFinancialDashboard);

export default router;
