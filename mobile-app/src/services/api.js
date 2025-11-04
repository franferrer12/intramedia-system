import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure API base URL - change to your backend URL
const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  me: () => api.get('/auth/me'),
};

export const requestsAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/requests${params ? `?${params}` : ''}`);
  },
  getById: (id) => api.get(`/requests/${id}`),
  getStats: () => api.get('/requests/stats'),
  create: (data) => api.post('/requests', data),
  update: (id, data) => api.put(`/requests/${id}`, data),
  delete: (id) => api.delete(`/requests/${id}`),
};

export const eventsAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/eventos${params ? `?${params}` : ''}`);
  },
  getById: (id) => api.get(`/eventos/${id}`),
  getUpcoming: (days = 7) => api.get(`/eventos/upcoming?days=${days}`),
  getByDJ: (djId) => api.get(`/eventos?dj_id=${djId}`),
};

export const djAPI = {
  getProfile: (id) => api.get(`/djs/${id}`),
  updateProfile: (id, data) => api.put(`/djs/${id}`, data),
  getStats: (id) => api.get(`/djs/${id}/stats`),
};

export const notificationsAPI = {
  getAll: (limit = 20) => api.get(`/social-media/${await AsyncStorage.getItem('userId')}/notifications?limit=${limit}`),
  markAsRead: (notificationId) => api.put(`/notificaciones/${notificationId}/read`),
  markAllAsRead: () => api.put('/notificaciones/read-all'),
};

export default api;
