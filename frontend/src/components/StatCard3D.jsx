import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import { intraMediaColors, animations } from '../styles/intraMediaTheme';

/**
 * StatCard 3D con efectos avanzados
 * - Efecto Tilt 3D al hover
 * - Glassmorphism
 * - Animaciones fluidas
 * - Glow effect con colores de Intra Media
 */
const StatCard3D = ({
  title,
  value,
  icon: Icon,
  color = 'orange',
  trend,
  trendValue,
  subtitle,
  delay = 0,
  onClick
}) => {
  // Colores neutros y profesionales (siguiendo mejores prácticas UX/UI)
  const colorClasses = {
    orange: {
      bg: 'bg-gradient-to-br from-amber-600/8 to-orange-600/8',
      icon: 'text-amber-700 dark:text-amber-600',
      glow: 'shadow-amber-600/15',
      border: 'border-amber-600/15',
    },
    blue: {
      bg: 'bg-gradient-to-br from-slate-600/8 to-blue-600/8',
      icon: 'text-slate-700 dark:text-slate-500',
      glow: 'shadow-slate-600/15',
      border: 'border-slate-600/15',
    },
    green: {
      bg: 'bg-gradient-to-br from-emerald-700/8 to-teal-700/8',
      icon: 'text-emerald-700 dark:text-emerald-600',
      glow: 'shadow-emerald-700/15',
      border: 'border-emerald-700/15',
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-600/8 to-violet-600/8',
      icon: 'text-purple-700 dark:text-purple-500',
      glow: 'shadow-purple-600/15',
      border: 'border-purple-600/15',
    },
    red: {
      bg: 'bg-gradient-to-br from-rose-700/8 to-red-700/8',
      icon: 'text-rose-700 dark:text-rose-600',
      glow: 'shadow-rose-700/15',
      border: 'border-rose-700/15',
    },
  };

  const getTrendIcon = () => {
    if (!trend) return <Minus className="w-4 h-4" />;
    return trend === 'up' ? (
      <TrendingUp className="w-4 h-4" />
    ) : (
      <TrendingDown className="w-4 h-4" />
    );
  };

  const getTrendColor = () => {
    if (!trend) return 'text-gray-500 dark:text-gray-400';
    return trend === 'up'
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';
  };

  const currentColor = colorClasses[color] || colorClasses.orange;

  return (
    <motion.div
      initial={animations.fade.initial}
      animate={animations.fade.animate}
      transition={{
        duration: 0.5,
        delay: delay / 1000,
        ...animations.spring
      }}
    >
      <Tilt
        tiltMaxAngleX={animations.tilt.max}
        tiltMaxAngleY={animations.tilt.max}
        perspective={animations.tilt.perspective}
        scale={animations.tilt.scale}
        transitionSpeed={animations.tilt.speed}
        gyroscope={true}
        glareEnable={animations.tilt.glare}
        glareMaxOpacity={animations.tilt.maxGlare}
        glareColor="#9333ea"
        glarePosition="all"
        className="h-full"
      >
        <div
          onClick={onClick}
          className={`
            relative h-full min-h-[200px] p-7 rounded-xl
            bg-white dark:bg-gray-800/80
            backdrop-blur-sm
            border border-gray-200 dark:border-white/20
            shadow-sm hover:shadow-md
            transition-all duration-300
            ${onClick ? 'cursor-pointer' : ''}
            overflow-hidden
            group
          `}
          style={{
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Acento de color minimalista */}
          <div className={`
            absolute top-0 left-0 w-1 h-full ${currentColor.bg} opacity-50
          `} />

          {/* Contenido con jerarquía mejorada estilo FourVenues */}
          <div className="relative z-10 flex flex-col h-full">
            {/* Header con título e ícono */}
            <div className="flex items-start justify-between mb-4">
              <p className="text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-widest">
                {title}
              </p>

              {/* Ícono más prominente */}
              {Icon && (
                <motion.div
                  className={`p-2.5 rounded-lg ${currentColor.bg} backdrop-blur-sm`}
                  style={{
                    transform: 'translateZ(10px)',
                  }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Icon className={`w-5 h-5 ${currentColor.icon}`} />
                </motion.div>
              )}
            </div>

            {/* Valor principal - MUY destacado */}
            <div className="flex-1 flex flex-col justify-center mb-3">
              <motion.p
                className="text-gray-900 dark:text-white font-bold text-5xl leading-none mb-1 tracking-tight"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: (delay / 1000) + 0.1, duration: 0.4 }}
              >
                {value}
              </motion.p>

              {/* Trend inline con el valor */}
              {trendValue && (
                <motion.div
                  className={`flex items-center gap-1.5 mt-2 text-sm font-semibold ${getTrendColor()}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (delay / 1000) + 0.3 }}
                >
                  {getTrendIcon()}
                  <span>{trendValue}</span>
                </motion.div>
              )}
            </div>

            {/* Subtitle - información contextual */}
            {subtitle && (
              <div className="pt-3 border-t border-gray-200 dark:border-white/10">
                <p className="text-gray-600 dark:text-gray-400 font-normal text-sm leading-relaxed">
                  {subtitle}
                </p>
              </div>
            )}
          </div>
        </div>
      </Tilt>
    </motion.div>
  );
};

export default StatCard3D;
