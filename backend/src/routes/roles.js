/**
 * Roles & Permissions Routes
 * Sistema completo de rutas para gestión de RBAC
 */

import express from 'express';
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  assignPermissions,
  assignRoleToUser,
  removeRoleFromUser,
  getUsersByRole,
  getAllPermissions,
  getRolesSummary,
  getUserRolesSummary,
  cloneRole
} from '../controllers/rolesController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission, requireAdminOrManager } from '../middleware/authorization.js';
import { validate, field } from '../middleware/validation.js';
import { shortCache, invalidateCache } from '../middleware/cache.js';
import { createRateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

// Middleware de autenticación en todas las rutas
router.use(authenticate);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUTAS DE LECTURA - ROLES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/roles
 * Obtener todos los roles
 */
router.get('/',
  requirePermission('roles', 'read'),
  shortCache,
  getAllRoles
);

/**
 * GET /api/roles/summary
 * Obtener resumen de roles con estadísticas
 */
router.get('/summary',
  requirePermission('roles', 'read'),
  shortCache,
  getRolesSummary
);

/**
 * GET /api/roles/users-summary
 * Obtener resumen de roles de usuarios
 */
router.get('/users-summary',
  requirePermission('roles', 'read'),
  shortCache,
  getUserRolesSummary
);

/**
 * GET /api/roles/:id
 * Obtener rol por ID con permisos
 */
router.get('/:id',
  requirePermission('roles', 'read'),
  getRoleById
);

/**
 * GET /api/roles/:id/users
 * Obtener usuarios con un rol específico
 */
router.get('/:id/users',
  requirePermission('roles', 'read'),
  getUsersByRole
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUTAS DE LECTURA - PERMISOS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/roles/permissions/all
 * Obtener todos los permisos disponibles
 */
router.get('/permissions/all',
  requirePermission('roles', 'read'),
  shortCache,
  getAllPermissions
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUTAS DE CREACIÓN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * POST /api/roles
 * Crear nuevo rol
 */
router.post('/',
  requirePermission('roles', 'create'),
  createRateLimit,
  validate([
    field('name').required().minLength(3).maxLength(50).matches(/^[a-z_]+$/),
    field('display_name').required().minLength(3).maxLength(100),
    field('description').optional().maxLength(500),
    field('level').optional().numeric().min(0).max(100),
    field('is_active').optional().boolean()
  ]),
  (req, res, next) => {
    invalidateCache('GET:/api/roles');
    next();
  },
  createRole
);

/**
 * POST /api/roles/:id/clone
 * Clonar rol existente con sus permisos
 */
router.post('/:id/clone',
  requirePermission('roles', 'create'),
  createRateLimit,
  validate([
    field('new_name').required().minLength(3).maxLength(50).matches(/^[a-z_]+$/),
    field('new_display_name').required().minLength(3).maxLength(100)
  ]),
  (req, res, next) => {
    invalidateCache('GET:/api/roles');
    next();
  },
  cloneRole
);

/**
 * POST /api/roles/assign
 * Asignar rol a usuario
 */
router.post('/assign',
  requirePermission('roles', 'assign'),
  createRateLimit,
  validate([
    field('user_id').required().numeric().positive(),
    field('role_id').required().numeric().positive(),
    field('expires_at').optional().date()
  ]),
  (req, res, next) => {
    invalidateCache('GET:/api/roles/users-summary');
    next();
  },
  assignRoleToUser
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUTAS DE ACTUALIZACIÓN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * PUT /api/roles/:id
 * Actualizar rol
 */
router.put('/:id',
  requirePermission('roles', 'update'),
  validate([
    field('display_name').optional().minLength(3).maxLength(100),
    field('description').optional().maxLength(500),
    field('level').optional().numeric().min(0).max(100),
    field('is_active').optional().boolean()
  ]),
  (req, res, next) => {
    invalidateCache('GET:/api/roles');
    next();
  },
  updateRole
);

/**
 * PUT /api/roles/:id/permissions
 * Asignar permisos a un rol
 */
router.put('/:id/permissions',
  requirePermission('roles', 'update'),
  validate([
    field('permission_ids').required().custom((value) => {
      if (!Array.isArray(value)) {
        throw new Error('permission_ids debe ser un array');
      }
      if (value.length === 0) {
        throw new Error('permission_ids no puede estar vacío');
      }
      if (!value.every(id => typeof id === 'number' && id > 0)) {
        throw new Error('Todos los IDs deben ser números positivos');
      }
      return true;
    })
  ]),
  (req, res, next) => {
    invalidateCache('GET:/api/roles');
    next();
  },
  assignPermissions
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUTAS DE ELIMINACIÓN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * DELETE /api/roles/:id
 * Eliminar rol (solo roles no sistema)
 */
router.delete('/:id',
  requireAdminOrManager,
  (req, res, next) => {
    invalidateCache('GET:/api/roles');
    next();
  },
  deleteRole
);

/**
 * POST /api/roles/remove
 * Remover rol de usuario
 */
router.post('/remove',
  requirePermission('roles', 'assign'),
  validate([
    field('user_id').required().numeric().positive(),
    field('role_id').required().numeric().positive()
  ]),
  (req, res, next) => {
    invalidateCache('GET:/api/roles/users-summary');
    next();
  },
  removeRoleFromUser
);

export default router;
