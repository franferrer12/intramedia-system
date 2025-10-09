import axiosInstance from './axios';
import { Proveedor, ProveedorFormData, TipoProveedor } from '../types';

export const proveedoresApi = {
  // Obtener todos los proveedores
  getAll: async (): Promise<Proveedor[]> => {
    const { data } = await axiosInstance.get('/proveedores');
    return data;
  },

  // Obtener un proveedor por ID
  getById: async (id: number): Promise<Proveedor> => {
    const { data } = await axiosInstance.get(`/proveedores/${id}`);
    return data;
  },

  // Obtener proveedores activos
  getActivos: async (): Promise<Proveedor[]> => {
    const { data } = await axiosInstance.get('/proveedores/activos');
    return data;
  },

  // Obtener proveedores por tipo
  getByTipo: async (tipo: TipoProveedor): Promise<Proveedor[]> => {
    const { data } = await axiosInstance.get(`/proveedores/tipo/${tipo}`);
    return data;
  },

  // Crear nuevo proveedor
  create: async (proveedor: ProveedorFormData): Promise<Proveedor> => {
    const { data } = await axiosInstance.post('/proveedores', proveedor);
    return data;
  },

  // Actualizar proveedor
  update: async (id: number, proveedor: ProveedorFormData): Promise<Proveedor> => {
    const { data } = await axiosInstance.put(`/proveedores/${id}`, proveedor);
    return data;
  },

  // Eliminar proveedor
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/proveedores/${id}`);
  },
};
