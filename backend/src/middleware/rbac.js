/**
 * Role-Based Access Control (RBAC) Middleware
 * Provides authorization based on user roles
 */

/**
 * Middleware to check if user has required role(s)
 * Must be used AFTER authenticate middleware
 *
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 * @returns {Function} Express middleware
 *
 * @example
 * // Single role
 * router.get('/admin', authenticate, requireRole('admin'), adminController)
 *
 * // Multiple roles
 * router.get('/reports', authenticate, requireRole(['admin', 'dj']), reportsController)
 */
export const requireRole = (allowedRoles) => {
  // Normalize to array
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso',
        requiredRole: roles,
        currentRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is an admin
 */
export const requireAdmin = requireRole('admin');

/**
 * Middleware to check if user is a DJ
 */
export const requireDJ = requireRole('dj');

/**
 * Middleware to check if user is admin or staff
 */
export const requireStaff = requireRole(['admin', 'staff']);

/**
 * Middleware to check if user owns the resource or is an admin
 * Checks if req.params.djId matches req.user.djId or user is admin
 *
 * @example
 * router.get('/djs/:djId/reports', authenticate, requireOwnerOrAdmin, getReports)
 */
export const requireOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  const djId = parseInt(req.params.djId);
  const isOwner = req.user.djId === djId;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para acceder a este recurso'
    });
  }

  next();
};

/**
 * Middleware to check email verification
 * Can be used in addition to role checks for sensitive operations
 */
export const requireEmailVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  if (!req.user.emailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Debes verificar tu email para acceder a este recurso'
    });
  }

  next();
};

/**
 * Audit log middleware - logs all actions for audit trail
 * Should be used on sensitive operations
 */
export const auditLog = (action, entityType) => {
  return async (req, res, next) => {
    // Store audit info in request for use in controller
    req.auditInfo = {
      action,
      entityType,
      userId: req.user?.id || null,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    };

    // Continue to controller
    // Controller should call logAudit() after successful operation
    next();
  };
};
