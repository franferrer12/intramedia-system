import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import AnimatedCard from './AnimatedCard';

/**
 * Card de Estadística con Animaciones y Comparativa
 */
const StatCard = ({
  title,
  value,
  icon: Icon,
  color = 'blue',
  trend,
  trendValue,
  subtitle,
  delay = 0,
  onClick
}) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    pink: 'bg-pink-500',
    cyan: 'bg-cyan-500'
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
    if (!trend) return 'text-gray-500';
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <AnimatedCard
      animation="fadeInUp"
      delay={delay}
      className={onClick ? 'cursor-pointer' : ''}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>

          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}

          {trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>{trendValue}</span>
            </div>
          )}
        </div>

        {Icon && (
          <div className={`p-3 ${colorClasses[color]} bg-opacity-10 rounded-lg`}>
            <Icon className={`w-6 h-6 ${colorClasses[color].replace('bg-', 'text-')}`} />
          </div>
        )}
      </div>
    </AnimatedCard>
  );
};

export default StatCard;
