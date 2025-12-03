import axios from './axios';

export interface DetalleVentaDTO {
  id: number;
  productoId: number;
  productoNombre: string;
  productoCategoria?: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  descuento: number;
  total: number;
}

export interface VentaDTO {
  id: number;
  numeroTicket: string;
  fecha: string;
  subtotal: number;
  descuento: number;
  total: number;
  metodoPago: 'EFECTIVO' | 'TARJETA' | 'MIXTO';
  montoEfectivo?: number;
  montoTarjeta?: number;
  sesionCajaId: number;
  sesionCajaNombre: string;
  empleadoId: number;
  empleadoNombre: string;
  eventoId?: number;
  eventoNombre?: string;
  clienteNombre?: string;
  observaciones?: string;
  detalles: DetalleVentaDTO[];
  createdAt: string;
}

export interface DetalleVentaRequest {
  productoId: number;
  cantidad: number;
  precioUnitario?: number;
  descuento?: number;
}

export interface VentaRequest {
  sesionCajaId: number;
  empleadoId: number;
  metodoPago: 'EFECTIVO' | 'TARJETA' | 'MIXTO';
  montoEfectivo?: number;
  montoTarjeta?: number;
  eventoId?: number;
  clienteNombre?: string;
  observaciones?: string;
  detalles: DetalleVentaRequest[];
}

const BASE_URL = '/pos/ventas';

export const ventaApi = {
  // Listar todas
  getAll: async (): Promise<VentaDTO[]> => {
    const response = await axios.get(BASE_URL);
    return response.data;
  },

  // Obtener por ID
  getById: async (id: number): Promise<VentaDTO> => {
    const response = await axios.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  // Buscar por número de ticket
  getByTicket: async (numeroTicket: string): Promise<VentaDTO> => {
    const response = await axios.get(`${BASE_URL}/ticket/${numeroTicket}`);
    return response.data;
  },

  // Obtener ventas de una sesión
  getBySesionCaja: async (sesionCajaId: number): Promise<VentaDTO[]> => {
    const response = await axios.get(`${BASE_URL}/sesion/${sesionCajaId}`);
    return response.data;
  },

  // Obtener ventas de un empleado
  getByEmpleado: async (empleadoId: number): Promise<VentaDTO[]> => {
    const response = await axios.get(`${BASE_URL}/empleado/${empleadoId}`);
    return response.data;
  },

  // Obtener ventas de un evento
  getByEvento: async (eventoId: number): Promise<VentaDTO[]> => {
    const response = await axios.get(`${BASE_URL}/evento/${eventoId}`);
    return response.data;
  },

  // Obtener ventas en rango de fechas
  getByRangoFechas: async (fechaInicio: string, fechaFin: string): Promise<VentaDTO[]> => {
    const response = await axios.get(`${BASE_URL}/rango-fechas`, {
      params: { fechaInicio, fechaFin }
    });
    return response.data;
  },

  // Crear nueva venta
  create: async (request: VentaRequest): Promise<VentaDTO> => {
    const response = await axios.post(BASE_URL, request);
    return response.data;
  }
};
