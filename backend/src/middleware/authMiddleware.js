import authService from '../services/authService.js';

/**
 * Authentication Middleware
 * Protects routes and verifies user permissions
 */

/**
 * Verify JWT token and attach user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No se proporcionó token de autenticación'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const result = await authService.verifyToken(token);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: result.error || 'Token inválido'
      });
    }

    // Attach user to request
    req.user = result.user;
    req.token = token;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      error: 'Error de autenticación'
    });
  }
};

/**
 * Check if user has specific role/type
 */
export const requireUserType = (...allowedTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
    }

    if (!allowedTypes.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para acceder a este recurso'
      });
    }

    next();
  };
};

/**
 * Check if user has specific permission
 */
export const requirePermission = (permission, resourceType = null) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
    }

    // Extract resource ID from params if available
    const resourceId = req.params.id || req.params.djId || req.params.eventId || null;

    // Check permission
    const hasPermission = await authService.hasPermission(
      req.user.id,
      permission,
      resourceType,
      resourceId ? parseInt(resourceId) : null
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para realizar esta acción'
      });
    }

    next();
  };
};

/**
 * Check if user can access specific DJ
 * - Admin can access all DJs
 * - Agency can access their managed DJs
 * - Individual DJ can only access their own profile
 */
export const canAccessDJ = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
    }

    const djId = parseInt(req.params.djId || req.params.id);

    // Admin can access all
    if (req.user.userType === 'admin') {
      return next();
    }

    // Individual DJ can only access their own profile
    if (req.user.userType === 'individual_dj') {
      if (req.user.dj && req.user.dj.id === djId) {
        return next();
      }
      return res.status(403).json({
        success: false,
        error: 'Solo puedes acceder a tu propio perfil'
      });
    }

    // Agency can access their managed DJs
    if (req.user.userType === 'agency' && req.user.agency) {
      const pool = (await import('../config/database.js')).default;

      const result = await pool.query(
        `SELECT 1 FROM agency_dj_relations
         WHERE agency_id = $1 AND dj_id = $2 AND active = true`,
        [req.user.agency.id, djId]
      );

      if (result.rows.length > 0) {
        return next();
      }

      return res.status(403).json({
        success: false,
        error: 'No tienes acceso a este DJ'
      });
    }

    return res.status(403).json({
      success: false,
      error: 'Acceso denegado'
    });
  } catch (error) {
    console.error('Error checking DJ access:', error);
    return res.status(500).json({
      success: false,
      error: 'Error verificando permisos'
    });
  }
};

/**
 * Check if user can access specific event
 * - Admin can access all events
 * - Agency can access events of their managed DJs
 * - Individual DJ can access only their own events
 */
export const canAccessEvent = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
    }

    const eventId = parseInt(req.params.eventId || req.params.id);

    // Admin can access all
    if (req.user.userType === 'admin') {
      return next();
    }

    const pool = (await import('../config/database.js')).default;

    // Get event DJs
    const eventResult = await pool.query(
      `SELECT dj_id FROM events WHERE id = $1`,
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado'
      });
    }

    const eventDjId = eventResult.rows[0].dj_id;

    // Individual DJ can access their own events
    if (req.user.userType === 'individual_dj') {
      if (req.user.dj && req.user.dj.id === eventDjId) {
        return next();
      }
      return res.status(403).json({
        success: false,
        error: 'Solo puedes acceder a tus propios eventos'
      });
    }

    // Agency can access events of their managed DJs
    if (req.user.userType === 'agency' && req.user.agency) {
      const result = await pool.query(
        `SELECT 1 FROM agency_dj_relations
         WHERE agency_id = $1 AND dj_id = $2 AND active = true`,
        [req.user.agency.id, eventDjId]
      );

      if (result.rows.length > 0) {
        return next();
      }

      return res.status(403).json({
        success: false,
        error: 'No tienes acceso a este evento'
      });
    }

    return res.status(403).json({
      success: false,
      error: 'Acceso denegado'
    });
  } catch (error) {
    console.error('Error checking event access:', error);
    return res.status(500).json({
      success: false,
      error: 'Error verificando permisos'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 * Useful for public endpoints that can return different data for authenticated users
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const result = await authService.verifyToken(token);

      if (result.success) {
        req.user = result.user;
        req.token = token;
      }
    }

    next();
  } catch (error) {
    // Silently fail - this is optional auth
    next();
  }
};

/**
 * Alias for authenticate - for backwards compatibility
 */
export const authenticateToken = authenticate;

/**
 * Role-based authorization middleware
 * @param {Array<String>} allowedRoles - Array of allowed roles
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
    }

    const userRole = req.user.role.toUpperCase();
    const normalizedRoles = allowedRoles.map(r => r.toUpperCase());

    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para acceder a este recurso',
        required_roles: allowedRoles,
        your_role: req.user.role
      });
    }

    next();
  };
};

export default {
  authenticate,
  authenticateToken,
  requireUserType,
  requireRole,
  requirePermission,
  canAccessDJ,
  canAccessEvent,
  optionalAuth
};
