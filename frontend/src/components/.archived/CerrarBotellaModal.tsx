import { FC, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { botellasAbiertasApi, BotellaAbierta, CerrarBotellaRequest, EstadoBotella } from '../../api/botellas-abiertas.api';
import { empleadosApi } from '../../api/empleados.api';
import { Empleado } from '../../types';
import { X, XCircle, Trash2, User, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { notify, handleApiError } from '../../utils/notifications';

interface CerrarBotellaModalProps {
  isOpen: boolean;
  onClose: () => void;
  botella: BotellaAbierta | null;
}

export const CerrarBotellaModal: FC<CerrarBotellaModalProps> = ({ isOpen, onClose, botella }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<CerrarBotellaRequest>>({
    empleadoId: 0,
    motivo: EstadoBotella.CERRADA,
    notas: '',
  });

  const { data: empleados = [] } = useQuery<Empleado[]>({
    queryKey: ['empleados'],
    queryFn: empleadosApi.getAll,
    enabled: isOpen,
  });

  useEffect(() => {
    if (botella) {
      // Auto-seleccionar motivo basado en el estado de la botella
      if (botella.isVacia) {
        setFormData(prev => ({ ...prev, motivo: EstadoBotella.CERRADA }));
      }
    }
  }, [botella]);

  const cerrarMutation = useMutation({
    mutationFn: botellasAbiertasApi.cerrar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['botellas-abiertas'] });
      queryClient.invalidateQueries({ queryKey: ['botellas-alertas'] });
      notify.success('Botella cerrada correctamente');
      handleClose();
    },
    onError: (error) => {
      handleApiError(error, 'Error al cerrar la botella');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!botella) return;

    if (!formData.empleadoId) {
      notify.error('Debes seleccionar un empleado');
      return;
    }

    if (!formData.motivo) {
      notify.error('Debes seleccionar un motivo de cierre');
      return;
    }

    cerrarMutation.mutate({
      botellaId: botella.id,
      empleadoId: formData.empleadoId!,
      motivo: formData.motivo!,
      notas: formData.notas,
    });
  };

  const handleClose = () => {
    setFormData({
      empleadoId: 0,
      motivo: EstadoBotella.CERRADA,
      notas: '',
    });
    onClose();
  };

  if (!isOpen || !botella) return null;

  const motivosDisponibles = [
    { value: EstadoBotella.CERRADA, label: 'Terminada (Vacía)', icon: XCircle, color: 'text-green-600' },
    { value: EstadoBotella.DESPERDICIADA, label: 'Desperdiciada (Rota/Derramada)', icon: Trash2, color: 'text-red-600' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <XCircle className="h-6 w-6 text-red-600" />
            <h2 className="text-2xl font-bold text-gray-900">Cerrar Botella</h2>
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
          {/* Información de la botella */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Información de la Botella</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Producto</p>
                <p className="font-semibold">{botella.productoNombre}</p>
              </div>
              <div>
                <p className="text-gray-600">Ubicación</p>
                <p className="font-semibold">{botella.ubicacion.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-gray-600">Copas servidas</p>
                <p className="font-semibold">{botella.copasServidas} / {botella.copasTotales}</p>
              </div>
              <div>
                <p className="text-gray-600">Copas restantes</p>
                <p className={`font-semibold ${botella.copasRestantes === 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {botella.copasRestantes}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Ingresos generados</p>
                <p className="font-semibold text-green-600">€{botella.ingresosGenerados.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600">Horas abierta</p>
                <p className="font-semibold">{botella.horasAbierta}h</p>
              </div>
            </div>

            {botella.copasRestantes > 0 && (
              <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                <p className="text-sm text-yellow-800">
                  <span className="font-semibold">⚠️ Atención:</span> Esta botella aún tiene {botella.copasRestantes} copas restantes.
                  Al cerrarla como DESPERDICIADA, se perderán €{botella.ingresosPotencialesPerdidos.toFixed(2)} en ingresos potenciales.
                </p>
              </div>
            )}
          </div>

          {/* Motivo de cierre */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              Motivo de cierre *
            </label>
            <div className="space-y-3">
              {motivosDisponibles.map(motivo => {
                const Icon = motivo.icon;
                return (
                  <label
                    key={motivo.value}
                    className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.motivo === motivo.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="motivo"
                      value={motivo.value}
                      checked={formData.motivo === motivo.value}
                      onChange={(e) => setFormData({ ...formData, motivo: e.target.value as EstadoBotella })}
                      className="text-blue-600"
                    />
                    <Icon className={`h-5 w-5 ${motivo.color}`} />
                    <span className="font-medium">{motivo.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Empleado */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 mr-2" />
              Empleado que cierra *
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
              placeholder="Ej: Botella rota accidentalmente, Botella terminada correctamente..."
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={cerrarMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant={formData.motivo === EstadoBotella.DESPERDICIADA ? 'danger' : 'primary'}
              disabled={cerrarMutation.isPending}
            >
              {cerrarMutation.isPending ? 'Cerrando...' : 'Cerrar Botella'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
