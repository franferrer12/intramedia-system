import { FC, useMemo } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, Wallet, DollarSign } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Producto } from '../../types';

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
  subtotal: number;
}

interface TicketActualProps {
  items: ItemCarrito[];
  onCantidadChange: (productoId: number, nuevaCantidad: number) => void;
  onEliminarItem: (productoId: number) => void;
  onLimpiarCarrito: () => void;
  onCobrar: (metodoPago: 'EFECTIVO' | 'TARJETA' | 'MIXTO') => void;
  isProcessing?: boolean;
}

export const TicketActual: FC<TicketActualProps> = ({
  items,
  onCantidadChange,
  onEliminarItem,
  onLimpiarCarrito,
  onCobrar,
  isProcessing = false
}) => {
  // Calcular totales
  const { subtotal, descuento, total, cantidadItems } = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const descuento = 0; // Por ahora sin descuentos
    const total = subtotal - descuento;
    const cantidadItems = items.reduce((sum, item) => sum + item.cantidad, 0);

    return { subtotal, descuento, total, cantidadItems };
  }, [items]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(value);
  };

  const hayItems = items.length > 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            Ticket Actual
            {cantidadItems > 0 && (
              <span className="px-2 py-1 text-xs font-bold bg-blue-600 text-white rounded-full">
                {cantidadItems}
              </span>
            )}
          </h2>
          {hayItems && (
            <button
              onClick={onLimpiarCarrito}
              disabled={isProcessing}
              className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Limpiar
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto p-0">
        {!hayItems ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
            <ShoppingCart className="h-16 w-16 mb-3" />
            <p className="text-sm text-center">
              Selecciona productos del catálogo para agregar al ticket
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {items.map((item) => (
              <div key={item.producto.id} className="p-4 hover:bg-gray-50 transition-colors">
                {/* Nombre y precio unitario */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 pr-2">
                    <h4 className="font-medium text-gray-900 text-sm leading-tight">
                      {item.producto.nombre}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatCurrency(item.producto.precioVenta)} /ud
                    </p>
                  </div>
                  <button
                    onClick={() => onEliminarItem(item.producto.id)}
                    disabled={isProcessing}
                    className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Controles de cantidad y subtotal */}
                <div className="flex items-center justify-between">
                  {/* Cantidad */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onCantidadChange(item.producto.id, Math.max(1, item.cantidad - 1))}
                      disabled={isProcessing || item.cantidad <= 1}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      step="0.1"
                      value={item.cantidad}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value) && value > 0) {
                          onCantidadChange(item.producto.id, value);
                        }
                      }}
                      disabled={isProcessing}
                      className="w-16 text-center py-1.5 border border-gray-300 rounded-lg font-medium text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <button
                      onClick={() => onCantidadChange(item.producto.id, item.cantidad + 1)}
                      disabled={isProcessing}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {formatCurrency(item.subtotal)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Totales y botones de pago */}
      {hayItems && (
        <div className="border-t bg-gray-50 p-4 space-y-4">
          {/* Resumen de totales */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            {descuento > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Descuento:</span>
                <span className="font-medium">-{formatCurrency(descuento)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
              <span>TOTAL:</span>
              <span className="text-2xl text-blue-600">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Botones de método de pago */}
          <div className="grid grid-cols-1 gap-2">
            <Button
              onClick={() => onCobrar('EFECTIVO')}
              disabled={isProcessing}
              className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-semibold text-base flex items-center justify-center gap-2"
            >
              <Wallet className="h-5 w-5" />
              COBRAR EFECTIVO
            </Button>

            <Button
              onClick={() => onCobrar('TARJETA')}
              disabled={isProcessing}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base flex items-center justify-center gap-2"
            >
              <CreditCard className="h-5 w-5" />
              COBRAR TARJETA
            </Button>

            <Button
              onClick={() => onCobrar('MIXTO')}
              disabled={isProcessing}
              variant="outline"
              className="w-full h-12 border-2 font-semibold text-base flex items-center justify-center gap-2"
            >
              <DollarSign className="h-5 w-5" />
              PAGO MIXTO
            </Button>
          </div>

          {isProcessing && (
            <div className="text-center text-sm text-blue-600 font-medium">
              Procesando venta...
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
