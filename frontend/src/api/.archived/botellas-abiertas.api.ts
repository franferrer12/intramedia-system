import axiosInstance from './axios';

// ========== TYPES ==========

export enum EstadoBotella {
  ABIERTA = 'ABIERTA',
  CERRADA = 'CERRADA',
  DESPERDICIADA = 'DESPERDICIADA'
}

export interface BotellaAbierta {
  id: number;
  productoId: number;
  productoNombre: string;
  productoCategoria: string;
  precioCopa: number;
  sesionCajaId?: number;
  ubicacion: string;
  copasTotales: number;
  copasServidas: number;
  copasRestantes: number;
  porcentajeConsumido: number;
  fechaApertura: string;
  fechaCierre?: string;
  horasAbierta: number;
  estado: EstadoBotella;
  abiertaPorId?: number;
  abiertaPorNombre?: string;
  cerradaPorId?: number;
  cerradaPorNombre?: string;
  ingresosGenerados: number;
  ingresosPotencialesPerdidos: number;
  alerta?: 'VACÍA' | 'CASI_VACÍA' | 'ABIERTA_MAS_24H' | null;
  notas?: string;
  createdAt: string;
  updatedAt: string;
  isCasiVacia: boolean;
  isVacia: boolean;
  isAbiertaMas24Horas: boolean;
}

export interface AbrirBotellaRequest {
  productoId: number;
  ubicacion: string;
  empleadoId: number;
  sesionCajaId?: number;
  notas?: string;
}

export interface CerrarBotellaRequest {
  botellaId: number;
  empleadoId: number;
  motivo: EstadoBotella.CERRADA | EstadoBotella.DESPERDICIADA;
  notas?: string;
}

export interface StockTotal {
  productoId: number;
  productoNombre: string;
  categoria: string;
  stockCerradoBotellas: number;
  stockAbiertoBotellas: number;
  copasDisponibles: number;
  stockAbiertoEquivalenteBotellas: number;
  stockTotalEquivalente: number;
  stockMinimo: number;
  stockMaximo?: number;
  nivelStock: 'BAJO' | 'NORMAL' | 'ALTO';
  ubicacionesBotellas: string[];
}

export interface ResumenBotellas {
  productoId: number;
  productoNombre: string;
  categoria?: string;
  totalBotellasAbiertas: number;
  totalCopasServidas: number;
  totalCopasDisponibles: number;
  equivalenteBotellas?: number;
  ubicaciones: string[];
  botellaMasAntigua?: string;
  botellaMasReciente?: string;
  tieneAlertaCasiVacia: boolean;
  tieneAlertaMas24h: boolean;
  botellasConAlertas: number;
}

// ========== API METHODS ==========

export const botellasAbiertasApi = {
  // ===== Consultas =====

  /**
   * Obtener todas las botellas abiertas (estado ABIERTA)
   */
  getAbiertas: async (): Promise<BotellaAbierta[]> => {
    const { data } = await axiosInstance.get('/botellas-abiertas');
    return data;
  },

  /**
   * Obtener todas las botellas (incluye cerradas y desperdiciadas)
   */
  getAll: async (): Promise<BotellaAbierta[]> => {
    const { data } = await axiosInstance.get('/botellas-abiertas/todas');
    return data;
  },

  /**
   * Obtener una botella por ID
   */
  getById: async (id: number): Promise<BotellaAbierta> => {
    const { data } = await axiosInstance.get(`/botellas-abiertas/${id}`);
    return data;
  },

  /**
   * Obtener botellas abiertas de un producto específico
   */
  getPorProducto: async (productoId: number): Promise<BotellaAbierta[]> => {
    const { data } = await axiosInstance.get(`/botellas-abiertas/producto/${productoId}`);
    return data;
  },

  /**
   * Obtener botellas abiertas por ubicación
   */
  getPorUbicacion: async (ubicacion: string): Promise<BotellaAbierta[]> => {
    const { data } = await axiosInstance.get(`/botellas-abiertas/ubicacion/${ubicacion}`);
    return data;
  },

  /**
   * Obtener botellas con alertas (casi vacías o abiertas más de 24h)
   */
  getConAlertas: async (): Promise<BotellaAbierta[]> => {
    const { data } = await axiosInstance.get('/botellas-abiertas/alertas');
    return data;
  },

  // ===== Operaciones =====

  /**
   * Abrir una nueva botella
   */
  abrir: async (request: AbrirBotellaRequest): Promise<BotellaAbierta> => {
    const { data } = await axiosInstance.post('/botellas-abiertas/abrir', request);
    return data;
  },

  /**
   * Cerrar una botella manualmente
   */
  cerrar: async (request: CerrarBotellaRequest): Promise<BotellaAbierta> => {
    const { data } = await axiosInstance.post('/botellas-abiertas/cerrar', request);
    return data;
  },

  // ===== Estadísticas =====

  /**
   * Obtener resumen de botellas abiertas por producto
   */
  getResumen: async (): Promise<ResumenBotellas[]> => {
    const { data } = await axiosInstance.get('/botellas-abiertas/resumen');
    return data;
  },

  /**
   * Calcular copas disponibles de un producto
   */
  getCopasDisponibles: async (productoId: number): Promise<number> => {
    const { data } = await axiosInstance.get(`/botellas-abiertas/copas-disponibles/${productoId}`);
    return data;
  },

  /**
   * Obtener stock total consolidado (cerrado + abierto)
   */
  getStockTotal: async (): Promise<StockTotal[]> => {
    const { data } = await axiosInstance.get('/botellas-abiertas/stock-total');
    return data;
  },

  /**
   * Obtener ubicaciones predefinidas
   */
  getUbicaciones: async (): Promise<string[]> => {
    const { data } = await axiosInstance.get('/botellas-abiertas/ubicaciones');
    return data;
  },
};
