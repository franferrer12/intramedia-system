import { FC, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { botellasAbiertasApi, AbrirBotellaRequest } from '../../api/botellas-abiertas.api';
import { productosApi } from '../../api/productos.api';
import { empleadosApi } from '../../api/empleados.api';
import { Producto, Empleado } from '../../types';
import { X, Wine, MapPin, User, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { notify, handleApiError } from '../../utils/notifications';

interface AbrirBotellaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AbrirBotellaModal: FC<AbrirBotellaModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<AbrirBotellaRequest>({
    productoId: 0,
    ubicacion: 'BARRA_PRINCIPAL',
    empleadoId: 0,
    notas: '',
  });

  // Queries
  const { data: productos = [] } = useQuery<Producto[]>({
    queryKey: ['productos-activos'],
    queryFn: productosApi.getActivos,
    enabled: isOpen,
  });

  const { data: empleados = [] } = useQuery<Empleado[]>({
    queryKey: ['empleados'],
    queryFn: empleadosApi.getAll,
    enabled: isOpen,
  });

  const { data: ubicaciones = [] } = useQuery<string[]>({
    queryKey: ['ubicaciones'],
    queryFn: botellasAbiertasApi.getUbicaciones,
    enabled: isOpen,
  });

  // Filtrar solo productos que son botellas
  const productosBotellas = productos.filter(p => p.esBotella);

  const abrirMutation = useMutation({
    mutationFn: botellasAbiertasApi.abrir,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['botellas-abiertas'] });
      queryClient.invalidateQueries({ queryKey: ['botellas-alertas'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      notify.success('Botella abierta correctamente');
      handleClose();
    },
    onError: (error) => {
      handleApiError(error, 'Error al abrir la botella');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.productoId) {
      notify.error('Debes seleccionar un producto');
      return;
    }

    if (!formData.empleadoId) {
      notify.error('Debes seleccionar un empleado');
      return;
    }

    abrirMutation.mutate(formData);
  };

  const handleClose = () => {
    setFormData({
      productoId: 0,
      ubicacion: 'BARRA_PRINCIPAL',
      empleadoId: 0,
      notas: '',
    });
    onClose();
  };

  const productoSeleccionado = productos.find(p => p.id === formData.productoId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Wine className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Abrir Botella</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Producto */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Wine className="h-4 w-4 mr-2" />
              Producto *
            </label>
            <select
              value={formData.productoId}
              onChange={(e) => setFormData({ ...formData, productoId: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value={0}>Selecciona un producto...</option>
              {productosBotellas.map(producto => (
                <option key={producto.id} value={producto.id}>
                  {producto.nombre} - Stock: {producto.stockActual} - {producto.copasPorBotella} copas
                </option>
              ))}
            </select>

            {productoSeleccionado && (
              <div className="mt-3 p-4 bg-blue-50 rounded-md">
                <h4 className="font-semibold text-sm text-gray-900 mb-2">Información del Producto</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Stock disponible</p>
                    <p className="font-semibold">{productoSeleccionado.stockActual} botellas</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Copas por botella</p>
                    <p className="font-semibold">{productoSeleccionado.copasPorBotella} copas</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Precio por copa</p>
                    <p className="font-semibold">€{productoSeleccionado.precioCopa?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Precio pack VIP</p>
                    <p className="font-semibold">€{productoSeleccionado.precioBotellaVip?.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ubicación */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <MapPin className="h-4 w-4 mr-2" />
              Ubicación *
            </label>
            <select
              value={formData.ubicacion}
              onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            >
              {ubicaciones.map(ub => (
                <option key={ub} value={ub}>{ub.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          {/* Empleado */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 mr-2" />
              Empleado que abre *
            </label>
            <select
              value={formData.empleadoId}
              onChange={(e) => setFormData({ ...formData, empleadoId: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value={0}>Selecciona un empleado...</option>
              {empleados.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.nombre}</option>
              ))}
            </select>
          </div>

          {/* Notas */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 mr-2" />
              Notas (opcional)
            </label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Ej: Apertura de botella para turno noche..."
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={abrirMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={abrirMutation.isPending}
            >
              {abrirMutation.isPending ? 'Abriendo...' : 'Abrir Botella'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
