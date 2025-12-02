import {
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  UsersIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

/**
 * Audit Log Statistics Component
 * Displays key metrics and statistics
 */
const AuditLogStats = ({ stats, className = '' }) => {
  if (!stats) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 h-24 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const metrics = [
    {
      name: 'Total de Eventos',
      value: stats.total_events?.toLocaleString() || '0',
      icon: ChartBarIcon,
      color: 'blue',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-600 dark:text-blue-400',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      name: 'Exitosos',
      value: stats.successful_events?.toLocaleString() || '0',
      icon: CheckCircleIcon,
      color: 'green',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-600 dark:text-green-400',
      iconColor: 'text-green-600 dark:text-green-400',
      percentage: stats.total_events > 0
        ? ((stats.successful_events / stats.total_events) * 100).toFixed(1) + '%'
        : '0%'
    },
    {
      name: 'Fallidos',
      value: stats.failed_events?.toLocaleString() || '0',
      icon: ExclamationCircleIcon,
      color: 'red',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-600 dark:text-red-400',
      iconColor: 'text-red-600 dark:text-red-400',
      percentage: stats.total_events > 0
        ? ((stats.failed_events / stats.total_events) * 100).toFixed(1) + '%'
        : '0%'
    },
    {
      name: 'Usuarios Únicos',
      value: stats.unique_users?.toLocaleString() || '0',
      icon: UsersIcon,
      color: 'purple',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-600 dark:text-purple-400',
      iconColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      name: 'IPs Únicas',
      value: stats.unique_ips?.toLocaleString() || '0',
      icon: GlobeAltIcon,
      color: 'indigo',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      iconColor: 'text-indigo-600 dark:text-indigo-400'
    }
  ];

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.name}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {metric.name}
                  </p>
                  <p className={`mt-2 text-3xl font-bold ${metric.textColor}`}>
                    {metric.value}
                  </p>
                  {metric.percentage && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {metric.percentage} del total
                    </p>
                  )}
                </div>
                <div className={`${metric.bgColor} rounded-lg p-3`}>
                  <Icon className={`h-6 w-6 ${metric.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Event Type Distribution Component
 * Shows breakdown by event type
 */
export const EventTypeDistribution = ({ eventsByType, className = '' }) => {
  if (!eventsByType || Object.keys(eventsByType).length === 0) {
    return null;
  }

  const colors = {
    CREATE: 'bg-green-500',
    UPDATE: 'bg-blue-500',
    DELETE: 'bg-red-500',
    VIEW: 'bg-gray-500',
    LOGIN: 'bg-purple-500',
    LOGOUT: 'bg-purple-400',
    SECURITY: 'bg-yellow-500',
    ERROR: 'bg-red-600',
    EXPORT: 'bg-indigo-500',
    IMPORT: 'bg-indigo-600'
  };

  const total = Object.values(eventsByType).reduce((sum, count) => sum + parseInt(count), 0);
  const sortedEvents = Object.entries(eventsByType).sort((a, b) => b[1] - a[1]);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Distribución por Tipo de Evento
      </h3>
      <div className="space-y-3">
        {sortedEvents.map(([type, count]) => {
          const percentage = ((count / total) * 100).toFixed(1);
          return (
            <div key={type}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {type}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {count} ({percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`${colors[type] || 'bg-gray-500'} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Hourly Activity Chart Component
 * Shows activity distribution by hour
 */
export const HourlyActivityChart = ({ hourlyDistribution, className = '' }) => {
  if (!hourlyDistribution || Object.keys(hourlyDistribution).length === 0) {
    return null;
  }

  // Create array for all 24 hours
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const maxCount = Math.max(...Object.values(hourlyDistribution).map(v => parseInt(v)));

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Actividad por Hora del Día
      </h3>
      <div className="flex items-end justify-between h-48 gap-1">
        {hours.map((hour) => {
          const count = parseInt(hourlyDistribution[hour] || 0);
          const height = maxCount > 0 ? (count / maxCount) * 100 : 0;

          return (
            <div key={hour} className="flex-1 flex flex-col items-center">
              <div className="w-full relative group">
                <div
                  className="w-full bg-blue-500 dark:bg-blue-600 rounded-t transition-all duration-300 hover:bg-blue-600 dark:hover:bg-blue-500"
                  style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0' }}
                />
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block">
                  <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                    {count} eventos
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {hour}h
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AuditLogStats;
