import { FC, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '../ui/Button';
import { X } from 'lucide-react';
import { sesionesVentaApi } from '../../api/sesiones-venta.api';
import type { SesionVentaRequest } from '../../types/sesion-venta.types';

interface AbrirSesionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AbrirSesionModal: FC<AbrirSesionModalProps> = ({ isOpen, onClose }) => {
  const [nombre, setNombre] = useState('');
  const queryClient = useQueryClient();

  const abrirSesionMutation = useMutation({
    mutationFn: (request: SesionVentaRequest) => sesionesVentaApi.crearSesion(request),
    onSuccess: (data) => {
      toast.success(`Sesión ${data.codigo} abierta correctamente`);
      queryClient.invalidateQueries({ queryKey: ['sesiones-venta'] });
      queryClient.invalidateQueries({ queryKey: ['sesiones-abiertas'] });
      setNombre('');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al abrir sesión');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      toast.error('El nombre de la sesión es obligatorio');
      return;
    }

    abrirSesionMutation.mutate({ nombre: nombre.trim() });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Abrir Nueva Sesión</h2>
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
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Sesión *
              </label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Turno Noche - Viernes"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={abrirSesionMutation.isPending}
                autoFocus
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Consejo:</strong> Usa nombres descriptivos que identifiquen claramente
                el turno o momento del día (ej: "Turno Tarde - Sábado").
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
              disabled={abrirSesionMutation.isPending || !nombre.trim()}
            >
              {abrirSesionMutation.isPending ? 'Abriendo...' : 'Abrir Sesión'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
