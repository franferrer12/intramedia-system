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

// === AVAILABILITY ===
export const availabilityAPI = {
  // Obtener todas las disponibilidades con filtros
  getAll: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/availability${params ? `?${params}` : ''}`);
  },

  // Obtener disponibilidad por ID
  getById: (id) => api.get(`/availability/${id}`),

  // Crear/actualizar disponibilidad
  upsert: (data) => api.post('/availability', data),

  // Actualizar disponibilidad existente
  update: (id, data) => api.put(`/availability/${id}`, data),

  // Eliminar disponibilidad
  delete: (id) => api.delete(`/availability/${id}`),

  // Verificar disponibilidad de DJ
  checkAvailability: (djId, fecha, horaInicio, horaFin) => {
    const params = new URLSearchParams({
      dj_id: djId,
      fecha,
      ...(horaInicio && { hora_inicio: horaInicio }),
      ...(horaFin && { hora_fin: horaFin })
    });
    return api.get(`/availability/check?${params.toString()}`);
  },

  // Detectar conflictos
  detectConflicts: (djId, fecha, horaInicio, horaFin, excludeId) => {
    const params = new URLSearchParams({
      dj_id: djId,
      fecha,
      ...(horaInicio && { hora_inicio: horaInicio }),
      ...(horaFin && { hora_fin: horaFin }),
      ...(excludeId && { exclude_id: excludeId })
    });
    return api.get(`/availability/conflicts?${params.toString()}`);
  },

  // Buscar DJs disponibles
  findAvailableDJs: (fecha, horaInicio, horaFin, agencyId) => {
    const params = new URLSearchParams({
      fecha,
      ...(horaInicio && { hora_inicio: horaInicio }),
      ...(horaFin && { hora_fin: horaFin }),
      ...(agencyId && { agency_id: agencyId })
    });
    return api.get(`/availability/available-djs?${params.toString()}`);
  },

  // 🆕 Sugerencias inteligentes de DJs alternativos
  getSmartSuggestions: (originalDjId, fecha, horaInicio, horaFin, agencyId) => {
    const params = new URLSearchParams({
      original_dj_id: originalDjId,
      fecha,
      ...(horaInicio && { hora_inicio: horaInicio }),
      ...(horaFin && { hora_fin: horaFin }),
      ...(agencyId && { agency_id: agencyId })
    });
    return api.get(`/availability/smart-suggestions?${params.toString()}`);
  },

  // 🆕 Resumen completo del calendario mensual
  getCalendarSummary: (year, month, djId, agencyId) => {
    const params = new URLSearchParams({
      year,
      month,
      ...(djId && { dj_id: djId }),
      ...(agencyId && { agency_id: agencyId })
    });
    return api.get(`/availability/calendar-summary?${params.toString()}`);
  },

  // Obtener calendario mensual de DJ
  getCalendar: (djId, year, month) => {
    const params = new URLSearchParams({ year, month });
    return api.get(`/availability/dj/${djId}/calendar?${params.toString()}`);
  },

  // Obtener disponibilidad por rango de fechas
  getByDateRange: (djId, fechaInicio, fechaFin) => {
    const params = new URLSearchParams({
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin
    });
    return api.get(`/availability/dj/${djId}/range?${params.toString()}`);
  },

  // Obtener disponibilidad de agencia
  getAgencyAvailability: (year, month) => {
    const params = new URLSearchParams({ year, month });
    return api.get(`/availability/agency?${params.toString()}`);
  },

  // Marcar fecha como no disponible
  markUnavailable: (djId, fecha, motivo, notas) => {
    return api.post('/availability/mark-unavailable', {
      dj_id: djId,
      fecha,
      motivo,
      notas
    });
  },

  // Marcar fecha como disponible
  markAvailable: (djId, fecha) => {
    return api.post('/availability/mark-available', {
      dj_id: djId,
      fecha
    });
  },

  // Reservar fecha para evento
  reserveForEvent: (djId, fecha, eventoId, horaInicio, horaFin) => {
    return api.post('/availability/reserve', {
      dj_id: djId,
      fecha,
      evento_id: eventoId,
      hora_inicio: horaInicio,
      hora_fin: horaFin
    });
  },

  // Bloquear rango de fechas
  blockDateRange: (djId, fechaInicio, fechaFin, motivo, notas) => {
    return api.post('/availability/block-range', {
      dj_id: djId,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      motivo,
      notas
    });
  },

  // 🆕 Notificar conflictos
  notifyConflicts: (djId, fecha, conflicts) => {
    return api.post('/availability/notify-conflicts', {
      dj_id: djId,
      fecha,
      conflicts
    });
  },

  // Obtener estadísticas de disponibilidad
  getStats: (djId, year, month) => {
    const params = new URLSearchParams({ year, month });
    return api.get(`/availability/dj/${djId}/stats?${params.toString()}`);
  },

  // Limpiar registros antiguos (admin)
  cleanupOld: (days = 90) => {
    return api.post(`/availability/cleanup?days=${days}`);
  }
};

// === DOCUMENTS ===
export const documentsAPI = {
  // Get all documents with filters
  getAll: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/documents${params ? `?${params}` : ''}`);
  },

  // Get document by ID
  getById: (id) => api.get(`/documents/${id}`),

  // Upload document
  upload: (formData) => {
    return api.post('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Update document metadata
  update: (id, data) => api.put(`/documents/${id}`, data),

  // Delete document
  delete: (id) => api.delete(`/documents/${id}`),

  // Download document
  download: (id) => {
    return api.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });
  },

  // Search documents
  search: (query, filters = {}) => {
    const params = new URLSearchParams({ q: query, ...filters }).toString();
    return api.get(`/documents/search?${params}`);
  },

  // Get recent documents
  getRecent: (limit = 10) => {
    return api.get(`/documents/recent?limit=${limit}`);
  },

  // Get document statistics
  getStats: () => api.get('/documents/stats'),

  // Get popular tags
  getTags: (limit = 50) => {
    return api.get(`/documents/tags?limit=${limit}`);
  },

  // === VERSIONING ===

  // Get version history
  getVersionHistory: (id) => api.get(`/documents/${id}/versions`),

  // Create new version
  createVersion: (id, formData) => {
    return api.post(`/documents/${id}/versions`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Rollback to version
  rollbackVersion: (id, version) => {
    return api.post(`/documents/${id}/versions/${version}/rollback`);
  },

  // === SHARING ===

  // Get document shares
  getShares: (id) => api.get(`/documents/${id}/shares`),

  // Share document
  share: (id, shareData) => api.post(`/documents/${id}/share`, shareData),

  // Unshare document
  unshare: (shareId) => api.delete(`/documents/shares/${shareId}`),

  // Generate share link
  generateShareLink: (id, options = {}) => {
    return api.post(`/documents/${id}/share-link`, options);
  },

  // Revoke share link
  revokeShareLink: (id) => api.delete(`/documents/${id}/share-link`),

  // Get shared document (public)
  getSharedDocument: (token, password) => {
    const params = password ? `?password=${encodeURIComponent(password)}` : '';
    return api.get(`/documents/shared/${token}${params}`);
  },

  // === AUDIT ===

  // Get access logs (admin only)
  getAccessLogs: (id, limit = 50, offset = 0) => {
    return api.get(`/documents/${id}/logs?limit=${limit}&offset=${offset}`);
  },
};

export default api;
