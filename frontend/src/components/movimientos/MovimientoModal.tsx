import { FC, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { movimientosStockApi, MovimientoStockFormData } from '../../api/movimientos-stock.api';
import { productosApi } from '../../api/productos.api';
import { eventosApi } from '../../api/eventos.api';
import { proveedoresApi } from '../../api/proveedores.api';
import { Button } from '../ui/Button';
import { notify, handleApiError } from '../../utils/notifications';

interface MovimientoModalProps {
  isOpen: boolean;
  onClose: () => void;
  productoIdInicial?: number;
}

const TIPOS_MOVIMIENTO = [
  { value: 'ENTRADA', label: 'Entrada - Recepción de mercancía' },
  { value: 'SALIDA', label: 'Salida - Consumo o venta' },
  { value: 'AJUSTE', label: 'Ajuste - Corrección de inventario' },
  { value: 'MERMA', label: 'Merma - Pérdida o deterioro' },
  { value: 'DEVOLUCION', label: 'Devolución - Retorno de mercancía' },
];

export const MovimientoModal: FC<MovimientoModalProps> = ({
  isOpen,
  onClose,
  productoIdInicial,
}) => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<MovimientoStockFormData>({
    productoId: productoIdInicial || 0,
    tipoMovimiento: 'ENTRADA',
    cantidad: 0,
    precioUnitario: undefined,
    motivo: '',
    referencia: '',
    eventoId: undefined,
    proveedorId: undefined,
    fechaMovimiento: new Date().toISOString().slice(0, 16),
    notas: '',
  });

  const { data: productos = [] } = useQuery({
    queryKey: ['productos-activos'],
    queryFn: productosApi.getActivos,
    enabled: isOpen,
  });

  const { data: eventos = [] } = useQuery({
    queryKey: ['eventos'],
    queryFn: eventosApi.getAll,
    enabled: isOpen,
  });

  const { data: proveedores = [] } = useQuery({
    queryKey: ['proveedores-activos'],
    queryFn: proveedoresApi.getActivos,
    enabled: isOpen,
  });

  useEffect(() => {
    if (productoIdInicial && isOpen) {
      setFormData((prev) => ({ ...prev, productoId: productoIdInicial }));
    }
  }, [productoIdInicial, isOpen]);

  const createMutation = useMutation({
    mutationFn: movimientosStockApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimientos-stock'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      notify.success('Movimiento registrado correctamente');
      onClose();
    },
    onError: (error) => {
      handleApiError(error, 'Error al registrar el movimiento');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.productoId) {
      notify.error('Debe seleccionar un producto');
      return;
    }
    if (!formData.tipoMovimiento) {
      notify.error('Debe seleccionar un tipo de movimiento');
      return;
    }
    if (formData.cantidad <= 0) {
      notify.error('La cantidad debe ser mayor a cero');
      return;
    }
    if (!formData.motivo?.trim()) {
      notify.error('El motivo es obligatorio');
      return;
    }

    // Preparar datos para envío
    const dataToSubmit: MovimientoStockFormData = {
      ...formData,
      precioUnitario: formData.precioUnitario || undefined,
      eventoId: formData.eventoId || undefined,
      proveedorId: formData.proveedorId || undefined,
      notas: formData.notas?.trim() || undefined,
      referencia: formData.referencia?.trim() || undefined,
    };

    createMutation.mutate(dataToSubmit);
  };

  if (!isOpen) return null;

  const isLoading = createMutation.isPending;
  const productoSeleccionado = productos.find((p) => p.id === formData.productoId);

  // Calcular servicios disponibles para productos de ocio nocturno
  const calcularServiciosDisponibles = () => {
    if (!productoSeleccionado) return null;

    if (productoSeleccionado.tipoVenta && productoSeleccionado.tipoVenta !== 'BOTELLA' && productoSeleccionado.unidadesReales) {
      const serviciosActuales = Math.floor(productoSeleccionado.stockActual * productoSeleccionado.unidadesReales);
      const serviciosMovimiento = Math.floor(formData.cantidad * productoSeleccionado.unidadesReales);

      return {
        actuales: serviciosActuales,
        movimiento: serviciosMovimiento,
        porBotella: productoSeleccionado.unidadesReales
      };
    }

    return null;
  };

  const servicios = calcularServiciosDisponibles();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="relative inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Registrar Movimiento de Stock</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipo de Movimiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Movimiento <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.tipoMovimiento}
                onChange={(e) => setFormData({ ...formData, tipoMovimiento: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {TIPOS_MOVIMIENTO.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Producto y Cantidad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Producto <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.productoId}
                  onChange={(e) =>
                    setFormData({ ...formData, productoId: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="0">Seleccionar producto...</option>
                  {productos.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.codigo} - {prod.nombre}
                    </option>
                  ))}
                </select>
                {productoSeleccionado && (
                  <div className="mt-1 space-y-1">
                    <p className="text-xs text-gray-500">
                      Stock actual: {productoSeleccionado.stockActual} {productoSeleccionado.unidadMedida}
                    </p>
                    {productoSeleccionado.tipoVenta && productoSeleccionado.tipoVenta !== 'BOTELLA' && (
                      <div className="flex items-center space-x-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          productoSeleccionado.tipoVenta === 'COPA'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {productoSeleccionado.tipoVenta}
                        </span>
                        {servicios && (
                          <span className="text-xs text-gray-600">
                            ≈ {servicios.actuales} servicios disponibles
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.cantidad || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, cantidad: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {productoSeleccionado && (
                  <div className="mt-1 space-y-1">
                    <p className="text-xs text-gray-500">
                      Unidad: {productoSeleccionado.unidadMedida}
                    </p>
                    {servicios && formData.cantidad > 0 && (
                      <p className="text-xs text-purple-600 font-medium">
                        ≈ {servicios.movimiento} servicios ({servicios.porBotella.toFixed(0)} serv/bot)
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Precio Unitario (opcional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio Unitario (€) - Opcional
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.precioUnitario || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    precioUnitario: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {formData.precioUnitario && formData.cantidad > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  Costo total: €{(formData.precioUnitario * formData.cantidad).toFixed(2)}
                </p>
              )}
            </div>

            {/* Motivo y Referencia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  placeholder="Ej: Compra a proveedor, Evento Viernes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Referencia - Opcional
                </label>
                <input
                  type="text"
                  value={formData.referencia}
                  onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                  placeholder="Nº factura, albarán..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Evento y Proveedor (opcional) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Evento - Opcional
                </label>
                <select
                  value={formData.eventoId || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      eventoId: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin evento</option>
                  {eventos.map((evento) => (
                    <option key={evento.id} value={evento.id}>
                      {evento.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proveedor - Opcional
                </label>
                <select
                  value={formData.proveedorId || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      proveedorId: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin proveedor</option>
                  {proveedores.map((prov) => (
                    <option key={prov.id} value={prov.id}>
                      {prov.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fecha del Movimiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha y Hora del Movimiento <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.fechaMovimiento}
                onChange={(e) => setFormData({ ...formData, fechaMovimiento: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas Adicionales
              </label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Vista previa del cambio de stock */}
            {productoSeleccionado && formData.cantidad > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Vista previa del cambio:</h4>
                <div className="text-sm text-blue-800 space-y-2">
                  <div>
                    <p>
                      Stock actual: <strong>{productoSeleccionado.stockActual}</strong>{' '}
                      {productoSeleccionado.unidadMedida}
                      {servicios && (
                        <span className="text-purple-700 ml-2">
                          (≈ {servicios.actuales} servicios)
                        </span>
                      )}
                    </p>
                    <p>
                      {formData.tipoMovimiento === 'ENTRADA' || formData.tipoMovimiento === 'DEVOLUCION'
                        ? '+'
                        : formData.tipoMovimiento === 'AJUSTE'
                        ? '='
                        : '-'}{' '}
                      <strong>{formData.cantidad}</strong> {productoSeleccionado.unidadMedida}
                      {servicios && (
                        <span className="text-purple-700 ml-2">
                          (≈ {servicios.movimiento} servicios)
                        </span>
                      )}
                    </p>
                    <p className="font-bold mt-1">
                      Stock resultante:{' '}
                      {(() => {
                        const stockResultante = formData.tipoMovimiento === 'AJUSTE'
                          ? formData.cantidad
                          : formData.tipoMovimiento === 'ENTRADA' || formData.tipoMovimiento === 'DEVOLUCION'
                          ? productoSeleccionado.stockActual + formData.cantidad
                          : productoSeleccionado.stockActual - formData.cantidad;

                        const serviciosResultantes = servicios
                          ? Math.floor(stockResultante * servicios.porBotella)
                          : null;

                        return (
                          <>
                            {stockResultante.toFixed(2)} {productoSeleccionado.unidadMedida}
                            {serviciosResultantes !== null && (
                              <span className="text-purple-700 ml-2">
                                (≈ {serviciosResultantes} servicios)
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </p>
                  </div>

                  {servicios && (
                    <div className="pt-2 border-t border-blue-300">
                      <p className="text-xs text-blue-700 italic">
                        💡 Este producto se vende como {productoSeleccionado.tipoVenta?.toLowerCase()} con{' '}
                        {servicios.porBotella.toFixed(0)} servicios por botella
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Registrando...' : 'Registrar Movimiento'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
