import { FC, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Zap, Link as LinkIcon, Unlink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { dispositivosPosApi, DispositivoPOS } from '../../api/dispositivos-pos.api';
import { empleadosApi } from '../../api/empleados.api';

interface QuickStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispositivo: DispositivoPOS;
}

export const QuickStartModal: FC<QuickStartModalProps> = ({
  isOpen,
  onClose,
  dispositivo,
}) => {
  const queryClient = useQueryClient();
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<number | null>(null);

  // Query para empleados activos
  const { data: empleados = [] } = useQuery({
    queryKey: ['empleados'],
    queryFn: empleadosApi.getAll,
  });

  const empleadosActivos = empleados.filter((emp: any) => emp.activo);

  // Mutation para vincular
  const vincularMutation = useMutation({
    mutationFn: (empleadoId: number) =>
      dispositivosPosApi.vincularTemporalmente(dispositivo.id, empleadoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispositivos-pos'] });
      toast.success('Dispositivo vinculado correctamente');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al vincular dispositivo');
    },
  });

  // Mutation para desvincular
  const desvincularMutation = useMutation({
    mutationFn: () => dispositivosPosApi.desvincular(dispositivo.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispositivos-pos'] });
      toast.success('Dispositivo desvinculado correctamente');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al desvincular dispositivo');
    },
  });

  const handleVincular = () => {
    if (selectedEmpleadoId) {
      vincularMutation.mutate(selectedEmpleadoId);
    }
  };

  const handleDesvincular = () => {
    if (confirm(`¿Desvincular a ${dispositivo.empleadoAsignadoNombre} de este dispositivo?`)) {
      desvincularMutation.mutate();
    }
  };

  if (!isOpen) return null;

  const isLinked = !!dispositivo.empleadoAsignadoId;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6" />
            <h2 className="text-xl font-bold">Quick Start</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-100 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Info del dispositivo */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Dispositivo</p>
            <p className="font-semibold text-gray-900">{dispositivo.nombre}</p>
            <p className="text-xs text-gray-500 mt-1">{dispositivo.ubicacion}</p>
          </div>

          {/* Estado actual */}
          {isLinked ? (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm text-green-700 font-medium flex items-center gap-2 mb-2">
                <LinkIcon className="h-4 w-4" />
                Actualmente vinculado
              </p>
              <p className="text-green-900 font-semibold">
                {dispositivo.empleadoAsignadoNombre}
              </p>
              <Button
                onClick={handleDesvincular}
                variant="outline"
                size="sm"
                className="mt-3 text-red-600 border-red-300 hover:bg-red-50"
                disabled={desvincularMutation.isPending}
              >
                <Unlink className="h-4 w-4 mr-2" />
                {desvincularMutation.isPending ? 'Desvinculando...' : 'Desvincular'}
              </Button>
            </div>
          ) : (
            <>
              {/* Selector de empleado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Empleado
                </label>
                <select
                  value={selectedEmpleadoId || ''}
                  onChange={(e) => setSelectedEmpleadoId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Selecciona un empleado --</option>
                  {empleadosActivos.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombre} {emp.apellido} - {emp.puesto}
                    </option>
                  ))}
                </select>
              </div>

              {/* Info del modo Quick Start */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Vinculación Temporal:</strong> El empleado podrá usar este
                  dispositivo hasta que se desvincule manualmente o finalice su turno.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!isLinked && (
          <div className="flex items-center justify-end gap-3 px-6 pb-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleVincular}
              disabled={!selectedEmpleadoId || vincularMutation.isPending}
            >
              <Zap className="h-4 w-4 mr-2" />
              {vincularMutation.isPending ? 'Vinculando...' : 'Vincular Ahora'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
