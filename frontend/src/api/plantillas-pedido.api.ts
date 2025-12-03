import axios from './axios';

export interface PlantillaPedido {
  id: number;
  nombre: string;
  descripcion?: string;
  proveedorId: number;
  proveedorNombre: string;
  detalles: any; // JSON con los productos
  observaciones?: string;
  activa: boolean;
  creadoPorId: number;
  creadoPorNombre: string;
  fechaCreacion: string;
  fechaModificacion: string;
}

export interface PedidoRecurrente {
  id: number;
  plantillaId: number;
  plantillaNombre: string;
  proveedorNombre: string;
  frecuencia: 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | 'TRIMESTRAL';
  diaEjecucion?: number;
  diasEjecucion?: string;
  horaEjecucion: string; // HH:mm
  proximaEjecucion: string;
  ultimaEjecucion?: string;
  activo: boolean;
  notificarAntesHoras?: number;
  emailsNotificacion?: string;
  descripcionFrecuencia: string;
  creadoPorId: number;
  creadoPorNombre: string;
  fechaCreacion: string;
}

export const plantillasApi = {
  getAll: async (): Promise<PlantillaPedido[]> => {
    const response = await axios.get('/plantillas-pedido');
    return response.data;
  },

  getActivas: async (): Promise<PlantillaPedido[]> => {
    const response = await axios.get('/plantillas-pedido/activas');
    return response.data;
  },

  getById: async (id: number): Promise<PlantillaPedido> => {
    const response = await axios.get(`/plantillas-pedido/${id}`);
    return response.data;
  },

  getByProveedor: async (proveedorId: number): Promise<PlantillaPedido[]> => {
    const response = await axios.get(`/plantillas-pedido/proveedor/${proveedorId}`);
    return response.data;
  },

  buscar: async (query: string): Promise<PlantillaPedido[]> => {
    const response = await axios.get(`/plantillas-pedido/buscar?query=${encodeURIComponent(query)}`);
    return response.data;
  },

  crear: async (plantilla: Partial<PlantillaPedido>): Promise<PlantillaPedido> => {
    const response = await axios.post('/plantillas-pedido', plantilla);
    return response.data;
  },

  crearDesdePedido: async (pedidoId: number, nombre: string, descripcion?: string): Promise<PlantillaPedido> => {
    const params = new URLSearchParams();
    params.append('nombre', nombre);
    if (descripcion) params.append('descripcion', descripcion);

    const response = await axios.post(`/plantillas-pedido/desde-pedido/${pedidoId}?${params.toString()}`);
    return response.data;
  },

  actualizar: async (id: number, plantilla: Partial<PlantillaPedido>): Promise<PlantillaPedido> => {
    const response = await axios.put(`/plantillas-pedido/${id}`, plantilla);
    return response.data;
  },

  toggleActiva: async (id: number): Promise<PlantillaPedido> => {
    const response = await axios.put(`/plantillas-pedido/${id}/toggle-activa`);
    return response.data;
  },

  eliminar: async (id: number): Promise<void> => {
    await axios.delete(`/plantillas-pedido/${id}`);
  },

  getEstadisticas: async (): Promise<any> => {
    const response = await axios.get('/plantillas-pedido/estadisticas');
    return response.data;
  },
};

export const recurrentesApi = {
  getAll: async (): Promise<PedidoRecurrente[]> => {
    const response = await axios.get('/pedidos-recurrentes');
    return response.data;
  },

  getActivos: async (): Promise<PedidoRecurrente[]> => {
    const response = await axios.get('/pedidos-recurrentes/activos');
    return response.data;
  },

  getById: async (id: number): Promise<PedidoRecurrente> => {
    const response = await axios.get(`/pedidos-recurrentes/${id}`);
    return response.data;
  },

  getProximasEjecuciones: async (dias: number = 7): Promise<PedidoRecurrente[]> => {
    const response = await axios.get(`/pedidos-recurrentes/proximas-ejecuciones?dias=${dias}`);
    return response.data;
  },

  crear: async (recurrente: Partial<PedidoRecurrente>): Promise<PedidoRecurrente> => {
    const response = await axios.post('/pedidos-recurrentes', recurrente);
    return response.data;
  },

  actualizar: async (id: number, recurrente: Partial<PedidoRecurrente>): Promise<PedidoRecurrente> => {
    const response = await axios.put(`/pedidos-recurrentes/${id}`, recurrente);
    return response.data;
  },

  toggleActivo: async (id: number): Promise<PedidoRecurrente> => {
    const response = await axios.put(`/pedidos-recurrentes/${id}/toggle-activo`);
    return response.data;
  },

  eliminar: async (id: number): Promise<void> => {
    await axios.delete(`/pedidos-recurrentes/${id}`);
  },

  ejecutarPendientes: async (): Promise<{ ejecutados: number; pedidosGenerados: number[] }> => {
    const response = await axios.post('/pedidos-recurrentes/ejecutar-pendientes');
    return response.data;
  },

  getEstadisticas: async (): Promise<any> => {
    const response = await axios.get('/pedidos-recurrentes/estadisticas');
    return response.data;
  },
};
