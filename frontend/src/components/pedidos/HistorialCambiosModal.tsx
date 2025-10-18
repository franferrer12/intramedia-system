import { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Clock, User, Activity, FileText, AlertCircle } from 'lucide-react';
import { pedidoAuditoriaApi, PedidoAuditoria } from '../../api/pedido-auditoria.api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface HistorialCambiosModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedidoId: number;
  numeroPedido: string;
}

export const HistorialCambiosModal: FC<HistorialCambiosModalProps> = ({
  isOpen,
  onClose,
  pedidoId,
  numeroPedido,
}) => {
  const { data: historial = [], isLoading, error } = useQuery({
    queryKey: ['pedido-auditoria', pedidoId],
    queryFn: () => pedidoAuditoriaApi.getHistorialPedido(pedidoId),
    enabled: isOpen && !!pedidoId,
  });

  if (!isOpen) return null;

  const getAccionIcon = (accion: string) => {
    switch (accion) {
      case 'CREADO':
        return <FileText className="h-5 w-5 text-green-600" />;
      case 'CAMBIO_ESTADO':
        return <Activity className="h-5 w-5 text-blue-600" />;
      case 'MODIFICADO':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'ELIMINADO':
        return <X className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getAccionColor = (accion: string) => {
    switch (accion) {
      case 'CREADO':
        return 'bg-green-100 border-green-300';
      case 'CAMBIO_ESTADO':
        return 'bg-blue-100 border-blue-300';
      case 'MODIFICADO':
        return 'bg-yellow-100 border-yellow-300';
      case 'ELIMINADO':
        return 'bg-red-100 border-red-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Historial de Cambios</h2>
            <p className="text-sm text-gray-600 mt-1">
              Pedido: <span className="font-semibold">{numeroPedido}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-red-800">
              Error al cargar el historial. Por favor, inténtalo de nuevo.
            </div>
          )}

          {!isLoading && !error && historial.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg">No hay cambios registrados para este pedido</p>
            </div>
          )}

          {!isLoading && !error && historial.length > 0 && (
            <div className="space-y-4">
              {/* Timeline */}
              <div className="relative">
                {/* Línea vertical del timeline */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                {historial.map((registro: PedidoAuditoria) => (
                  <div key={registro.id} className="relative flex gap-4 mb-6 last:mb-0">
                    {/* Icono del timeline */}
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 ${getAccionColor(
                        registro.accion
                      )} z-10`}
                    >
                      {getAccionIcon(registro.accion)}
                    </div>

                    {/* Contenido del cambio */}
                    <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                      {/* Header del cambio */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-lg">
                            {registro.descripcion}
                          </h4>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span>{registro.usuarioNombre || 'Sistema'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>
                                {format(new Date(registro.fechaCambio), "dd 'de' MMMM yyyy 'a las' HH:mm", {
                                  locale: es,
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            registro.accion === 'CREADO'
                              ? 'bg-green-100 text-green-800'
                              : registro.accion === 'CAMBIO_ESTADO'
                              ? 'bg-blue-100 text-blue-800'
                              : registro.accion === 'MODIFICADO'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {registro.accion}
                        </span>
                      </div>

                      {/* Detalles del cambio */}
                      <div className="mt-3 space-y-2">
                        {/* Cambio de estado */}
                        {registro.estadoAnterior && registro.estadoNuevo && (
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <p className="text-sm font-medium text-gray-700 mb-2">Cambio de Estado:</p>
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md text-sm font-medium">
                                {registro.estadoAnterior}
                              </span>
                              <span className="text-gray-400">→</span>
                              <span className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm font-medium">
                                {registro.estadoNuevo}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Campo modificado */}
                        {registro.campoModificado && (
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Campo modificado: <span className="text-blue-600">{registro.campoModificado}</span>
                            </p>
                            {registro.valorAnterior && registro.valorNuevo && (
                              <div className="flex items-center gap-3 mt-2">
                                <div className="flex-1">
                                  <p className="text-xs text-gray-500 mb-1">Valor anterior:</p>
                                  <p className="text-sm text-gray-700 font-mono bg-white px-2 py-1 rounded border border-gray-200">
                                    {registro.valorAnterior}
                                  </p>
                                </div>
                                <span className="text-gray-400">→</span>
                                <div className="flex-1">
                                  <p className="text-xs text-gray-500 mb-1">Valor nuevo:</p>
                                  <p className="text-sm text-gray-700 font-mono bg-white px-2 py-1 rounded border border-gray-200">
                                    {registro.valorNuevo}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Observaciones */}
                        {registro.observaciones && (
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <p className="text-sm text-blue-900">
                              <span className="font-medium">Nota:</span> {registro.observaciones}
                            </p>
                          </div>
                        )}

                        {/* Información técnica (colapsable) */}
                        {(registro.ipAddress || registro.userAgent) && (
                          <details className="text-xs text-gray-500">
                            <summary className="cursor-pointer hover:text-gray-700">
                              Ver información técnica
                            </summary>
                            <div className="mt-2 bg-gray-50 rounded p-2 space-y-1">
                              {registro.ipAddress && <p>IP: {registro.ipAddress}</p>}
                              {registro.userAgent && <p>User Agent: {registro.userAgent}</p>}
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {historial.length} cambio{historial.length !== 1 ? 's' : ''} registrado{historial.length !== 1 ? 's' : ''}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
