import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

/**
 * Tarjeta de comparación Year-over-Year con visualización 3D
 * Muestra métricas actuales vs período anterior con sparkline
 */
const ComparisonCard3D = ({ title, currentValue, previousValue, data, color = 'blue', icon: Icon }) => {
  const colorClasses = {
    blue: {
      bg: 'from-blue-500/20 to-blue-600/20',
      text: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-500/20',
      line: '#3b82f6'
    },
    green: {
      bg: 'from-green-500/20 to-green-600/20',
      text: 'text-green-600 dark:text-green-400',
      iconBg: 'bg-green-500/20',
      line: '#10b981'
    },
    purple: {
      bg: 'from-purple-500/20 to-purple-600/20',
      text: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-500/20',
      line: '#8b5cf6'
    },
    orange: {
      bg: 'from-orange-500/20 to-orange-600/20',
      text: 'text-orange-600 dark:text-orange-400',
      iconBg: 'bg-orange-500/20',
      line: '#f59e0b'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  // Calcular diferencia y porcentaje
  const difference = currentValue - previousValue;
  const percentageChange = previousValue === 0 ? 100 : ((difference / previousValue) * 100);
  const isPositive = difference >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="group relative"
    >
      {/* Glow effect */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${colors.bg} rounded-xl opacity-0 group-hover:opacity-100 blur transition duration-300`} />

      {/* Card */}
      <div className="relative h-full p-6 rounded-xl bg-white dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-white/10 transition-all duration-300 shadow-lg group-hover:shadow-2xl overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />

        {/* Header */}
        <div className="relative z-10 flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg ${colors.iconBg} backdrop-blur-sm group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-6 h-6 ${colors.text}`} />
          </div>

          {/* Trend indicator */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
            isPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
          }`}>
            {isPositive ? (
              <TrendingUp className={`w-4 h-4 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
            ) : (
              <TrendingDown className={`w-4 h-4 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
            )}
            <span className={`text-xs font-bold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isPositive ? '+' : ''}{percentageChange.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Title */}
        <p className="relative z-10 text-gray-600 dark:text-gray-400 font-medium text-sm uppercase tracking-wider mb-3">
          {title}
        </p>

        {/* Current Value */}
        <p className={`relative z-10 font-bold text-4xl leading-tight mb-2 ${colors.text} group-hover:scale-105 transition-transform duration-300`}>
          {currentValue}
        </p>

        {/* Comparison */}
        <div className="relative z-10 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
          <span>{previousValue}</span>
          <ArrowRight className="w-4 h-4" />
          <span className={`font-semibold ${colors.text}`}>{currentValue}</span>
          <span className="text-xs">vs año anterior</span>
        </div>

        {/* Sparkline */}
        {data && data.length > 0 && (
          <div className="relative z-10 h-16 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={colors.line}
                  strokeWidth={2}
                  dot={false}
                  animationDuration={1000}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Bottom gradient bar */}
        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.bg} opacity-50 group-hover:opacity-100 transition-opacity duration-300`} />
      </div>
    </motion.div>
  );
};

export default ComparisonCard3D;
