import axios from './axios';

export interface InversionInicial {
  id: number;
  concepto: string;
  descripcion?: string;
  categoria: string;
  monto: number;
  fecha: string;
  activoFijoId?: number;
  activoFijoNombre?: string;
  proveedorId?: number;
  proveedorNombre?: string;
  numeroFactura?: string;
  formaPago?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface InversionInicialRequest {
  concepto: string;
  descripcion?: string;
  categoria: string;
  monto: number;
  fecha: string;
  activoFijoId?: number;
  proveedorId?: number;
  numeroFactura?: string;
  formaPago?: string;
}

const inversionInicialApi = {
  // Obtener todas las inversiones
  getAll: async (): Promise<InversionInicial[]> => {
    const response = await axios.get('/inversion-inicial');
    return response.data;
  },

  // Obtener inversión por ID
  getById: async (id: number): Promise<InversionInicial> => {
    const response = await axios.get(`/inversion-inicial/${id}`);
    return response.data;
  },

  // Obtener por categoría
  getByCategoria: async (categoria: string): Promise<InversionInicial[]> => {
    const response = await axios.get(`/inversion-inicial/categoria/${categoria}`);
    return response.data;
  },

  // Obtener por rango de fechas
  getByRangoFechas: async (fechaInicio: string, fechaFin: string): Promise<InversionInicial[]> => {
    const response = await axios.get('/inversion-inicial/rango-fechas', {
      params: { fechaInicio, fechaFin }
    });
    return response.data;
  },

  // Buscar por concepto
  buscarPorConcepto: async (concepto: string): Promise<InversionInicial[]> => {
    const response = await axios.get('/inversion-inicial/buscar', {
      params: { concepto }
    });
    return response.data;
  },

  // Obtener inversión total
  getInversionTotal: async (): Promise<number> => {
    const response = await axios.get('/inversion-inicial/estadisticas/total');
    return response.data;
  },

  // Obtener inversión por categoría
  getInversionPorCategoria: async (categoria: string): Promise<number> => {
    const response = await axios.get(`/inversion-inicial/estadisticas/por-categoria/${categoria}`);
    return response.data;
  },

  // Crear inversión
  create: async (data: InversionInicialRequest): Promise<InversionInicial> => {
    const response = await axios.post('/inversion-inicial', data);
    return response.data;
  },

  // Actualizar inversión
  update: async (id: number, data: InversionInicialRequest): Promise<InversionInicial> => {
    const response = await axios.put(`/inversion-inicial/${id}`, data);
    return response.data;
  },

  // Eliminar inversión
  delete: async (id: number): Promise<void> => {
    await axios.delete(`/inversion-inicial/${id}`);
  }
};

export default inversionInicialApi;
