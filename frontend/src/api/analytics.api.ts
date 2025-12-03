import axiosInstance from './axios';
import { CostesLaborales, RendimientoEmpleado, AnalisisRentabilidad, DashboardMetrics, MesCoste } from '../types';

export const analyticsApi = {
  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    const { data } = await axiosInstance.get('/analytics/dashboard');
    return data;
  },

  getCostesLaborales: async (periodo?: string): Promise<CostesLaborales> => {
    const { data } = await axiosInstance.get('/analytics/costes-laborales', {
      params: { periodo }
    });
    return data;
  },

  getRendimientoEmpleado: async (empleadoId: number, desde?: string, hasta?: string): Promise<RendimientoEmpleado> => {
    const { data } = await axiosInstance.get(`/analytics/rendimiento-empleado/${empleadoId}`, {
      params: { desde, hasta }
    });
    return data;
  },

  getRentabilidadEventos: async (desde?: string, hasta?: string): Promise<AnalisisRentabilidad[]> => {
    const { data } = await axiosInstance.get('/analytics/rentabilidad-eventos', {
      params: { desde, hasta }
    });
    return data;
  },

  getEvolucionCostes: async (meses: number = 6): Promise<MesCoste[]> => {
    const { data } = await axiosInstance.get('/analytics/evolucion-costes', {
      params: { meses }
    });
    return data;
  },

  getComparativaAnual: async (año?: number): Promise<Record<string, number>> => {
    const { data } = await axiosInstance.get('/analytics/comparativa-anual', {
      params: { año }
    });
    return data;
  },
};
