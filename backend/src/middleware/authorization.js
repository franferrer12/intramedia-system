/**
 * Authorization Middleware - RBAC System
 * Sistema de autorización basado en roles y permisos
 */

import pool from '../config/database.js';

/**
 * Verifica si el usuario tiene un permiso específico
 * @param {String} recurso - Recurso a verificar (ej: 'eventos', 'djs')
 * @param {String} accion - Acción a verificar (ej: 'create', 'read', 'update', 'delete')
 */
export const requirePermission = (recurso, accion) => {
  return async (req, res, next) => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
      }

      const userId = req.user.id;

      // Llamar a la función de la base de datos
      const result = await pool.query(
        'SELECT user_has_permission($1, $2, $3) as has_permission',
        [userId, recurso, accion]
      );

      const hasPermission = result.rows[0]?.has_permission;

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: 'No tienes permisos para realizar esta acción',
          required_permission: {
            recurso,
            accion
          }
        });
      }

      // Usuario tiene permiso, continuar
      next();
    } catch (error) {
      console.error('Error verificando permisos:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al verificar permisos'
      });
    }
  };
};

/**
 * Verifica si el usuario tiene al menos uno de los roles especificados
 * @param {Array<String>} allowedRoles - Roles permitidos (ej: ['admin', 'manager'])
 */
export const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
      }

      const userId = req.user.id;

      // Obtener el rol del usuario
      const result = await pool.query(
        `SELECT r.nombre as role_nombre
         FROM djs d
         INNER JOIN roles r ON d.role_id = r.id
         WHERE d.id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Usuario sin rol asignado'
        });
      }

      const userRole = result.rows[0].role_nombre;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: 'No tienes permisos para acceder a este recurso',
          required_roles: allowedRoles,
          your_role: userRole
        });
      }

      // Usuario tiene uno de los roles permitidos
      req.userRole = userRole;
      next();
    } catch (error) {
      console.error('Error verificando rol:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al verificar rol'
      });
    }
  };
};

/**
 * Middleware que carga los permisos del usuario en req.permissions
 * Útil para mostrar/ocultar elementos en el frontend
 */
export const loadUserPermissions = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      req.permissions = [];
      return next();
    }

    const userId = req.user.id;

    // Obtener todos los permisos del usuario
    const result = await pool.query(
      'SELECT * FROM get_user_permissions($1)',
      [userId]
    );

    req.permissions = result.rows;
    next();
  } catch (error) {
    console.error('Error cargando permisos:', error);
    req.permissions = [];
    next();
  }
};

/**
 * Helper para verificar si el usuario es admin
 */
export const requireAdmin = requireRole('admin');

/**
 * Helper para verificar si el usuario es admin o manager
 */
export const requireAdminOrManager = requireRole('admin', 'manager');

/**
 * Middleware para permitir acceso solo al propio recurso o a admins/managers
 * Útil para endpoints como PUT /djs/:id donde un DJ solo puede editar su propio perfil
 * @param {String} resourceIdParam - Nombre del parámetro en la ruta (default: 'id')
 */
export const requireOwnerOrAdmin = (resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
      }

      const userId = req.user.id;
      const resourceId = parseInt(req.params[resourceIdParam]);

      // Verificar si es admin o manager
      const roleResult = await pool.query(
        `SELECT r.nombre as role_nombre
         FROM djs d
         INNER JOIN roles r ON d.role_id = r.id
         WHERE d.id = $1`,
        [userId]
      );

      if (roleResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Usuario sin rol asignado'
        });
      }

      const userRole = roleResult.rows[0].role_nombre;

      // Admin y manager tienen acceso a todo
      if (userRole === 'admin' || userRole === 'manager') {
        req.userRole = userRole;
        return next();
      }

      // Otros usuarios solo pueden acceder a su propio recurso
      if (userId !== resourceId) {
        return res.status(403).json({
          success: false,
          error: 'Solo puedes modificar tu propio perfil'
        });
      }

      req.userRole = userRole;
      next();
    } catch (error) {
      console.error('Error verificando permisos de owner:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al verificar permisos'
      });
    }
  };
};

/**
 * Endpoint para obtener los permisos del usuario actual
 * Útil para el frontend
 */
export const getMyPermissions = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
    }

    const userId = req.user.id;

    // Obtener información del rol
    const roleResult = await pool.query(
      `SELECT d.id, d.nombre, d.email, r.id as role_id, r.nombre as role_nombre, r.nivel_acceso
       FROM djs d
       INNER JOIN roles r ON d.role_id = r.id
       WHERE d.id = $1`,
      [userId]
    );

    if (roleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Obtener permisos
    const permissionsResult = await pool.query(
      'SELECT * FROM get_user_permissions($1)',
      [userId]
    );

    res.json({
      success: true,
      data: {
        user: roleResult.rows[0],
        permissions: permissionsResult.rows
      }
    });
  } catch (error) {
    console.error('Error obteniendo permisos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener permisos del usuario'
    });
  }
};

export default {
  requirePermission,
  requireRole,
  loadUserPermissions,
  requireAdmin,
  requireAdminOrManager,
  requireOwnerOrAdmin,
  getMyPermissions
};
