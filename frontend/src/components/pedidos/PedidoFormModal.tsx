import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Plus, Trash2, Package, Calculator } from 'lucide-react';
import { proveedoresApi } from '../../api/proveedores.api';
import { productosApi } from '../../api/productos.api';
import type { Producto, Proveedor } from '../../types';
import type { CrearPedidoRequest, DetallePedidoRequest } from '../../types/pedido';
import { Button } from '../ui/Button';

interface PedidoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CrearPedidoRequest) => Promise<void>;
}

interface DetalleLineaState extends DetallePedidoRequest {
  tempId: string;
  productoNombre?: string;
}

export const PedidoFormModal = ({ isOpen, onClose, onSubmit }: PedidoFormModalProps) => {
  const [formData, setFormData] = useState({
    proveedorId: 0,
    fechaEsperada: '',
    notas: '',
  });
  const [detalles, setDetalles] = useState<DetalleLineaState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Queries para obtener proveedores y productos
  const { data: proveedores = [] } = useQuery<Proveedor[]>({
    queryKey: ['proveedores-activos'],
    queryFn: proveedoresApi.getActivos,
    enabled: isOpen,
  });

  const { data: productos = [] } = useQuery<Producto[]>({
    queryKey: ['productos-activos'],
    queryFn: productosApi.getAll,
    enabled: isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      // Reset form
      setFormData({
        proveedorId: 0,
        fechaEsperada: '',
        notas: '',
      });
      setDetalles([]);
      setError('');
    }
  }, [isOpen]);

  const agregarLinea = () => {
    setDetalles([
      ...detalles,
      {
        tempId: Date.now().toString(),
        productoId: 0,
        cantidad: 1,
        precioUnitario: 0,
        notas: '',
      },
    ]);
  };

  const eliminarLinea = (tempId: string) => {
    setDetalles(detalles.filter((d) => d.tempId !== tempId));
  };

  const actualizarLinea = (tempId: string, campo: keyof DetallePedidoRequest, valor: any) => {
    setDetalles(
      detalles.map((d) => {
        if (d.tempId === tempId) {
          const updated = { ...d, [campo]: valor };

          // Si cambió el producto, actualizar precio unitario automáticamente
          if (campo === 'productoId') {
            const producto = productos.find((p) => p.id === Number(valor));
            if (producto) {
              updated.precioUnitario = producto.precioCompra;
              updated.productoNombre = producto.nombre;
            }
          }

          return updated;
        }
        return d;
      })
    );
  };

  const calcularSubtotal = (detalle: DetalleLineaState) => {
    return detalle.cantidad * detalle.precioUnitario;
  };

  const calcularTotales = () => {
    const subtotal = detalles.reduce((sum, d) => sum + calcularSubtotal(d), 0);
    const impuestos = subtotal * 0.21; // 21% IVA
    const total = subtotal + impuestos;
    return { subtotal, impuestos, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!formData.proveedorId || formData.proveedorId === 0) {
      setError('Debe seleccionar un proveedor');
      return;
    }

    if (detalles.length === 0) {
      setError('Debe agregar al menos un producto al pedido');
      return;
    }

    // Validar que todos los detalles tengan producto y cantidades válidas
    for (const detalle of detalles) {
      if (!detalle.productoId || detalle.productoId === 0) {
        setError('Todos los productos deben estar seleccionados');
        return;
      }
      if (detalle.cantidad <= 0) {
        setError('Las cantidades deben ser mayores a 0');
        return;
      }
      if (detalle.precioUnitario <= 0) {
        setError('Los precios unitarios deben ser mayores a 0');
        return;
      }
    }

    setIsLoading(true);

    try {
      const requestData: CrearPedidoRequest = {
        proveedorId: formData.proveedorId,
        fechaEsperada: formData.fechaEsperada || undefined,
        notas: formData.notas || undefined,
        detalles: detalles.map((d) => ({
          productoId: d.productoId,
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitario,
          notas: d.notas || undefined,
        })),
      };

      await onSubmit(requestData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear el pedido');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const { subtotal, impuestos, total } = calcularTotales();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">Nuevo Pedido a Proveedor</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Información General */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proveedor <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.proveedorId}
                onChange={(e) => setFormData({ ...formData, proveedorId: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value={0}>Seleccionar proveedor...</option>
                {proveedores.map((prov) => (
                  <option key={prov.id} value={prov.id}>
                    {prov.nombre} {prov.telefono && `(${prov.telefono})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Esperada de Entrega
              </label>
              <input
                type="date"
                value={formData.fechaEsperada}
                onChange={(e) => setFormData({ ...formData, fechaEsperada: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas del Pedido
            </label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              rows={2}
              placeholder="Información adicional sobre el pedido..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Productos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Productos <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={agregarLinea}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Agregar Producto
              </button>
            </div>

            {detalles.length === 0 ? (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">No hay productos agregados</p>
                <p className="text-sm text-gray-500">
                  Haz clic en "Agregar Producto" para empezar
                </p>
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Producto
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-28">
                          Cantidad
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">
                          Precio Unit.
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">
                          Subtotal
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">
                          Notas
                        </th>
                        <th className="px-4 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {detalles.map((detalle) => (
                        <tr key={detalle.tempId} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <select
                              value={detalle.productoId}
                              onChange={(e) =>
                                actualizarLinea(detalle.tempId, 'productoId', Number(e.target.value))
                              }
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              required
                            >
                              <option value={0}>Seleccionar...</option>
                              {productos
                                .filter((p) => p.activo)
                                .map((prod) => (
                                  <option key={prod.id} value={prod.id}>
                                    {prod.nombre} - {prod.categoria}
                                  </option>
                                ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={detalle.cantidad}
                              onChange={(e) =>
                                actualizarLinea(detalle.tempId, 'cantidad', Number(e.target.value))
                              }
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              required
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={detalle.precioUnitario}
                              onChange={(e) =>
                                actualizarLinea(detalle.tempId, 'precioUnitario', Number(e.target.value))
                              }
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              required
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {calcularSubtotal(detalle).toFixed(2)}€
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={detalle.notas || ''}
                              onChange={(e) =>
                                actualizarLinea(detalle.tempId, 'notas', e.target.value)
                              }
                              placeholder="Opcional..."
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => eliminarLinea(detalle.tempId)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Totales */}
          {detalles.length > 0 && (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-6 border border-indigo-200">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">Resumen del Pedido</h3>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">{subtotal.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IVA (21%):</span>
                  <span className="font-medium text-gray-900">{impuestos.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-indigo-300 pt-2">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-indigo-600">{total.toFixed(2)}€</span>
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-500">
                <p>• {detalles.length} producto{detalles.length !== 1 ? 's' : ''} en el pedido</p>
                <p>
                  • Cantidad total:{' '}
                  {detalles.reduce((sum, d) => sum + d.cantidad, 0).toFixed(2)} unidades
                </p>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || detalles.length === 0}>
              {isLoading ? 'Creando...' : 'Crear Pedido'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
