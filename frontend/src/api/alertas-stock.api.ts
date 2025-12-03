import axiosInstance from './axios';

export interface AlertaStock {
  id: number;
  producto: {
    id: number;
    codigo: string;
    nombre: string;
    stockActual: number;
    stockMinimo: number;
    unidadMedida: string;
  };
  tipoAlerta: string;
  nivel: string;
  mensaje: string;
  fechaAlerta: string;
  leida: boolean;
  fechaLectura?: string;
  activa: boolean;
}

export const alertasStockApi = {
  getAlertasActivas: async (): Promise<AlertaStock[]> => {
    const { data } = await axiosInstance.get('/alertas-stock');
    return data;
  },

  getAlertasNoLeidas: async (): Promise<AlertaStock[]> => {
    const { data } = await axiosInstance.get('/alertas-stock/no-leidas');
    return data;
  },

  getConteoNoLeidas: async (): Promise<number> => {
    const { data } = await axiosInstance.get('/alertas-stock/conteo-no-leidas');
    return data;
  },

  marcarComoLeida: async (id: number): Promise<void> => {
    await axiosInstance.post(`/alertas-stock/${id}/marcar-leida`);
  },

  marcarTodasComoLeidas: async (): Promise<void> => {
    await axiosInstance.post('/alertas-stock/marcar-todas-leidas');
  },

  desactivarAlerta: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/alertas-stock/${id}`);
  },

  forzarVerificacion: async (): Promise<string> => {
    const { data } = await axiosInstance.post('/alertas-stock/forzar-verificacion');
    return data;
  },
};
