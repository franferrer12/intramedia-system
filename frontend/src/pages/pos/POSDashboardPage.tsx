import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  CreditCard,
  Wallet,
  Clock,
  Trophy,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { posEstadisticasApi } from '../../api/pos-estadisticas.api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useState } from 'react';

type PeriodoFiltro = 'hoy' | 'semana' | 'mes';

export const POSDashboardPage = () => {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('hoy');

  // Query con auto-refresh agresivo para tiempo real
  const { data: stats, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['pos-estadisticas', periodo],
    queryFn: () => {
      switch (periodo) {
        case 'hoy':
          return posEstadisticasApi.getHoy();
        case 'semana':
          return posEstadisticasApi.getSemana();
        case 'mes':
          return posEstadisticasApi.getMes();
        default:
          return posEstadisticasApi.getHoy();
      }
    },
    refetchInterval: 5000, // ⚡ Auto-refresh cada 5 segundos para tiempo real
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 3000, // Los datos se consideran obsoletos después de 3 segundos
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando estadísticas POS...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Error al cargar las estadísticas</p>
          <p className="text-sm text-gray-600 mt-2">Por favor, inténtalo de nuevo</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Formatear números
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Datos para gráfico de métodos de pago
  const metodosPagoData = [
    { name: 'Efectivo', value: stats?.totalEfectivo || 0, color: '#10b981' },
    { name: 'Tarjeta', value: stats?.totalTarjeta || 0, color: '#3b82f6' },
    { name: 'Mixto', value: stats?.totalMixto || 0, color: '#f59e0b' }
  ];

  // Datos para gráfico de ventas por hora (solo si hay datos)
  const ventasPorHoraData = (stats?.ventasPorHora || [])
    .map(v => ({
      hora: `${v.hora}:00`,
      ventas: v.cantidad,
      total: v.total
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard POS - Tiempo Real</h1>
          <p className="text-gray-600 mt-2">
            Monitoreo en vivo de ventas y cajas {isRefetching && <span className="text-blue-600">(actualizando...)</span>}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Filtros de periodo */}
          <button
            onClick={() => setPeriodo('hoy')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              periodo === 'hoy'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setPeriodo('semana')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              periodo === 'semana'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            7 Días
          </button>
          <button
            onClick={() => setPeriodo('mes')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              periodo === 'mes'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            30 Días
          </button>
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            title="Refrescar ahora"
          >
            <RefreshCw className={`h-5 w-5 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Ingresos */}
        <Card>
          <CardBody className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats?.totalIngresos || 0)}
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Total Ventas */}
        <Card>
          <CardBody className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Ventas</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalVentas || 0}</p>
            </div>
          </CardBody>
        </Card>

        {/* Ticket Promedio */}
        <Card>
          <CardBody className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ticket Promedio</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats?.ticketPromedio || 0)}
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Productos Vendidos */}
        <Card>
          <CardBody className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-500">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unidades Vendidas</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.productosVendidos || 0}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Sesiones Activas */}
      {stats && stats.sesionesAbiertas > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Cajas Abiertas ({stats.sesionesAbiertas})
            </h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.sesionesActivasDetalle.map((sesion) => (
                <div
                  key={sesion.id}
                  className="p-4 border rounded-lg bg-green-50 border-green-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{sesion.nombreCaja}</h3>
                    <span className="px-2 py-1 text-xs font-medium bg-green-500 text-white rounded-full">
                      ABIERTA
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    Cajero: <span className="font-medium">{sesion.empleadoAperturaNombre}</span>
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    Apertura: {new Date(sesion.fechaApertura).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <div className="flex justify-between items-center pt-3 border-t border-green-200">
                    <div>
                      <p className="text-xs text-gray-600">Ventas</p>
                      <p className="text-lg font-bold text-gray-900">{sesion.totalVentas}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">Ingresos</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(sesion.totalIngresos)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Métodos de Pago */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Desglose por Método de Pago
            </h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium text-gray-600">Efectivo</p>
                </div>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(stats?.totalEfectivo || 0)}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-medium text-gray-600">Tarjeta</p>
                </div>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(stats?.totalTarjeta || 0)}
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg col-span-2">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm font-medium text-gray-600">Mixto</p>
                </div>
                <p className="text-xl font-bold text-yellow-600">
                  {formatCurrency(stats?.totalMixto || 0)}
                </p>
              </div>
            </div>
            {stats && (stats.totalEfectivo > 0 || stats.totalTarjeta > 0 || stats.totalMixto > 0) && (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={metodosPagoData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${((entry.value / (stats.totalIngresos || 1)) * 100).toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {metodosPagoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        {/* Top Productos */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top Productos Más Vendidos
            </h2>
          </CardHeader>
          <CardBody>
            {stats?.topProductos && stats.topProductos.length > 0 ? (
              <div className="space-y-3">
                {stats.topProductos.slice(0, 5).map((producto, index) => (
                  <div key={producto.productoId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-600' :
                        'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{producto.nombre}</p>
                        <p className="text-sm text-gray-600">
                          {producto.cantidadVendida} unidades en {producto.numeroVentas} ventas
                        </p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(producto.totalIngresos)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                No hay ventas registradas en este periodo
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Ventas por Hora */}
      {periodo === 'hoy' && ventasPorHoraData.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Ventas por Hora (Hoy)
            </h2>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ventasPorHoraData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hora" />
                <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'total') return formatCurrency(value);
                    return value;
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="ventas" fill="#3b82f6" name="Número de Ventas" />
                <Bar yAxisId="right" dataKey="total" fill="#10b981" name="Total (€)" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      )}

      {/* Auto-refresh indicator */}
      <div className="flex items-center justify-center gap-2 text-sm">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
          isRefetching
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 text-gray-600'
        }`}>
          <Clock className={`h-4 w-4 ${isRefetching ? 'animate-pulse' : ''}`} />
          <span className="font-medium">
            {isRefetching ? '🔄 Actualizando datos...' : '⚡ Actualización automática cada 5 segundos'}
          </span>
        </div>
      </div>
    </div>
  );
};
