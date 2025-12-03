import axiosInstance from './axios';
import { Nomina, NominaFormData } from '../types';

export const nominasApi = {
  getAll: async (): Promise<Nomina[]> => {
    const { data } = await axiosInstance.get('/nominas');
    return data;
  },

  getById: async (id: number): Promise<Nomina> => {
    const { data } = await axiosInstance.get(`/nominas/${id}`);
    return data;
  },

  getByPeriodo: async (periodo: string): Promise<Nomina[]> => {
    const { data } = await axiosInstance.get(`/nominas/periodo/${periodo}`);
    return data;
  },

  getByEmpleado: async (empleadoId: number): Promise<Nomina[]> => {
    const { data } = await axiosInstance.get(`/nominas/empleado/${empleadoId}`);
    return data;
  },

  getByEstado: async (estado: string): Promise<Nomina[]> => {
    const { data } = await axiosInstance.get(`/nominas/estado/${estado}`);
    return data;
  },

  getAllPeriodos: async (): Promise<string[]> => {
    const { data } = await axiosInstance.get('/nominas/periodos');
    return data;
  },

  getStatsByPeriodo: async (periodo: string): Promise<{ totalPagado: number; totalPendiente: number }> => {
    const { data } = await axiosInstance.get(`/nominas/stats/periodo/${periodo}`);
    return data;
  },

  countByEstado: async (estado: string): Promise<number> => {
    const { data } = await axiosInstance.get(`/nominas/count/estado/${estado}`);
    return data;
  },

  create: async (nomina: NominaFormData): Promise<Nomina> => {
    const { data } = await axiosInstance.post('/nominas', nomina);
    return data;
  },

  generarNominasMasivas: async (periodo: string): Promise<Nomina[]> => {
    const { data } = await axiosInstance.post(`/nominas/generar-masivas/${periodo}`);
    return data;
  },

  update: async (id: number, nomina: NominaFormData): Promise<Nomina> => {
    const { data } = await axiosInstance.put(`/nominas/${id}`, nomina);
    return data;
  },

  marcarComoPagada: async (id: number, metodoPago: string, referenciaPago?: string): Promise<Nomina> => {
    const { data } = await axiosInstance.patch(`/nominas/${id}/pagar`, {
      metodoPago,
      referenciaPago
    });
    return data;
  },

  cancelar: async (id: number): Promise<Nomina> => {
    const { data } = await axiosInstance.patch(`/nominas/${id}/cancelar`);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/nominas/${id}`);
  },
};
