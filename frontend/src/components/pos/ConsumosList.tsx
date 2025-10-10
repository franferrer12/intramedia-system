import { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { sesionesVentaApi } from '../../api/sesiones-venta.api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ConsumosListProps {
  sesionId: number;
}

export const ConsumosList: FC<ConsumosListProps> = ({ sesionId }) => {
  const { data: consumos, isLoading } = useQuery({
    queryKey: ['consumos-sesion', sesionId],
    queryFn: () => sesionesVentaApi.listarConsumosDeSesion(sesionId),
    refetchInterval: 5000, // Actualizar cada 5 segundos
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (!consumos || consumos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Consumos Registrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No hay consumos registrados aún</p>
            <p className="text-xs mt-1">
              Selecciona productos para comenzar a registrar consumos
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Consumos Registrados ({consumos.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {consumos.map((consumo) => (
            <div
              key={consumo.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {consumo.productoNombre}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>Cantidad: {consumo.cantidad}</span>
                      {consumo.tipoVenta && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          {consumo.tipoVenta}
                        </span>
                      )}
                      <span>
                        {format(new Date(consumo.fechaRegistro), 'HH:mm', { locale: es })}
                      </span>
                    </div>
                    {consumo.notas && (
                      <p className="text-xs text-gray-600 mt-1 italic">
                        📝 {consumo.notas}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right ml-4">
                <p className="text-lg font-bold text-gray-900">
                  €{consumo.subtotal.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  €{consumo.precioUnitario.toFixed(2)} × {consumo.cantidad}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Resumen */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-gray-700">Total de consumos:</p>
            <p className="text-xl font-bold text-gray-900">
              €
              {consumos
                .reduce((sum, c) => sum + c.subtotal, 0)
                .toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
