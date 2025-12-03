import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import {
  Activity,
  DollarSign,
  ShoppingCart,
  Clock,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { sesionesVentaApi } from '../../api/sesiones-venta.api';
import { ventaApi } from '../../api/pos-ventas.api';
import { posEstadisticasApi } from '../../api/pos-estadisticas.api';

export default function MonitorSesionesPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Query para sesiones abiertas con auto-refresh
  const { data: sesionesAbiertas, isLoading: loadingSesiones, refetch: refetchSesiones } = useQuery({
    queryKey: ['sesiones-abiertas-monitor'],
    queryFn: sesionesVentaApi.listarSesionesAbiertas,
    refetchInterval: autoRefresh ? 5000 : false, // 5 segundos
  });

  // Query para estadísticas del día
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['pos-stats-monitor'],
    queryFn: posEstadisticasApi.getHoy,
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(value);
  };

  const handleRefreshManual = () => {
    refetchSesiones();
    refetchStats();
  };

  if (loadingSesiones) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando monitor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="h-8 w-8 text-blue-600" />
            Monitor de Sesiones en Tiempo Real
          </h1>
          <p className="text-gray-600 mt-1">
            Vista en vivo de todas las sesiones activas
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle auto-refresh */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              autoRefresh
                ? 'bg-green-100 text-green-700 border-2 border-green-300'
                : 'bg-gray-100 text-gray-700 border-2 border-gray-300'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>

          {/* Refresh manual */}
          <button
            onClick={handleRefreshManual}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
          >
            <RefreshCw className="h-5 w-5" />
            Actualizar
          </button>
        </div>
      </div>

      {/* KPIs Globales del Día */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Ingresos Hoy</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(stats.totalIngresos || 0)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Ventas Totales</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalVentas || 0}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Ticket Promedio</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(stats.ticketPromedio || 0)}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Sesiones Activas</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {sesionesAbiertas?.length || 0}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de sesiones activas */}
      {!sesionesAbiertas || sesionesAbiertas.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <XCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500">No hay sesiones activas en este momento</p>
            <p className="text-sm text-gray-400 mt-2">Las sesiones aparecerán aquí cuando se abran</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sesionesAbiertas.map((sesion) => (
            <SesionCard key={sesion.id} sesion={sesion} />
          ))}
        </div>
      )}
    </div>
  );
}

// Componente individual de sesión
function SesionCard({ sesion }: { sesion: any }) {
  // Query para últimas ventas de esta sesión
  const { data: ventas } = useQuery({
    queryKey: ['ventas-sesion', sesion.id],
    queryFn: () => ventaApi.getBySesionCaja(sesion.id),
    refetchInterval: 5000,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const calcularDuracion = (fechaApertura: string) => {
    const inicio = new Date(fechaApertura);
    const ahora = new Date();
    const diffMs = ahora.getTime() - inicio.getTime();
    const horas = Math.floor(diffMs / (1000 * 60 * 60));
    const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (horas > 0) {
      return `${horas}h ${minutos}min`;
    }
    return `${minutos} min`;
  };

  const ultimasVentas = ventas?.slice(-5).reverse() || [];

  return (
    <Card className="border-2 border-green-200 bg-green-50">
      <CardHeader className="border-b border-green-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <div>
              <h3 className="text-lg font-bold text-gray-900">{sesion.codigo}</h3>
              <p className="text-sm text-gray-600">{sesion.nombre}</p>
            </div>
          </div>
          <div className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold">
            ACTIVA
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Info básica */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-lg">
            <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Duración
            </p>
            <p className="font-bold text-gray-900">{calcularDuracion(sesion.fechaApertura)}</p>
          </div>

          <div className="bg-white p-3 rounded-lg">
            <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
              <ShoppingCart className="h-3 w-3" />
              Ventas
            </p>
            <p className="font-bold text-blue-600">{sesion.totalItems || 0}</p>
          </div>

          <div className="bg-white p-3 rounded-lg">
            <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Total
            </p>
            <p className="font-bold text-green-600">{formatCurrency(sesion.valorTotal || 0)}</p>
          </div>
        </div>

        {/* Últimas ventas */}
        <div className="bg-white rounded-lg p-3">
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Últimas Ventas (Live)
          </h4>

          {ultimasVentas.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">Sin ventas aún</p>
          ) : (
            <div className="space-y-1">
              {ultimasVentas.map((venta: any) => (
                <div
                  key={venta.id}
                  className="flex items-center justify-between text-xs py-1.5 px-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span className="text-gray-600">{formatTime(venta.createdAt)}</span>
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">
                      {venta.metodoPago}
                    </span>
                  </div>
                  <span className="font-semibold text-green-600">{formatCurrency(venta.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info del empleado */}
        {sesion.empleadoNombre && (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-white p-2 rounded">
            <Users className="h-4 w-4" />
            <span>Cajero: <span className="font-medium text-gray-900">{sesion.empleadoNombre}</span></span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
