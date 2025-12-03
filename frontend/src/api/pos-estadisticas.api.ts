import axios from './axios';
import { SesionCajaDTO } from './pos-sesiones-caja.api';

export interface ProductoVendidoDTO {
  productoId: number;
  nombre: string;
  cantidadVendida: number;
  totalIngresos: number;
  numeroVentas: number;
}

export interface VentaPorHoraDTO {
  hora: number;
  cantidad: number;
  total: number;
}

export interface EstadisticasPOSDTO {
  // Estadísticas generales
  totalVentas: number;
  totalIngresos: number;
  productosVendidos: number;
  ticketPromedio: number;

  // Desglose por método de pago
  totalEfectivo: number;
  totalTarjeta: number;
  totalMixto: number;

  // Top productos
  topProductos: ProductoVendidoDTO[];

  // Ventas por hora
  ventasPorHora: VentaPorHoraDTO[];

  // Sesiones activas
  sesionesAbiertas: number;
  sesionesActivasDetalle: SesionCajaDTO[];
}

const BASE_URL = '/pos/estadisticas';

export const posEstadisticasApi = {
  // Estadísticas en rango de fechas
  getEstadisticas: async (fechaInicio: string, fechaFin: string): Promise<EstadisticasPOSDTO> => {
    const response = await axios.get(BASE_URL, {
      params: { fechaInicio, fechaFin }
    });
    return response.data;
  },

  // Estadísticas de hoy
  getHoy: async (): Promise<EstadisticasPOSDTO> => {
    const response = await axios.get(`${BASE_URL}/hoy`);
    return response.data;
  },

  // Estadísticas de la semana
  getSemana: async (): Promise<EstadisticasPOSDTO> => {
    const response = await axios.get(`${BASE_URL}/semana`);
    return response.data;
  },

  // Estadísticas del mes
  getMes: async (): Promise<EstadisticasPOSDTO> => {
    const response = await axios.get(`${BASE_URL}/mes`);
    return response.data;
  },

  // Top productos más vendidos
  getTopProductos: async (
    fechaInicio: string,
    fechaFin: string,
    limit: number = 10
  ): Promise<ProductoVendidoDTO[]> => {
    const response = await axios.get(`${BASE_URL}/top-productos`, {
      params: { fechaInicio, fechaFin, limit }
    });
    return response.data;
  },

  // Ventas por hora
  getVentasPorHora: async (
    fechaInicio: string,
    fechaFin: string
  ): Promise<VentaPorHoraDTO[]> => {
    const response = await axios.get(`${BASE_URL}/ventas-por-hora`, {
      params: { fechaInicio, fechaFin }
    });
    return response.data;
  },

  // Estadísticas de una sesión específica
  getSesion: async (sesionId: number): Promise<EstadisticasPOSDTO> => {
    const response = await axios.get(`${BASE_URL}/sesion/${sesionId}`);
    return response.data;
  }
};
