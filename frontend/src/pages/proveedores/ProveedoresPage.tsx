import { useState, useEffect } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProveedorModal } from '../../components/proveedores/ProveedorModal';
import { proveedoresApi } from '../../api/proveedores.api';
import { Proveedor, ProveedorFormData } from '../../types';
import { Plus, Package, Edit2, Trash2, Phone, Mail } from 'lucide-react';
import { notify, handleApiError } from '../../utils/notifications';

export const ProveedoresPage = () => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | undefined>();

  useEffect(() => {
    loadProveedores();
  }, []);

  const loadProveedores = async () => {
    try {
      setIsLoading(true);
      const data = await proveedoresApi.getAll();
      setProveedores(data);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
      handleApiError(error, 'Error al cargar los proveedores');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedProveedor(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este proveedor?')) return;

    try {
      await proveedoresApi.delete(id);
      notify.success('Proveedor eliminado correctamente');
      loadProveedores();
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      handleApiError(error, 'Error al eliminar el proveedor');
    }
  };

  const handleSubmit = async (data: ProveedorFormData) => {
    try {
      if (selectedProveedor) {
        await proveedoresApi.update(selectedProveedor.id, data);
        notify.success('Proveedor actualizado correctamente');
      } else {
        await proveedoresApi.create(data);
        notify.success('Proveedor creado correctamente');
      }
      loadProveedores();
    } catch (error) {
      console.error('Error al guardar proveedor:', error);
      handleApiError(error, selectedProveedor ? 'Error al actualizar el proveedor' : 'Error al crear el proveedor');
      throw error;
    }
  };

  const getTipoColor = (tipo: string) => {
    const colors: any = {
      BEBIDAS: 'bg-blue-100 text-blue-800',
      ALIMENTOS: 'bg-green-100 text-green-800',
      EQUIPAMIENTO: 'bg-purple-100 text-purple-800',
      SERVICIOS: 'bg-orange-100 text-orange-800',
      OTRO: 'bg-gray-100 text-gray-800',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      BEBIDAS: 'Bebidas',
      ALIMENTOS: 'Alimentos',
      EQUIPAMIENTO: 'Equipamiento',
      SERVICIOS: 'Servicios',
      OTRO: 'Otro',
    };
    return labels[tipo] || tipo;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Cargando proveedores...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border-2 border-purple-200">
        <h1 className="text-4xl font-bold text-gray-900">🚚 Empresas que Me Venden</h1>
        <p className="text-gray-700 mt-2 text-lg">Las empresas que me traen bebidas, comida y todo lo demás</p>
      </div>

      <div className="flex justify-end">
        <Button variant="primary" onClick={handleCreate} className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          ➕ Añadir Proveedor
        </Button>
      </div>

      {proveedores.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No tienes proveedores todavía
              </h3>
              <p className="text-gray-600 mb-4">
                Registra las empresas que te venden productos
              </p>
              <Button variant="primary" onClick={handleCreate}>
                ➕ Añadir Mi Primer Proveedor
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {proveedores.map((proveedor) => (
            <Card key={proveedor.id}>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {proveedor.nombre}
                      </h3>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${getTipoColor(
                          proveedor.tipo
                        )}`}
                      >
                        {getTipoLabel(proveedor.tipo)}
                      </span>
                      {proveedor.activo ? (
                        <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Activo
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          Inactivo
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Contacto:</strong> {proveedor.contacto}</p>
                      {proveedor.telefono && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          {proveedor.telefono}
                        </div>
                      )}
                      {proveedor.email && (
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2" />
                          {proveedor.email}
                        </div>
                      )}
                      {proveedor.direccion && (
                        <p className="text-gray-500 mt-1">{proveedor.direccion}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(proveedor)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(proveedor.id)}
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

      <ProveedorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        proveedor={selectedProveedor}
      />
    </div>
  );
};
