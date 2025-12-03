import { FC, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/Button';
import { AlertCircle, CheckCircle, DollarSign, CreditCard, Wallet, Clock, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface CerrarSesionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notas?: string) => Promise<void>;
  sesion: {
    id: number;
    codigo: string;
    nombre: string;
    efectivoInicial: number;
    totalVentas: number;
    valorTotal: number;
    montoEsperadoEfectivo: number;
    montoEsperadoTarjeta: number;
    duracionMinutos: number;
    fechaApertura: string;
  };
}

export const CerrarSesionModal: FC<CerrarSesionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  sesion
}) => {
  const [notas, setNotas] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formatear moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Formatear duración
  const formatDuracion = (minutos: number) => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (horas > 0) {
      return `${horas}h ${mins}min`;
    }
    return `${mins} min`;
  };

  // Reset form cuando se abre/cierra
  useEffect(() => {
    if (!isOpen) {
      setNotas('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(notas || undefined);
      toast.success('Sesión cerrada correctamente');
      onClose();
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error);
      toast.error(error?.response?.data?.message || 'Error al cerrar la sesión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ticketPromedio = sesion.totalVentas > 0 ? sesion.valorTotal / sesion.totalVentas : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-orange-500" />
            Cerrar Sesión de Caja
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Información de la sesión */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Información de la Sesión
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-blue-700 font-medium">Código:</p>
                <p className="text-blue-900 font-semibold">{sesion.codigo}</p>
              </div>
              <div>
                <p className="text-blue-700 font-medium">Nombre:</p>
                <p className="text-blue-900 font-semibold">{sesion.nombre}</p>
              </div>
              <div>
                <p className="text-blue-700 font-medium">Apertura:</p>
                <p className="text-blue-900 font-semibold">
                  {new Date(sesion.fechaApertura).toLocaleString('es-ES')}
                </p>
              </div>
              <div>
                <p className="text-blue-700 font-medium flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Duración:
                </p>
                <p className="text-blue-900 font-semibold">{formatDuracion(sesion.duracionMinutos)}</p>
              </div>
            </div>
          </div>

          {/* Resumen de ventas */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Resumen de Ventas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Ventas */}
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Ventas</p>
                <p className="text-2xl font-bold text-gray-900">{sesion.totalVentas}</p>
              </div>

              {/* Ingresos Totales */}
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Ingresos Totales</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(sesion.valorTotal)}
                </p>
              </div>

              {/* Ticket Promedio */}
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-sm text-gray-600 mb-1 flex items-center justify-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Ticket Promedio
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(ticketPromedio)}
                </p>
              </div>
            </div>
          </div>

          {/* Desglose por método de pago */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Desglose Esperado por Método de Pago</h3>
            <div className="space-y-3">
              {/* Efectivo */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Wallet className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Efectivo</p>
                    <p className="text-xs text-gray-600">
                      Inicial: {formatCurrency(sesion.efectivoInicial)}
                    </p>
                  </div>
                </div>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(sesion.montoEsperadoEfectivo + sesion.efectivoInicial)}
                </p>
              </div>

              {/* Tarjeta */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="font-medium text-gray-900">Tarjeta</p>
                </div>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(sesion.montoEsperadoTarjeta)}
                </p>
              </div>

              {/* Total Esperado */}
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg mt-2">
                <p className="font-bold text-white text-lg">TOTAL ESPERADO</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(sesion.efectivoInicial + sesion.valorTotal)}
                </p>
              </div>
            </div>
          </div>

          {/* Notas opcionales */}
          <div>
            <label htmlFor="notas" className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones (opcional)
            </label>
            <textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              placeholder="Ej: Todo correcto, sin incidencias..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Advertencia */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">Importante:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Al cerrar la sesión, no podrás registrar más ventas</li>
                  <li>Verifica que todos los pagos estén registrados</li>
                  <li>Esta acción no se puede deshacer</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? 'Cerrando...' : 'Confirmar Cierre'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
