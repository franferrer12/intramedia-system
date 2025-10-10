import { FC, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../api/analytics.api';
import { DashboardMetrics, CostesLaborales, AnalisisRentabilidad } from '../../types';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Clock,
  Calendar,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import { DatePicker } from '../../components/ui/DatePicker';

export const AnalyticsPage: FC = () => {
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Query para el dashboard principal
  const { data: dashboardData, isLoading: loadingDashboard } = useQuery<DashboardMetrics>({
    queryKey: ['analytics-dashboard'],
    queryFn: analyticsApi.getDashboardMetrics,
  });

  // Query para costes laborales
  const { data: costesData, isLoading: loadingCostes } = useQuery<CostesLaborales>({
    queryKey: ['analytics-costes'],
    queryFn: () => analyticsApi.getCostesLaborales(undefined),
  });

  // Query para rentabilidad de eventos
  const { data: rentabilidadData = [], isLoading: loadingRentabilidad } = useQuery<AnalisisRentabilidad[]>({
    queryKey: ['analytics-rentabilidad', fechaDesde, fechaHasta],
    queryFn: () => analyticsApi.getRentabilidadEventos(
      fechaDesde || undefined,
      fechaHasta || undefined
    ),
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Componente MetricCard
  const MetricCard: FC<{
    title: string;
    value: string | number;
    change?: number;
    icon: React.ElementType;
    color: string;
    subtitle?: string;
  }> = ({ title, value, change, icon: Icon, color, subtitle }) => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {change !== undefined && (
            <div className="flex items-center mt-2">
              {change >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span
                className={`text-sm font-medium ${
                  change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatPercentage(change)}
              </span>
              <span className="text-xs text-gray-500 ml-1">vs mes anterior</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  // Componente LineChart simple con CSS
  const LineChart: FC<{ data: Array<{ periodo: string; total: number }> }> = ({ data }) => {
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data.map((d) => d.total));
    const minValue = Math.min(...data.map((d) => d.total));
    const range = maxValue - minValue || 1;

    return (
      <div className="w-full h-64 relative">
        <div className="absolute inset-0 flex items-end justify-around pb-8">
          {data.map((item, index) => {
            const height = ((item.total - minValue) / range) * 100;
            return (
              <div key={index} className="flex flex-col items-center flex-1 mx-1">
                <div className="w-full relative group">
                  <div
                    className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-all cursor-pointer"
                    style={{ height: `${Math.max(height, 5)}%` }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap transition-opacity">
                      {formatCurrency(item.total)}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2 text-center">
                  {item.periodo.split('-')[1]}/{item.periodo.split('-')[0].slice(-2)}
                </p>
              </div>
            );
          })}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-300" />
      </div>
    );
  };

  if (loadingDashboard) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Análisis del Negocio</h1>
          <p className="text-gray-600 mt-1">
            Cómo va tu club
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      {/* Métricas principales */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Costes Laborales Mes Actual"
            value={formatCurrency(dashboardData?.costesLaboralesMesActual || 0)}
            change={dashboardData?.variacionMensual}
            icon={DollarSign}
            color="bg-blue-500"
            subtitle={dashboardData?.mesActual || ''}
          />
          <MetricCard
            title="Empleados Activos"
            value={dashboardData?.empleadosActivos || 0}
            icon={Users}
            color="bg-green-500"
            subtitle={`${dashboardData?.cantidadJornadasMesActual || 0} jornadas este mes`}
          />
          <MetricCard
            title="Coste Medio por Hora"
            value={formatCurrency(dashboardData?.promedioCosteHora || 0)}
            icon={Clock}
            color="bg-purple-500"
            subtitle={`${(dashboardData?.totalHorasMesActual || 0).toFixed(1)} horas trabajadas`}
          />
          <MetricCard
            title="Pendiente de Pago"
            value={formatCurrency(dashboardData?.importePendientePago || 0)}
            icon={AlertCircle}
            color="bg-orange-500"
            subtitle={`${dashboardData?.jornadasPendientesPago || 0} jornadas pendientes`}
          />
        </div>
      )}

      {/* Gráfico de tendencia */}
      {dashboardData && dashboardData.ultimos6MesesTendencia && dashboardData.ultimos6MesesTendencia.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Evolución de Costes Laborales
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Últimos 6 meses
              </p>
            </div>
            <BarChart3 className="h-6 w-6 text-blue-600" />
          </div>
          {loadingCostes ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <LineChart data={dashboardData.ultimos6MesesTendencia} />
          )}
        </div>
      )}

      {/* Detalles de costes laborales */}
      {costesData && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Detalle de Costes Laborales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Pagado</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {formatCurrency(costesData?.totalPagadoMes || 0)}
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Nóminas</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {formatCurrency(costesData?.totalNominaMes || 0)}
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-600">Horas Trabajadas</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {(costesData?.totalHorasTrabajadas || 0).toFixed(1)}h
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-600">Coste por Jornada</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {formatCurrency(costesData?.promedioCosteJornada || 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros para rentabilidad */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Análisis de Rentabilidad por Eventos
        </h2>
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <DatePicker
              label="Desde"
              value={fechaDesde}
              onChange={(value) => setFechaDesde(value)}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <DatePicker
              label="Hasta"
              value={fechaHasta}
              onChange={(value) => setFechaHasta(value)}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFechaDesde('');
                setFechaHasta('');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {/* Tabla de rentabilidad */}
        {loadingRentabilidad ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : rentabilidadData && rentabilidadData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Evento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ingresos
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Costes Personal
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Otros Gastos
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Margen
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % Margen
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rentabilidadData.map((item) => (
                  <tr key={item.eventoId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.eventoNombre}
                      </div>
                      {item.aforoReal && (
                        <div className="text-xs text-gray-500">
                          {item.cantidadEmpleados} empleados | {item.aforoReal} asistentes
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.eventoFecha).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {item.eventoTipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                      {formatCurrency(item.ingresosEvento)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                      {formatCurrency(item.costesPersonal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                      {formatCurrency(item.otrosGastos)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold">
                      <span
                        className={
                          item.margenBruto >= 0 ? 'text-green-600' : 'text-red-600'
                        }
                      >
                        {formatCurrency(item.margenBruto)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <div className="flex items-center justify-end">
                        {item.porcentajeMargen >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                        )}
                        <span
                          className={
                            item.porcentajeMargen >= 0
                              ? 'text-green-600 font-medium'
                              : 'text-red-600 font-medium'
                          }
                        >
                          {item.porcentajeMargen.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.eventoEstado === 'FINALIZADO'
                            ? 'bg-green-100 text-green-800'
                            : item.eventoEstado === 'EN_CURSO'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {item.eventoEstado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay datos de rentabilidad disponibles</p>
            <p className="text-sm text-gray-400 mt-2">
              Ajusta los filtros para ver resultados
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
