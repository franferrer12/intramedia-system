import { useState, useEffect } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { UsuarioModal } from '../../components/usuarios/UsuarioModal';
import { usuariosApi } from '../../api/usuarios.api';
import { Usuario, UsuarioFormData } from '../../types';
import { Plus, Mail, Shield, Edit2, Trash2, UserX, UserCheck } from 'lucide-react';
import { notify, handleApiError } from '../../utils/notifications';

export const UsuariosPage = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | undefined>();

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      setIsLoading(true);
      const data = await usuariosApi.getAll();
      setUsuarios(data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      handleApiError(error, 'Error al cargar los usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedUsuario(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
      await usuariosApi.delete(id);
      notify.success('Usuario eliminado correctamente');
      loadUsuarios();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      handleApiError(error, 'Error al eliminar el usuario');
    }
  };

  const handleToggleActivo = async (id: number) => {
    try {
      await usuariosApi.toggleActivo(id);
      notify.success('Estado del usuario actualizado');
      loadUsuarios();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      handleApiError(error, 'Error al cambiar el estado del usuario');
    }
  };

  const handleSubmit = async (data: UsuarioFormData) => {
    try {
      if (selectedUsuario) {
        await usuariosApi.update(selectedUsuario.id, data);
        notify.success('Usuario actualizado correctamente');
      } else {
        await usuariosApi.create(data);
        notify.success('Usuario creado correctamente');
      }
      loadUsuarios();
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      handleApiError(error, selectedUsuario ? 'Error al actualizar el usuario' : 'Error al crear el usuario');
      throw error;
    }
  };

  const getRolColor = (rol: string) => {
    const colors: any = {
      ADMIN: 'bg-purple-100 text-purple-800',
      GERENTE: 'bg-blue-100 text-blue-800',
      ENCARGADO: 'bg-green-100 text-green-800',
      RRHH: 'bg-yellow-100 text-yellow-800',
      LECTURA: 'bg-gray-100 text-gray-800',
    };
    return colors[rol] || 'bg-gray-100 text-gray-800';
  };

  const getRolLabel = (rol: string) => {
    const labels: Record<string, string> = {
      ADMIN: 'Admin',
      GERENTE: 'Gerente',
      ENCARGADO: 'Encargado',
      RRHH: 'RRHH',
      LECTURA: 'Lectura',
    };
    return labels[rol] || rol;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Cargando usuarios...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-600 mt-2">Gestión de usuarios del sistema</p>
        </div>
        <Button variant="primary" onClick={handleCreate} className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {usuarios.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay usuarios registrados
              </h3>
              <p className="text-gray-600 mb-4">
                Comienza creando tu primer usuario
              </p>
              <Button variant="primary" onClick={handleCreate}>
                Crear Usuario
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {usuarios.map((usuario) => (
            <Card key={usuario.id}>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gray-200 rounded-full p-3">
                      <Shield className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {usuario.username}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getRolColor(
                            usuario.rol
                          )}`}
                        >
                          {getRolLabel(usuario.rol)}
                        </span>
                        {usuario.activo ? (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Activo
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-gray-600 mt-1">
                        <Mail className="h-4 w-4 mr-2" />
                        <span className="text-sm">{usuario.email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActivo(usuario.id)}
                      title={usuario.activo ? 'Desactivar usuario' : 'Activar usuario'}
                    >
                      {usuario.activo ? (
                        <UserX className="h-4 w-4" />
                      ) : (
                        <UserCheck className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(usuario)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(usuario.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <UsuarioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        usuario={selectedUsuario}
      />
    </div>
  );
};
