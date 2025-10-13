import axios from './axios';

export interface DispositivoPOS {
  id: number;
  uuid: string;
  nombre: string;
  descripcion?: string;
  tipo: 'CAJA' | 'BARRA' | 'MOVIL';
  ubicacion?: string;
  empleadoAsignadoId?: number;
  empleadoAsignadoNombre?: string;
  categoriasPredeterminadas?: string[];
  configImpresora?: Record<string, any>;
  tieneLectorBarras?: boolean;
  tieneCajonDinero?: boolean;
  tienePantallaCliente?: boolean;
  permisos?: Record<string, any>;
  activo: boolean;
  modoOfflineHabilitado?: boolean;
  modoTabletCompartida?: boolean;
  asignacionPermanente?: boolean; // false = Quick Start (temporal), true = Asignación Fija
  ultimaConexion?: string;
  ultimaSincronizacion?: string;
  ipAddress?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DispositivoPOSRequest {
  nombre: string;
  descripcion?: string;
  tipo: 'CAJA' | 'BARRA' | 'MOVIL';
  ubicacion?: string;
  empleadoAsignadoId?: number;
  pin: string;
  categoriasPredeterminadas?: string[];
  configImpresora?: Record<string, any>;
  tieneLectorBarras?: boolean;
  tieneCajonDinero?: boolean;
  tienePantallaCliente?: boolean;
  modoTabletCompartida?: boolean;
  asignacionPermanente?: boolean; // false = Quick Start, true = Asignación Fija
  permisos?: Record<string, any>;
}

export interface AuthDispositivoResponse {
  token: string;
  type: string;
  dispositivo: DispositivoPOS;
  configuracion: ConfiguracionPOS;
}

export interface EmpleadoSimple {
  id: number;
  nombre: string;
  apellido: string;
  iniciales: string;
  puesto?: string;
  activo: boolean;
}

export interface ConfiguracionPOS {
  dispositivoId: number;
  categoriasPredeterminadas?: string[];
  permisos?: Record<string, any>;
  configImpresora?: Record<string, any>;
  tieneLectorBarras?: boolean;
  tieneCajonDinero?: boolean;
  tienePantallaCliente?: boolean;
  modoOfflineHabilitado?: boolean;
  modoTabletCompartida?: boolean;
  productosPrecargados?: any[];
  empleadosActivos?: EmpleadoSimple[];
  sesionCajaActiva?: number;
}

export interface VentaOffline {
  uuidVenta: string;
  datosVenta: Record<string, any>;
  fechaCreacionLocal?: string;
  sesionCajaId?: number;
}

export interface ResultadoSincronizacion {
  uuidVenta: string;
  exitoso: boolean;
  ventaId?: number;
  mensaje?: string;
  error?: string;
}

// Antiguo formato (mantener para backward compatibility)
export interface PairingToken {
  pairingToken: string;
  pairingUrl: string;
  qrCodeData: string;
  dispositivoId: number;
  dispositivoNombre: string;
  expiresAt: string;
}

// NUEVO: Sistema de pairing mejorado
export interface PairingTokenResponse {
  token: string; // UUID temporal
  pairingCode: string; // Código de 6 dígitos (ej: "842-931")
  expiresAt: string; // ISO timestamp
  qrCodeData: string; // URL completa para QR
  directLink: string; // Enlace directo
  validityMinutes: number; // 60 minutos
}

export interface DeviceAuthResponse {
  success: boolean;
  deviceUUID: string;
  deviceToken: string; // JWT de 30 días
  device: {
    id: number;
    uuid: string;
    nombre: string;
    tipo: string;
    ubicacion?: string;
    asignacionPermanente: boolean;
    modoTabletCompartida: boolean;
    config: {
      categoriasPredeterminadas?: string[];
      tieneLectorBarras: boolean;
      tieneCajonDinero: boolean;
      tienePantallaCliente: boolean;
      permisos?: Record<string, any>;
    };
  };
}

export const dispositivosPosApi = {
  // GESTIÓN DE DISPOSITIVOS (Admin)
  registrar: async (data: DispositivoPOSRequest): Promise<DispositivoPOS> => {
    const response = await axios.post('/dispositivos-pos/registrar', data);
    return response.data;
  },

  listarTodos: async (): Promise<DispositivoPOS[]> => {
    const response = await axios.get('/dispositivos-pos');
    return response.data;
  },

  listarActivos: async (): Promise<DispositivoPOS[]> => {
    const response = await axios.get('/dispositivos-pos/activos');
    return response.data;
  },

  obtenerPorId: async (id: number): Promise<DispositivoPOS> => {
    const response = await axios.get(`/dispositivos-pos/${id}`);
    return response.data;
  },

  actualizar: async (id: number, data: DispositivoPOSRequest): Promise<DispositivoPOS> => {
    const response = await axios.put(`/dispositivos-pos/${id}`, data);
    return response.data;
  },

  eliminar: async (id: number): Promise<void> => {
    await axios.delete(`/dispositivos-pos/${id}`);
  },

  // AUTENTICACIÓN Y EMPAREJAMIENTO
  generarTokenPairing: async (dispositivoId: number): Promise<PairingToken> => {
    const response = await axios.post(`/dispositivos-pos/${dispositivoId}/generar-token-pairing`);
    return response.data;
  },

  autenticarConToken: async (pairingToken: string): Promise<AuthDispositivoResponse> => {
    const response = await axios.post('/dispositivos-pos/autenticar-con-token', null, {
      params: { pairingToken }
    });
    return response.data;
  },

  autenticarConEmpleado: async (identifier: string): Promise<AuthDispositivoResponse> => {
    const response = await axios.post('/dispositivos-pos/autenticar-con-empleado', null, {
      params: { identifier }
    });
    return response.data;
  },

  autenticarConPIN: async (uuid: string, pin: string): Promise<AuthDispositivoResponse> => {
    const response = await axios.post('/auth/device/login', { uuid, pin });
    return response.data;
  },

  obtenerConfiguracion: async (id: number): Promise<ConfiguracionPOS> => {
    const response = await axios.get(`/dispositivos-pos/${id}/configuracion`);
    return response.data;
  },

  registrarHeartbeat: async (id: number): Promise<void> => {
    await axios.post(`/dispositivos-pos/${id}/heartbeat`);
  },

  // SINCRONIZACIÓN OFFLINE
  sincronizarVentasOffline: async (
    ventas: VentaOffline[],
    dispositivoId: number
  ): Promise<ResultadoSincronizacion[]> => {
    const response = await axios.post('/dispositivos-pos/ventas-offline/sincronizar', ventas, {
      params: { dispositivoId }
    });
    return response.data;
  },

  obtenerVentasPendientes: async (id: number): Promise<VentaOffline[]> => {
    const response = await axios.get(`/dispositivos-pos/${id}/ventas-pendientes`);
    return response.data;
  },

  // LOGS
  obtenerLogs: async (id: number, limit: number = 100): Promise<any[]> => {
    const response = await axios.get(`/dispositivos-pos/${id}/logs`, {
      params: { limit }
    });
    return response.data;
  },

  registrarLog: async (
    id: number,
    tipoEvento: string,
    descripcion: string,
    metadata?: Record<string, any>
  ): Promise<void> => {
    await axios.post(`/dispositivos-pos/${id}/log`, metadata || {}, {
      params: { tipoEvento, descripcion }
    });
  },

  // VINCULACIÓN TEMPORAL (QUICK START)
  vincularTemporalmente: async (dispositivoId: number, empleadoId: number): Promise<DispositivoPOS> => {
    const response = await axios.post(`/dispositivos-pos/${dispositivoId}/vincular-temporal`, null, {
      params: { empleadoId }
    });
    return response.data;
  },

  desvincular: async (dispositivoId: number): Promise<DispositivoPOS> => {
    const response = await axios.post(`/dispositivos-pos/${dispositivoId}/desvincular`);
    return response.data;
  },

  // NUEVO SISTEMA DE PAIRING (bypass Railway WAF)
  // Usa path /api/auth/device/** que está whitelisteado
  generarTokenPairingNuevo: async (dispositivoId: number): Promise<PairingTokenResponse> => {
    const response = await axios.get(`/auth/device/${dispositivoId}/qr`);
    return response.data;
  },

  vincularPorToken: async (token: string): Promise<DeviceAuthResponse> => {
    // Usa /api/auth/device/setup con parámetro 'p'
    const response = await axios.get('/auth/device/setup', {
      params: { p: token }
    });
    return response.data;
  },

  vincularPorCodigo: async (code: string): Promise<DeviceAuthResponse> => {
    // Usa /api/auth/device/pair
    const response = await axios.get('/auth/device/pair', {
      params: { code }
    });
    return response.data;
  },
};
