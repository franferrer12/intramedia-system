import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Star,
  Target,
  Activity,
  Award,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

/**
 * Panel de Performance Individual del DJ
 * Muestra métricas detalladas, evolución y comparativas
 */
const DJPerformancePanel = ({ djId, djData, eventosData }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('mes'); // mes, trimestre, año

  // Calcular métricas
  const calculateMetrics = () => {
    if (!eventosData || eventosData.length === 0) {
      return {
        totalEventos: 0,
        cacheTotalGenerado: 0,
        cachePromedio: 0,
        tasaCrecimiento: 0,
        eventosCompletados: 0,
        eventosCancelados: 0,
        tasaConversion: 0,
        ratingPromedio: 0
      };
    }

    const total = eventosData.length;
    const completados = eventosData.filter(e => e.estado === 'completado').length;
    const cancelados = eventosData.filter(e => e.estado === 'cancelado').length;
    const cacheTotal = eventosData.reduce((sum, e) => sum + (parseFloat(e.cache_total) || 0), 0);
    const cachePromedio = cacheTotal / total;

    // Calcular crecimiento comparando último mes con mes anterior
    const hoy = new Date();
    const mesActual = eventosData.filter(e => {
      const fecha = new Date(e.fecha);
      return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
    });
    const mesAnterior = eventosData.filter(e => {
      const fecha = new Date(e.fecha);
      const lastMonth = new Date(hoy.getFullYear(), hoy.getMonth() - 1);
      return fecha.getMonth() === lastMonth.getMonth() && fecha.getFullYear() === lastMonth.getFullYear();
    });

    const cacheMesActual = mesActual.reduce((sum, e) => sum + (parseFloat(e.cache_total) || 0), 0);
    const cacheMesAnterior = mesAnterior.reduce((sum, e) => sum + (parseFloat(e.cache_total) || 0), 0);
    const tasaCrecimiento = cacheMesAnterior > 0
      ? ((cacheMesActual - cacheMesAnterior) / cacheMesAnterior * 100)
      : 0;

    return {
      totalEventos: total,
      cacheTotalGenerado: cacheTotal,
      cachePromedio,
      tasaCrecimiento,
      eventosCompletados: completados,
      eventosCancelados: cancelados,
      tasaConversion: (completados / total * 100) || 0,
      ratingPromedio: 4.5 // Mock - implementar sistema real de ratings
    };
  };

  const metrics = calculateMetrics();

  // Datos para gráfico de evolución mensual
  const evolucionMensual = () => {
    const meses = {};
    eventosData?.forEach(evento => {
      const fecha = new Date(evento.fecha);
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

      if (!meses[mesKey]) {
        meses[mesKey] = { mes: mesKey, eventos: 0, cache: 0 };
      }

      meses[mesKey].eventos += 1;
      meses[mesKey].cache += parseFloat(evento.cache_total) || 0;
    });

    return Object.values(meses).sort((a, b) => a.mes.localeCompare(b.mes)).slice(-6);
  };

  // Datos para radar chart de competencias
  const competenciasData = [
    { competencia: 'Puntualidad', value: 90 },
    { competencia: 'Equipamiento', value: 85 },
    { competencia: 'Comunicación', value: 95 },
    { competencia: 'Repertorio', value: 88 },
    { competencia: 'Profesionalismo', value: 92 },
    { competencia: 'Versatilidad', value: 80 }
  ];

  const MetricCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'blue' }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600',
      purple: 'from-purple-500 to-purple-600',
      pink: 'from-pink-500 to-pink-600'
    };

    const getTrendIcon = () => {
      if (trend === 'up') return <ArrowUp className="w-4 h-4" />;
      if (trend === 'down') return <ArrowDown className="w-4 h-4" />;
      return <Minus className="w-4 h-4" />;
    };

    const getTrendColor = () => {
      if (trend === 'up') return 'text-green-600 dark:text-green-400';
      if (trend === 'down') return 'text-red-600 dark:text-red-400';
      return 'text-gray-500 dark:text-gray-400';
    };

    return (
      <motion.div
        whileHover={{ y: -4 }}
        className="relative group"
      >
        <div className={`absolute -inset-0.5 bg-gradient-to-r ${colorClasses[color]} rounded-lg opacity-20 group-hover:opacity-30 blur transition-opacity`} />
        <div className="relative bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between mb-3">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClasses[color]} bg-opacity-10`}>
              <Icon className={`w-5 h-5 text-${color}-600`} />
            </div>
            {trendValue && (
              <div className={`flex items-center gap-1 ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className="text-sm font-semibold">{trendValue}%</span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-500">{subtitle}</p>}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header con selector de período */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Panel de Performance</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Seguimiento y análisis detallado</p>
        </div>
        <div className="flex gap-2">
          {['mes', 'trimestre', 'año'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedPeriod === period
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Eventos"
          value={metrics.totalEventos}
          subtitle={`${metrics.eventosCompletados} completados`}
          icon={Calendar}
          color="blue"
          trend={metrics.totalEventos > 10 ? 'up' : metrics.totalEventos < 5 ? 'down' : 'neutral'}
          trendValue={12}
        />
        <MetricCard
          title="Caché Generado"
          value={`€${metrics.cacheTotalGenerado.toLocaleString('es-ES', {maximumFractionDigits: 0})}`}
          subtitle={`€${metrics.cachePromedio.toFixed(0)} promedio`}
          icon={DollarSign}
          color="green"
          trend={metrics.tasaCrecimiento > 0 ? 'up' : metrics.tasaCrecimiento < 0 ? 'down' : 'neutral'}
          trendValue={Math.abs(metrics.tasaCrecimiento).toFixed(1)}
        />
        <MetricCard
          title="Tasa de Éxito"
          value={`${metrics.tasaConversion.toFixed(0)}%`}
          subtitle={`${metrics.eventosCancelados} cancelados`}
          icon={Target}
          color="orange"
          trend={metrics.tasaConversion > 90 ? 'up' : metrics.tasaConversion < 70 ? 'down' : 'neutral'}
          trendValue={5}
        />
        <MetricCard
          title="Rating Promedio"
          value={metrics.ratingPromedio.toFixed(1)}
          subtitle="Valoración clientes"
          icon={Star}
          color="purple"
          trend="up"
          trendValue={2}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolución Mensual */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Evolución Últimos 6 Meses
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={evolucionMensual()}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis dataKey="mes" className="text-gray-600 dark:text-gray-400" />
              <YAxis className="text-gray-600 dark:text-gray-400" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--tw-bg-opacity)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem'
                }}
              />
              <Bar dataKey="eventos" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar de Competencias */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" />
            Análisis de Competencias
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={competenciasData}>
              <PolarGrid className="stroke-gray-200 dark:stroke-gray-700" />
              <PolarAngleAxis dataKey="competencia" className="text-xs text-gray-600 dark:text-gray-400" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} className="text-gray-600 dark:text-gray-400" />
              <Radar name="Score" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Objetivos vs Resultados */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Objetivos del Mes
          </h3>
          <span className="text-sm text-gray-600 dark:text-gray-400">Diciembre 2025</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Objetivo: Eventos */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Eventos/Mes</span>
              <span className="text-xs font-semibold text-green-600 dark:text-green-400">80%</span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">8</span>
              <span className="text-sm text-gray-500">/ 10</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '80%' }} />
            </div>
          </div>

          {/* Objetivo: Revenue */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Revenue/Mes</span>
              <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">65%</span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">€6.5K</span>
              <span className="text-sm text-gray-500">/ €10K</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '65%' }} />
            </div>
          </div>

          {/* Objetivo: Rating */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Rating Promedio</span>
              <span className="text-xs font-semibold text-green-600 dark:text-green-400">100%</span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">4.8</span>
              <span className="text-sm text-gray-500">/ 4.5</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DJPerformancePanel;
