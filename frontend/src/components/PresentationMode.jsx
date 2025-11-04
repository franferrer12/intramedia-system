import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Maximize2,
  X,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  BarChart3,
  Clock,
  Minimize2
} from 'lucide-react';
import { estadisticasAPI } from '../services/api';

/**
 * Modo Presentación
 * Muestra KPIs en pantalla completa para TVs/monitores
 * Con auto-refresh cada 30 segundos
 */
const PresentationMode = ({ isOpen, onClose }) => {
  const [kpis, setKpis] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadData();

      // Auto-refresh cada 30 segundos
      const refreshInterval = setInterval(() => {
        if (autoRefresh) {
          loadData();
        }
      }, 30000);

      // Actualizar reloj cada segundo
      const clockInterval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);

      return () => {
        clearInterval(refreshInterval);
        clearInterval(clockInterval);
      };
    }
  }, [isOpen, autoRefresh]);

  const loadData = async () => {
    try {
      const res = await estadisticasAPI.getKPIs();
      setKpis(res.data.data);
    } catch (error) {
      console.error('Error loading KPIs:', error);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const kpiCards = [
    {
      title: 'Eventos Este Mes',
      value: kpis?.eventos_mes_actual || 0,
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      subtitle: `${kpis?.eventos_proximos_7dias || 0} próximos en 7 días`
    },
    {
      title: 'Facturación Mes',
      value: `€${parseFloat(kpis?.facturacion_mes_actual || 0).toLocaleString('es-ES', {maximumFractionDigits: 0})}`,
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      subtitle: `Bolo promedio: €${parseFloat(kpis?.bolo_promedio_mes || 0).toFixed(0)}`
    },
    {
      title: 'Eventos Año',
      value: kpis?.eventos_año_actual || 0,
      icon: BarChart3,
      color: 'from-purple-500 to-purple-600',
      subtitle: 'Total del año'
    },
    {
      title: 'Pendiente Cobro',
      value: kpis?.eventos_pendiente_cobro || 0,
      icon: Clock,
      color: 'from-orange-500 to-orange-600',
      subtitle: `€${parseFloat(kpis?.monto_pendiente_cobro || 0).toLocaleString('es-ES', {maximumFractionDigits: 0})}`
    },
    {
      title: 'Próximos 30 días',
      value: kpis?.eventos_proximos_30dias || 0,
      icon: TrendingUp,
      color: 'from-pink-500 to-pink-600',
      subtitle: 'Eventos confirmados'
    },
    {
      title: 'Facturación Año',
      value: `€${parseFloat(kpis?.facturacion_año_actual || 0).toLocaleString('es-ES', {maximumFractionDigits: 0})}`,
      icon: DollarSign,
      color: 'from-teal-500 to-teal-600',
      subtitle: 'Total anual'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 z-[100] overflow-hidden"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }} />
          </div>

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/10">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Maximize2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Modo Presentación</h1>
                  <p className="text-sm text-gray-400">KPIs en Tiempo Real</p>
                </div>
              </div>

              {/* Auto-refresh toggle */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="autoRefresh" className="text-sm text-gray-300 cursor-pointer">
                  Auto-actualizar (30s)
                </label>
              </div>
            </div>

            {/* Clock */}
            <div className="text-right">
              <div className="text-4xl font-bold text-white font-mono tabular-nums">
                {formatTime(currentTime)}
              </div>
              <div className="text-sm text-gray-400 capitalize">
                {formatDate(currentTime)}
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-colors text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* KPIs Grid */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8 h-[calc(100vh-120px)] overflow-y-auto">
            {kpiCards.map((kpi, index) => {
              const Icon = kpi.icon;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative group"
                >
                  {/* Glow effect */}
                  <div className={`absolute -inset-1 bg-gradient-to-br ${kpi.color} rounded-2xl opacity-20 group-hover:opacity-40 blur-xl transition-opacity`} />

                  {/* Card */}
                  <div className="relative h-full p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all">
                    {/* Icon */}
                    <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${kpi.color} mb-6`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-medium text-gray-400 mb-4">
                      {kpi.title}
                    </h3>

                    {/* Value */}
                    <div className="mb-3">
                      <motion.p
                        key={kpi.value}
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-6xl font-bold text-white mb-2 tabular-nums"
                      >
                        {kpi.value}
                      </motion.p>
                    </div>

                    {/* Subtitle */}
                    <p className="text-sm text-gray-500">
                      {kpi.subtitle}
                    </p>

                    {/* Decorative line */}
                    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${kpi.color} opacity-50 rounded-b-2xl`} />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="relative z-10 flex items-center justify-center px-8 py-4 border-t border-white/10">
            <p className="text-sm text-gray-500">
              Última actualización: {formatTime(currentTime)}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PresentationMode;
