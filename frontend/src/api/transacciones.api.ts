import axiosInstance from './axios';
import { Transaccion, TransaccionFormData, CategoriaTransaccion, CategoriaTransaccionFormData, TipoTransaccion } from '../types';

export const transaccionesApi = {
  // Transacciones
  getAll: async (): Promise<Transaccion[]> => {
    const { data } = await axiosInstance.get('/transacciones');
    return data;
  },

  getById: async (id: number): Promise<Transaccion> => {
    const { data } = await axiosInstance.get(`/transacciones/${id}`);
    return data;
  },

  getByTipo: async (tipo: TipoTransaccion): Promise<Transaccion[]> => {
    const { data } = await axiosInstance.get(`/transacciones/tipo/${tipo}`);
    return data;
  },

  getByEventoId: async (eventoId: number): Promise<Transaccion[]> => {
    const { data } = await axiosInstance.get(`/transacciones/evento/${eventoId}`);
    return data;
  },

  getByFecha: async (fechaInicio: string, fechaFin: string): Promise<Transaccion[]> => {
    const { data } = await axiosInstance.get('/transacciones/fecha', {
      params: { fechaInicio, fechaFin }
    });
    return data;
  },

  getSumByTipo: async (tipo: TipoTransaccion, fechaInicio: string, fechaFin: string): Promise<number> => {
    const { data } = await axiosInstance.get(`/transacciones/suma/tipo/${tipo}`, {
      params: { fechaInicio, fechaFin }
    });
    return data;
  },

  getSumByEvento: async (eventoId: number, tipo: TipoTransaccion): Promise<number> => {
    const { data } = await axiosInstance.get(`/transacciones/suma/evento/${eventoId}/tipo/${tipo}`);
    return data;
  },

  create: async (transaccion: TransaccionFormData): Promise<Transaccion> => {
    const { data } = await axiosInstance.post('/transacciones', transaccion);
    return data;
  },

  update: async (id: number, transaccion: TransaccionFormData): Promise<Transaccion> => {
    const { data } = await axiosInstance.put(`/transacciones/${id}`, transaccion);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/transacciones/${id}`);
  },
};

export const categoriasTransaccionApi = {
  getAll: async (): Promise<CategoriaTransaccion[]> => {
    const { data } = await axiosInstance.get('/categorias-transaccion');
    return data;
  },

  getActivas: async (): Promise<CategoriaTransaccion[]> => {
    const { data } = await axiosInstance.get('/categorias-transaccion/activas');
    return data;
  },

  getByTipo: async (tipo: TipoTransaccion): Promise<CategoriaTransaccion[]> => {
    const { data } = await axiosInstance.get(`/categorias-transaccion/tipo/${tipo}`);
    return data;
  },

  getByTipoActivas: async (tipo: TipoTransaccion): Promise<CategoriaTransaccion[]> => {
    const { data } = await axiosInstance.get(`/categorias-transaccion/tipo/${tipo}/activas`);
    return data;
  },

  create: async (categoria: CategoriaTransaccionFormData): Promise<CategoriaTransaccion> => {
    const { data } = await axiosInstance.post('/categorias-transaccion', categoria);
    return data;
  },

  update: async (id: number, categoria: CategoriaTransaccionFormData): Promise<CategoriaTransaccion> => {
    const { data } = await axiosInstance.put(`/categorias-transaccion/${id}`, categoria);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/categorias-transaccion/${id}`);
  },
};
