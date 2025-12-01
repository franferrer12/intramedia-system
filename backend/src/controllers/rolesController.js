/**
 * Roles Controller
 * Gestión completa de roles y permisos RBAC
 */

import Role from '../models/Role.js';
import logger from '../utils/logger.js';

/**
 * Obtener todos los roles
 */
export const getAllRoles = async (req, res) => {
  try {
    const { include_permissions } = req.query;

    const roles = await Role.findAll({
      include_permissions: include_permissions === 'true'
    });

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    logger.error('Error getting roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener roles',
      error: error.message
    });
  }
};

/**
 * Obtener rol por ID
 */
export const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findById(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    res.json({
      success: true,
      data: role
    });
  } catch (error) {
    logger.error('Error getting role:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener rol',
      error: error.message
    });
  }
};

/**
 * Crear nuevo rol
 */
export const createRole = async (req, res) => {
  try {
    const roleData = req.body;
    const role = await Role.create(roleData);

    logger.info('Role created:', { roleId: role.id, name: role.name });

    res.status(201).json({
      success: true,
      message: 'Rol creado exitosamente',
      data: role
    });
  } catch (error) {
    logger.error('Error creating role:', error);

    if (error.message.includes('ya existe')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear rol',
      error: error.message
    });
  }
};

/**
 * Actualizar rol
 */
export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const role = await Role.update(id, updates);

    logger.info('Role updated:', { roleId: id });

    res.json({
      success: true,
      message: 'Rol actualizado exitosamente',
      data: role
    });
  } catch (error) {
    logger.error('Error updating role:', error);

    if (error.message === 'Rol no encontrado') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('sistema')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar rol',
      error: error.message
    });
  }
};

/**
 * Eliminar rol
 */
export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.delete(id);

    logger.info('Role deleted:', { roleId: id });

    res.json({
      success: true,
      message: 'Rol eliminado exitosamente',
      data: role
    });
  } catch (error) {
    logger.error('Error deleting role:', error);

    if (error.message === 'Rol no encontrado') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('sistema')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al eliminar rol',
      error: error.message
    });
  }
};

/**
 * Asignar permisos a un rol
 */
export const assignPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permission_ids } = req.body;

    if (!Array.isArray(permission_ids)) {
      return res.status(400).json({
        success: false,
        message: 'permission_ids debe ser un array'
      });
    }

    const result = await Role.assignPermissions(id, permission_ids);

    logger.info('Permissions assigned:', { roleId: id, count: permission_ids.length });

    res.json({
      success: true,
      message: `${result.assigned} permisos asignados al rol`,
      data: result
    });
  } catch (error) {
    logger.error('Error assigning permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error al asignar permisos',
      error: error.message
    });
  }
};

/**
 * Asignar rol a usuario
 */
export const assignRoleToUser = async (req, res) => {
  try {
    const { user_id, role_id, expires_at } = req.body;
    const assignedBy = req.user?.id;

    if (!user_id || !role_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id y role_id son requeridos'
      });
    }

    const assignment = await Role.assignToUser(user_id, role_id, {
      assigned_by: assignedBy,
      expires_at
    });

    logger.info('Role assigned to user:', { userId: user_id, roleId: role_id });

    res.status(201).json({
      success: true,
      message: 'Rol asignado exitosamente',
      data: assignment
    });
  } catch (error) {
    logger.error('Error assigning role to user:', error);
    res.status(500).json({
      success: false,
      message: 'Error al asignar rol',
      error: error.message
    });
  }
};

/**
 * Remover rol de usuario
 */
export const removeRoleFromUser = async (req, res) => {
  try {
    const { user_id, role_id } = req.body;

    if (!user_id || !role_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id y role_id son requeridos'
      });
    }

    const result = await Role.removeFromUser(user_id, role_id);

    logger.info('Role removed from user:', { userId: user_id, roleId: role_id });

    res.json({
      success: true,
      message: 'Rol removido exitosamente',
      data: result
    });
  } catch (error) {
    logger.error('Error removing role from user:', error);

    if (error.message.includes('no encontrada')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al remover rol',
      error: error.message
    });
  }
};

/**
 * Obtener usuarios con un rol
 */
export const getUsersByRole = async (req, res) => {
  try {
    const { id } = req.params;
    const users = await Role.getUsersByRole(id);

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    logger.error('Error getting users by role:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    });
  }
};

/**
 * Obtener todos los permisos
 */
export const getAllPermissions = async (req, res) => {
  try {
    const { resource, grouped } = req.query;

    let permissions;
    if (grouped === 'true') {
      permissions = await Role.getPermissionsGrouped();
    } else {
      permissions = await Role.getAllPermissions({ resource });
    }

    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    logger.error('Error getting permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener permisos',
      error: error.message
    });
  }
};

/**
 * Obtener resumen de roles
 */
export const getRolesSummary = async (req, res) => {
  try {
    const summary = await Role.getRolesSummary();

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Error getting roles summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen',
      error: error.message
    });
  }
};

/**
 * Obtener resumen de roles de usuarios
 */
export const getUserRolesSummary = async (req, res) => {
  try {
    const summary = await Role.getUserRolesSummary();

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Error getting user roles summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen',
      error: error.message
    });
  }
};

/**
 * Clonar rol
 */
export const cloneRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_name, new_display_name } = req.body;

    if (!new_name || !new_display_name) {
      return res.status(400).json({
        success: false,
        message: 'new_name y new_display_name son requeridos'
      });
    }

    const newRole = await Role.cloneRole(id, new_name, new_display_name);

    logger.info('Role cloned:', { sourceId: id, newId: newRole.id });

    res.status(201).json({
      success: true,
      message: 'Rol clonado exitosamente',
      data: newRole
    });
  } catch (error) {
    logger.error('Error cloning role:', error);

    if (error.message.includes('no encontrado')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al clonar rol',
      error: error.message
    });
  }
};

export default {
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
};
