import { FC, useState, useEffect } from 'react';
import { CreditCard, DollarSign, Split, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface PaymentMethodModalProps {
  isOpen: boolean;
  total: number;
  onConfirm: (metodoPago: 'EFECTIVO' | 'TARJETA' | 'MIXTO', montoEfectivo?: number, montoTarjeta?: number) => void;
  onCancel: () => void;
}

export const PaymentMethodModal: FC<PaymentMethodModalProps> = ({
  isOpen,
  total,
  onConfirm,
  onCancel,
}) => {
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<'EFECTIVO' | 'TARJETA' | 'MIXTO' | null>(null);
  const [montoEfectivo, setMontoEfectivo] = useState<string>('');
  const [montoTarjeta, setMontoTarjeta] = useState<string>('');

  // Calcular automáticamente el monto restante para pago mixto
  useEffect(() => {
    if (metodoSeleccionado === 'MIXTO' && montoEfectivo !== '') {
      const efectivo = parseFloat(montoEfectivo) || 0;
      const tarjeta = Math.max(0, total - efectivo);
      setMontoTarjeta(tarjeta.toFixed(2));
    }
  }, [montoEfectivo, total, metodoSeleccionado]);

  const handleConfirm = () => {
    if (!metodoSeleccionado) return;

    if (metodoSeleccionado === 'MIXTO') {
      const efectivo = parseFloat(montoEfectivo) || 0;
      const tarjeta = parseFloat(montoTarjeta) || 0;

      if (efectivo + tarjeta !== total) {
        alert(`El total de pagos (${(efectivo + tarjeta).toFixed(2)}€) debe ser igual al total de la venta (${total.toFixed(2)}€)`);
        return;
      }

      if (efectivo <= 0 || tarjeta <= 0) {
        alert('Ambos montos deben ser mayores a 0 para pago mixto');
        return;
      }

      onConfirm('MIXTO', efectivo, tarjeta);
    } else if (metodoSeleccionado === 'EFECTIVO') {
      // ✅ EFECTIVO: 100% efectivo, 0% tarjeta
      onConfirm('EFECTIVO', total, 0);
    } else if (metodoSeleccionado === 'TARJETA') {
      // ✅ TARJETA: 0% efectivo, 100% tarjeta
      onConfirm('TARJETA', 0, total);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Método de Pago</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Total */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-1">Total a cobrar</p>
          <p className="text-3xl font-bold text-blue-600">{total.toFixed(2)}€</p>
        </div>

        {/* Métodos de Pago */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => setMetodoSeleccionado('EFECTIVO')}
            className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
              metodoSeleccionado === 'EFECTIVO'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className={`p-2 rounded-lg ${
              metodoSeleccionado === 'EFECTIVO' ? 'bg-blue-500' : 'bg-gray-200'
            }`}>
              <DollarSign className={`h-6 w-6 ${
                metodoSeleccionado === 'EFECTIVO' ? 'text-white' : 'text-gray-600'
              }`} />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-gray-900">Efectivo</p>
              <p className="text-sm text-gray-500">Pago completo en efectivo</p>
            </div>
            {metodoSeleccionado === 'EFECTIVO' && (
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            )}
          </button>

          <button
            onClick={() => setMetodoSeleccionado('TARJETA')}
            className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
              metodoSeleccionado === 'TARJETA'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className={`p-2 rounded-lg ${
              metodoSeleccionado === 'TARJETA' ? 'bg-blue-500' : 'bg-gray-200'
            }`}>
              <CreditCard className={`h-6 w-6 ${
                metodoSeleccionado === 'TARJETA' ? 'text-white' : 'text-gray-600'
              }`} />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-gray-900">Tarjeta</p>
              <p className="text-sm text-gray-500">Pago completo con tarjeta</p>
            </div>
            {metodoSeleccionado === 'TARJETA' && (
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            )}
          </button>

          <button
            onClick={() => setMetodoSeleccionado('MIXTO')}
            className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
              metodoSeleccionado === 'MIXTO'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className={`p-2 rounded-lg ${
              metodoSeleccionado === 'MIXTO' ? 'bg-blue-500' : 'bg-gray-200'
            }`}>
              <Split className={`h-6 w-6 ${
                metodoSeleccionado === 'MIXTO' ? 'text-white' : 'text-gray-600'
              }`} />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-gray-900">Mixto</p>
              <p className="text-sm text-gray-500">Efectivo + Tarjeta</p>
            </div>
            {metodoSeleccionado === 'MIXTO' && (
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            )}
          </button>
        </div>

        {/* Campos de Pago Mixto */}
        {metodoSeleccionado === 'MIXTO' && (
          <div className="space-y-3 mb-6 bg-gray-50 rounded-lg p-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Efectivo (€)
              </label>
              <input
                type="number"
                min="0"
                max={total}
                step="0.01"
                value={montoEfectivo}
                onChange={(e) => setMontoEfectivo(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tarjeta (€)
              </label>
              <input
                type="number"
                min="0"
                max={total}
                step="0.01"
                value={montoTarjeta}
                onChange={(e) => setMontoTarjeta(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {montoEfectivo !== '' && montoTarjeta !== '' && (
              <div className="pt-2 border-t border-gray-300">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Suma parcial:</span>
                  <span className={`font-semibold ${
                    (parseFloat(montoEfectivo || '0') + parseFloat(montoTarjeta || '0')).toFixed(2) === total.toFixed(2)
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {(parseFloat(montoEfectivo || '0') + parseFloat(montoTarjeta || '0')).toFixed(2)}€
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex gap-3">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!metodoSeleccionado}
            variant="primary"
            className="flex-1"
          >
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
};
