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
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { DatePicker } from '../../components/ui/DatePicker';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
} from 'recharts';

export const AnalyticsPage: FC = () => {
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [selectedPeriodo, setSelectedPeriodo] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

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

  // Función para exportar datos a CSV
  const exportToCSV = () => {
    if (!rentabilidadData || rentabilidadData.length === 0) return;

    const headers = [
      'Evento',
      'Fecha',
      'Tipo',
      'Ingresos',
      'Costes Personal',
      'Otros Gastos',
      'Margen Bruto',
      '% Margen',
      'Estado',
    ];

    const rows = rentabilidadData.map((item) => [
      item.eventoNombre,
      new Date(item.eventoFecha).toLocaleDateString('es-ES'),
      item.eventoTipo,
      item.ingresosEvento.toFixed(2),
      item.costesPersonal.toFixed(2),
      item.otrosGastos.toFixed(2),
      item.margenBruto.toFixed(2),
      item.porcentajeMargen.toFixed(2),
      item.eventoEstado,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `rentabilidad_eventos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función para exportar gráfico como imagen
  const exportChartAsImage = (chartId: string) => {
    const chartElement = document.getElementById(chartId);
    if (!chartElement) return;

    // Usamos html2canvas o similar (necesitaría instalarse)
    // Por ahora, mostramos un mensaje
    alert('Funcionalidad de exportación de gráfico como imagen disponible próximamente');
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

  // Componente de gráfico interactivo mejorado
  const InteractiveChart: FC<{ data: Array<{ periodo: string; total: number }> }> = ({ data }) => {
    if (!data || data.length === 0) return null;

    const chartData = data.map((item) => ({
      periodo: `${item.periodo.split('-')[1]}/${item.periodo.split('-')[0].slice(-2)}`,
      periodoCompleto: item.periodo,
      total: item.total,
    }));

    const handleBarClick = (data: any) => {
      if (data && data.periodoCompleto) {
        setSelectedPeriodo(data.periodoCompleto);
        alert(`Detalles del período ${data.periodoCompleto}:\n\nTotal: ${formatCurrency(data.total)}`);
      }
    };

    return (
      <ResponsiveContainer width="100%" height={300}>
        {chartType === 'bar' ? (
          <BarChart data={chartData} onClick={handleBarClick}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="periodo"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: any) => [formatCurrency(value), 'Total']}
              cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
            />
            <Bar
              dataKey="total"
              fill="#3b82f6"
              radius={[8, 8, 0, 0]}
              cursor="pointer"
            />
          </BarChart>
        ) : (
          <RechartsLineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="periodo"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: any) => [formatCurrency(value), 'Total']}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 5 }}
              activeDot={{ r: 7, cursor: 'pointer' }}
            />
          </RechartsLineChart>
        )}
      </ResponsiveContainer>
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
                Últimos 6 meses • {selectedPeriodo ? `Período seleccionado: ${selectedPeriodo}` : 'Haz clic en una barra para ver detalles'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Toggle de tipo de gráfico */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    chartType === 'bar'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Gráfico de barras"
                >
                  Barras
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    chartType === 'line'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Gráfico de líneas"
                >
                  Líneas
                </button>
              </div>
              <button
                onClick={() => exportChartAsImage('chart-container')}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Exportar gráfico"
              >
                <Download className="h-5 w-5" />
              </button>
            </div>
          </div>
          {loadingCostes ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div id="chart-container">
              <InteractiveChart data={dashboardData.ultimos6MesesTendencia} />
            </div>
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Análisis de Rentabilidad por Eventos
          </h2>
          {rentabilidadData && rentabilidadData.length > 0 && (
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar CSV
            </button>
          )}
        </div>
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
