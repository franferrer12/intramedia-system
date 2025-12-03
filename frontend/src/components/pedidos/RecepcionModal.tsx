import { useState, useEffect } from 'react';
import { X, Package, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import type { Pedido, RecepcionarPedidoRequest, DetalleRecepcionRequest } from '../../types/pedido';
import { Button } from '../ui/Button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface RecepcionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RecepcionarPedidoRequest) => Promise<void>;
  pedido: Pedido;
}

interface DetalleRecepcionState extends DetalleRecepcionRequest {
  productoNombre: string;
  productoCategoria: string;
  cantidadPedida: number;
  cantidadYaRecibida: number;
  pendiente: number;
  precioUnitario: number;
}

export const RecepcionModal = ({ isOpen, onClose, onSubmit, pedido }: RecepcionModalProps) => {
  const [detalles, setDetalles] = useState<DetalleRecepcionState[]>([]);
  const [notasGenerales, setNotasGenerales] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && pedido) {
      // Inicializar detalles con la información del pedido
      const detallesIniciales: DetalleRecepcionState[] = pedido.detalles.map((detalle) => ({
        detalleId: detalle.id,
        cantidadRecibida: detalle.diferencia, // Por defecto, recibir lo que falta
        notas: '',
        // Info adicional para mostrar
        productoNombre: detalle.productoNombre,
        productoCategoria: detalle.productoCategoria,
        cantidadPedida: detalle.cantidadPedida,
        cantidadYaRecibida: detalle.cantidadRecibida,
        pendiente: detalle.diferencia,
        precioUnitario: detalle.precioUnitario,
      }));
      setDetalles(detallesIniciales);
      setNotasGenerales('');
      setError('');
    }
  }, [isOpen, pedido]);

  const actualizarDetalle = (detalleId: number, campo: keyof DetalleRecepcionState, valor: any) => {
    setDetalles(
      detalles.map((d) => {
        if (d.detalleId === detalleId) {
          return { ...d, [campo]: valor };
        }
        return d;
      })
    );
  };

  const marcarComoCompleto = (detalleId: number) => {
    setDetalles(
      detalles.map((d) => {
        if (d.detalleId === detalleId) {
          return { ...d, cantidadRecibida: d.pendiente };
        }
        return d;
      })
    );
  };

  const calcularEstadoRecepcion = () => {
    const totalPedido = detalles.reduce((sum, d) => sum + d.cantidadPedida, 0);
    const totalRecibidoAhora = detalles.reduce((sum, d) => sum + d.cantidadRecibida, 0);
    const totalYaRecibido = detalles.reduce((sum, d) => sum + d.cantidadYaRecibida, 0);
    const totalQueSeRecibira = totalYaRecibido + totalRecibidoAhora;
    const porcentaje = (totalQueSeRecibira / totalPedido) * 100;

    const productosCompletos = detalles.filter(
      (d) => d.cantidadYaRecibida + d.cantidadRecibida >= d.cantidadPedida
    ).length;

    const esRecepcionCompleta = totalQueSeRecibira >= totalPedido;

    return {
      totalPedido,
      totalRecibidoAhora,
      totalYaRecibido,
      totalQueSeRecibira,
      porcentaje,
      productosCompletos,
      totalProductos: detalles.length,
      esRecepcionCompleta,
    };
  };

  const calcularValorRecepcion = () => {
    return detalles.reduce((sum, d) => sum + d.cantidadRecibida * d.precioUnitario, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar que al menos se reciba algo
    const totalRecibido = detalles.reduce((sum, d) => sum + d.cantidadRecibida, 0);
    if (totalRecibido <= 0) {
      setError('Debe recibir al menos 1 unidad de algún producto');
      return;
    }

    // Validar que no se reciba más de lo pendiente
    for (const detalle of detalles) {
      if (detalle.cantidadRecibida > detalle.pendiente) {
        setError(
          `No puede recibir más de ${detalle.pendiente} unidades de "${detalle.productoNombre}"`
        );
        return;
      }
      if (detalle.cantidadRecibida < 0) {
        setError('Las cantidades recibidas no pueden ser negativas');
        return;
      }
    }

    setIsLoading(true);

    try {
      const requestData: RecepcionarPedidoRequest = {
        detallesRecepcion: detalles.map((d) => ({
          detalleId: d.detalleId,
          cantidadRecibida: d.cantidadRecibida,
          notas: d.notas || undefined,
        })),
        notas: notasGenerales || undefined,
      };

      await onSubmit(requestData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al recepcionar el pedido');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const estado = calcularEstadoRecepcion();
  const valorRecepcion = calcularValorRecepcion();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <div className="flex items-center gap-3">
              <Package className="h-6 w-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">Recepcionar Pedido</h2>
            </div>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
              <span className="font-medium text-gray-900">{pedido.numeroPedido}</span>
              <span>•</span>
              <span>{pedido.proveedorNombre}</span>
              <span>•</span>
              <span>
                Pedido: {format(new Date(pedido.fechaPedido), 'dd/MM/yyyy', { locale: es })}
              </span>
              {pedido.fechaEsperada && (
                <>
                  <span>•</span>
                  <span>
                    Esperado:{' '}
                    {format(new Date(pedido.fechaEsperada), 'dd/MM/yyyy', { locale: es })}
                  </span>
                </>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Info sobre recepción parcial */}
          {pedido.parcialmenteRecibido && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">Recepción Parcial Previa</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Este pedido ya fue recepcionado parcialmente. Las cantidades mostradas son las
                    que aún faltan por recibir.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tabla de productos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Productos del Pedido
            </label>

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
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-32">
                        Recibir Ahora
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">
                        Notas
                      </th>
                      <th className="px-4 py-3 w-24"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {detalles.map((detalle) => {
                      const estaCompleto =
                        detalle.cantidadYaRecibida + detalle.cantidadRecibida >=
                        detalle.cantidadPedida;
                      const porcentajeProducto =
                        ((detalle.cantidadYaRecibida + detalle.cantidadRecibida) /
                          detalle.cantidadPedida) *
                        100;

                      return (
                        <tr
                          key={detalle.detalleId}
                          className={`hover:bg-gray-50 ${estaCompleto ? 'bg-green-50' : ''}`}
                        >
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {detalle.productoNombre}
                            </div>
                            <div className="text-xs text-gray-500">{detalle.productoCategoria}</div>
                            {estaCompleto && (
                              <div className="flex items-center gap-1 mt-1 text-xs font-medium text-green-600">
                                <CheckCircle className="h-3 w-3" />
                                Completo
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="text-sm font-medium text-gray-900">
                              {detalle.cantidadPedida}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="text-sm text-gray-600">
                              {detalle.cantidadYaRecibida}
                            </div>
                            {detalle.cantidadYaRecibida > 0 && (
                              <div className="text-xs text-gray-500">
                                ({porcentajeProducto.toFixed(0)}%)
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div
                              className={`text-sm font-medium ${
                                detalle.pendiente > 0 ? 'text-orange-600' : 'text-gray-400'
                              }`}
                            >
                              {detalle.pendiente}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={detalle.pendiente}
                              value={detalle.cantidadRecibida}
                              onChange={(e) =>
                                actualizarDetalle(
                                  detalle.detalleId,
                                  'cantidadRecibida',
                                  Number(e.target.value)
                                )
                              }
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-500"
                              required
                            />
                          </td>
                          <td className="px-4 py-4">
                            <input
                              type="text"
                              value={detalle.notas || ''}
                              onChange={(e) =>
                                actualizarDetalle(detalle.detalleId, 'notas', e.target.value)
                              }
                              placeholder="Ej: Dañado, incompleto..."
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </td>
                          <td className="px-4 py-4 text-center">
                            {detalle.pendiente > 0 && (
                              <button
                                type="button"
                                onClick={() => marcarComoCompleto(detalle.detalleId)}
                                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                title="Recibir todo lo pendiente"
                              >
                                Completo
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Notas generales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas de Recepción
            </label>
            <textarea
              value={notasGenerales}
              onChange={(e) => setNotasGenerales(e.target.value)}
              rows={3}
              placeholder="Observaciones generales sobre la recepción del pedido..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Resumen de recepción */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Estado de recepción */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Estado de Recepción</h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Progreso:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          estado.esRecepcionCompleta ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(estado.porcentaje, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {estado.porcentaje.toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Productos completos:</span>
                  <span className="font-medium text-gray-900">
                    {estado.productosCompletos} / {estado.totalProductos}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total a recibir ahora:</span>
                  <span className="font-medium text-gray-900">
                    {estado.totalRecibidoAhora.toFixed(2)} unidades
                  </span>
                </div>

                {estado.esRecepcionCompleta && (
                  <div className="flex items-center gap-2 mt-3 p-2 bg-green-100 rounded-md">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      ¡Pedido será completado!
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Valor de recepción */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-5 border border-green-200">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Valor de Recepción</h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-gray-600">Valor recibido ahora:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {valorRecepcion.toFixed(2)}€
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total del pedido:</span>
                  <span className="font-medium text-gray-900">
                    {pedido.total.toFixed(2)}€
                  </span>
                </div>

                <div className="text-xs text-gray-500 mt-3 p-2 bg-white bg-opacity-50 rounded">
                  Se creará automáticamente:
                  <ul className="list-disc ml-4 mt-1">
                    <li>Movimientos de stock (ENTRADA)</li>
                    <li>Transacción financiera (GASTO)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || estado.totalRecibidoAhora <= 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? 'Recepcionando...' : 'Confirmar Recepción'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
