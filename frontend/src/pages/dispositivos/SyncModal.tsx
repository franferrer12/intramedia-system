import { FC, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, RefreshCw, CheckCircle, AlertCircle, Clock, Database } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { dispositivosPosApi, DispositivoPOS } from '../../api/dispositivos-pos.api';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispositivo: DispositivoPOS;
}

export const SyncModal: FC<SyncModalProps> = ({
  isOpen,
  onClose,
  dispositivo,
}) => {
  const queryClient = useQueryClient();
  const [autoSync, setAutoSync] = useState(false);

  // Query para obtener ventas pendientes
  const { data: ventasPendientes = [], refetch: refetchPendientes } = useQuery({
    queryKey: ['ventas-pendientes', dispositivo.id],
    queryFn: () => dispositivosPosApi.obtenerVentasPendientes(dispositivo.id),
    enabled: isOpen,
  });

  // Mutation para sincronizar manualmente
  const sincronizarMutation = useMutation({
    mutationFn: () => dispositivosPosApi.sincronizarVentasOffline(ventasPendientes, dispositivo.id),
    onSuccess: async () => {
      // Invalidar queries para forzar refetch
      await queryClient.invalidateQueries({ queryKey: ['dispositivos-pos'] });
      await queryClient.invalidateQueries({ queryKey: ['ventas-pendientes', dispositivo.id] });

      // Refetch inmediato para actualizar la UI
      await refetchPendientes();

      toast.success('Sincronización completada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al sincronizar');
    },
  });

  // Auto-sincronización cada 30 segundos si está habilitada
  useEffect(() => {
    if (!autoSync || !isOpen) return;

    const interval = setInterval(() => {
      if (ventasPendientes.length > 0) {
        sincronizarMutation.mutate();
      }
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [autoSync, isOpen, ventasPendientes.length]);

  const handleSyncNow = () => {
    if (ventasPendientes.length === 0) {
      toast.info('No hay ventas pendientes de sincronización');
      return;
    }
    sincronizarMutation.mutate();
  };

  if (!isOpen) return null;

  const ultimaSync = dispositivo.ultimaSincronizacion
    ? new Date(dispositivo.ultimaSincronizacion)
    : null;

  const getSyncStatus = () => {
    if (ventasPendientes.length > 0) {
      return {
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: <AlertCircle className="h-5 w-5" />,
        text: `${ventasPendientes.length} venta${ventasPendientes.length > 1 ? 's' : ''} pendiente${ventasPendientes.length > 1 ? 's' : ''}`,
      };
    }

    if (!ultimaSync) {
      return {
        color: 'text-gray-600',
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        icon: <Database className="h-5 w-5" />,
        text: 'Sin sincronización previa',
      };
    }

    return {
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: <CheckCircle className="h-5 w-5" />,
      text: 'Sincronizado',
    };
  };

  const status = getSyncStatus();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-6 w-6" />
            <h2 className="text-xl font-bold">Sincronización</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-purple-100 transition-colors"
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

          {/* Estado de sincronización */}
          <div className={`rounded-lg p-4 border ${status.border} ${status.bg}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={status.color}>
                {status.icon}
              </div>
              <div className="flex-1">
                <p className={`font-semibold ${status.color}`}>
                  {status.text}
                </p>
                {ultimaSync && (
                  <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Última sincronización:{' '}
                    {formatDistanceToNow(ultimaSync, { addSuffix: true, locale: es })}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sincronización automática */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className="text-sm font-semibold text-blue-900">
                  Sincronización Automática
                </span>
                <p className="text-xs text-blue-700 mt-1">
                  {autoSync
                    ? '✅ Activa: Se sincronizará cada 30 segundos automáticamente'
                    : 'Desactivada: Sincroniza manualmente cuando lo necesites'
                  }
                </p>
              </div>
            </label>
          </div>

          {/* Detalles de ventas pendientes */}
          {ventasPendientes.length > 0 && (
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <p className="text-sm font-semibold text-yellow-900 mb-2">
                Ventas Pendientes
              </p>
              <div className="space-y-1">
                {ventasPendientes.slice(0, 5).map((venta: any, index: number) => (
                  <div key={venta.uuidVenta} className="text-xs text-yellow-800 flex items-center gap-2">
                    <span className="w-4 h-4 bg-yellow-200 rounded-full flex items-center justify-center text-[10px]">
                      {index + 1}
                    </span>
                    <span className="font-mono">{venta.uuidVenta.substring(0, 8)}...</span>
                  </div>
                ))}
                {ventasPendientes.length > 5 && (
                  <p className="text-xs text-yellow-700 italic mt-2">
                    ... y {ventasPendientes.length - 5} más
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Información */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-600">
              <strong>💡 Cómo funciona:</strong> Las ventas offline se guardan en el dispositivo
              cuando no hay conexión. Usa la sincronización manual para enviarlas al servidor,
              o activa el modo automático para sincronizar periódicamente.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cerrar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSyncNow}
            disabled={sincronizarMutation.isPending || ventasPendientes.length === 0}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${sincronizarMutation.isPending ? 'animate-spin' : ''}`} />
            {sincronizarMutation.isPending ? 'Sincronizando...' : 'Sincronizar Ahora'}
          </Button>
        </div>
      </div>
    </div>
  );
};
