import axiosInstance from './axios';
import { JornadaTrabajo, JornadaTrabajoFormData } from '../types';

export const jornadasApi = {
  getAll: async (): Promise<JornadaTrabajo[]> => {
    const { data } = await axiosInstance.get('/jornadas');
    return data;
  },

  getById: async (id: number): Promise<JornadaTrabajo> => {
    const { data } = await axiosInstance.get(`/jornadas/${id}`);
    return data;
  },

  getByEmpleado: async (empleadoId: number): Promise<JornadaTrabajo[]> => {
    const { data } = await axiosInstance.get(`/jornadas/empleado/${empleadoId}`);
    return data;
  },

  getPendientes: async (): Promise<JornadaTrabajo[]> => {
    const { data } = await axiosInstance.get('/jornadas/pendientes');
    return data;
  },

  getPendientesByEmpleado: async (empleadoId: number): Promise<JornadaTrabajo[]> => {
    const { data } = await axiosInstance.get(`/jornadas/pendientes/empleado/${empleadoId}`);
    return data;
  },

  getByPeriodo: async (periodo: string): Promise<JornadaTrabajo[]> => {
    const { data } = await axiosInstance.get(`/jornadas/periodo/${periodo}`);
    return data;
  },

  getByFecha: async (fecha: string): Promise<JornadaTrabajo[]> => {
    const { data } = await axiosInstance.get(`/jornadas/fecha/${fecha}`);
    return data;
  },

  getByRangoFechas: async (fechaInicio: string, fechaFin: string): Promise<JornadaTrabajo[]> => {
    const { data } = await axiosInstance.get('/jornadas/rango', {
      params: { fechaInicio, fechaFin }
    });
    return data;
  },

  getByEvento: async (eventoId: number): Promise<JornadaTrabajo[]> => {
    const { data } = await axiosInstance.get(`/jornadas/evento/${eventoId}`);
    return data;
  },

  getEstadisticasEmpleado: async (empleadoId: number): Promise<{
    totalPendiente: number;
    horasMesActual: number;
    totalPagadoMesActual: number;
    cantidadPendientes: number;
    empleadoNombre: string;
  }> => {
    const { data } = await axiosInstance.get(`/jornadas/stats/empleado/${empleadoId}`);
    return data;
  },

  getEstadisticasGenerales: async (): Promise<{
    totalPendiente: number;
    cantidadPendientes: number;
  }> => {
    const { data } = await axiosInstance.get('/jornadas/stats/general');
    return data;
  },

  create: async (jornada: JornadaTrabajoFormData): Promise<JornadaTrabajo> => {
    const { data } = await axiosInstance.post('/jornadas', jornada);
    return data;
  },

  update: async (id: number, jornada: JornadaTrabajoFormData): Promise<JornadaTrabajo> => {
    const { data } = await axiosInstance.put(`/jornadas/${id}`, jornada);
    return data;
  },

  marcarComoPagada: async (id: number, metodoPago: string): Promise<JornadaTrabajo> => {
    const { data } = await axiosInstance.patch(`/jornadas/${id}/pagar`, { metodoPago });
    return data;
  },

  pagarMultiples: async (jornadaIds: number[], metodoPago: string): Promise<JornadaTrabajo[]> => {
    const { data } = await axiosInstance.post('/jornadas/pagar-multiples', {
      jornadaIds,
      metodoPago
    });
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/jornadas/${id}`);
  },
};
