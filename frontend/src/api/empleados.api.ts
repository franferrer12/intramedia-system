import axiosInstance from './axios';
import { Empleado, EmpleadoFormData } from '../types';

export const empleadosApi = {
  getAll: async (): Promise<Empleado[]> => {
    const { data } = await axiosInstance.get('/empleados');
    return data;
  },

  getActivos: async (): Promise<Empleado[]> => {
    const { data } = await axiosInstance.get('/empleados/activos');
    return data;
  },

  getInactivos: async (): Promise<Empleado[]> => {
    const { data } = await axiosInstance.get('/empleados/inactivos');
    return data;
  },

  getById: async (id: number): Promise<Empleado> => {
    const { data } = await axiosInstance.get(`/empleados/${id}`);
    return data;
  },

  getByCargo: async (cargo: string): Promise<Empleado[]> => {
    const { data } = await axiosInstance.get(`/empleados/cargo/${cargo}`);
    return data;
  },

  getByDepartamento: async (departamento: string): Promise<Empleado[]> => {
    const { data } = await axiosInstance.get(`/empleados/departamento/${departamento}`);
    return data;
  },

  search: async (searchTerm: string): Promise<Empleado[]> => {
    const { data } = await axiosInstance.get('/empleados/search', {
      params: { q: searchTerm }
    });
    return data;
  },

  getAllCargos: async (): Promise<string[]> => {
    const { data } = await axiosInstance.get('/empleados/cargos');
    return data;
  },

  getAllDepartamentos: async (): Promise<string[]> => {
    const { data } = await axiosInstance.get('/empleados/departamentos');
    return data;
  },

  countActivos: async (): Promise<number> => {
    const { data } = await axiosInstance.get('/empleados/count/activos');
    return data;
  },

  create: async (empleado: EmpleadoFormData): Promise<Empleado> => {
    const { data } = await axiosInstance.post('/empleados', empleado);
    return data;
  },

  update: async (id: number, empleado: EmpleadoFormData): Promise<Empleado> => {
    const { data } = await axiosInstance.put(`/empleados/${id}`, empleado);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/empleados/${id}`);
  },

  darDeBaja: async (id: number): Promise<Empleado> => {
    const { data} = await axiosInstance.patch(`/empleados/${id}/dar-baja`);
    return data;
  },

  reactivar: async (id: number): Promise<Empleado> => {
    const { data } = await axiosInstance.patch(`/empleados/${id}/reactivar`);
    return data;
  },
};
