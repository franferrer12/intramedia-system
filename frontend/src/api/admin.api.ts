import axios from './axios';

// ==================== TYPES ====================

export interface SystemLog {
  id: number;
  nivel: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  modulo: string;
  accion: string;
  mensaje: string;
  detalles?: any;
  usuarioId?: number;
  usuarioNombre?: string;
  ipAddress?: string;
  userAgent?: string;
  stackTrace?: string;
  fechaHora: string;
}

export interface ConfiguracionSistema {
  id: number;
  clave: string;
  valor: string;
  tipo: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  categoria: string;
  descripcion?: string;
  modificadoPorId?: number;
  modificadoPorNombre?: string;
  fechaModificacion: string;
}

export interface Usuario {
  id: number;
  username: string;
  email: string;
  nombre?: string;
  apellidos?: string;
  rol: string;
  activo: boolean;
  fechaCreacion: string;
  ultimoAcceso?: string;
}

export interface LogsFilters {
  nivel?: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  modulo?: string;
  usuarioId?: number;
  fechaInicio?: string;
  fechaFin?: string;
  page?: number;
  size?: number;
}

export interface LogsPage {
  content: SystemLog[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface LogEstadisticas {
  totalLogs: number;
  erroresUltimaHora: number;
  erroresUltimas24Horas: number;
  totalErrores: number;
  totalWarnings: number;
  totalInfo: number;
  modulos: string[];
}

export interface UserEstadisticas {
  totalUsuarios: number;
  usuariosActivos: number;
  usuariosInactivos: number;
  usuariosPorRol: Record<string, number>;
}

// ==================== SYSTEM LOGS API ====================

export const adminLogsApi = {
  getLogs: async (filters: LogsFilters = {}): Promise<LogsPage> => {
    const params = new URLSearchParams();

    if (filters.nivel) params.append('nivel', filters.nivel);
    if (filters.modulo) params.append('modulo', filters.modulo);
    if (filters.usuarioId) params.append('usuarioId', filters.usuarioId.toString());
    if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
    if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);
    if (filters.page !== undefined) params.append('page', filters.page.toString());
    if (filters.size !== undefined) params.append('size', filters.size.toString());

    const response = await axios.get<LogsPage>(`/admin/logs?${params.toString()}`);
    return response.data;
  },

  getRecentLogs: async (limit: number = 20): Promise<SystemLog[]> => {
    const response = await axios.get<SystemLog[]>(`/admin/logs/recent?limit=${limit}`);
    return response.data;
  },

  getEstadisticas: async (): Promise<LogEstadisticas> => {
    const response = await axios.get<LogEstadisticas>('/admin/logs/estadisticas');
    return response.data;
  },

  getModulos: async (): Promise<string[]> => {
    const response = await axios.get<string[]>('/admin/logs/modulos');
    return response.data;
  },

  limpiarLogsAntiguos: async (fecha: string): Promise<void> => {
    await axios.delete(`/admin/logs/limpiar?fecha=${fecha}`);
  },
};

// ==================== CONFIGURATION API ====================

export const adminConfigApi = {
  getAll: async (): Promise<ConfiguracionSistema[]> => {
    const response = await axios.get<ConfiguracionSistema[]>('/admin/configuracion');
    return response.data;
  },

  getByCategoria: async (categoria: string): Promise<ConfiguracionSistema[]> => {
    const response = await axios.get<ConfiguracionSistema[]>(`/admin/configuracion/categoria/${categoria}`);
    return response.data;
  },

  getCategorias: async (): Promise<string[]> => {
    const response = await axios.get<string[]>('/admin/configuracion/categorias');
    return response.data;
  },

  getByClave: async (clave: string): Promise<ConfiguracionSistema> => {
    const response = await axios.get<ConfiguracionSistema>(`/admin/configuracion/${clave}`);
    return response.data;
  },

  update: async (clave: string, valor: string): Promise<ConfiguracionSistema> => {
    const response = await axios.put<ConfiguracionSistema>(`/admin/configuracion/${clave}?valor=${encodeURIComponent(valor)}`);
    return response.data;
  },

  create: async (config: Partial<ConfiguracionSistema>): Promise<ConfiguracionSistema> => {
    const response = await axios.post<ConfiguracionSistema>('/admin/configuracion', config);
    return response.data;
  },

  delete: async (clave: string): Promise<void> => {
    await axios.delete(`/admin/configuracion/${clave}`);
  },

  buscar: async (query: string): Promise<ConfiguracionSistema[]> => {
    const response = await axios.get<ConfiguracionSistema[]>(`/admin/configuracion/buscar?query=${encodeURIComponent(query)}`);
    return response.data;
  },

  getMapa: async (): Promise<Record<string, string>> => {
    const response = await axios.get<Record<string, string>>('/admin/configuracion/mapa');
    return response.data;
  },
};

// ==================== USER MANAGEMENT API ====================

export const adminUsersApi = {
  getAll: async (): Promise<Usuario[]> => {
    const response = await axios.get<Usuario[]>('/admin/usuarios');
    return response.data;
  },

  getById: async (id: number): Promise<Usuario> => {
    const response = await axios.get<Usuario>(`/admin/usuarios/${id}`);
    return response.data;
  },

  updateRol: async (id: number, rol: string): Promise<Usuario> => {
    const response = await axios.put<Usuario>(`/admin/usuarios/${id}/rol?rol=${rol}`);
    return response.data;
  },

  toggleActivo: async (id: number): Promise<Usuario> => {
    const response = await axios.put<Usuario>(`/admin/usuarios/${id}/activo`);
    return response.data;
  },

  resetPassword: async (id: number): Promise<{ message: string; temporaryPassword: string }> => {
    const response = await axios.post<{ message: string; temporaryPassword: string }>(`/admin/usuarios/${id}/reset-password`);
    return response.data;
  },

  getEstadisticas: async (): Promise<UserEstadisticas> => {
    const response = await axios.get<UserEstadisticas>('/admin/usuarios/estadisticas');
    return response.data;
  },
};

// ==================== SYSTEM HEALTH API ====================

export const adminHealthApi = {
  getHealth: async (): Promise<any> => {
    const response = await axios.get('/admin/health');
    return response.data;
  },
};
