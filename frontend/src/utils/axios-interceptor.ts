import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { handleApiError } from './notifications';

// Crear una instancia de axios
export const axiosInstance = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de peticiones (Request)
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Obtener el token de autenticación
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log de la petición en desarrollo
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Interceptor de respuestas (Response)
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log de la respuesta en desarrollo
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }

    return response;
  },
  (error: AxiosError) => {
    // Log del error
    console.error('[API Response Error]', error.response || error);

    // Manejo especial de errores de autenticación
    if (error.response?.status === 401) {
      // Limpiar el storage y redirigir al login
      localStorage.removeItem('auth-storage');

      // Solo redirigir si no estamos ya en la página de login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Manejo de errores de red
    if (!error.response) {
      handleApiError(error, 'Error de conexión');
      return Promise.reject(error);
    }

    // Dejar que el componente maneje el error específico
    // pero ya tenemos el interceptor que muestra el mensaje
    return Promise.reject(error);
  }
);

/**
 * Helper para hacer peticiones GET con manejo de errores
 */
export const apiGet = async <T = any>(url: string, config?: any): Promise<T> => {
  const response = await axiosInstance.get<T>(url, config);
  return response.data;
};

/**
 * Helper para hacer peticiones POST con manejo de errores
 */
export const apiPost = async <T = any>(url: string, data?: any, config?: any): Promise<T> => {
  const response = await axiosInstance.post<T>(url, data, config);
  return response.data;
};

/**
 * Helper para hacer peticiones PUT con manejo de errores
 */
export const apiPut = async <T = any>(url: string, data?: any, config?: any): Promise<T> => {
  const response = await axiosInstance.put<T>(url, data, config);
  return response.data;
};

/**
 * Helper para hacer peticiones PATCH con manejo de errores
 */
export const apiPatch = async <T = any>(url: string, data?: any, config?: any): Promise<T> => {
  const response = await axiosInstance.patch<T>(url, data, config);
  return response.data;
};

/**
 * Helper para hacer peticiones DELETE con manejo de errores
 */
export const apiDelete = async <T = any>(url: string, config?: any): Promise<T> => {
  const response = await axiosInstance.delete<T>(url, config);
  return response.data;
};

export default axiosInstance;
