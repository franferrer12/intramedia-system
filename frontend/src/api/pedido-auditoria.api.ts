import axios from './axios';

export interface PedidoAuditoria {
  id: number;
  pedidoId: number;
  numeroPedido: string;
  usuarioId?: number;
  usuarioNombre?: string;
  usuarioEmail?: string;
  accion: string; // 'CREADO', 'MODIFICADO', 'CAMBIO_ESTADO', 'ELIMINADO'
  estadoAnterior?: string;
  estadoNuevo?: string;
  campoModificado?: string;
  valorAnterior?: string;
  valorNuevo?: string;
  observaciones?: string;
  ipAddress?: string;
  userAgent?: string;
  fechaCambio: string;
  descripcion: string; // Descripción amigable generada en el backend
}

/**
 * API para auditoría de pedidos
 */
export const pedidoAuditoriaApi = {
  /**
   * Obtener historial completo de auditoría de un pedido
   */
  getHistorialPedido: async (pedidoId: number): Promise<PedidoAuditoria[]> => {
    const response = await axios.get(`/pedidos/${pedidoId}/auditoria`);
    return response.data;
  },

  /**
   * Obtener solo cambios de estado de un pedido
   */
  getCambiosEstado: async (pedidoId: number): Promise<PedidoAuditoria[]> => {
    const response = await axios.get(`/pedidos/${pedidoId}/auditoria/cambios-estado`);
    return response.data;
  },

  /**
   * Obtener actividad reciente (últimos 50 cambios)
   */
  getActividadReciente: async (): Promise<PedidoAuditoria[]> => {
    const response = await axios.get('/pedidos/auditoria/reciente');
    return response.data;
  },
};
