import axiosInstance from './axios';
import { DashboardStats } from '../types';

export const dashboardApi = {
  // Obtener estadísticas del dashboard
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await axiosInstance.get('/dashboard/stats');
    return data;
  },
};
