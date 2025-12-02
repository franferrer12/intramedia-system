import express from 'express';
import {
  register,
  login,
  getCurrentUser,
  logout,
  changePassword,
  validateToken,
  getUserPermissions
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { strictRateLimit, rateLimit } from '../middleware/rateLimit.js';
import { shortCache } from '../middleware/cache.js';
import { validateRequest } from '../middleware/zodValidation.js';
import { loginSchema, registerSchema, changePasswordSchema } from '../schemas/index.js';

const router = express.Router();

/**
 * Authentication Routes - Multi-Tenant System
 * Supports Agencies and Individual DJs
 */

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (Agency or Individual DJ)
 * @access  Public
 */
router.post('/register', strictRateLimit, validateRequest(registerSchema), register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get JWT token
 * @access  Public
 */
// Temporarily disabled rate limit for testing
router.post('/login', validateRequest(loginSchema), login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user info
 * @access  Private (requires JWT token)
 */
router.get('/me', authenticate, shortCache, getCurrentUser);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate session
 * @access  Private (requires JWT token)
 */
router.post('/logout', authenticate, logout);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private (requires JWT token)
 */
router.post('/change-password', authenticate, strictRateLimit, validateRequest(changePasswordSchema), changePassword);

/**
 * @route   GET /api/auth/validate
 * @desc    Validate if JWT token is still valid
 * @access  Private (requires JWT token)
 */
router.get('/validate', authenticate, validateToken);

/**
 * @route   GET /api/auth/permissions
 * @desc    Get user permissions for role-based UI rendering
 * @access  Private (requires JWT token)
 */
router.get('/permissions', authenticate, shortCache, getUserPermissions);

export default router;
