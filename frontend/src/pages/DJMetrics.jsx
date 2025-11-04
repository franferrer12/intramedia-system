import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Clock,
  Users,
  Award,
  AlertCircle,
  CheckCircle,
  Activity,
  BarChart3,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

const DJMetrics = () => {
  const [searchParams] = useSearchParams();
  const djId = searchParams.get('id');

  const [djStats, setDjStats] = useState(null);
  const [monthlyPerformance, setMonthlyPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (djId) {
      loadDJData();
    }
  }, [djId, selectedYear]);

  const loadDJData = async () => {
    try {
      setLoading(true);

      // Cargar estadísticas del DJ
      const statsResponse = await fetch(`http://localhost:3001/api/djs-financial/financial-stats/${djId}`);
      const statsData = await statsResponse.json();

      // Cargar rendimiento mensual
      const performanceResponse = await fetch(
        `http://localhost:3001/api/djs-financial/rendimiento-mensual?dj_id=${djId}&año=${selectedYear}`
      );
      const performanceData = await performanceResponse.json();

      if (statsData.success) {
        setDjStats(statsData.data);
      }

      if (performanceData.success) {
        setMonthlyPerformance(performanceData.data);
      }
    } catch (error) {
      console.error('Error al cargar datos del DJ:', error);
      toast.error('Error al cargar métricas del DJ');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  const getMonthName = (month) => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return months[month - 1] || '';
  };

  const calculateTrend = () => {
    if (monthlyPerformance.length < 2) return null;

    const recent = monthlyPerformance.slice(-3);
    const old = monthlyPerformance.slice(0, 3);

    const recentAvg = recent.reduce((sum, m) => sum + parseFloat(m.total_cobrado || 0), 0) / recent.length;
    const oldAvg = old.reduce((sum, m) => sum + parseFloat(m.total_cobrado || 0), 0) / old.length;

    const percentChange = oldAvg > 0 ? ((recentAvg - oldAvg) / oldAvg) * 100 : 0;

    return {
      isPositive: percentChange > 0,
      percentage: Math.abs(percentChange).toFixed(1)
    };
  };

  const trend = calculateTrend();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando métricas...</p>
        </div>
      </div>
    );
  }

  if (!djStats) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">DJ no encontrado</h3>
          <p className="text-red-700">No se encontraron datos para este DJ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Métricas de {djStats.dj_nombre}</h1>
            <p className="text-gray-600 mt-1">{djStats.dj_email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border rounded-lg"
          >
            <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
            <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
            <option value={new Date().getFullYear() - 2}>{new Date().getFullYear() - 2}</option>
          </select>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-3">
        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
          djStats.dj_activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {djStats.dj_activo ? 'Activo' : 'Inactivo'}
        </span>

        {trend && (
          <span className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold ${
            trend.isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {trend.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {trend.percentage}% {trend.isPositive ? 'crecimiento' : 'caída'} últimos 3 meses
          </span>
        )}
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8 opacity-80" />
            <Activity className="w-5 h-5 opacity-60" />
          </div>
          <p className="text-blue-100 text-sm mb-1">Total Eventos</p>
          <p className="text-3xl font-bold">{djStats.total_eventos}</p>
          <p className="text-blue-100 text-xs mt-2">
            {djStats.eventos_ultimo_trimestre} en últimos 3 meses
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5 opacity-60" />
          </div>
          <p className="text-green-100 text-sm mb-1">Total Cobrado</p>
          <p className="text-3xl font-bold">{formatCurrency(djStats.total_cobrado)}</p>
          <p className="text-green-100 text-xs mt-2">
            {formatCurrency(djStats.promedio_por_evento)} por evento
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 opacity-80" />
            <BarChart3 className="w-5 h-5 opacity-60" />
          </div>
          <p className="text-purple-100 text-sm mb-1">Precio/Hora</p>
          <p className="text-3xl font-bold">
            {djStats.precio_hora_medio > 0 ? formatCurrency(djStats.precio_hora_medio) : '-'}
          </p>
          <p className="text-purple-100 text-xs mt-2">
            {djStats.total_horas_trabajadas}h trabajadas
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8 opacity-80" />
            <Users className="w-5 h-5 opacity-60" />
          </div>
          <p className="text-orange-100 text-sm mb-1">Rentabilidad Agencia</p>
          <p className="text-3xl font-bold">{formatCurrency(djStats.rentabilidad_total_agencia)}</p>
          <p className="text-orange-100 text-xs mt-2">
            {djStats.margen_beneficio_porcentaje}% margen
          </p>
        </div>
      </div>

      {/* Pagos Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Estado de Pagos
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Pendiente de pago</span>
                <span className="text-lg font-bold text-orange-600">
                  {formatCurrency(djStats.total_pendiente_pago)}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {djStats.eventos_pendiente_pago} eventos sin pagar
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">% Eventos Pagados</span>
                <span className="text-lg font-bold text-green-600">
                  {djStats.porcentaje_eventos_pagados}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    parseFloat(djStats.porcentaje_eventos_pagados) > 80
                      ? 'bg-green-500'
                      : parseFloat(djStats.porcentaje_eventos_pagados) > 50
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${djStats.porcentaje_eventos_pagados}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Actividad Reciente
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Últimos 3 meses</p>
                  <p className="text-xs text-gray-500">Eventos realizados</p>
                </div>
              </div>
              <span className="text-xl font-bold text-blue-600">
                {djStats.eventos_ultimo_trimestre}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Promedio por evento</p>
                  <p className="text-xs text-gray-500">Ingresos medios</p>
                </div>
              </div>
              <span className="text-xl font-bold text-green-600">
                {formatCurrency(djStats.promedio_por_evento)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rendimiento Mensual */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-600" />
          Rendimiento Mensual {selectedYear}
        </h3>

        {monthlyPerformance.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No hay datos para este año
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Mes</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Eventos</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Cobrado</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Promedio</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Horas</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">€/Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthlyPerformance.map((month) => (
                  <tr key={month.mes} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">{getMonthName(month.mes)}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">{month.total_eventos}</td>
                    <td className="py-3 px-4 text-right font-semibold text-green-600">
                      {formatCurrency(month.total_cobrado)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">
                      {formatCurrency(month.promedio_por_evento)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">
                      {parseFloat(month.total_horas || 0).toFixed(1)}h
                    </td>
                    <td className="py-3 px-4 text-right text-purple-600 font-medium">
                      {month.precio_hora_medio > 0 ? formatCurrency(month.precio_hora_medio) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DJMetrics;
