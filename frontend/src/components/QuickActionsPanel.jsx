import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Plus,
  Calculator,
  FileText,
  Download,
  Upload,
  Calendar,
  Users,
  Music,
  X,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Panel flotante con acciones rápidas
 * Permite acceso rápido a las funcionalidades más usadas
 */
const QuickActionsPanel = ({ onCalculatorOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const quickActions = [
    {
      id: 'new-event',
      label: 'Nuevo Evento',
      icon: Plus,
      color: 'blue',
      action: () => navigate('/eventos')
    },
    {
      id: 'calculator',
      label: 'Calculadora de Precios',
      icon: Calculator,
      color: 'green',
      action: () => {
        onCalculatorOpen?.();
        setIsOpen(false);
      }
    },
    {
      id: 'calendar',
      label: 'Ver Calendario',
      icon: Calendar,
      color: 'purple',
      action: () => navigate('/calendario')
    },
    {
      id: 'djs',
      label: 'Gestionar DJs',
      icon: Music,
      color: 'orange',
      action: () => navigate('/djs')
    },
    {
      id: 'clients',
      label: 'Gestionar Clientes',
      icon: Users,
      color: 'pink',
      action: () => navigate('/clientes')
    },
    {
      id: 'export',
      label: 'Exportar Datos',
      icon: Download,
      color: 'indigo',
      action: () => alert('Función de exportación próximamente')
    },
    {
      id: 'import',
      label: 'Importar Datos',
      icon: Upload,
      color: 'teal',
      action: () => alert('Función de importación próximamente')
    },
    {
      id: 'reports',
      label: 'Ver Reportes',
      icon: FileText,
      color: 'cyan',
      action: () => navigate('/socios')
    }
  ];

  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    pink: 'from-pink-500 to-pink-600',
    indigo: 'from-indigo-500 to-indigo-600',
    teal: 'from-teal-500 to-teal-600',
    cyan: 'from-cyan-500 to-cyan-600'
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-2xl hover:shadow-blue-500/50 transition-all"
        aria-label="Quick Actions"
      >
        <Zap className="w-6 h-6" />
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Zap className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold">Acciones Rápidas</h2>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-blue-100 text-sm">Accede rápidamente a las funcionalidades principales</p>
              </div>

              {/* Actions Grid */}
              <div className="p-6 space-y-3">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;

                  return (
                    <motion.button
                      key={action.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={action.action}
                      className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClasses[action.color]} text-white shadow-lg`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white text-left">
                          {action.label}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                    </motion.button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 p-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Presiona <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300 font-mono">⌘K</kbd> para búsqueda rápida
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default QuickActionsPanel;
