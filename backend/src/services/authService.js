import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

/**
 * Authentication Service
 * Handles user authentication, registration, and session management
 */

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days
const SALT_ROUNDS = 10;

class AuthService {
  /**
   * Register a new user
   */
  async register(userData) {
    const { email, password, userType, additionalData = {} } = userData;

    try {
      // Check if user already exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return {
          success: false,
          error: 'El email ya está registrado'
        };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Map user_type to role for legacy compatibility
      // Note: 'staff' is used because 'dj' role requires a dj_id (user_dj_role constraint)
      const roleMap = {
        'agency': 'staff',
        'individual_dj': 'staff',
        'admin': 'admin'
      };
      const role = roleMap[userType] || 'staff';

      // Create user
      const userResult = await pool.query(
        `INSERT INTO users (email, password_hash, user_type, role, is_active)
         VALUES ($1, $2, $3, $4, true)
         RETURNING id, email, user_type, created_at`,
        [email, passwordHash, userType, role]
      );

      const user = userResult.rows[0];

      // Create agency or link DJ based on user type
      if (userType === 'agency') {
        await this.createAgency(user.id, additionalData);
      } else if (userType === 'individual_dj') {
        await this.createOrLinkDJ(user.id, additionalData);
      }

      // Generate token
      const token = this.generateToken(user);

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          userType: user.user_type
        },
        token
      };
    } catch (error) {
      console.error('Error in register:', error);
      return {
        success: false,
        error: 'Error al registrar usuario'
      };
    }
  }

  /**
   * Login user
   */
  async login(email, password, ipAddress = null, userAgent = null) {
    try {
      // Get user
      const userResult = await pool.query(
        'SELECT id, email, password_hash, user_type, is_active FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        return {
          success: false,
          error: 'Credenciales inválidas'
        };
      }

      const user = userResult.rows[0];

      // Check if user is active
      if (!user.is_active) {
        return {
          success: false,
          error: 'Usuario desactivado'
        };
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);

      if (!validPassword) {
        return {
          success: false,
          error: 'Credenciales inválidas'
        };
      }

      // Update last login
      await pool.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // Generate token
      const token = this.generateToken(user);

      // Create session
      await this.createSession(user.id, token, ipAddress, userAgent);

      // Get additional user data
      const userData = await this.getUserData(user.id, user.user_type);

      // Log action
      await this.logAction(user.id, 'login', 'user', user.id, null, null, ipAddress);

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          userType: user.user_type,
          ...userData
        },
        token
      };
    } catch (error) {
      console.error('Error in login:', error);
      return {
        success: false,
        error: 'Error al iniciar sesión'
      };
    }
  }

  /**
   * Verify token and get user
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      // Check if session exists and is valid
      const sessionResult = await pool.query(
        `SELECT s.*, u.email, u.user_type, u.is_active
         FROM sessions s
         JOIN users u ON s.user_id = u.id
         WHERE s.token = $1 AND s.expires_at > NOW()`,
        [token]
      );

      if (sessionResult.rows.length === 0) {
        return {
          success: false,
          error: 'Sesión inválida o expirada'
        };
      }

      const session = sessionResult.rows[0];

      if (!session.is_active) {
        return {
          success: false,
          error: 'Usuario desactivado'
        };
      }

      // Get user data
      const userData = await this.getUserData(session.user_id, session.user_type);

      return {
        success: true,
        user: {
          id: session.user_id,
          email: session.email,
          userType: session.user_type,
          ...userData
        }
      };
    } catch (error) {
      console.error('Error verifying token:', error);
      return {
        success: false,
        error: 'Token inválido'
      };
    }
  }

  /**
   * Logout user (invalidate session)
   */
  async logout(token) {
    try {
      await pool.query(
        'DELETE FROM sessions WHERE token = $1',
        [token]
      );

      return {
        success: true,
        message: 'Sesión cerrada correctamente'
      };
    } catch (error) {
      console.error('Error in logout:', error);
      return {
        success: false,
        error: 'Error al cerrar sesión'
      };
    }
  }

  // ========== HELPER METHODS ==========

  /**
   * Generate JWT token
   */
  generateToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        userType: user.user_type
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  /**
   * Create session in database
   */
  async createSession(userId, token, ipAddress, userAgent) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await pool.query(
      `INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, token, ipAddress, userAgent, expiresAt]
    );
  }

  /**
   * Get user-specific data based on type
   */
  async getUserData(userId, userType) {
    if (userType === 'agency') {
      const agencyResult = await pool.query(
        `SELECT a.*
         FROM agencies a
         WHERE a.user_id = $1`,
        [userId]
      );

      return agencyResult.rows.length > 0 ? {
        agency: agencyResult.rows[0]
      } : {};
    } else if (userType === 'individual_dj') {
      const djResult = await pool.query(
        'SELECT * FROM djs WHERE user_id = $1',
        [userId]
      );

      return djResult.rows.length > 0 ? {
        dj: djResult.rows[0]
      } : {};
    }

    return {};
  }

  /**
   * Create agency for new user
   */
  async createAgency(userId, data) {
    const { agencyName, legalName, taxId, contactPerson, phone } = data;

    await pool.query(
      `INSERT INTO agencies (user_id, agency_name, legal_name, tax_id, contact_person, phone, subscription_plan, max_djs)
       VALUES ($1, $2, $3, $4, $5, $6, 'basic', 10)`,
      [userId, agencyName || 'Mi Agencia', legalName, taxId, contactPerson, phone]
    );
  }

  /**
   * Create or link DJ for individual user
   */
  async createOrLinkDJ(userId, data) {
    const { nombre, email, telefono } = data;

    // Check if DJ with this email already exists
    const existingDJ = await pool.query(
      'SELECT id FROM djs WHERE email = $1',
      [email]
    );

    if (existingDJ.rows.length > 0) {
      // Link existing DJ to user
      await pool.query(
        'UPDATE djs SET user_id = $1, managed_by = $2 WHERE id = $3',
        [userId, 'self', existingDJ.rows[0].id]
      );
    } else {
      // Create new DJ
      await pool.query(
        `INSERT INTO djs (nombre, email, telefono, user_id, managed_by, active)
         VALUES ($1, $2, $3, $4, 'self', true)`,
        [nombre || 'DJ', email, telefono, userId]
      );
    }
  }

  /**
   * Log action to audit log
   */
  async logAction(userId, action, entityType, entityId, oldValues, newValues, ipAddress) {
    try {
      await pool.query(
        `INSERT INTO audit_log (user_id, action, entity_type, entity_id, old_values, new_values, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          action,
          entityType,
          entityId,
          oldValues ? JSON.stringify(oldValues) : null,
          newValues ? JSON.stringify(newValues) : null,
          ipAddress
        ]
      );
    } catch (error) {
      console.error('Error logging action:', error);
    }
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get current password hash
      const userResult = await pool.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return {
          success: false,
          error: 'Usuario no encontrado'
        };
      }

      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);

      if (!validPassword) {
        return {
          success: false,
          error: 'Contraseña actual incorrecta'
        };
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

      // Update password
      await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newPasswordHash, userId]
      );

      return {
        success: true,
        message: 'Contraseña actualizada correctamente'
      };
    } catch (error) {
      console.error('Error changing password:', error);
      return {
        success: false,
        error: 'Error al cambiar contraseña'
      };
    }
  }

  /**
   * Check if user has permission
   */
  async hasPermission(userId, permission, resourceType = null, resourceId = null) {
    try {
      // Admin has all permissions
      const userResult = await pool.query(
        'SELECT user_type FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length > 0 && userResult.rows[0].user_type === 'admin') {
        return true;
      }

      // Check specific permission
      let query = 'SELECT 1 FROM user_permissions WHERE user_id = $1 AND permission = $2';
      const params = [userId, permission];

      if (resourceType) {
        query += ' AND resource_type = $3';
        params.push(resourceType);
      }

      if (resourceId) {
        query += ' AND (resource_id = $4 OR resource_id IS NULL)';
        params.push(resourceId);
      }

      const result = await pool.query(query, params);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }
}

export default new AuthService();
