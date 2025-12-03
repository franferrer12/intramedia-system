import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

/**
 * Middleware to authenticate JWT tokens
 * Validates the token and attaches the user object to req.user
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No se proporcionó token de autenticación'
      });
    }

    // Extract token
    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database with agency info
    const result = await pool.query(
      `SELECT
        u.id,
        u.email,
        u.role,
        u.dj_id,
        u.is_active,
        u.email_verified,
        d.nombre as dj_nombre,
        a.id as agency_id,
        a.agency_name
      FROM users u
      LEFT JOIN djs d ON u.dj_id = d.id
      LEFT JOIN agencies a ON u.id = a.user_id
      WHERE u.id = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Usuario desactivado'
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      djId: user.dj_id,
      djName: user.dj_nombre || null,
      emailVerified: user.email_verified,
      agencyId: user.agency_id || null,
      agencyName: user.agency_name || null
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }

    console.error('Error en autenticación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al autenticar'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 * Useful for endpoints that have different behavior for authenticated users
 */
export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    // Reuse authenticate logic
    await authenticate(req, res, next);
  } catch (error) {
    // Continue without user
    req.user = null;
    next();
  }
};

/**
 * Generate JWT token for a user
 */
export const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Verify a JWT token (utility function)
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Alias for authenticate - for backwards compatibility
 */
export const authenticateToken = authenticate;

/**
 * Role-based authorization middleware
 * @param {Array<String>} allowedRoles - Array of allowed roles (e.g., ['ADMIN', 'DJ'])
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const userRole = req.user.role.toUpperCase();
    const normalizedRoles = allowedRoles.map(r => r.toUpperCase());

    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso',
        required_roles: allowedRoles,
        your_role: req.user.role
      });
    }

    next();
  };
};
