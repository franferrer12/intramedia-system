import axiosInstance from './axios';
import { Evento, EventoFormData } from '../types';

export const eventosApi = {
  // Obtener todos los eventos
  getAll: async (): Promise<Evento[]> => {
    const { data } = await axiosInstance.get('/eventos');
    return data;
  },

  // Obtener un evento por ID
  getById: async (id: number): Promise<Evento> => {
    const { data } = await axiosInstance.get(`/eventos/${id}`);
    return data;
  },

  // Crear nuevo evento
  create: async (evento: EventoFormData): Promise<Evento> => {
    const { data } = await axiosInstance.post('/eventos', evento);
    return data;
  },

  // Actualizar evento
  update: async (id: number, evento: EventoFormData): Promise<Evento> => {
    const { data } = await axiosInstance.put(`/eventos/${id}`, evento);
    return data;
  },

  // Eliminar evento
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/eventos/${id}`);
  },

  // Obtener eventos próximos
  getProximos: async (): Promise<Evento[]> => {
    const { data} = await axiosInstance.get('/eventos/proximos');
    return data;
  },

  // Obtener eventos por estado
  getByEstado: async (estado: string): Promise<Evento[]> => {
    const { data } = await axiosInstance.get(`/eventos/estado/${estado}`);
    return data;
  },
};
