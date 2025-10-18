import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminUsersApi, type Usuario } from '../../api/admin.api';
import { Users, Mail, Calendar, CheckCircle, XCircle, Key } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function UsuariosTab() {
  const queryClient = useQueryClient();
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['admin-usuarios'],
    queryFn: () => adminUsersApi.getAll(),
  });

  const { data: estadisticas } = useQuery({
    queryKey: ['admin-usuarios-stats'],
    queryFn: () => adminUsersApi.getEstadisticas(),
  });

  const toggleActivoMutation = useMutation({
    mutationFn: (id: number) => adminUsersApi.toggleActivo(id),
    onSuccess: () => {
      toast.success('Estado del usuario actualizado');
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] });
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    },
  });

  const updateRolMutation = useMutation({
    mutationFn: ({ id, rol }: { id: number; rol: string }) => adminUsersApi.updateRol(id, rol),
    onSuccess: () => {
      toast.success('Rol actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] });
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: number) => adminUsersApi.resetPassword(id),
    onSuccess: (data) => {
      toast.success(
        <div>
          <p className="font-semibold">Contraseña reseteada</p>
          <p className="text-xs mt-1">Nueva contraseña temporal:</p>
          <code className="block bg-gray-800 text-white px-2 py-1 rounded mt-1">
            {data.temporaryPassword}
          </code>
        </div>,
        { duration: 10000 }
      );
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleToggleActivo = (id: number) => {
    toggleActivoMutation.mutate(id);
  };

  const handleUpdateRol = (id: number, nuevoRol: string) => {
    if (window.confirm(`¿Estás seguro de cambiar el rol de este usuario a ${nuevoRol}?`)) {
      updateRolMutation.mutate({ id, rol: nuevoRol });
    }
  };

  const handleResetPassword = (id: number, username: string) => {
    if (window.confirm(`¿Estás seguro de resetear la contraseña de ${username}?`)) {
      resetPasswordMutation.mutate(id);
    }
  };

  const usuariosFiltrados = usuarios?.filter((user) => {
    const matchRol = !filtroRol || user.rol === filtroRol;
    const matchEstado =
      filtroEstado === '' ||
      (filtroEstado === 'activo' && user.activo) ||
      (filtroEstado === 'inactivo' && !user.activo);
    return matchRol && matchEstado;
  });

  const roles = ['ADMIN', 'GERENTE', 'RRHH', 'ENCARGADO', 'LECTURA'];

  const getRolColor = (rol: string) => {
    switch (rol) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'GERENTE':
        return 'bg-purple-100 text-purple-800';
      case 'RRHH':
        return 'bg-blue-100 text-blue-800';
      case 'ENCARGADO':
        return 'bg-green-100 text-green-800';
      case 'LECTURA':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      {/* Statistics */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-indigo-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-600 font-medium">Total Usuarios</p>
                <p className="text-2xl font-bold text-indigo-900">{estadisticas.totalUsuarios}</p>
              </div>
              <Users className="h-8 w-8 text-indigo-600" />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Usuarios Activos</p>
                <p className="text-2xl font-bold text-green-900">{estadisticas.usuariosActivos}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Usuarios Inactivos</p>
                <p className="text-2xl font-bold text-red-900">{estadisticas.usuariosInactivos}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Rol</label>
            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="">Todos los roles</option>
              {roles.map((rol) => (
                <option key={rol} value={rol}>
                  {rol}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="">Todos</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Cargando usuarios...</p>
        </div>
      ) : usuariosFiltrados && usuariosFiltrados.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Creación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Acceso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuariosFiltrados.map((usuario: Usuario) => (
                <tr key={usuario.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-semibold">
                          {usuario.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{usuario.username}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {usuario.email}
                        </div>
                        {usuario.nombre && (
                          <div className="text-xs text-gray-500">
                            {usuario.nombre} {usuario.apellidos}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={usuario.rol}
                      onChange={(e) => handleUpdateRol(usuario.id, e.target.value)}
                      className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${getRolColor(usuario.rol)}`}
                    >
                      {roles.map((rol) => (
                        <option key={rol} value={rol}>
                          {rol}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActivo(usuario.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                        usuario.activo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {usuario.activo ? (
                        <>
                          <CheckCircle className="h-3 w-3" />
                          Activo
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3" />
                          Inactivo
                        </>
                      )}
                    </button>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(usuario.fechaCreacion), 'dd/MM/yyyy', { locale: es })}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {usuario.ultimoAcceso
                      ? format(new Date(usuario.ultimoAcceso), 'dd/MM/yyyy HH:mm', { locale: es })
                      : 'Nunca'}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleResetPassword(usuario.id, usuario.username)}
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-900"
                      title="Resetear contraseña"
                    >
                      <Key className="h-4 w-4" />
                      Reset
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-600">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p>No se encontraron usuarios</p>
        </div>
      )}
    </div>
  );
}
