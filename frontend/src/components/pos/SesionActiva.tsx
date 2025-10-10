import { FC } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Clock, DollarSign, ShoppingCart, XCircle } from 'lucide-react';
import { sesionesVentaApi } from '../../api/sesiones-venta.api';
import type { SesionVenta } from '../../types/sesion-venta.types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface SesionActivaProps {
  sesion: SesionVenta;
}

export const SesionActiva: FC<SesionActivaProps> = ({ sesion }) => {
  const queryClient = useQueryClient();

  const cerrarSesionMutation = useMutation({
    mutationFn: () => sesionesVentaApi.cerrarSesion({ sesionId: sesion.id }),
    onSuccess: () => {
      toast.success('Sesión cerrada correctamente');
      queryClient.invalidateQueries({ queryKey: ['sesiones-venta'] });
      queryClient.invalidateQueries({ queryKey: ['sesiones-abiertas'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al cerrar sesión');
    },
  });

  const handleCerrarSesion = () => {
    if (sesion.totalItems > 0) {
      if (!confirm(`¿Cerrar la sesión ${sesion.codigo}?\n\nTotal: €${sesion.valorTotal.toFixed(2)}\nItems: ${sesion.totalItems}`)) {
        return;
      }
    }
    cerrarSesionMutation.mutate();
  };

  const tiempoTranscurrido = formatDistanceToNow(new Date(sesion.fechaApertura), {
    locale: es,
    addSuffix: true,
  });

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-blue-900">
            Sesión Activa: {sesion.codigo}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCerrarSesion}
            disabled={cerrarSesionMutation.isPending}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Nombre de la sesión */}
          <div>
            <p className="text-sm font-medium text-blue-700">Nombre</p>
            <p className="text-lg font-semibold text-blue-900">{sesion.nombre}</p>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-3 gap-4">
            {/* Valor Total */}
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <DollarSign className="h-4 w-4" />
                <p className="text-xs font-medium">Total</p>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                €{sesion.valorTotal.toFixed(2)}
              </p>
            </div>

            {/* Total Items */}
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <ShoppingCart className="h-4 w-4" />
                <p className="text-xs font-medium">Items</p>
              </div>
              <p className="text-2xl font-bold text-blue-900">{sesion.totalItems}</p>
            </div>

            {/* Duración */}
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Clock className="h-4 w-4" />
                <p className="text-xs font-medium">Duración</p>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {sesion.duracionMinutos}m
              </p>
            </div>
          </div>

          {/* Información adicional */}
          <div className="text-xs text-blue-700 bg-white bg-opacity-50 rounded p-3">
            <p>
              <strong>Abierta:</strong> {tiempoTranscurrido}
            </p>
            {sesion.empleadoNombre && (
              <p className="mt-1">
                <strong>Empleado:</strong> {sesion.empleadoNombre}
              </p>
            )}
            {sesion.creadoPor && (
              <p className="mt-1">
                <strong>Creada por:</strong> {sesion.creadoPor}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
