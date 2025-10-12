import { FC } from 'react';
import { X, Wine, Sparkles } from 'lucide-react';
import { Producto } from '../../types';
import { Button } from '../ui/Button';

interface ModalTipoVentaProps {
  isOpen: boolean;
  onClose: () => void;
  producto: Producto;
  onSeleccionTipo: (tipo: 'COPA' | 'VIP') => void;
}

export const ModalTipoVenta: FC<ModalTipoVentaProps> = ({
  isOpen,
  onClose,
  producto,
  onSeleccionTipo,
}) => {
  if (!isOpen || !producto.esVentaDual) return null;

  const ingresoCopas = (producto.copasPorBotella || 0) * (producto.precioCopa || 0);
  const ingresoVip = producto.precioBotellaVip || 0;
  const mejorOpcion = ingresoCopas > ingresoVip ? 'COPA' : 'VIP';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" onClick={onClose} />

        <div className="relative inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Wine className="w-7 h-7 text-amber-600" />
                Seleccionar Tipo de Venta
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {producto.nombre} - Stock: {producto.stockActual} unidades
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Opción COPA */}
            <button
              onClick={() => onSeleccionTipo('COPA')}
              className={`relative p-6 border-3 rounded-xl text-left transition-all hover:scale-105 ${
                mejorOpcion === 'COPA'
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-gray-300 hover:border-blue-300'
              }`}
            >
              {mejorOpcion === 'COPA' && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  RECOMENDADO
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Wine className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">Venta en Copas</h4>
                  <p className="text-sm text-gray-600">Servicio en barra</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Precio por copa:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {producto.precioCopa?.toFixed(2)}€
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Copas por botella:</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {producto.copasPorBotella}
                  </span>
                </div>

                <div className="border-t pt-2 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Ingreso total:</span>
                    <span className="text-2xl font-bold text-blue-700">
                      {ingresoCopas.toFixed(2)}€
                    </span>
                  </div>
                </div>

                {producto.margenBeneficioCopas && (
                  <div className="text-xs text-gray-600 text-center mt-2">
                    Margen: {producto.margenBeneficioCopas.toFixed(0)}%
                  </div>
                )}
              </div>
            </button>

            {/* Opción VIP */}
            <button
              onClick={() => onSeleccionTipo('VIP')}
              className={`relative p-6 border-3 rounded-xl text-left transition-all hover:scale-105 ${
                mejorOpcion === 'VIP'
                  ? 'border-purple-500 bg-purple-50 shadow-lg'
                  : 'border-gray-300 hover:border-purple-300'
              }`}
            >
              {mejorOpcion === 'VIP' && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  RECOMENDADO
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">Botella VIP</h4>
                  <p className="text-sm text-gray-600">Zona reservados</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Precio botella:</span>
                  <span className="text-lg font-bold text-purple-600">
                    {producto.precioBotellaVip?.toFixed(2)}€
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Formato:</span>
                  <span className="text-lg font-semibold text-gray-900">
                    Botella completa
                  </span>
                </div>

                <div className="border-t pt-2 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Ingreso total:</span>
                    <span className="text-2xl font-bold text-purple-700">
                      {ingresoVip.toFixed(2)}€
                    </span>
                  </div>
                </div>

                {producto.margenBeneficioVip && (
                  <div className="text-xs text-gray-600 text-center mt-2">
                    Margen: {producto.margenBeneficioVip.toFixed(0)}%
                  </div>
                )}
              </div>
            </button>
          </div>

          {/* Comparación */}
          {ingresoCopas !== ingresoVip && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-700 text-center">
                {ingresoCopas > ingresoVip ? (
                  <>
                    <strong className="text-blue-600">Venta en copas</strong> genera{' '}
                    <strong className="text-green-600">
                      {(ingresoCopas - ingresoVip).toFixed(2)}€ más
                    </strong>{' '}
                    que botella VIP
                  </>
                ) : (
                  <>
                    <strong className="text-purple-600">Botella VIP</strong> genera{' '}
                    <strong className="text-green-600">
                      {(ingresoVip - ingresoCopas).toFixed(2)}€ más
                    </strong>{' '}
                    que venta en copas
                  </>
                )}
              </div>
            </div>
          )}

          {/* Botón cancelar */}
          <div className="flex justify-center mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
