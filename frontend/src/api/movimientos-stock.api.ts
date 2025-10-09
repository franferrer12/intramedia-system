import axiosInstance from './axios';

export interface MovimientoStock {
  id: number;
  productoId: number;
  productoNombre: string;
  productoCodigo: string;
  tipoMovimiento: string;
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  precioUnitario?: number;
  costoTotal?: number;
  motivo?: string;
  referencia?: string;
  eventoId?: number;
  eventoNombre?: string;
  proveedorId?: number;
  proveedorNombre?: string;
  usuarioNombre?: string;
  fechaMovimiento: string;
  notas?: string;
  creadoEn: string;
}

export interface MovimientoStockFormData {
  productoId: number;
  tipoMovimiento: string;
  cantidad: number;
  precioUnitario?: number;
  motivo?: string;
  referencia?: string;
  eventoId?: number;
  proveedorId?: number;
  fechaMovimiento?: string;
  notas?: string;
}

export const movimientosStockApi = {
  getAll: async (): Promise<MovimientoStock[]> => {
    const { data } = await axiosInstance.get('/movimientos-stock');
    return data;
  },

  getByProducto: async (productoId: number): Promise<MovimientoStock[]> => {
    const { data } = await axiosInstance.get(`/movimientos-stock/producto/${productoId}`);
    return data;
  },

  getByEvento: async (eventoId: number): Promise<MovimientoStock[]> => {
    const { data } = await axiosInstance.get(`/movimientos-stock/evento/${eventoId}`);
    return data;
  },

  getByTipo: async (tipo: string): Promise<MovimientoStock[]> => {
    const { data } = await axiosInstance.get(`/movimientos-stock/tipo/${tipo}`);
    return data;
  },

  getByFechaRange: async (desde: string, hasta: string): Promise<MovimientoStock[]> => {
    const { data } = await axiosInstance.get('/movimientos-stock/fecha-range', {
      params: { desde, hasta },
    });
    return data;
  },

  getByProductoAndFecha: async (
    productoId: number,
    desde: string,
    hasta: string
  ): Promise<MovimientoStock[]> => {
    const { data } = await axiosInstance.get(
      `/movimientos-stock/producto/${productoId}/fecha-range`,
      {
        params: { desde, hasta },
      }
    );
    return data;
  },

  create: async (formData: MovimientoStockFormData): Promise<MovimientoStock> => {
    const { data } = await axiosInstance.post('/movimientos-stock', formData);
    return data;
  },
};
