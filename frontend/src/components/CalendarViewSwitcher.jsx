import { motion } from 'framer-motion';
import { Calendar, Grid3x3, List } from 'lucide-react';

/**
 * Selector de vistas para el calendario
 * Vistas: Mes, Semana, Día
 */
const CalendarViewSwitcher = ({ currentView, onViewChange }) => {
  const views = [
    { id: 'month', label: 'Mes', icon: Calendar },
    { id: 'week', label: 'Semana', icon: Grid3x3 },
    { id: 'day', label: 'Día', icon: List }
  ];

  return (
    <div className="inline-flex items-center bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg gap-1">
      {views.map((view) => {
        const Icon = view.icon;
        const isActive = currentView === view.id;

        return (
          <motion.button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              relative px-4 py-2 rounded-md transition-all duration-200 flex items-center gap-2
              ${isActive
                ? 'text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }
            `}
          >
            {/* Background activo */}
            {isActive && (
              <motion.div
                layoutId="activeViewBackground"
                className="absolute inset-0 bg-primary-600 dark:bg-primary-500 rounded-md"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}

            {/* Contenido */}
            <span className="relative z-10 flex items-center gap-2">
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline font-medium text-sm">{view.label}</span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default CalendarViewSwitcher;
