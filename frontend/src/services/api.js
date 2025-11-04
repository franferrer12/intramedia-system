import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token si existe
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// === EVENTOS ===
export const eventosAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/eventos${params ? `?${params}` : ''}`);
  },

  getById: (id) => api.get(`/eventos/${id}`),

  create: (data) => api.post('/eventos', data),

  update: (id, data) => api.put(`/eventos/${id}`, data),

  delete: (id) => api.delete(`/eventos/${id}`),

  getStatsByMonth: (mes) => api.get(`/eventos/stats/${mes}`),

  getUpcoming: (days = 7) => api.get(`/eventos/upcoming?days=${days}`),
};

// === DJs ===
export const djsAPI = {
  getAll: () => api.get('/djs'),

  getById: (id) => api.get(`/djs/${id}`),

  create: (data) => api.post('/djs', data),

  update: (id, data) => api.put(`/djs/${id}`, data),

  getEventos: (id, filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/djs/${id}/eventos${params ? `?${params}` : ''}`);
  },

  getStatsByMonth: (id, mes) => api.get(`/djs/${id}/stats/${mes}`),
};

// === CLIENTES ===
export const clientesAPI = {
  getAll: () => api.get('/clientes'),

  getById: (id) => api.get(`/clientes/${id}`),

  create: (data) => api.post('/clientes', data),

  update: (id, data) => api.put(`/clientes/${id}`, data),
};

// === ESTADÍSTICAS ===
export const estadisticasAPI = {
  getKPIs: () => api.get('/estadisticas/kpis'),

  getDashboardFinanciero: (year) => {
    const params = year ? `?year=${year}` : '';
    return api.get(`/estadisticas/dashboard-financiero${params}`);
  },

  getDJStats: (djId, year) => {
    const params = year ? `?year=${year}` : '';
    return api.get(`/estadisticas/dj/${djId}${params}`);
  },

  getRanking: (year, metric = 'eventos') => {
    const params = new URLSearchParams({ year, metric }).toString();
    return api.get(`/estadisticas/ranking?${params}`);
  },

  getCrecimiento: () => api.get('/estadisticas/crecimiento'),
};

// === SOCIOS ===
export const sociosAPI = {
  getAll: () => api.get('/socios'),

  getDashboard: () => api.get('/socios/dashboard'),

  getReporte: (year, socioId) => {
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (socioId) params.append('socio_id', socioId);
    return api.get(`/socios/reporte?${params.toString()}`);
  },

  update: (id, data) => api.put(`/socios/${id}`, data),
};

// === AGENCIES ===
export const agenciesAPI = {
  // Get agency stats/dashboard
  getStats: () => api.get('/agencies/stats'),

  // Get agency DJs
  getDJs: () => api.get('/agencies/djs'),

  // Add DJ to agency
  addDJ: (djData) => api.post('/agencies/djs', djData),

  // Remove DJ from agency
  removeDJ: (djId) => api.delete(`/agencies/djs/${djId}`),

  // Update agency settings
  updateSettings: (settings) => api.put('/agencies/settings', settings),

  // Get agency profile
  getProfile: () => api.get('/agencies/profile'),

  // Update agency profile
  updateProfile: (data) => api.put('/agencies/profile', data),
};

// === REQUESTS (Solicitudes de DJs) ===
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

// === PROFIT DISTRIBUTION ===
export const profitDistributionAPI = {
  getConfig: () => api.get('/profit-distribution/config'),

  updateConfig: (config) => api.put('/profit-distribution/config', config),

  recalculate: () => api.post('/profit-distribution/recalculate'),

  getFinancialBreakdown: (eventoId) => api.get(`/eventos/${eventoId}/financial-breakdown`),

  getMonthlySummary: () => api.get('/eventos/financial-summary/monthly'),

  getPartnersSummary: () => api.get('/eventos/financial-summary/partners'),
};

// === MONTHLY EXPENSES ===
export const monthlyExpensesAPI = {
  getAll: (params) => api.get('/monthly-expenses', { params }),
  getByPeriod: (year, month) => api.get(`/monthly-expenses/${year}/${month}`),
  create: (data) => api.post('/monthly-expenses', data),
  update: (year, month, data) => api.put(`/monthly-expenses/${year}/${month}`, data),
  calculateBudget: (year, month) => api.post(`/monthly-expenses/${year}/${month}/calculate-budget`),
  redistribute: (year, month) => api.post(`/monthly-expenses/${year}/${month}/redistribute`),
  closePeriod: (year, month) => api.post(`/monthly-expenses/${year}/${month}/close`),
  getBudgetVsReal: (params) => api.get('/monthly-expenses/budget-vs-real', { params })
};

export default api;
