import axiosInstance from './axios';
import { MovimientoStock, MovimientoStockFormData } from '../types';

export const movimientosApi = {
  getAll: async (): Promise<MovimientoStock[]> => {
    const { data } = await axiosInstance.get('/movimientos-stock');
    return data;
  },

  getByProducto: async (productoId: number): Promise<MovimientoStock[]> => {
    const { data } = await axiosInstance.get(`/movimientos-stock/producto/${productoId}`);
    return data;
  },

  registrar: async (formData: MovimientoStockFormData): Promise<MovimientoStock> => {
    const { data } = await axiosInstance.post('/movimientos-stock', formData);
    return data;
  },
};
