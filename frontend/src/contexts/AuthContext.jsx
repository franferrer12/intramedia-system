import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * AuthContext - Multi-Tenant Authentication
 * Manages authentication state for Agencies and Individual DJs
 */

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState(null);
  const navigate = useNavigate();

  // Validate token on mount
  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setLoading(false);
    }
  }, []);

  /**
   * Validate stored token
   */
  const validateToken = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/validate`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success && data.valid) {
        setUser(data.user);
        await fetchPermissions();
      } else {
        // Token invalid, clear it
        logout(false);
      }
    } catch (error) {
      console.error('Error validating token:', error);
      logout(false);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch user permissions
   */
  const fetchPermissions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/permissions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setPermissions(data.permissions);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  /**
   * Register new user (Agency or Individual DJ)
   */
  const register = async (userData) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (data.success) {
        // Store token
        localStorage.setItem('auth_token', data.token);
        setToken(data.token);
        setUser(data.user);

        // Fetch permissions
        await fetchPermissions();

        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.message || 'Error al registrar usuario' };
      }
    } catch (error) {
      console.error('Error in register:', error);
      return { success: false, error: 'Error de conexión al servidor' };
    }
  };

  /**
   * Login user
   */
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        // Store token
        localStorage.setItem('auth_token', data.token);
        setToken(data.token);
        setUser(data.user);

        // Fetch permissions
        await fetchPermissions();

        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.message || 'Credenciales inválidas' };
      }
    } catch (error) {
      console.error('Error in login:', error);
      return { success: false, error: 'Error de conexión al servidor' };
    }
  };

  /**
   * Logout user
   */
  const logout = async (callApi = true) => {
    if (callApi && token) {
      try {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('Error in logout:', error);
      }
    }

    // Clear local state
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    setPermissions(null);
    navigate('/login');
  };

  /**
   * Change password
   */
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.message || 'Error al cambiar contraseña' };
      }
    } catch (error) {
      console.error('Error changing password:', error);
      return { success: false, error: 'Error de conexión al servidor' };
    }
  };

  /**
   * Refresh user data
   */
  const refreshUser = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        await fetchPermissions();
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      return { success: false, error: 'Error de conexión al servidor' };
    }
  };

  /**
   * Check if user has specific permission
   */
  const hasPermission = (permission) => {
    if (!permissions) return false;
    return permissions[permission] === true;
  };

  /**
   * Check if user is admin
   */
  const isAdmin = () => {
    return user?.userType === 'admin';
  };

  /**
   * Check if user is agency
   */
  const isAgency = () => {
    return user?.userType === 'agency';
  };

  /**
   * Check if user is individual DJ
   */
  const isIndividualDJ = () => {
    return user?.userType === 'individual_dj';
  };

  /**
   * Get user display name
   */
  const getUserDisplayName = () => {
    if (!user) return '';

    if (user.userType === 'agency' && user.agency) {
      return user.agency.agency_name;
    } else if (user.userType === 'individual_dj' && user.dj) {
      return user.dj.nombre;
    } else if (user.userType === 'admin') {
      return 'Administrador';
    }

    return user.email;
  };

  const value = {
    user,
    token,
    loading,
    permissions,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    changePassword,
    refreshUser,
    hasPermission,
    isAdmin,
    isAgency,
    isIndividualDJ,
    getUserDisplayName
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
