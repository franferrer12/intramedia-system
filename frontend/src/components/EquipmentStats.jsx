import {
  CubeIcon,
  CheckCircleIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

/**
 * Equipment Statistics Component
 * Displays key metrics for equipment inventory
 */
const EquipmentStats = ({ stats, className = '' }) => {
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
      name: 'Total Equipos',
      value: stats.total_equipos || 0,
      icon: CubeIcon,
      color: 'blue',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-600 dark:text-blue-400',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      name: 'Disponibles',
      value: stats.disponibles || 0,
      icon: CheckCircleIcon,
      color: 'green',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-600 dark:text-green-400',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    {
      name: 'Alquilados',
      value: stats.alquilados || 0,
      icon: ClockIcon,
      color: 'yellow',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      textColor: 'text-yellow-600 dark:text-yellow-400',
      iconColor: 'text-yellow-600 dark:text-yellow-400'
    },
    {
      name: 'En Mantenimiento',
      value: stats.en_mantenimiento || 0,
      icon: WrenchScrewdriverIcon,
      color: 'orange',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      textColor: 'text-orange-600 dark:text-orange-400',
      iconColor: 'text-orange-600 dark:text-orange-400'
    },
    {
      name: 'Ingresos del Mes',
      value: `$${parseFloat(stats.ingresos_mes || 0).toLocaleString()}`,
      icon: CurrencyDollarIcon,
      color: 'purple',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-600 dark:text-purple-400',
      iconColor: 'text-purple-600 dark:text-purple-400',
      subtitle: `${stats.alquileres_activos || 0} alquileres activos`
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
                  {metric.subtitle && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {metric.subtitle}
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

      {/* Additional Stats */}
      {stats.valor_total_equipos && (
        <div className="mt-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Valor Total del Inventario
              </p>
              <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
                ${parseFloat(stats.valor_total_equipos).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Inversión en equipos
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Suma de todos los precios de compra
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentStats;
