import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // withCredentials: true, // Deshabilitado temporalmente para evitar CORS con Railway
});

// Interceptor para agregar el token en cada petición
axiosInstance.interceptors.request.use(
  (config) => {
    const currentPath = window.location.pathname;
    let token = null;
    let tokenType = 'none';

    // IMPORTANTE: Si estamos en terminal POS, SIEMPRE usar device_token
    if (currentPath.startsWith('/pos-terminal')) {
      token = localStorage.getItem('device_token');
      tokenType = 'device';
    } else {
      // En backoffice, usar token de admin
      token = localStorage.getItem('token');
      tokenType = 'admin';

      // Si no hay token de admin, intentar token de dispositivo POS (fallback)
      if (!token) {
        token = localStorage.getItem('device_token');
        tokenType = 'device';
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Log para debugging (solo en desarrollo)
      if (config.url?.includes('sincronizar') || config.url?.includes('heartbeat')) {
        console.log(`🔑 Usando token tipo: ${tokenType} para ${config.method?.toUpperCase()} ${config.url}`);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log detallado de errores 401/403 para debugging
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error(`❌ ${error.response.status} ${error.response.statusText}:`, {
        url: error.config?.url,
        method: error.config?.method,
        hasToken: !!error.config?.headers?.Authorization,
        response: error.response.data
      });

      const currentPath = window.location.pathname;

      // IMPORTANTE: No limpiar tokens en terminal POS - solo registrar el error
      // El terminal POS maneja sus propios errores de auth sin borrar el device_token
      if (!currentPath.startsWith('/pos-terminal')) {
        // Limpiar tokens solo en backoffice
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('device_token');
        localStorage.removeItem('device_uuid');
        localStorage.removeItem('device_data');
        localStorage.removeItem('device_config');
        localStorage.removeItem('device_token_expires_at');
        localStorage.removeItem('device_config_last_update');

        // Redirigir a login si no estamos ya ahí
        if (!currentPath.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
