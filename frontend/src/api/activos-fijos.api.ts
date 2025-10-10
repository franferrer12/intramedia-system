import axios from './axios';

export interface ActivoFijo {
  id: number;
  nombre: string;
  descripcion?: string;
  categoria: string;
  valorInicial: number;
  fechaAdquisicion: string;
  vidaUtilAnios: number;
  valorResidual: number;
  amortizacionAnual: number;
  amortizacionMensual: number;
  amortizacionAcumulada: number;
  valorNeto: number;
  proveedorId?: number;
  proveedorNombre?: string;
  numeroFactura?: string;
  ubicacion?: string;
  activo: boolean;
  notas?: string;
  porcentajeAmortizacion: number;
  completamenteAmortizado: boolean;
  aniosRestantes: number;
  creadoEn: string;
  actualizadoEn: string;
}

export interface ActivoFijoRequest {
  nombre: string;
  descripcion?: string;
  categoria: string;
  valorInicial: number;
  fechaAdquisicion: string;
  vidaUtilAnios: number;
  valorResidual?: number;
  proveedorId?: number;
  numeroFactura?: string;
  ubicacion?: string;
  activo?: boolean;
  notas?: string;
}

const activosFijosApi = {
  // Obtener todos los activos
  getAll: async (): Promise<ActivoFijo[]> => {
    const response = await axios.get('/activos-fijos');
    return response.data;
  },

  // Obtener activo por ID
  getById: async (id: number): Promise<ActivoFijo> => {
    const response = await axios.get(`/activos-fijos/${id}`);
    return response.data;
  },

  // Obtener activos por categoría
  getByCategoria: async (categoria: string): Promise<ActivoFijo[]> => {
    const response = await axios.get(`/activos-fijos/categoria/${categoria}`);
    return response.data;
  },

  // Obtener solo activos activos
  getActivos: async (): Promise<ActivoFijo[]> => {
    const response = await axios.get('/activos-fijos/activos');
    return response.data;
  },

  // Obtener activos completamente amortizados
  getAmortizados: async (): Promise<ActivoFijo[]> => {
    const response = await axios.get('/activos-fijos/amortizados');
    return response.data;
  },

  // Buscar por nombre
  buscarPorNombre: async (nombre: string): Promise<ActivoFijo[]> => {
    const response = await axios.get('/activos-fijos/buscar', {
      params: { nombre }
    });
    return response.data;
  },

  // Obtener valor total
  getValorTotal: async (): Promise<number> => {
    const response = await axios.get('/activos-fijos/estadisticas/valor-total');
    return response.data;
  },

  // Obtener valor neto total
  getValorNetoTotal: async (): Promise<number> => {
    const response = await axios.get('/activos-fijos/estadisticas/valor-neto-total');
    return response.data;
  },

  // Obtener amortización acumulada total
  getAmortizacionAcumulada: async (): Promise<number> => {
    const response = await axios.get('/activos-fijos/estadisticas/amortizacion-acumulada');
    return response.data;
  },

  // Crear activo
  create: async (data: ActivoFijoRequest): Promise<ActivoFijo> => {
    const response = await axios.post('/activos-fijos', data);
    return response.data;
  },

  // Actualizar activo
  update: async (id: number, data: ActivoFijoRequest): Promise<ActivoFijo> => {
    const response = await axios.put(`/activos-fijos/${id}`, data);
    return response.data;
  },

  // Eliminar activo
  delete: async (id: number): Promise<void> => {
    await axios.delete(`/activos-fijos/${id}`);
  },

  // Recalcular amortización
  recalcularAmortizacion: async (id: number): Promise<ActivoFijo> => {
    const response = await axios.post(`/activos-fijos/${id}/recalcular-amortizacion`);
    return response.data;
  }
};

export default activosFijosApi;
