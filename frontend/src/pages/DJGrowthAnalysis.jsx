import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Zap,
  Crown,
  Star,
  ArrowRight,
  Activity,
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';

const DJGrowthAnalysis = () => {
  const navigate = useNavigate();
  const [topDJs, setTopDJs] = useState([]);
  const [comparativa, setComparativa] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar top DJs por rentabilidad
      const topResponse = await fetch('http://localhost:3001/api/djs-financial/top-rentabilidad?limit=10');
      const topData = await topResponse.json();

      // Cargar comparativa de rendimiento
      const compResponse = await fetch('http://localhost:3001/api/djs-financial/comparativa-rendimiento');
      const compData = await compResponse.json();

      if (topData.success) {
        setTopDJs(topData.data);
      }

      if (compData.success) {
        setComparativa(compData.data);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar análisis de crecimiento');
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

  const getMedalColor = (position) => {
    switch (position) {
      case 1: return 'from-yellow-400 to-yellow-600';
      case 2: return 'from-gray-400 to-gray-600';
      case 3: return 'from-orange-400 to-orange-600';
      default: return 'from-blue-400 to-blue-600';
    }
  };

  const getMedalIcon = (position) => {
    switch (position) {
      case 1: return <Crown className="w-6 h-6" />;
      case 2: return <Award className="w-6 h-6" />;
      case 3: return <Star className="w-6 h-6" />;
      default: return <Target className="w-5 h-5" />;
    }
  };

  const getGrowthIndicator = (dj) => {
    if (!dj.eventos_mes_anterior || dj.eventos_mes_anterior === 0) {
      return { icon: null, color: '', text: 'Sin datos previos' };
    }

    const growth = ((dj.eventos_ultimo_mes - dj.eventos_mes_anterior) / dj.eventos_mes_anterior) * 100;

    if (growth > 0) {
      return {
        icon: <TrendingUp className="w-4 h-4" />,
        color: 'text-green-600',
        text: `+${growth.toFixed(0)}%`
      };
    } else if (growth < 0) {
      return {
        icon: <TrendingDown className="w-4 h-4" />,
        color: 'text-red-600',
        text: `${growth.toFixed(0)}%`
      };
    } else {
      return {
        icon: <Activity className="w-4 h-4" />,
        color: 'text-gray-600',
        text: 'Sin cambios'
      };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando análisis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Análisis de Crecimiento de DJs</h1>
        <p className="text-gray-600 mt-1">Rankings, tendencias y comparativas de rendimiento</p>
      </div>

      {/* Top 10 DJs por Rentabilidad */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Top 10 DJs por Rentabilidad</h2>
            <p className="text-sm text-gray-600">Los DJs que más beneficio generan para la agencia</p>
          </div>
        </div>

        <div className="space-y-3">
          {topDJs.map((dj, index) => {
            const position = index + 1;
            const growth = getGrowthIndicator(dj);

            return (
              <div
                key={dj.dj_id}
                className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 transition-all border border-gray-200 cursor-pointer group"
                onClick={() => navigate(`/dj-metrics?id=${dj.dj_id}`)}
              >
                {/* Position Badge */}
                <div className={`w-12 h-12 bg-gradient-to-br ${getMedalColor(position)} rounded-lg flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0`}>
                  {position <= 3 ? getMedalIcon(position) : position}
                </div>

                {/* DJ Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{dj.dj_nombre}</h3>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <span>{dj.total_eventos} eventos</span>
                    <span className="text-gray-400">•</span>
                    <span className={`flex items-center gap-1 ${growth.color}`}>
                      {growth.icon}
                      {growth.text}
                    </span>
                  </p>
                </div>

                {/* Metrics */}
                <div className="text-right">
                  <p className="text-lg font-bold text-purple-600">
                    {formatCurrency(dj.rentabilidad_total_agencia)}
                  </p>
                  <p className="text-xs text-gray-500">{dj.margen_beneficio_porcentaje}% margen</p>
                </div>

                {/* Arrow */}
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparativa de Rendimiento */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Comparativa de Rendimiento</h2>
            <p className="text-sm text-gray-600">Actividad último mes vs mes anterior</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">DJ</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Mes Actual</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Mes Anterior</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Tendencia</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Cobrado (Actual)</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Promedio/Evento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {comparativa.map((dj) => {
                const growth = getGrowthIndicator(dj);
                const eventosChange = dj.eventos_ultimo_mes - dj.eventos_mes_anterior;

                return (
                  <tr
                    key={dj.dj_id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/dj-metrics?id=${dj.dj_id}`)}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {dj.dj_nombre.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{dj.dj_nombre}</p>
                          <p className="text-xs text-gray-500">{dj.total_eventos} eventos total</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-700 rounded-lg font-bold text-lg">
                        {dj.eventos_ultimo_mes}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 text-gray-700 rounded-lg font-bold text-lg">
                        {dj.eventos_mes_anterior || 0}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`flex items-center gap-1 px-3 py-2 rounded-lg font-semibold ${
                          eventosChange > 0 ? 'bg-green-100 text-green-700' :
                          eventosChange < 0 ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {growth.icon}
                          {eventosChange > 0 ? `+${eventosChange}` : eventosChange}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <span className="font-bold text-green-600">
                        {formatCurrency(dj.total_cobrado_ultimo_mes)}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <span className="text-gray-700 font-medium">
                        {formatCurrency(dj.promedio_por_evento)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8" />
            <h3 className="font-semibold text-lg">Mayor Crecimiento</h3>
          </div>
          {comparativa.length > 0 && (() => {
            const sorted = [...comparativa].sort((a, b) => {
              const growthA = a.eventos_mes_anterior > 0 ? ((a.eventos_ultimo_mes - a.eventos_mes_anterior) / a.eventos_mes_anterior) : 0;
              const growthB = b.eventos_mes_anterior > 0 ? ((b.eventos_ultimo_mes - b.eventos_mes_anterior) / b.eventos_mes_anterior) : 0;
              return growthB - growthA;
            });
            const top = sorted[0];
            const growth = top.eventos_mes_anterior > 0 ?
              ((top.eventos_ultimo_mes - top.eventos_mes_anterior) / top.eventos_mes_anterior * 100).toFixed(0) : 0;

            return (
              <>
                <p className="text-2xl font-bold mb-2">{top.dj_nombre}</p>
                <p className="text-green-100 text-sm">+{growth}% de crecimiento este mes</p>
              </>
            );
          })()}
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-8 h-8" />
            <h3 className="font-semibold text-lg">Más Rentable</h3>
          </div>
          {topDJs.length > 0 && (
            <>
              <p className="text-2xl font-bold mb-2">{topDJs[0].dj_nombre}</p>
              <p className="text-purple-100 text-sm">
                {formatCurrency(topDJs[0].rentabilidad_total_agencia)} generados
              </p>
            </>
          )}
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-8 h-8" />
            <h3 className="font-semibold text-lg">Más Activo</h3>
          </div>
          {comparativa.length > 0 && (() => {
            const mostActive = [...comparativa].sort((a, b) => b.eventos_ultimo_mes - a.eventos_ultimo_mes)[0];
            return (
              <>
                <p className="text-2xl font-bold mb-2">{mostActive.dj_nombre}</p>
                <p className="text-blue-100 text-sm">
                  {mostActive.eventos_ultimo_mes} eventos este mes
                </p>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

// Trophy icon component (missing from lucide-react)
const Trophy = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 3h12v2h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-.5c-.5 2-1.5 3.5-3 4.5V19h2v2H7v-2h2v-2.5c-1.5-1-2.5-2.5-3-4.5H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2V3m2 0v2h8V3H8m-3 4v3h1c0-1 0-2 .5-3H5m14 0h-.5c.5 1 .5 2 .5 3h1V7h-1z"/>
  </svg>
);

export default DJGrowthAnalysis;
