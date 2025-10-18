import { useState } from 'react';
import { X, Package, User, Calendar, FileText, DollarSign, TrendingUp, CheckCircle, AlertCircle, Clock, History } from 'lucide-react';
import type { Pedido } from '../../types/pedido';
import { ESTADO_COLORS } from '../../types/pedido';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '../ui/Button';
import { HistorialCambiosModal } from './HistorialCambiosModal';
import { AdjuntosSection } from './AdjuntosSection';

interface PedidoDetalleModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: Pedido;
}

export const PedidoDetalleModal = ({ isOpen, onClose, pedido }: PedidoDetalleModalProps) => {
  const [showHistorialModal, setShowHistorialModal] = useState(false);

  if (!isOpen) return null;

  const porcentajeRecibido = (pedido.cantidadRecibida / pedido.cantidadTotal) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <div className="flex items-center gap-3">
              <Package className="h-6 w-6 text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900">Detalle del Pedido</h2>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-xl font-mono font-bold text-indigo-600">
                {pedido.numeroPedido}
              </span>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${ESTADO_COLORS[pedido.estado]}`}>
                {pedido.estadoDisplay}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Información General */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Proveedor */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Proveedor</h3>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-bold text-gray-900">{pedido.proveedorNombre}</p>
                {pedido.proveedorContacto && (
                  <p className="text-sm text-gray-600">{pedido.proveedorContacto}</p>
                )}
              </div>
            </div>

            {/* Fechas */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Fechas</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pedido:</span>
                  <span className="font-medium text-gray-900">
                    {format(new Date(pedido.fechaPedido), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </span>
                </div>
                {pedido.fechaEsperada && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Esperada:</span>
                    <span className="font-medium text-gray-900">
                      {format(new Date(pedido.fechaEsperada), 'dd/MM/yyyy', { locale: es })}
                    </span>
                  </div>
                )}
                {pedido.fechaRecepcion && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Recepción:</span>
                    <span className="font-medium text-green-600">
                      {format(new Date(pedido.fechaRecepcion), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Usuario y Recepción */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-gray-600" />
                <h4 className="text-sm font-medium text-gray-700">Creado por</h4>
              </div>
              <p className="text-gray-900 font-medium">{pedido.usuarioNombre}</p>
            </div>

            {pedido.recepcionadoPorNombre && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <h4 className="text-sm font-medium text-gray-700">Recepcionado por</h4>
                </div>
                <p className="text-gray-900 font-medium">{pedido.recepcionadoPorNombre}</p>
              </div>
            )}
          </div>

          {/* Estado de Recepción */}
          {(pedido.estado === 'PARCIAL' || pedido.estado === 'RECIBIDO') && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-5 border border-green-200">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Estado de Recepción</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="text-gray-600">Progreso</span>
                    <span className="font-medium text-gray-900">{porcentajeRecibido.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${pedido.completamenteRecibido ? 'bg-green-500' : 'bg-yellow-500'}`}
                      style={{ width: `${Math.min(porcentajeRecibido, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Total Pedido</p>
                    <p className="text-lg font-bold text-gray-900">{pedido.cantidadTotal.toFixed(2)} unidades</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Total Recibido</p>
                    <p className="text-lg font-bold text-green-600">{pedido.cantidadRecibida.toFixed(2)} unidades</p>
                  </div>
                </div>

                {pedido.parcialmenteRecibido && (
                  <div className="flex items-center gap-2 p-2 bg-yellow-100 rounded-md">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      Recepción parcial - Faltan {(pedido.cantidadTotal - pedido.cantidadRecibida).toFixed(2)} unidades
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Productos */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Productos</h3>
            </div>

            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Producto
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">
                        Pedida
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">
                        Recibida
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">
                        Pendiente
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-28">
                        P. Unit.
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pedido.detalles.map((detalle) => (
                      <tr key={detalle.id} className={detalle.completamenteRecibido ? 'bg-green-50' : ''}>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{detalle.productoNombre}</div>
                          <div className="text-xs text-gray-500">{detalle.productoCategoria}</div>
                          {detalle.notas && (
                            <div className="text-xs text-gray-600 mt-1 italic">
                              <FileText className="h-3 w-3 inline mr-1" />
                              {detalle.notas}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-medium text-gray-900">
                            {detalle.cantidadPedida}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm font-medium ${detalle.cantidadRecibida > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                            {detalle.cantidadRecibida}
                          </span>
                          {detalle.cantidadRecibida > 0 && (
                            <div className="text-xs text-gray-500">
                              ({detalle.porcentajeRecibido.toFixed(0)}%)
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm font-medium ${detalle.diferencia > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                            {detalle.diferencia}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm text-gray-900">
                            {detalle.precioUnitario.toFixed(2)}€
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-medium text-gray-900">
                            {detalle.subtotal.toFixed(2)}€
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Totales */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-5 border border-indigo-200">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-indigo-600" />
              <h3 className="font-semibold text-gray-900">Totales del Pedido</h3>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium text-gray-900">{pedido.subtotal.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Impuestos (21%):</span>
                <span className="font-medium text-gray-900">{pedido.impuestos.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-indigo-300 pt-2">
                <span className="text-gray-900">Total:</span>
                <span className="text-indigo-600">{pedido.total.toFixed(2)}€</span>
              </div>
            </div>
          </div>

          {/* Notas */}
          {pedido.notas && (
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-start gap-2">
                <FileText className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Notas del Pedido</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{pedido.notas}</p>
                </div>
              </div>
            </div>
          )}

          {/* Archivos Adjuntos */}
          <div className="border-t pt-4">
            <AdjuntosSection pedidoId={pedido.id} />
          </div>

          {/* Info de Auditoría */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <h4 className="text-sm font-medium text-gray-700">Auditoría</h4>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
              <div>
                <span className="font-medium">Creado:</span>{' '}
                {format(new Date(pedido.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
              </div>
              <div>
                <span className="font-medium">Actualizado:</span>{' '}
                {format(new Date(pedido.updatedAt), 'dd/MM/yyyy HH:mm', { locale: es })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between p-6 border-t bg-gray-50">
          <Button
            onClick={() => setShowHistorialModal(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            Ver Historial de Cambios
          </Button>
          <Button onClick={onClose} variant="outline">
            Cerrar
          </Button>
        </div>
      </div>

      {/* Modal de Historial */}
      <HistorialCambiosModal
        isOpen={showHistorialModal}
        onClose={() => setShowHistorialModal(false)}
        pedidoId={pedido.id}
        numeroPedido={pedido.numeroPedido}
      />
    </div>
  );
};
