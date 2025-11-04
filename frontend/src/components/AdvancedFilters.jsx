import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Search, Calendar, DollarSign, User, Tag } from 'lucide-react';

/**
 * Componente de filtros avanzados reutilizable
 * Soporta múltiples tipos de filtros: texto, rango numérico, fechas, selección
 */
const AdvancedFilters = ({ filters, onFilterChange, onClear }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});

  const handleFilterChange = (filterKey, value) => {
    const newFilters = { ...activeFilters, [filterKey]: value };
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClear = () => {
    setActiveFilters({});
    onClear();
  };

  const getIcon = (type) => {
    switch (type) {
      case 'text': return Search;
      case 'date': return Calendar;
      case 'number': return DollarSign;
      case 'select': return Tag;
      case 'user': return User;
      default: return Filter;
    }
  };

  const activeCount = Object.keys(activeFilters).filter(k => activeFilters[k]).length;

  return (
    <div className="relative">
      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
      >
        <Filter className="w-4 h-4" />
        <span className="font-medium">Filtros</span>
        {activeCount > 0 && (
          <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
            {activeCount}
          </span>
        )}
      </motion.button>

      {/* Filters Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 right-0 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Filtros Avanzados</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Filters */}
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {filters.map((filter) => {
                const Icon = getIcon(filter.type);

                return (
                  <div key={filter.key} className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Icon className="w-4 h-4" />
                      {filter.label}
                    </label>

                    {filter.type === 'text' && (
                      <input
                        type="text"
                        value={activeFilters[filter.key] || ''}
                        onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                        placeholder={filter.placeholder || 'Buscar...'}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}

                    {filter.type === 'select' && (
                      <select
                        value={activeFilters[filter.key] || ''}
                        onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Todos</option>
                        {filter.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {filter.type === 'date' && (
                      <input
                        type="date"
                        value={activeFilters[filter.key] || ''}
                        onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}

                    {filter.type === 'number' && (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          value={activeFilters[`${filter.key}_min`] || ''}
                          onChange={(e) => handleFilterChange(`${filter.key}_min`, e.target.value)}
                          placeholder="Mínimo"
                          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          value={activeFilters[`${filter.key}_max`] || ''}
                          onChange={(e) => handleFilterChange(`${filter.key}_max`, e.target.value)}
                          placeholder="Máximo"
                          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <button
                onClick={handleClear}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Limpiar
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
              >
                Aplicar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedFilters;
