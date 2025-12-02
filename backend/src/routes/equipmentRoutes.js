import express from 'express';
import {
  getEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getEquipmentStats,
  checkAvailability,
  getEquipmentRentals,
  createRental,
  markAsDelivered,
  markAsReturned,
  getAllRentals
} from '../controllers/equipmentController.js';
import { authenticate as authenticateToken } from '../middleware/auth.js';
import { requireAdmin, requireAgency } from '../middleware/rbac.js';

const router = express.Router();

// ============================================================================
// EQUIPMENT ROUTES
// All equipment routes require authentication
// ============================================================================

/**
 * @route   GET /api/equipment/stats
 * @desc    Get equipment statistics for agency
 * @access  Private (Agency only)
 * @returns Equipment stats (total, disponibles, alquilados, ingresos, etc.)
 */
router.get('/stats', authenticateToken, requireAgency, getEquipmentStats);

/**
 * @route   GET /api/equipment
 * @desc    Get all equipment for agency with optional filters
 * @access  Private (Agency only)
 * @query   tipo, estado, solo_disponibles
 * @returns Array of equipment
 */
router.get('/', authenticateToken, requireAgency, getEquipment);

/**
 * @route   GET /api/equipment/:id
 * @desc    Get equipment by ID
 * @access  Private
 * @returns Equipment object with availability info
 */
router.get('/:id', authenticateToken, getEquipmentById);

/**
 * @route   POST /api/equipment
 * @desc    Create new equipment
 * @access  Private (Agency only)
 * @body    Equipment data (tipo, marca, modelo, cantidad, precios, etc.)
 * @returns Created equipment
 */
router.post('/', authenticateToken, requireAgency, createEquipment);

/**
 * @route   PUT /api/equipment/:id
 * @desc    Update equipment
 * @access  Private (Agency only)
 * @body    Equipment data to update
 * @returns Updated equipment
 */
router.put('/:id', authenticateToken, requireAgency, updateEquipment);

/**
 * @route   DELETE /api/equipment/:id
 * @desc    Delete equipment (soft delete)
 * @access  Private (Agency only)
 * @returns Deleted equipment
 */
router.delete('/:id', authenticateToken, requireAgency, deleteEquipment);

/**
 * @route   POST /api/equipment/:id/check-availability
 * @desc    Check equipment availability for date range
 * @access  Private
 * @body    { fecha_inicio, fecha_fin, cantidad }
 * @returns Availability info (disponible, cantidad_disponible, etc.)
 */
router.post('/:id/check-availability', authenticateToken, checkAvailability);

/**
 * @route   GET /api/equipment/:id/rentals
 * @desc    Get rentals for specific equipment
 * @access  Private (Agency only)
 * @query   estado (optional)
 * @returns Array of rentals
 */
router.get('/:id/rentals', authenticateToken, requireAgency, getEquipmentRentals);

// ============================================================================
// RENTAL ROUTES
// ============================================================================

/**
 * @route   GET /api/equipment/rentals/all
 * @desc    Get all rentals (admin view)
 * @access  Private (Admin only)
 * @query   estado, fecha_inicio, fecha_fin
 * @returns Array of rentals with full details
 */
router.get('/rentals/all', authenticateToken, requireAdmin, getAllRentals);

/**
 * @route   POST /api/equipment/rentals
 * @desc    Create new equipment rental
 * @access  Private
 * @body    Rental data (equipment_id, cantidad, fechas, precio, etc.)
 * @returns Created rental
 */
router.post('/rentals', authenticateToken, createRental);

/**
 * @route   POST /api/equipment/rentals/:id/deliver
 * @desc    Mark rental as delivered
 * @access  Private (Agency only)
 * @returns Updated rental
 */
router.post('/rentals/:id/deliver', authenticateToken, requireAgency, markAsDelivered);

/**
 * @route   POST /api/equipment/rentals/:id/return
 * @desc    Mark rental as returned
 * @access  Private (Agency only)
 * @body    { condicion: 'excelente'|'bueno'|'regular'|'dañado' }
 * @returns Updated rental
 */
router.post('/rentals/:id/return', authenticateToken, requireAgency, markAsReturned);

export default router;
