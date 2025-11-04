import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Star } from 'lucide-react';

/**
 * Tarjeta 3D para estadísticas de DJs
 * Con efecto parallax, glassmorphism y animaciones
 */
const DJStatCard3D = ({ title, value, subtitle, trend, trendValue, icon: Icon, color = 'blue', rating }) => {
  const colorClasses = {
    blue: {
      bg: 'from-blue-500/20 to-blue-600/20',
      border: 'border-blue-500/30',
      icon: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-500/20',
      value: 'text-blue-600 dark:text-blue-400',
      glow: 'shadow-blue-500/20'
    },
    green: {
      bg: 'from-green-500/20 to-green-600/20',
      border: 'border-green-500/30',
      icon: 'text-green-600 dark:text-green-400',
      iconBg: 'bg-green-500/20',
      value: 'text-green-600 dark:text-green-400',
      glow: 'shadow-green-500/20'
    },
    purple: {
      bg: 'from-purple-500/20 to-purple-600/20',
      border: 'border-purple-500/30',
      icon: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-500/20',
      value: 'text-purple-600 dark:text-purple-400',
      glow: 'shadow-purple-500/20'
    },
    orange: {
      bg: 'from-orange-500/20 to-orange-600/20',
      border: 'border-orange-500/30',
      icon: 'text-orange-600 dark:text-orange-400',
      iconBg: 'bg-orange-500/20',
      value: 'text-orange-600 dark:text-orange-400',
      glow: 'shadow-orange-500/20'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600 dark:text-green-400';
    if (trend === 'down') return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        y: -8,
        scale: 1.02,
        transition: { duration: 0.3 }
      }}
      className="group relative"
    >
      {/* Glow effect */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${colors.bg} rounded-xl opacity-0 group-hover:opacity-100 blur transition duration-300 ${colors.glow}`} />

      {/* Card */}
      <div className={`relative h-full p-6 rounded-xl bg-white dark:bg-gray-800/80 backdrop-blur-sm border ${colors.border} transition-all duration-300 shadow-lg group-hover:shadow-2xl overflow-hidden`}>
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />

        {/* Header with icon */}
        <div className="relative flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg ${colors.iconBg} backdrop-blur-sm group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-6 h-6 ${colors.icon}`} />
          </div>

          {/* Rating stars if provided */}
          {rating !== undefined && (
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Title */}
        <p className="text-gray-600 dark:text-gray-400 font-medium text-sm uppercase tracking-wider mb-3">
          {title}
        </p>

        {/* Value */}
        <p className={`font-bold text-4xl leading-tight mb-2 ${colors.value} group-hover:scale-105 transition-transform duration-300`}>
          {value}
        </p>

        {/* Subtitle */}
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 leading-relaxed">
          {subtitle}
        </p>

        {/* Trend indicator */}
        {trend && trendValue && (
          <div className={`flex items-center gap-2 text-sm font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{trendValue}</span>
            <span className="text-gray-500 dark:text-gray-400 text-xs">vs mes anterior</span>
          </div>
        )}

        {/* Bottom gradient bar */}
        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.bg} opacity-50 group-hover:opacity-100 transition-opacity duration-300`} />
      </div>
    </motion.div>
  );
};

export default DJStatCard3D;
