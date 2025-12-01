/**
 * Role Model
 * Sistema completo de gestión de roles y permisos RBAC
 */

import pool from '../config/database.js';
import logger from '../utils/logger.js';

class Role {
  /**
   * Obtener todos los roles
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Array>} Lista de roles
   */
  static async findAll(filters = {}) {
    const { is_active = true, include_permissions = false } = filters;

    try {
      let query = `
        SELECT
          r.*,
          (SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = r.id AND ur.is_active = true) as user_count
        FROM roles r
      `;

      const conditions = [];
      const values = [];

      if (is_active !== undefined) {
        conditions.push(`r.is_active = $${values.length + 1}`);
        values.push(is_active);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += ` ORDER BY r.level DESC`;

      const result = await pool.query(query, values);
      let roles = result.rows;

      // Incluir permisos si se solicita
      if (include_permissions) {
        for (const role of roles) {
          const permsResult = await pool.query(
            'SELECT * FROM get_role_permissions($1)',
            [role.id]
          );
          role.permissions = permsResult.rows;
        }
      }

      return roles;
    } catch (error) {
      logger.error('Error finding roles:', error);
      throw error;
    }
  }

  /**
   * Obtener rol por ID
   * @param {number} id - ID del rol
   * @param {boolean} include_permissions - Incluir permisos
   * @returns {Promise<Object|null>} Rol encontrado
   */
  static async findById(id, include_permissions = true) {
    try {
      const query = `
        SELECT
          r.*,
          (SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = r.id AND ur.is_active = true) as user_count
        FROM roles r
        WHERE r.id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      const role = result.rows[0];

      if (include_permissions) {
        const permsResult = await pool.query(
          'SELECT * FROM get_role_permissions($1)',
          [role.id]
        );
        role.permissions = permsResult.rows;
      }

      return role;
    } catch (error) {
      logger.error('Error finding role by ID:', error);
      throw error;
    }
  }

  /**
   * Obtener rol por nombre
   * @param {string} name - Nombre del rol
   * @returns {Promise<Object|null>} Rol encontrado
   */
  static async findByName(name) {
    try {
      const query = `SELECT * FROM roles WHERE name = $1`;
      const result = await pool.query(query, [name]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding role by name:', error);
      throw error;
    }
  }

  /**
   * Crear nuevo rol
   * @param {Object} roleData - Datos del rol
   * @returns {Promise<Object>} Rol creado
   */
  static async create(roleData) {
    const {
      name,
      display_name,
      description,
      level = 0,
      is_system = false,
      is_active = true
    } = roleData;

    try {
      const query = `
        INSERT INTO roles (name, display_name, description, level, is_system, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const values = [name, display_name, description, level, is_system, is_active];
      const result = await pool.query(query, values);

      logger.info('Role created:', { roleId: result.rows[0].id, name });
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        // Unique violation
        throw new Error(`El rol '${name}' ya existe`);
      }
      logger.error('Error creating role:', error);
      throw error;
    }
  }

  /**
   * Actualizar rol
   * @param {number} id - ID del rol
   * @param {Object} updates - Datos a actualizar
   * @returns {Promise<Object>} Rol actualizado
   */
  static async update(id, updates) {
    try {
      // Verificar que el rol existe y no es sistema si se intenta modificar propiedades críticas
      const existing = await this.findById(id, false);
      if (!existing) {
        throw new Error('Rol no encontrado');
      }

      if (existing.is_system && (updates.name || updates.level !== undefined)) {
        throw new Error('No se pueden modificar propiedades críticas de roles del sistema');
      }

      const allowedFields = ['display_name', 'description', 'level', 'is_active'];
      const updates_filtered = {};

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          updates_filtered[key] = updates[key];
        }
      });

      if (Object.keys(updates_filtered).length === 0) {
        return existing;
      }

      const setClause = Object.keys(updates_filtered)
        .map((key, idx) => `${key} = $${idx + 2}`)
        .join(', ');

