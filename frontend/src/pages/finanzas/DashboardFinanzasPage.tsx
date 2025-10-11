import { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { transaccionesApi } from '../../api/transacciones.api';
import { dashboardApi } from '../../api/dashboard.api';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, ShoppingCart, ArrowRightLeft } from 'lucide-react';
import { Line } from 'recharts';

export const DashboardFinanzasPage: FC = () => {
  // Obtener transacciones
  const { data: transacciones = [], isLoading: loadingTransacciones } = useQuery({
    queryKey: ['transacciones'],
    queryFn: transaccionesApi.getAll,
  });

  // Obtener estadísticas del dashboard
  const { data: dashboardData, isLoading: loadingDashboard } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  // Calcular totales del mes actual
  const mesActual = new Date().toISOString().slice(0, 7); // YYYY-MM
  const transaccionesMes = transacciones.filter(t => t.fecha.startsWith(mesActual));

  const totalIngresos = transaccionesMes
    .filter(t => t.tipo === 'INGRESO')
    .reduce((sum, t) => sum + t.monto, 0);

  const totalGastos = transaccionesMes
    .filter(t => t.tipo === 'GASTO')
    .reduce((sum, t) => sum + t.monto, 0);

  const balance = totalIngresos - totalGastos;

  // Calcular tendencias (últimos 6 meses)
  const getTendenciaMensual = () => {
    const meses: Array<{ mes: string; ingresos: number; gastos: number; balance: number }> = [];
    const hoy = new Date();

    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const mesStr = fecha.toISOString().slice(0, 7);
      const mesNombre = fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });

      const transaccionesMes = transacciones.filter(t => t.fecha.startsWith(mesStr));
      const ingresos = transaccionesMes.filter(t => t.tipo === 'INGRESO').reduce((sum, t) => sum + t.monto, 0);
      const gastos = transaccionesMes.filter(t => t.tipo === 'GASTO').reduce((sum, t) => sum + t.monto, 0);

      meses.push({
        mes: mesNombre,
        ingresos,
        gastos,
        balance: ingresos - gastos,
      });
    }

    return meses;
  };

  const tendenciaMensual = getTendenciaMensual();

  // Categorías de gastos más altas
  const gastosporCategoria = transaccionesMes
    .filter(t => t.tipo === 'GASTO')
    .reduce((acc, t) => {
      const categoria = t.categoriaNombre || 'Sin categoría';
      acc[categoria] = (acc[categoria] || 0) + t.monto;
      return acc;
    }, {} as Record<string, number>);

  const topGastos = Object.entries(gastosporCategoria)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Métodos de pago
  const ingresosporMetodo = transaccionesMes
    .filter(t => t.tipo === 'INGRESO')
    .reduce((acc, t) => {
      const metodo = t.metodoPago || 'No especificado';
      acc[metodo] = (acc[metodo] || 0) + t.monto;
      return acc;
    }, {} as Record<string, number>);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const formatPercentage = (value: number, total: number) => {
    return ((value / total) * 100).toFixed(1);
  };

  if (loadingTransacciones || loadingDashboard) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard financiero...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Financiero</h1>
        <p className="text-gray-600 mt-2">
          Resumen consolidado de ingresos, gastos y ventas POS
        </p>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Ingresos del Mes</p>
                <p className="text-3xl font-bold mt-2">{formatCurrency(totalIngresos)}</p>
                <p className="text-green-100 text-sm mt-2">
                  {transaccionesMes.filter(t => t.tipo === 'INGRESO').length} transacciones
                </p>
              </div>
              <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                <TrendingUp className="h-8 w-8" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Gastos del Mes</p>
                <p className="text-3xl font-bold mt-2">{formatCurrency(totalGastos)}</p>
                <p className="text-red-100 text-sm mt-2">
                  {transaccionesMes.filter(t => t.tipo === 'GASTO').length} transacciones
                </p>
              </div>
              <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                <TrendingDown className="h-8 w-8" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className={`bg-gradient-to-br ${balance >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} text-white`}>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Balance (P&L)</p>
                <p className="text-3xl font-bold mt-2">{formatCurrency(balance)}</p>
                <p className="text-blue-100 text-sm mt-2">
                  {balance >= 0 ? 'Beneficio' : 'Pérdida'} del mes
                </p>
              </div>
              <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                <DollarSign className="h-8 w-8" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Gráfico de Tendencia */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Tendencia de Ingresos vs Gastos</h2>
              <p className="text-sm text-gray-600 mt-1">Últimos 6 meses</p>
            </div>
            <BarChart3 className="h-6 w-6 text-blue-600" />
          </div>
        </CardHeader>
        <CardBody>
          <div className="w-full overflow-x-auto">
            <div className="min-w-[500px] h-64 flex items-end justify-around gap-4 px-4">
              {tendenciaMensual.map((mes, index) => {
                const maxValue = Math.max(...tendenciaMensual.map(m => Math.max(m.ingresos, m.gastos)));
                const ingresosHeight = (mes.ingresos / maxValue) * 100;
                const gastosHeight = (mes.gastos / maxValue) * 100;

                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex gap-1 items-end h-48 mb-2">
                      <div
                        className="flex-1 bg-green-500 rounded-t hover:bg-green-600 transition-colors cursor-pointer group relative"
                        style={{ height: `${ingresosHeight}%` }}
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap transition-opacity">
                          {formatCurrency(mes.ingresos)}
                        </div>
                      </div>
                      <div
                        className="flex-1 bg-red-500 rounded-t hover:bg-red-600 transition-colors cursor-pointer group relative"
                        style={{ height: `${gastosHeight}%` }}
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap transition-opacity">
                          {formatCurrency(mes.gastos)}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 text-center font-medium">
                      {mes.mes}
                    </p>
                    <p className={`text-xs font-bold mt-1 ${mes.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {mes.balance >= 0 ? '+' : ''}{formatCurrency(mes.balance)}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-700">Ingresos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-700">Gastos</span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Detalles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categorías de Gastos */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Top Gastos por Categoría</h2>
          </CardHeader>
          <CardBody>
            {topGastos.length > 0 ? (
              <div className="space-y-4">
                {topGastos.map(([categoria, monto]) => (
                  <div key={categoria}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{categoria}</span>
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(monto)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full transition-all"
                        style={{ width: `${formatPercentage(monto, totalGastos)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatPercentage(monto, totalGastos)}% del total
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No hay datos de gastos este mes</p>
            )}
          </CardBody>
        </Card>

        {/* Ingresos por Método de Pago */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Ingresos por Método de Pago</h2>
          </CardHeader>
          <CardBody>
            {Object.keys(ingresosporMetodo).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(ingresosporMetodo)
                  .sort(([, a], [, b]) => b - a)
                  .map(([metodo, monto]) => (
                    <div key={metodo}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{metodo}</span>
                        <span className="text-sm font-bold text-gray-900">{formatCurrency(monto)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${formatPercentage(monto, totalIngresos)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatPercentage(monto, totalIngresos)}% del total
                      </p>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No hay datos de ingresos este mes</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
