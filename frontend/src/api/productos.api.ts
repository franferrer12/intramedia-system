import axiosInstance from './axios';
import { Producto, ProductoFormData, TipoVenta } from '../types';

interface TipoVentaOption {
  value: TipoVenta;
  label: string;
  descripcion: string;
}

interface ProductoPreset {
  tipoVenta: string;
  mlPorServicio: number | null;
  factorMerma: number;
  capacidadesComunes: number[];
  descripcion: string;
}

interface MetricasCalculadas {
  precioCompra: number;
  precioVenta: number;
  capacidadMl: number;
  tipoVenta: string;
  mlPorServicio: number;
  factorMerma: number;
  unidadesTeorica: number;
  unidadesReales: number;
  ingresoTotalEstimado: number;
  beneficioUnitario: number;
  margenPorcentaje: number;
  precioPromedioServicio: number;
}

export const productosApi = {
  getAll: async (): Promise<Producto[]> => {
    const { data } = await axiosInstance.get('/productos');
    return data;
  },

  getById: async (id: number): Promise<Producto> => {
    const { data } = await axiosInstance.get(`/productos/${id}`);
    return data;
  },

  getActivos: async (): Promise<Producto[]> => {
    const { data } = await axiosInstance.get('/productos/activos');
    return data;
  },

  getCategorias: async (): Promise<string[]> => {
    const { data } = await axiosInstance.get('/productos/categorias');
    return data;
  },

  getBajoStock: async (): Promise<Producto[]> => {
    const { data} = await axiosInstance.get('/productos/bajo-stock');
    return data;
  },

  create: async (formData: ProductoFormData): Promise<Producto> => {
    const { data } = await axiosInstance.post('/productos', formData);
    return data;
  },

  update: async (id: number, formData: ProductoFormData): Promise<Producto> => {
    const { data } = await axiosInstance.put(`/productos/${id}`, formData);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/productos/${id}`);
  },

  // ========== MÉTODOS PARA MODELO DE OCIO NOCTURNO ==========

  getTiposVenta: async (): Promise<TipoVentaOption[]> => {
    const { data } = await axiosInstance.get('/productos/tipos-venta');
    return data;
  },

  getPresets: async (tipoVenta: TipoVenta): Promise<ProductoPreset> => {
    const { data } = await axiosInstance.get(`/productos/presets/${tipoVenta}`);
    return data;
  },

  calcularMetricas: async (params: {
    precioCompra: number;
    precioVenta: number;
    capacidadMl: number;
    tipoVenta: TipoVenta;
    mlPorServicio?: number;
    factorMerma?: number;
  }): Promise<MetricasCalculadas> => {
    const { data } = await axiosInstance.post('/productos/calcular', params);
    return data;
  },
};