      const query = `
        UPDATE roles
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const values = [id, ...Object.values(updates_filtered)];
      const result = await pool.query(query, values);

      logger.info('Role updated:', { roleId: id });
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating role:', error);
      throw error;
    }
  }

  /**
   * Eliminar rol (solo roles no sistema)
   * @param {number} id - ID del rol
   * @returns {Promise<Object>} Rol eliminado
   */
  static async delete(id) {
    try {
      const role = await this.findById(id, false);

      if (!role) {
        throw new Error('Rol no encontrado');
      }

      if (role.is_system) {
        throw new Error('No se pueden eliminar roles del sistema');
      }

      const query = `DELETE FROM roles WHERE id = $1 RETURNING *`;
      const result = await pool.query(query, [id]);

      logger.info('Role deleted:', { roleId: id });
      return result.rows[0];
    } catch (error) {
      logger.error('Error deleting role:', error);
      throw error;
    }
  }

  /**
   * Asignar permisos a un rol
   * @param {number} roleId - ID del rol
   * @param {Array<number>} permissionIds - IDs de permisos
   * @returns {Promise<Object>} Resultado
   */
  static async assignPermissions(roleId, permissionIds) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Eliminar permisos existentes
      await client.query(
        'DELETE FROM role_permissions WHERE role_id = $1',
        [roleId]
      );

      // Insertar nuevos permisos
      if (permissionIds && permissionIds.length > 0) {
        const values = permissionIds.map((permId, idx) =>
          `($1, $${idx + 2})`
        ).join(', ');

        await client.query(
          `INSERT INTO role_permissions (role_id, permission_id)
           VALUES ${values}
           ON CONFLICT (role_id, permission_id) DO NOTHING`,
          [roleId, ...permissionIds]
        );
      }

      await client.query('COMMIT');

      logger.info('Permissions assigned to role:', {
        roleId,
        count: permissionIds.length
      });

      return { success: true, assigned: permissionIds.length };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error assigning permissions:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Asignar rol a usuario
   * @param {number} userId - ID del usuario
   * @param {number} roleId - ID del rol
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>} Asignación creada
   */
  static async assignToUser(userId, roleId, options = {}) {
    const { assigned_by, expires_at } = options;

    try {
      const query = `
        INSERT INTO user_roles (user_id, role_id, assigned_by, expires_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, role_id)
        DO UPDATE SET
          is_active = true,
          assigned_by = EXCLUDED.assigned_by,
          assigned_at = CURRENT_TIMESTAMP,
          expires_at = EXCLUDED.expires_at
        RETURNING *
      `;

      const values = [userId, roleId, assigned_by || null, expires_at || null];
      const result = await pool.query(query, values);

      logger.info('Role assigned to user:', { userId, roleId });
      return result.rows[0];
    } catch (error) {
      logger.error('Error assigning role to user:', error);
      throw error;
    }
  }

  /**
   * Remover rol de usuario
   * @param {number} userId - ID del usuario
   * @param {number} roleId - ID del rol
   * @returns {Promise<Object>} Resultado
   */
  static async removeFromUser(userId, roleId) {
    try {
      const query = `
        UPDATE user_roles
        SET is_active = false
        WHERE user_id = $1 AND role_id = $2
        RETURNING *
      `;

      const result = await pool.query(query, [userId, roleId]);

      if (result.rows.length === 0) {
        throw new Error('Asignación de rol no encontrada');
      }

      logger.info('Role removed from user:', { userId, roleId });
      return result.rows[0];
    } catch (error) {
      logger.error('Error removing role from user:', error);
      throw error;
    }
  }

  /**
   * Obtener usuarios con un rol específico
   * @param {number} roleId - ID del rol
   * @returns {Promise<Array>} Lista de usuarios
   */
  static async getUsersByRole(roleId) {
    try {
      const query = `
        SELECT
          u.id,
          u.email,
          u.user_type,
          u.is_active,
          ur.assigned_at,
          ur.expires_at
        FROM user_roles ur
        INNER JOIN users u ON ur.user_id = u.id
        WHERE ur.role_id = $1
          AND ur.is_active = true
          AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
        ORDER BY ur.assigned_at DESC
      `;

      const result = await pool.query(query, [roleId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting users by role:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los permisos disponibles
   * @param {Object} filters - Filtros
   * @returns {Promise<Array>} Lista de permisos
   */
  static async getAllPermissions(filters = {}) {
    const { resource, is_active = true } = filters;

    try {
      let query = 'SELECT * FROM permissions';
      const conditions = [];
      const values = [];

      if (resource) {
        conditions.push(`resource = $${values.length + 1}`);
        values.push(resource);
      }

      if (is_active !== undefined) {
        conditions.push(`is_active = $${values.length + 1}`);
        values.push(is_active);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += ` ORDER BY resource, action`;

      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      logger.error('Error getting all permissions:', error);
      throw error;
    }
  }

  /**
   * Obtener permisos agrupados por recurso
   * @returns {Promise<Object>} Permisos agrupados
   */
  static async getPermissionsGrouped() {
    try {
      const permissions = await this.getAllPermissions();

      const grouped = {};
      permissions.forEach(perm => {
        if (!grouped[perm.resource]) {
          grouped[perm.resource] = [];
        }
        grouped[perm.resource].push(perm);
      });

      return grouped;
    } catch (error) {
      logger.error('Error getting grouped permissions:', error);
      throw error;
    }
  }

  /**
   * Obtener resumen de roles con permisos
   * @returns {Promise<Array>} Resumen
   */
  static async getRolesSummary() {
    try {
      const query = 'SELECT * FROM role_permissions_summary';
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error getting roles summary:', error);
      throw error;
    }
  }

  /**
   * Obtener resumen de roles de usuarios
   * @returns {Promise<Array>} Resumen
   */
  static async getUserRolesSummary() {
    try {
      const query = 'SELECT * FROM user_roles_summary ORDER BY max_level DESC';
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error getting user roles summary:', error);
      throw error;
    }
  }

  /**
   * Clonar rol con sus permisos
   * @param {number} sourceRoleId - ID del rol fuente
   * @param {string} newName - Nombre del nuevo rol
   * @param {string} newDisplayName - Nombre para mostrar
   * @returns {Promise<Object>} Rol clonado
   */
  static async cloneRole(sourceRoleId, newName, newDisplayName) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Obtener rol fuente
      const sourceRole = await this.findById(sourceRoleId);
      if (!sourceRole) {
        throw new Error('Rol fuente no encontrado');
      }

      // Crear nuevo rol
      const newRole = await this.create({
        name: newName,
        display_name: newDisplayName,
        description: `Clonado de: ${sourceRole.display_name}`,
        level: sourceRole.level,
        is_system: false
      });

      // Copiar permisos
      const permissionIds = sourceRole.permissions.map(p => p.permission_id);
      await this.assignPermissions(newRole.id, permissionIds);

      await client.query('COMMIT');

      logger.info('Role cloned:', { sourceRoleId, newRoleId: newRole.id });
      return await this.findById(newRole.id);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error cloning role:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

export default Role;
