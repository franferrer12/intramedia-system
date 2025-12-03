import axios from './axios';

export interface AdjuntoPedido {
  id: number;
  pedidoId: number;
  numeroPedido: string;
  nombreArchivo: string;
  nombreOriginal: string;
  tipoArchivo: 'FACTURA' | 'ALBARAN' | 'CONTRATO' | 'PRESUPUESTO' | 'NOTA_ENTREGA' | 'OTRO';
  mimeType: string;
  tamanioBytes: number;
  tamanioLegible: string;
  descripcion?: string;
  subidoPorId?: number;
  subidoPorNombre?: string;
  fechaSubida: string;
  urlDescarga: string;
  urlVistaPrevia?: string;
  esImagen: boolean;
  esPdf: boolean;
}

export interface EstadisticasAdjuntos {
  cantidadAdjuntos: number;
  tamanioTotalBytes: number;
}

/**
 * API para adjuntos de pedidos
 */
export const adjuntosPedidoApi = {
  /**
   * Obtener todos los adjuntos de un pedido
   */
  getAdjuntosPedido: async (pedidoId: number): Promise<AdjuntoPedido[]> => {
    const response = await axios.get(`/pedidos/adjuntos/pedido/${pedidoId}`);
    return response.data;
  },

  /**
   * Subir un archivo adjunto
   */
  subirAdjunto: async (
    pedidoId: number,
    file: File,
    tipoArchivo: string,
    descripcion?: string,
    usuarioId?: number
  ): Promise<AdjuntoPedido> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipoArchivo', tipoArchivo);
    if (descripcion) {
      formData.append('descripcion', descripcion);
    }
    if (usuarioId) {
      formData.append('usuarioId', usuarioId.toString());
    }

    const response = await axios.post(
      `/pedidos/adjuntos/pedido/${pedidoId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Descargar un archivo adjunto
   */
  descargarAdjunto: async (adjuntoId: number, nombreOriginal: string): Promise<void> => {
    const response = await axios.get(`/pedidos/adjuntos/${adjuntoId}/download`, {
      responseType: 'blob',
    });

    // Crear un enlace temporal para descargar el archivo
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', nombreOriginal);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Eliminar un adjunto
   */
  eliminarAdjunto: async (adjuntoId: number): Promise<void> => {
    await axios.delete(`/pedidos/adjuntos/${adjuntoId}`);
  },

  /**
   * Obtener estadísticas de adjuntos de un pedido
   */
  getEstadisticas: async (pedidoId: number): Promise<EstadisticasAdjuntos> => {
    const response = await axios.get(`/pedidos/adjuntos/pedido/${pedidoId}/estadisticas`);
    return response.data;
  },

  /**
   * Obtener información de un adjunto específico
   */
  getAdjunto: async (adjuntoId: number): Promise<AdjuntoPedido> => {
    const response = await axios.get(`/pedidos/adjuntos/${adjuntoId}`);
    return response.data;
  },
};
