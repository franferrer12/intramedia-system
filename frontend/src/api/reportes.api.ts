import { axiosInstance } from '../utils/axios-interceptor';

// Helper function to download file from blob
const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const reportesApi = {
  // Export eventos to Excel
  exportEventosExcel: async (fechaInicio: string, fechaFin: string): Promise<void> => {
    const response = await axiosInstance.get(
      '/reportes/eventos/excel',
      {
        params: { fechaInicio, fechaFin },
        responseType: 'blob',
      }
    );
    const filename = `eventos_${fechaInicio}_${fechaFin}.xlsx`;
    downloadFile(response.data, filename);
  },

  // Export transacciones to Excel
  exportTransaccionesExcel: async (fechaInicio: string, fechaFin: string): Promise<void> => {
    const response = await axiosInstance.get(
      '/reportes/transacciones/excel',
      {
        params: { fechaInicio, fechaFin },
        responseType: 'blob',
      }
    );
    const filename = `transacciones_${fechaInicio}_${fechaFin}.xlsx`;
    downloadFile(response.data, filename);
  },

  // Export nominas to Excel
  exportNominasExcel: async (mes: number, anio: number): Promise<void> => {
    const response = await axiosInstance.get(
      '/reportes/nominas/excel',
      {
        params: { mes, anio },
        responseType: 'blob',
      }
    );
    const filename = `nominas_${mes}_${anio}.xlsx`;
    downloadFile(response.data, filename);
  },

  // Export inventario to Excel
  exportInventarioExcel: async (): Promise<void> => {
    const response = await axiosInstance.get(
      '/reportes/inventario/excel',
      {
        responseType: 'blob',
      }
    );
    const today = new Date().toISOString().split('T')[0];
    const filename = `inventario_${today}.xlsx`;
    downloadFile(response.data, filename);
  },

  // Export movimientos stock to Excel
  exportMovimientosStockExcel: async (fechaInicio: string, fechaFin: string): Promise<void> => {
    const response = await axiosInstance.get(
      '/reportes/movimientos-stock/excel',
      {
        params: { fechaInicio, fechaFin },
        responseType: 'blob',
      }
    );
    const filename = `movimientos_stock_${fechaInicio}_${fechaFin}.xlsx`;
    downloadFile(response.data, filename);
  },

  // ========== PDF EXPORTS ==========

  // Export nominas to PDF
  exportNominasPdf: async (mes: number, anio: number): Promise<void> => {
    const response = await axiosInstance.get(
      '/reportes/nominas/pdf',
      {
        params: { mes, anio },
        responseType: 'blob',
      }
    );
    const filename = `nominas_${mes}_${anio}.pdf`;
    downloadFile(response.data, filename);
  },

  // Export eventos to PDF
  exportEventosPdf: async (fechaInicio: string, fechaFin: string): Promise<void> => {
    const response = await axiosInstance.get(
      '/reportes/eventos/pdf',
      {
        params: { fechaInicio, fechaFin },
        responseType: 'blob',
      }
    );
    const filename = `eventos_${fechaInicio}_${fechaFin}.pdf`;
    downloadFile(response.data, filename);
  },

  // Export profit & loss to PDF
  exportProfitLossPdf: async (fechaInicio: string, fechaFin: string): Promise<void> => {
    const response = await axiosInstance.get(
      '/reportes/profit-loss/pdf',
      {
        params: { fechaInicio, fechaFin },
        responseType: 'blob',
      }
    );
    const filename = `profit_loss_${fechaInicio}_${fechaFin}.pdf`;
    downloadFile(response.data, filename);
  },

  // Export transacciones to PDF
  exportTransaccionesPdf: async (fechaInicio: string, fechaFin: string): Promise<void> => {
    const response = await axiosInstance.get(
      '/reportes/transacciones/pdf',
      {
        params: { fechaInicio, fechaFin },
        responseType: 'blob',
      }
    );
    const filename = `transacciones_${fechaInicio}_${fechaFin}.pdf`;
    downloadFile(response.data, filename);
  },
};
