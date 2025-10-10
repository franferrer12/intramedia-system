import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Calendar, Clock, DollarSign, ShoppingCart, User, Loader2 } from 'lucide-react';
import { sesionesVentaApi } from '../../api/sesiones-venta.api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SesionesPage() {
  const [sesionExpandida, setSesionExpandida] = useState<number | null>(null);

  const { data: sesiones, isLoading } = useQuery({
    queryKey: ['sesiones-venta'],
    queryFn: sesionesVentaApi.listarSesiones,
  });

  const { data: consumosExpandidos } = useQuery({
    queryKey: ['consumos-sesion', sesionExpandida],
    queryFn: () => sesionesVentaApi.listarConsumosDeSesion(sesionExpandida!),
    enabled: sesionExpandida !== null,
  });

  const toggleSesion = (id: number) => {
    setSesionExpandida(sesionExpandida === id ? null : id);
  };

  const getEstadoBadge = (estado: string) => {
    const badges = {
      ABIERTA: 'bg-green-100 text-green-800',
      CERRADA: 'bg-gray-100 text-gray-800',
      CANCELADA: 'bg-red-100 text-red-800',
    };
    return badges[estado as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Historial de Sesiones</h1>
        <p className="text-gray-600 mt-1">
          Consulta todas las sesiones de venta registradas
        </p>
      </div>

      {/* Estadísticas generales */}
      {sesiones && sesiones.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sesiones</p>
                  <p className="text-2xl font-bold text-gray-900">{sesiones.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Abiertas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {sesiones.filter((s) => s.estado === 'ABIERTA').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-blue-600">
                    €{sesiones.reduce((sum, s) => sum + s.valorTotal, 0).toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {sesiones.reduce((sum, s) => sum + s.totalItems, 0)}
                  </p>
                </div>
                <ShoppingCart className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de sesiones */}
      {!sesiones || sesiones.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No hay sesiones registradas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sesiones.map((sesion) => (
            <Card key={sesion.id} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleSesion(sesion.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{sesion.codigo}</CardTitle>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getEstadoBadge(
                          sesion.estado
                        )}`}
                      >
                        {sesion.estado}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{sesion.nombre}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      €{sesion.valorTotal.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">{sesion.totalItems} items</p>
                  </div>
                </div>
              </CardHeader>

              {sesionExpandida === sesion.id && (
                <CardContent className="border-t bg-gray-50">
                  {/* Información de la sesión */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Apertura</p>
                      <p className="text-sm text-gray-900">
                        {format(new Date(sesion.fechaApertura), "dd/MM/yyyy 'a las' HH:mm", {
                          locale: es,
                        })}
                      </p>
                    </div>

                    {sesion.fechaCierre && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Cierre</p>
                        <p className="text-sm text-gray-900">
                          {format(new Date(sesion.fechaCierre), "dd/MM/yyyy 'a las' HH:mm", {
                            locale: es,
                          })}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Duración</p>
                      <p className="text-sm text-gray-900">
                        {Math.floor(sesion.duracionMinutos / 60)}h {sesion.duracionMinutos % 60}m
                      </p>
                    </div>

                    {sesion.creadoPor && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Creada por
                        </p>
                        <p className="text-sm text-gray-900">{sesion.creadoPor}</p>
                      </div>
                    )}
                  </div>

                  {/* Consumos */}
                  {consumosExpandidos && consumosExpandidos.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">
                        Consumos ({consumosExpandidos.length})
                      </h4>
                      <div className="space-y-2">
                        {consumosExpandidos.map((consumo) => (
                          <div
                            key={consumo.id}
                            className="flex items-center justify-between bg-white p-3 rounded border border-gray-200"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {consumo.productoNombre}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Cantidad: {consumo.cantidad} × €{consumo.precioUnitario.toFixed(2)}
                                {consumo.notas && ` • ${consumo.notas}`}
                              </p>
                            </div>
                            <p className="font-semibold text-gray-900">
                              €{consumo.subtotal.toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {consumosExpandidos && consumosExpandidos.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No hay consumos registrados en esta sesión
                    </p>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
