import axios from './axios';
import type {
  Pedido,
  CrearPedidoRequest,
  RecepcionarPedidoRequest,
  EstadoPedido,
} from '../types/pedido';

const API_URL = '/pedidos';

export const pedidosApi = {
  /**
   * Obtener todos los pedidos
   */
  getAll: async (): Promise<Pedido[]> => {
    const response = await axios.get<Pedido[]>(API_URL);
    return response.data;
  },

  /**
   * Obtener pedido por ID
   */
  getById: async (id: number): Promise<Pedido> => {
    const response = await axios.get<Pedido>(`${API_URL}/${id}`);
    return response.data;
  },

  /**
   * Obtener pedidos por estado
   */
  getByEstado: async (estado: EstadoPedido): Promise<Pedido[]> => {
    const response = await axios.get<Pedido[]>(`${API_URL}/estado/${estado}`);
    return response.data;
  },

  /**
   * Obtener pedidos pendientes de recepción
   */
  getPendientesRecepcion: async (): Promise<Pedido[]> => {
    const response = await axios.get<Pedido[]>(`${API_URL}/pendientes-recepcion`);
    return response.data;
  },

  /**
   * Crear un nuevo pedido
   */
  create: async (data: CrearPedidoRequest): Promise<Pedido> => {
    const response = await axios.post<Pedido>(API_URL, data);
    return response.data;
  },

  /**
   * Actualizar estado de un pedido
   */
  updateEstado: async (id: number, estado: EstadoPedido): Promise<Pedido> => {
    const response = await axios.patch<Pedido>(`${API_URL}/${id}/estado`, null, {
      params: { estado },
    });
    return response.data;
  },

  /**
   * Recepcionar un pedido
   */
  recepcionar: async (id: number, data: RecepcionarPedidoRequest): Promise<Pedido> => {
    const response = await axios.post<Pedido>(`${API_URL}/${id}/recepcionar`, data);
    return response.data;
  },

  /**
   * Cancelar un pedido
   */
  cancelar: async (id: number, motivo?: string): Promise<Pedido> => {
    const response = await axios.post<Pedido>(`${API_URL}/${id}/cancelar`, null, {
      params: { motivo },
    });
    return response.data;
  },

  /**
   * Eliminar un pedido
   */
  delete: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
  },
};
