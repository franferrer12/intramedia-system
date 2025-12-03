import axios from './axios';

export interface RoiMetrics {
  inversionTotal: number;
  valorActivosActual: number;
  beneficioNetoAcumulado: number;
  ingresosTotales: number;
  gastosTotales: number;
  roi: number;
  roiAnualizado: number;
  diasDesdeApertura: number;
  inversionRecuperada: number;
  porcentajeRecuperado: number;
  diasEstimadosRecuperacion: number | null;
  tasaRetornoMensual: number;
  estadoRecuperacion: string;
  inversionRecuperadaCompletamente: boolean;
}

const roiApi = {
  // Obtener métricas de ROI
  getMetricas: async (): Promise<RoiMetrics> => {
    const response = await axios.get('/roi/metricas');
    return response.data;
  },

  // Obtener métricas de ROI para un período
  getMetricasPeriodo: async (fechaInicio: string, fechaFin: string): Promise<RoiMetrics> => {
    const response = await axios.get('/roi/metricas/periodo', {
      params: { fechaInicio, fechaFin }
    });
    return response.data;
  }
};

export default roiApi;
