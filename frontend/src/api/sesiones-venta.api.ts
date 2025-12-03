import axios from './axios';
import type {
  SesionVenta,
  ConsumoSesion,
  SesionVentaRequest,
  RegistrarConsumoRequest,
  CerrarSesionRequest,
} from '../types/sesion-venta.types';

export const sesionesVentaApi = {
  // Crear nueva sesión
  crearSesion: async (request: SesionVentaRequest): Promise<SesionVenta> => {
    const { data } = await axios.post<SesionVenta>('/sesiones-venta', request);
    return data;
  },

  // Listar todas las sesiones
  listarSesiones: async (): Promise<SesionVenta[]> => {
    const { data } = await axios.get<SesionVenta[]>('/sesiones-venta');
    return data;
  },

  // Listar sesiones abiertas
  listarSesionesAbiertas: async (): Promise<SesionVenta[]> => {
    const { data } = await axios.get<SesionVenta[]>('/sesiones-venta/abiertas');
    return data;
  },

  // Obtener sesión por ID
  obtenerSesion: async (id: number): Promise<SesionVenta> => {
    const { data } = await axios.get<SesionVenta>(`/sesiones-venta/${id}`);
    return data;
  },

  // Registrar consumo
  registrarConsumo: async (request: RegistrarConsumoRequest): Promise<ConsumoSesion> => {
    const { sesionId, ...body } = request;
    const { data } = await axios.post<ConsumoSesion>(
      `/sesiones-venta/${sesionId}/consumos`,
      body
    );
    return data;
  },

  // Listar consumos de una sesión
  listarConsumosDeSesion: async (sesionId: number): Promise<ConsumoSesion[]> => {
    const { data } = await axios.get<ConsumoSesion[]>(
      `/sesiones-venta/${sesionId}/consumos`
    );
    return data;
  },

  // Cerrar sesión
  cerrarSesion: async (request: CerrarSesionRequest): Promise<SesionVenta> => {
    const { sesionId, notas } = request;
    const { data } = await axios.post<SesionVenta>(
      `/sesiones-venta/${sesionId}/cerrar`,
      { notas }
    );
    return data;
  },
};
