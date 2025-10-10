import axios from './axios';

export interface SesionCajaDTO {
  id: number;
  nombreCaja: string;
  empleadoAperturaId: number;
  empleadoAperturaNombre: string;
  empleadoCierreId?: number;
  empleadoCierreNombre?: string;
  fechaApertura: string;
  fechaCierre?: string;
  montoInicial: number;
  montoEsperado?: number;
  montoReal?: number;
  diferencia?: number;
  estado: 'ABIERTA' | 'CERRADA';
  observaciones?: string;
  totalVentas: number;
  totalIngresos: number;
  createdAt: string;
  updatedAt: string;
}

export interface AperturaCajaRequest {
  nombreCaja: string;
  empleadoAperturaId: number;
  montoInicial: number;
  observaciones?: string;
}

export interface CierreCajaRequest {
  empleadoCierreId: number;
  montoReal: number;
  observaciones?: string;
}

const BASE_URL = '/pos/sesiones-caja';

export const sesionCajaApi = {
  // Listar todas
  getAll: async (): Promise<SesionCajaDTO[]> => {
    const response = await axios.get(BASE_URL);
    return response.data;
  },

  // Obtener por ID
  getById: async (id: number): Promise<SesionCajaDTO> => {
    const response = await axios.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  // Listar sesiones abiertas
  getAbiertas: async (): Promise<SesionCajaDTO[]> => {
    const response = await axios.get(`${BASE_URL}/abiertas`);
    return response.data;
  },

  // Listar sesiones cerradas en rango de fechas
  getCerradas: async (fechaInicio: string, fechaFin: string): Promise<SesionCajaDTO[]> => {
    const response = await axios.get(`${BASE_URL}/cerradas`, {
      params: { fechaInicio, fechaFin }
    });
    return response.data;
  },

  // Obtener historial de una caja
  getByCaja: async (nombreCaja: string): Promise<SesionCajaDTO[]> => {
    const response = await axios.get(`${BASE_URL}/caja/${encodeURIComponent(nombreCaja)}`);
    return response.data;
  },

  // Obtener sesión abierta de una caja
  getSesionAbiertaPorCaja: async (nombreCaja: string): Promise<SesionCajaDTO | null> => {
    try {
      const response = await axios.get(`${BASE_URL}/caja/${encodeURIComponent(nombreCaja)}/abierta`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 204) {
        return null; // No hay sesión abierta
      }
      throw error;
    }
  },

  // Obtener sesiones de un empleado
  getByEmpleado: async (empleadoId: number): Promise<SesionCajaDTO[]> => {
    const response = await axios.get(`${BASE_URL}/empleado/${empleadoId}`);
    return response.data;
  },

  // Abrir nueva sesión
  abrir: async (request: AperturaCajaRequest): Promise<SesionCajaDTO> => {
    const response = await axios.post(`${BASE_URL}/abrir`, request);
    return response.data;
  },

  // Cerrar sesión
  cerrar: async (id: number, request: CierreCajaRequest): Promise<SesionCajaDTO> => {
    const response = await axios.post(`${BASE_URL}/${id}/cerrar`, request);
    return response.data;
  }
};
