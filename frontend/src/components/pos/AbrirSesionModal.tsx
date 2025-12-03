import { FC, useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '../ui/Button';
import { X } from 'lucide-react';
import { sesionCajaApi, AperturaCajaRequest } from '../../api/pos-sesiones-caja.api';
import { empleadosApi } from '../../api/empleados.api';

interface AbrirSesionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AbrirSesionModal: FC<AbrirSesionModalProps> = ({ isOpen, onClose }) => {
  const [nombreCaja, setNombreCaja] = useState('');
  const [empleadoAperturaId, setEmpleadoAperturaId] = useState<number | ''>('');
  const [montoInicial, setMontoInicial] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const queryClient = useQueryClient();

  // Cargar empleados
  const { data: empleados } = useQuery({
    queryKey: ['empleados'],
    queryFn: empleadosApi.getAll,
    enabled: isOpen,
  });

  const abrirSesionMutation = useMutation({
    mutationFn: (request: AperturaCajaRequest) => sesionCajaApi.abrir(request),
    onSuccess: (data) => {
      toast.success(`Sesión ${data.nombreCaja} abierta correctamente`);
      queryClient.invalidateQueries({ queryKey: ['sesiones-caja-abiertas'] });
      // Limpiar formulario
      setNombreCaja('');
      setEmpleadoAperturaId('');
      setMontoInicial('');
      setObservaciones('');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al abrir sesión de caja');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombreCaja.trim()) {
      toast.error('El nombre de la caja es obligatorio');
      return;
    }

    if (!empleadoAperturaId) {
      toast.error('Debes seleccionar un empleado');
      return;
    }

    if (!montoInicial || parseFloat(montoInicial) < 0) {
      toast.error('El monto inicial debe ser mayor o igual a 0');
      return;
    }

    const request: AperturaCajaRequest = {
      nombreCaja: nombreCaja.trim(),
      empleadoAperturaId: Number(empleadoAperturaId),
      montoInicial: parseFloat(montoInicial),
      observaciones: observaciones.trim() || undefined,
    };

    abrirSesionMutation.mutate(request);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Abrir Nueva Sesión de Caja</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="nombreCaja" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Caja *
              </label>
              <input
                id="nombreCaja"
                type="text"
                value={nombreCaja}
                onChange={(e) => setNombreCaja(e.target.value)}
                placeholder="Ej: Caja Principal, Caja Bar"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={abrirSesionMutation.isPending}
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="empleadoAperturaId" className="block text-sm font-medium text-gray-700 mb-2">
                Empleado Responsable *
              </label>
              <select
                id="empleadoAperturaId"
                value={empleadoAperturaId}
                onChange={(e) => setEmpleadoAperturaId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={abrirSesionMutation.isPending}
              >
                <option value="">Selecciona un empleado</option>
                {empleados?.map((empleado) => (
                  <option key={empleado.id} value={empleado.id}>
                    {empleado.nombre} {empleado.apellidos}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="montoInicial" className="block text-sm font-medium text-gray-700 mb-2">
                Monto Inicial en Caja *
              </label>
              <input
                id="montoInicial"
                type="number"
                step="0.01"
                min="0"
                value={montoInicial}
                onChange={(e) => setMontoInicial(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={abrirSesionMutation.isPending}
              />
              <p className="text-xs text-gray-500 mt-1">Efectivo inicial con el que se abre la caja</p>
            </div>

            <div>
              <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones (opcional)
              </label>
              <textarea
                id="observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Notas adicionales..."
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={abrirSesionMutation.isPending}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Importante:</strong> Una vez abierta la sesión, todas las ventas se registrarán en esta caja hasta que se cierre.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={abrirSesionMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={abrirSesionMutation.isPending || !nombreCaja.trim() || !empleadoAperturaId || !montoInicial}
            >
              {abrirSesionMutation.isPending ? 'Abriendo...' : 'Abrir Sesión'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
