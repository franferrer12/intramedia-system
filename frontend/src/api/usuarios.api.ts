import axiosInstance from './axios';
import { Usuario, UsuarioFormData, RolUsuario } from '../types';

export const usuariosApi = {
  // Obtener todos los usuarios
  getAll: async (): Promise<Usuario[]> => {
    const { data } = await axiosInstance.get('/usuarios');
    return data;
  },

  // Obtener un usuario por ID
  getById: async (id: number): Promise<Usuario> => {
    const { data } = await axiosInstance.get(`/usuarios/${id}`);
    return data;
  },

  // Obtener usuarios activos
  getActivos: async (): Promise<Usuario[]> => {
    const { data } = await axiosInstance.get('/usuarios/activos');
    return data;
  },

  // Obtener usuarios por rol
  getByRol: async (rol: RolUsuario): Promise<Usuario[]> => {
    const { data } = await axiosInstance.get(`/usuarios/rol/${rol}`);
    return data;
  },

  // Crear nuevo usuario
  create: async (usuario: UsuarioFormData): Promise<Usuario> => {
    const { data } = await axiosInstance.post('/usuarios', usuario);
    return data;
  },

  // Actualizar usuario
  update: async (id: number, usuario: UsuarioFormData): Promise<Usuario> => {
    const { data } = await axiosInstance.put(`/usuarios/${id}`, usuario);
    return data;
  },

  // Eliminar usuario (soft delete)
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/usuarios/${id}`);
  },

  // Eliminar usuario permanentemente
  deletePermanente: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/usuarios/${id}/permanente`);
  },

  // Cambiar rol de usuario
  cambiarRol: async (id: number, rol: RolUsuario): Promise<Usuario> => {
    const { data } = await axiosInstance.patch(`/usuarios/${id}/rol`, null, {
      params: { rol }
    });
    return data;
  },

  // Activar/Desactivar usuario
  toggleActivo: async (id: number): Promise<Usuario> => {
    const { data } = await axiosInstance.patch(`/usuarios/${id}/toggle-activo`);
    return data;
  },
};
