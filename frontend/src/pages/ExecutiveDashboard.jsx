import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Activity,
  PieChart,
  BarChart3,
  FileDown,
  FileSpreadsheet,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';

const ExecutiveDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [healthScore, setHealthScore] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load both metrics and health score in parallel
      const [metricsRes, healthRes] = await Promise.all([
        fetch('http://localhost:3001/api/executive-dashboard/metrics'),
        fetch('http://localhost:3001/api/executive-dashboard/health-score')
      ]);

      const metricsData = await metricsRes.json();
      const healthData = await healthRes.json();

      if (metricsData.success && healthData.success) {
        setData(metricsData.data);
        setHealthScore(healthData.data);
      } else {
        toast.error('Error al cargar datos del dashboard');
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Error de conexión con el servidor');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-ES').format(num || 0);
  };

  const getHealthScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthScoreBg = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-blue-100';
    if (score >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading || !data) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard ejecutivo...</p>
        </div>
      </div>
    );
  }

  const { financialOverview, clientMetrics, djMetrics, alertsSummary, revenueByMonth, topClients, topDJs, pendingPayments, profitDistribution } = data;

  // Prepare chart data
  const revenueChartData = revenueByMonth.map(month => ({
    name: month.mes_nombre.trim(),
    Facturación: parseFloat(month.facturacion),
    Cobrado: parseFloat(month.cobrado),
    Beneficio: parseFloat(month.beneficio_bruto)
  }));

  const alertsChartData = [
    { name: 'Críticas', value: parseInt(alertsSummary.alertas_criticas), color: '#EF4444' },
    { name: 'Advertencias', value: parseInt(alertsSummary.alertas_warning), color: '#F59E0B' },
    { name: 'Informativas', value: parseInt(alertsSummary.alertas_info), color: '#3B82F6' }
  ];

  const profitDistChartData = [
    { name: 'Comisión Agencia (10%)', value: parseFloat(profitDistribution.comision_agencia), color: '#8B5CF6' },
    { name: 'Propietarios (90%)', value: parseFloat(profitDistribution.beneficio_propietarios), color: '#10B981' }
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Ejecutivo</h1>
          <p className="text-gray-600 mt-1">Vista consolidada del rendimiento financiero</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={() => toast.success('Funcionalidad de exportación próximamente')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={() => toast.success('Funcionalidad de exportación próximamente')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
        </div>
      </div>

      {/* Financial Health Score */}
      {healthScore && (
        <div className={`rounded-xl shadow-lg p-8 ${getHealthScoreBg(healthScore.score)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-20 h-20 rounded-full ${getHealthScoreBg(healthScore.score)} flex items-center justify-center border-4 ${healthScore.score >= 80 ? 'border-green-300' : healthScore.score >= 60 ? 'border-blue-300' : healthScore.score >= 40 ? 'border-yellow-300' : 'border-red-300'}`}>
                <span className={`text-3xl font-bold ${getHealthScoreColor(healthScore.score)}`}>
                  {healthScore.score}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Índice de Salud Financiera</h2>
                <p className={`text-lg font-semibold ${getHealthScoreColor(healthScore.score)}`}>
                  {healthScore.status}
                </p>
                <p className="text-sm text-gray-600 mt-1">{healthScore.message}</p>
              </div>
            </div>
            <Activity className={`w-16 h-16 ${getHealthScoreColor(healthScore.score)}`} />
          </div>
        </div>
      )}

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Facturación Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(financialOverview.facturacion_total)}
              </p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {formatCurrency(financialOverview.facturacion_ultimo_mes)} este mes
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rentabilidad Neta</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(financialOverview.rentabilidad_neta_realizada)}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Margen: {financialOverview.margen_beneficio_porcentaje}%
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendiente Cobro</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {formatCurrency(financialOverview.total_pendiente_cobro)}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Tasa cobro: {financialOverview.tasa_cobro_eventos}%
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Eventos</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {formatNumber(financialOverview.total_eventos)}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {formatNumber(financialOverview.eventos_ultimo_mes)} este mes
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Summary Card */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Alertas Activas
          </h2>
          <button
            onClick={() => navigate('/financial-alerts')}
            className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            Ver todas <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-gray-900">{alertsSummary.alertas_activas}</p>
            <p className="text-xs text-gray-600 mt-1">Total Activas</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-3xl font-bold text-red-600">{alertsSummary.alertas_criticas}</p>
            <p className="text-xs text-gray-600 mt-1">Críticas</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-3xl font-bold text-orange-600">{alertsSummary.cobros_criticos}</p>
            <p className="text-xs text-gray-600 mt-1">Cobros Críticos</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-3xl font-bold text-yellow-600">{alertsSummary.pagos_dj_pendientes}</p>
            <p className="text-xs text-gray-600 mt-1">Pagos DJ</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">{alertsSummary.clientes_en_riesgo}</p>
            <p className="text-xs text-gray-600 mt-1">Clientes en Riesgo</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Evolución de Ingresos (Últimos 12 meses)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                contentStyle={{ fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="Facturación" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="Cobrado" stroke="#10B981" strokeWidth={2} />
              <Line type="monotone" dataKey="Beneficio" stroke="#8B5CF6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Profit Distribution */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Distribución de Beneficios
          </h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={250}>
              <RePieChart>
                <Pie
                  data={profitDistChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {profitDistChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </RePieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm text-gray-600">Beneficio Distribuible</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(profitDistribution.beneficio_distribuible)}
                </p>
              </div>
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Comisión Agencia (10%)</span>
                  <span className="text-sm font-semibold text-purple-600">
                    {formatCurrency(profitDistribution.comision_agencia)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Propietarios (90%)</span>
                  <span className="text-sm font-semibold text-green-600">
                    {formatCurrency(profitDistribution.beneficio_propietarios)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Por propietario (45%)</span>
                  <span className="text-sm font-semibold text-blue-600">
                    {formatCurrency(profitDistribution.beneficio_por_propietario)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client Metrics */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Métricas de Clientes
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Clientes</span>
              <span className="text-lg font-bold text-gray-900">{clientMetrics.total_clientes}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Clientes Activos</span>
              <span className="text-lg font-bold text-green-600">{clientMetrics.clientes_activos}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Activos Trimestre</span>
              <span className="text-lg font-bold text-blue-600">{clientMetrics.clientes_activos_trimestre}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Clientes VIP (10+ eventos)</span>
              <span className="text-lg font-bold text-purple-600">{clientMetrics.clientes_vip}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Nuevos este mes</span>
              <span className="text-lg font-bold text-indigo-600">{clientMetrics.clientes_nuevos_mes}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Promedio eventos/cliente</span>
                <span className="text-sm font-semibold text-gray-900">{clientMetrics.promedio_eventos_por_cliente}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-600">Facturación media/cliente</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(clientMetrics.facturacion_promedio_por_cliente)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* DJ Metrics */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Métricas de DJs
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total DJs</span>
              <span className="text-lg font-bold text-gray-900">{djMetrics.total_djs}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">DJs Activos</span>
              <span className="text-lg font-bold text-green-600">{djMetrics.djs_activos}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Activos Trimestre</span>
              <span className="text-lg font-bold text-blue-600">{djMetrics.djs_activos_trimestre}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">DJ con más eventos</span>
              <span className="text-lg font-bold text-purple-600">{djMetrics.dj_mas_eventos || 'N/A'}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Promedio eventos/DJ</span>
                <span className="text-sm font-semibold text-gray-900">{djMetrics.promedio_eventos_por_dj}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-600">Pago promedio/DJ</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(djMetrics.pago_promedio_por_dj)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Payments */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          Pagos Pendientes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Collections */}
          <div>
            <h4 className="text-md font-semibold text-gray-700 mb-3">Cobros de Clientes</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="text-sm text-gray-600">Eventos pendientes cobro</span>
                <span className="text-lg font-bold text-orange-600">
                  {pendingPayments.eventos_pendiente_cobro_count}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="text-sm text-gray-600">Monto total pendiente</span>
                <span className="text-lg font-bold text-orange-600">
                  {formatCurrency(pendingPayments.eventos_pendiente_cobro_total)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-sm text-gray-600">Eventos vencidos (+30d)</span>
                <span className="text-lg font-bold text-red-600">
                  {pendingPayments.eventos_vencidos_cobro_count}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-sm text-gray-600">Monto vencido</span>
                <span className="text-lg font-bold text-red-600">
                  {formatCurrency(pendingPayments.eventos_vencidos_cobro_total)}
                </span>
              </div>
            </div>
          </div>

          {/* DJ Payments */}
          <div>
            <h4 className="text-md font-semibold text-gray-700 mb-3">Pagos a DJs</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm text-gray-600">Eventos pendientes pago</span>
                <span className="text-lg font-bold text-yellow-600">
                  {pendingPayments.eventos_pendiente_pago_dj_count}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm text-gray-600">Monto total pendiente</span>
                <span className="text-lg font-bold text-yellow-600">
                  {formatCurrency(pendingPayments.eventos_pendiente_pago_dj_total)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-sm text-gray-600">Eventos vencidos (+14d)</span>
                <span className="text-lg font-bold text-red-600">
                  {pendingPayments.eventos_vencidos_pago_dj_count}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-sm text-gray-600">Monto vencido</span>
                <span className="text-lg font-bold text-red-600">
                  {formatCurrency(pendingPayments.eventos_vencidos_pago_dj_total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clients */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Top 10 Clientes por Facturación
            </h3>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {topClients.slice(0, 10).map((client, index) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  onClick={() => navigate(`/cliente-metrics?id=${client.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-600' :
                      'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{client.nombre}</p>
                      <p className="text-xs text-gray-500">{client.total_eventos} eventos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(client.facturacion_total)}
                    </p>
                    <p className="text-xs text-green-600">{client.tasa_cobro}% cobrado</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top DJs */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-purple-500 to-purple-600">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Top 10 DJs por Eventos
            </h3>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {topDJs.slice(0, 10).map((dj, index) => (
                <div
                  key={dj.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  onClick={() => navigate(`/dj-metrics?id=${dj.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-600' :
                      'bg-purple-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{dj.nombre}</p>
                      <p className="text-xs text-gray-500">{dj.total_eventos} eventos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(dj.total_cobrado)}
                    </p>
                    <p className="text-xs text-green-600">{dj.tasa_pago}% pagado</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/financial-alerts')}
            className="p-4 border-2 border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
          >
            <AlertTriangle className="w-6 h-6 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-900">Ver Alertas</p>
          </button>
          <button
            onClick={() => navigate('/clientes-payments-pending')}
            className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <DollarSign className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-900">Cobros Pendientes</p>
          </button>
          <button
            onClick={() => navigate('/profit-distribution')}
            className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <PieChart className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-900">Distribución</p>
          </button>
          <button
            onClick={() => navigate('/financial')}
            className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors"
          >
            <BarChart3 className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-900">Reportes</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
