import express from 'express';
import {
  // Templates
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,

  // Campaigns
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,

  // Recipients & Sending
  getCampaignRecipients,
  previewRecipientsCount,
  sendCampaign,
  cancelCampaign,

  // Stats
  getCampaignStats,
  getCampaignsSummary
} from '../controllers/emailCampaignController.js';
import { authenticate as authenticateToken } from '../middleware/auth.js';
import { requireAdmin, requireStaff, requireAgency } from '../middleware/rbac.js';

const router = express.Router();

// ============================================================================
// EMAIL CAMPAIGN ROUTES
// All routes require authentication and agency membership
// Staff can view and create, Admin can delete
// ============================================================================

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EMAIL TEMPLATES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * @route   GET /api/campaigns/templates
 * @desc    Get all email templates for agency
 * @access  Private (Staff+)
 * @query   categoria - Filter by category
 * @query   activo - Filter by active status
 */
router.get('/templates', authenticateToken, requireAgency, requireStaff, getTemplates);

/**
 * @route   GET /api/campaigns/templates/:id
 * @desc    Get template by ID
 * @access  Private (Staff+)
 */
router.get('/templates/:id', authenticateToken, requireAgency, requireStaff, getTemplateById);

/**
 * @route   POST /api/campaigns/templates
 * @desc    Create new email template
 * @access  Private (Staff+)
 * @body    nombre, descripcion, categoria, asunto, contenidoHtml, contenidoTexto, variablesDisponibles
 */
router.post('/templates', authenticateToken, requireAgency, requireStaff, createTemplate);

/**
 * @route   PUT /api/campaigns/templates/:id
 * @desc    Update email template
 * @access  Private (Staff+)
 * @body    Any template fields to update
 */
router.put('/templates/:id', authenticateToken, requireAgency, requireStaff, updateTemplate);

/**
 * @route   DELETE /api/campaigns/templates/:id
 * @desc    Delete email template (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/templates/:id', authenticateToken, requireAgency, requireAdmin, deleteTemplate);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CAMPAIGNS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * @route   GET /api/campaigns/stats/summary
 * @desc    Get overall campaign stats summary
 * @access  Private (Staff+)
 * @note    Must be before /:id routes to avoid route conflict
 */
router.get('/stats/summary', authenticateToken, requireAgency, requireStaff, getCampaignsSummary);

/**
 * @route   GET /api/campaigns
 * @desc    Get all campaigns for agency
 * @access  Private (Staff+)
 * @query   estado - Filter by status
 */
router.get('/', authenticateToken, requireAgency, requireStaff, getCampaigns);

/**
 * @route   GET /api/campaigns/:id
 * @desc    Get campaign by ID with stats
 * @access  Private (Staff+)
 */
router.get('/:id', authenticateToken, requireAgency, requireStaff, getCampaignById);

/**
 * @route   POST /api/campaigns
 * @desc    Create new campaign
 * @access  Private (Staff+)
 * @body    nombre, descripcion, asunto, contenidoHtml, contenidoTexto, tipoDestinatarios, filtros, etc.
 */
router.post('/', authenticateToken, requireAgency, requireStaff, createCampaign);

/**
 * @route   PUT /api/campaigns/:id
 * @desc    Update campaign (only if not sent)
 * @access  Private (Staff+)
 * @body    Any campaign fields to update
 */
router.put('/:id', authenticateToken, requireAgency, requireStaff, updateCampaign);

/**
 * @route   DELETE /api/campaigns/:id
 * @desc    Delete campaign (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticateToken, requireAgency, requireAdmin, deleteCampaign);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RECIPIENTS & SENDING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * @route   POST /api/campaigns/preview-recipients
 * @desc    Preview recipient count before creating campaign
 * @access  Private (Staff+)
 * @body    tipoDestinatarios, filtros, destinatariosPersonalizados
 */
router.post('/preview-recipients', authenticateToken, requireAgency, requireStaff, previewRecipientsCount);

/**
 * @route   GET /api/campaigns/:id/recipients
 * @desc    Get all recipients for a campaign
 * @access  Private (Staff+)
 * @query   estado - Filter by recipient status
 */
router.get('/:id/recipients', authenticateToken, requireAgency, requireStaff, getCampaignRecipients);

/**
 * @route   POST /api/campaigns/:id/send
 * @desc    Send campaign (schedule or immediate)
 * @access  Private (Admin only - sending requires admin approval)
 * @body    immediate - true for immediate sending, false for scheduled
 */
router.post('/:id/send', authenticateToken, requireAgency, requireAdmin, sendCampaign);

/**
 * @route   POST /api/campaigns/:id/cancel
 * @desc    Cancel scheduled campaign
 * @access  Private (Admin only)
 */
router.post('/:id/cancel', authenticateToken, requireAgency, requireAdmin, cancelCampaign);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STATS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * @route   GET /api/campaigns/:id/stats
 * @desc    Get detailed stats for a campaign
 * @access  Private (Staff+)
 */
router.get('/:id/stats', authenticateToken, requireAgency, requireStaff, getCampaignStats);

export default router;
