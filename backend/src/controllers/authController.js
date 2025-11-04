import authService from '../services/authService.js';

/**
 * Authentication Controller - Multi-Tenant System
 * Handles authentication for Agencies and Individual DJs
 */

/**
 * Register new user (Agency or Individual DJ)
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const { email, password, userType, ...additionalData } = req.body;

    // Validate required fields
    if (!email || !password || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Email, contraseña y tipo de usuario son requeridos'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres'
      });
    }

    // Validate user type
    if (!['agency', 'individual_dj'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de usuario no válido. Debe ser "agency" (Agencia) o "individual_dj" (DJ Individual)'
      });
    }

    // Additional validation for Individual DJ
    if (userType === 'individual_dj') {
      if (!additionalData.nombre) {
        return res.status(400).json({
          success: false,
          message: 'El nombre artístico es requerido para DJs individuales'
        });
      }
    }

    // Additional validation for Agency
    if (userType === 'agency') {
      if (!additionalData.agencyName) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de la agencia es requerido'
        });
      }
    }

    // Register user
    const result = await authService.register({
      email,
      password,
      userType,
      additionalData
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Log registration
    const ipAddress = req.ip || req.connection.remoteAddress;
    await authService.logAction(
      result.user.id,
      'register',
      'user',
      result.user.id,
      null,
      { email, userType },
      ipAddress
    );

    res.status(201).json({
      success: true,
      message: userType === 'agency'
        ? 'Agencia registrada exitosamente'
        : 'DJ registrado exitosamente',
      user: result.user,
      token: result.token
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message
    });
  }
};

/**
 * Login user (Agency or Individual DJ)
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    console.log('🔍 LOGIN ATTEMPT - Body:', JSON.stringify(req.body));
    console.log('🔍 Email:', req.body.email);
    console.log('🔍 Password:', req.body.password ? '***' : 'MISSING');

    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      console.log('❌ Missing credentials - Email:', !!email, 'Password:', !!password);
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // Get IP and user agent for session tracking
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Attempt login
    const result = await authService.login(email, password, ipAddress, userAgent);

    console.log('🔍 Login result:', result.success ? '✅ SUCCESS' : '❌ FAILED');
    if (!result.success) {
      console.log('❌ Error:', result.error);
    }

    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: result.error || 'Credenciales inválidas'
      });
    }

    // Send different messages based on user type
    let welcomeMessage = 'Inicio de sesión exitoso';
    if (result.user.userType === 'agency') {
      welcomeMessage = `¡Bienvenido ${result.user.agency?.agency_name || 'de nuevo'}!`;
    } else if (result.user.userType === 'individual_dj') {
      welcomeMessage = `¡Bienvenido ${result.user.dj?.nombre || 'de nuevo'}!`;
    } else if (result.user.userType === 'admin') {
      welcomeMessage = 'Bienvenido, Administrador';
    }

    res.json({
      success: true,
      message: welcomeMessage,
      user: result.user,
      token: result.token
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
};

/**
 * Get current authenticated user info
 * GET /api/auth/me
 */
export const getCurrentUser = async (req, res) => {
  try {
    // User is attached by authenticate middleware
    const userId = req.user.id;

    // Get fresh user data including agency/DJ details
    const userData = await authService.getUserData(userId, req.user.userType);

    res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        userType: req.user.userType,
        ...userData
      }
    });
  } catch (error) {
    console.error('Error en getCurrentUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener información del usuario',
      error: error.message
    });
  }
};

/**
 * Logout user (invalidate session)
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  try {
    const token = req.token; // Set by authenticate middleware

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'No se encontró token de sesión'
      });
    }

    const result = await authService.logout(token);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Sesión cerrada correctamente'
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cerrar sesión',
      error: error.message
    });
  }
};

/**
 * Change password for authenticated user
 * POST /api/auth/change-password
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual y nueva contraseña son requeridas'
      });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 8 caracteres'
      });
    }

    // Check that new password is different
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe ser diferente a la actual'
      });
    }

    // Change password
    const result = await authService.changePassword(userId, currentPassword, newPassword);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Log action
    const ipAddress = req.ip || req.connection.remoteAddress;
    await authService.logAction(
      userId,
      'change_password',
      'user',
      userId,
      null,
      null,
      ipAddress
    );

    res.json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar contraseña',
      error: error.message
    });
  }
};

/**
 * Validate token (useful for frontend to check if token is still valid)
 * GET /api/auth/validate
 */
export const validateToken = async (req, res) => {
  try {
    const token = req.token; // Set by authenticate middleware

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'No se encontró token'
      });
    }

    const result = await authService.verifyToken(token);

    if (!result.success) {
      return res.status(401).json(result);
    }

    res.json({
      success: true,
      valid: true,
      user: result.user
    });
  } catch (error) {
    console.error('Error en validateToken:', error);
    res.status(500).json({
      success: false,
      message: 'Error al validar token',
      error: error.message
    });
  }
};

/**
 * Get user permissions (for role-based UI rendering)
 * GET /api/auth/permissions
 */
export const getUserPermissions = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.userType;

    // Build permissions object based on user type
    const permissions = {
      userType: userType,
      isAdmin: userType === 'admin',
      isAgency: userType === 'agency',
      isIndividualDJ: userType === 'individual_dj',

      // Feature permissions
      canManageDJs: userType === 'admin' || userType === 'agency',
      canManageMultipleDJs: userType === 'admin' || userType === 'agency',
      canViewAllEvents: userType === 'admin',
      canManageOwnEvents: true,
      canViewAnalytics: true,
      canManageAgency: userType === 'admin' || userType === 'agency',
      canAssignDJs: userType === 'admin' || userType === 'agency',
      canViewReports: true,
      canExportData: true,
      canManageUsers: userType === 'admin'
    };

    // Add agency-specific info
    if (userType === 'agency' && req.user.agency) {
      permissions.agencyId = req.user.agency.id;
      permissions.agencyName = req.user.agency.agency_name;
      permissions.subscriptionPlan = req.user.agency.subscription_plan;
      permissions.maxDJs = req.user.agency.max_djs;
      permissions.totalDJs = req.user.agency.total_djs || 0;
    }

    // Add DJ-specific info
    if (userType === 'individual_dj' && req.user.dj) {
      permissions.djId = req.user.dj.id;
      permissions.djName = req.user.dj.nombre;
    }

    res.json({
      success: true,
      permissions
    });
  } catch (error) {
    console.error('Error en getUserPermissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener permisos',
      error: error.message
    });
  }
};

export default {
  register,
  login,
  logout,
  getCurrentUser,
  changePassword,
  validateToken,
  getUserPermissions
};
