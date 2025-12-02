import { useState } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Audit Log Filters Component
 * Advanced filtering for audit logs
 */
const AuditLogFilters = ({ filters, onFilterChange, onReset, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handleReset = () => {
    onReset();
    setIsExpanded(false);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== null && v !== undefined);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Filtros</h3>
          {hasActiveFilters && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
              Activos
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
            >
              <XMarkIcon className="h-4 w-4" />
              Limpiar
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {isExpanded ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
      </div>

      {/* Filters Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Buscar
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.search || ''}
                  onChange={(e) => handleChange('search', e.target.value)}
                  placeholder="Acción, usuario, endpoint..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Evento
              </label>
              <select
                value={filters.eventType || ''}
                onChange={(e) => handleChange('eventType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="">Todos</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="VIEW">VIEW</option>
                <option value="LOGIN">LOGIN</option>
                <option value="LOGOUT">LOGOUT</option>
                <option value="SECURITY">SECURITY</option>
                <option value="ERROR">ERROR</option>
                <option value="EXPORT">EXPORT</option>
                <option value="IMPORT">IMPORT</option>
              </select>
            </div>

            {/* Entity Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Entidad
              </label>
              <select
                value={filters.entityType || ''}
                onChange={(e) => handleChange('entityType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="">Todos</option>
                <option value="evento">Evento</option>
                <option value="dj">DJ</option>
                <option value="cliente">Cliente</option>
                <option value="lead">Lead</option>
                <option value="payment">Payment</option>
                <option value="document">Document</option>
                <option value="contract">Contract</option>
                <option value="solicitud">Solicitud</option>
                <option value="reservation">Reservation</option>
                <option value="user">User</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="">Todos</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILURE">FAILURE</option>
                <option value="ERROR">ERROR</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Desde
              </label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>

            {/* User ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ID de Usuario
              </label>
              <input
                type="number"
                value={filters.userId || ''}
                onChange={(e) => handleChange('userId', e.target.value)}
                placeholder="ID"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>

            {/* IP Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dirección IP
              </label>
              <input
                type="text"
                value={filters.ipAddress || ''}
                onChange={(e) => handleChange('ipAddress', e.target.value)}
                placeholder="192.168.1.1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filtros Rápidos
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onFilterChange({ status: 'FAILURE' })}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Solo Fallidos
              </button>
              <button
                onClick={() => onFilterChange({ eventType: 'SECURITY' })}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Eventos de Seguridad
              </button>
              <button
                onClick={() => onFilterChange({ eventType: 'DELETE' })}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Solo Eliminaciones
              </button>
              <button
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  onFilterChange({ startDate: today, endDate: today });
                }}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Hoy
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const weekAgo = new Date(today);
                  weekAgo.setDate(today.getDate() - 7);
                  onFilterChange({
                    startDate: weekAgo.toISOString().split('T')[0],
                    endDate: today.toISOString().split('T')[0]
                  });
                }}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Última Semana
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogFilters;
