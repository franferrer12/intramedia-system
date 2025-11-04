import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Home,
  Calendar,
  Music,
  Users,
  DollarSign,
  UserCheck,
  FileText,
  Package,
  BarChart3,
  Plus,
  ArrowRight,
  Clock,
  Command
} from 'lucide-react';

/**
 * Command Palette - Sistema de búsqueda global con keyboard shortcuts
 * Inspirado en VSCode Command Palette y Raycast
 *
 * Features:
 * - Ctrl+K / Cmd+K para abrir
 * - ESC para cerrar
 * - Arrow keys para navegar
 * - Enter para ejecutar
 * - Búsqueda fuzzy
 * - Recientes
 */
const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  // Índice de comandos disponibles
  const commands = useMemo(() => [
    // Navegación
    {
      id: 'nav-dashboard',
      title: 'Dashboard',
      subtitle: 'Panel de control y análisis',
      icon: Home,
      action: () => navigate('/'),
      category: 'Navegación',
      keywords: ['inicio', 'home', 'panel']
    },
    {
      id: 'nav-eventos',
      title: 'Eventos',
      subtitle: 'Gestión de eventos y shows',
      icon: Calendar,
      action: () => navigate('/eventos'),
      category: 'Navegación',
      keywords: ['events', 'shows', 'fiestas']
    },
    {
      id: 'nav-djs',
      title: 'DJs',
      subtitle: 'Gestión de DJs y artistas',
      icon: Music,
      action: () => navigate('/djs'),
      category: 'Navegación',
      keywords: ['artistas', 'músicos', 'artists']
    },
    {
      id: 'nav-clientes',
      title: 'Clientes',
      subtitle: 'Base de datos de clientes',
      icon: Users,
      action: () => navigate('/clientes'),
      category: 'Navegación',
      keywords: ['customers', 'contacts', 'contactos']
    },
    {
      id: 'nav-finanzas',
      title: 'Finanzas',
      subtitle: 'Transacciones y análisis financiero',
      icon: DollarSign,
      action: () => navigate('/finanzas'),
      category: 'Navegación',
      keywords: ['money', 'transactions', 'dinero', 'pagos']
    },
    {
      id: 'nav-nominas',
      title: 'Nóminas',
      subtitle: 'Gestión de nóminas y pagos',
      icon: FileText,
      action: () => navigate('/nominas'),
      category: 'Navegación',
      keywords: ['payroll', 'salarios', 'pagos']
    },
    {
      id: 'nav-socios',
      title: 'Socios',
      subtitle: 'Gestión de socios del negocio',
      icon: UserCheck,
      action: () => navigate('/socios'),
      category: 'Navegación',
      keywords: ['partners', 'shareholders', 'accionistas']
    },
    {
      id: 'nav-calendario',
      title: 'Calendario',
      subtitle: 'Vista de calendario de eventos',
      icon: Calendar,
      action: () => navigate('/calendario'),
      category: 'Navegación',
      keywords: ['calendar', 'schedule', 'agenda']
    },
    {
      id: 'nav-inventario',
      title: 'Inventario',
      subtitle: 'Control de stock y productos',
      icon: Package,
      action: () => navigate('/inventario'),
      category: 'Navegación',
      keywords: ['stock', 'productos', 'almacén']
    },
    {
      id: 'nav-analytics',
      title: 'Analytics',
      subtitle: 'Análisis y reportes avanzados',
      icon: BarChart3,
      action: () => navigate('/analytics'),
      category: 'Navegación',
      keywords: ['reports', 'estadísticas', 'reportes']
    },

    // Acciones rápidas
    {
      id: 'action-nuevo-evento',
      title: 'Crear Nuevo Evento',
      subtitle: 'Añadir un evento al sistema',
      icon: Plus,
      action: () => {
        navigate('/eventos');
        // Simular click en botón "Nuevo Evento" después de navegar
        setTimeout(() => {
          const newButton = document.querySelector('[data-action="new-event"]');
          if (newButton) newButton.click();
        }, 100);
      },
      category: 'Acciones Rápidas',
      keywords: ['new', 'crear', 'add', 'nuevo']
    },
    {
      id: 'action-nuevo-dj',
      title: 'Añadir DJ',
      subtitle: 'Registrar nuevo DJ o artista',
      icon: Plus,
      action: () => {
        navigate('/djs');
        setTimeout(() => {
          const newButton = document.querySelector('[data-action="new-dj"]');
          if (newButton) newButton.click();
        }, 100);
      },
      category: 'Acciones Rápidas',
      keywords: ['new', 'crear', 'add', 'nuevo', 'artista']
    },
    {
      id: 'action-nuevo-cliente',
      title: 'Añadir Cliente',
      subtitle: 'Registrar nuevo cliente',
      icon: Plus,
      action: () => {
        navigate('/clientes');
        setTimeout(() => {
          const newButton = document.querySelector('[data-action="new-client"]');
          if (newButton) newButton.click();
        }, 100);
      },
      category: 'Acciones Rápidas',
      keywords: ['new', 'crear', 'add', 'nuevo', 'customer']
    }
  ], [navigate]);

  // Búsqueda fuzzy simple
  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands;

    const searchLower = search.toLowerCase();
    return commands.filter(cmd => {
      const titleMatch = cmd.title.toLowerCase().includes(searchLower);
      const subtitleMatch = cmd.subtitle.toLowerCase().includes(searchLower);
      const categoryMatch = cmd.category.toLowerCase().includes(searchLower);
      const keywordsMatch = cmd.keywords.some(kw => kw.includes(searchLower));

      return titleMatch || subtitleMatch || categoryMatch || keywordsMatch;
    });
  }, [search, commands]);

  // Agrupar por categoría
  const groupedCommands = useMemo(() => {
    const groups = {};
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K o Cmd+K para abrir/cerrar
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        setSearch('');
        setSelectedIndex(0);
      }

      if (!isOpen) return;

      // ESC para cerrar
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        setSearch('');
        setSelectedIndex(0);
      }

      // Arrow Down
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
      }

      // Arrow Up
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
      }

      // Enter para ejecutar
      if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        executeCommand(filteredCommands[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  // Ejecutar comando
  const executeCommand = useCallback((command) => {
    command.action();
    setIsOpen(false);
    setSearch('');
    setSelectedIndex(0);
  }, []);

  // Reset selected index cuando cambia el filtro
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Command Palette Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-white/10">
                <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar páginas, acciones..."
                  className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  autoFocus
                />
                <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium">ESC</kbd>
                </div>
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto">
                {Object.entries(groupedCommands).length > 0 ? (
                  Object.entries(groupedCommands).map(([category, cmds], categoryIndex) => (
                    <div key={category}>
                      {/* Category Header */}
                      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {category}
                        </p>
                      </div>

                      {/* Commands in this category */}
                      <div className="py-1">
                        {cmds.map((cmd, cmdIndex) => {
                          const absoluteIndex = filteredCommands.indexOf(cmd);
                          const isSelected = selectedIndex === absoluteIndex;
                          const Icon = cmd.icon;

                          return (
                            <motion.button
                              key={cmd.id}
                              onClick={() => executeCommand(cmd)}
                              onMouseEnter={() => setSelectedIndex(absoluteIndex)}
                              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                                isSelected
                                  ? 'bg-blue-50 dark:bg-blue-900/20'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                              }`}
                              whileHover={{ x: 4 }}
                              transition={{ duration: 0.15 }}
                            >
                              {/* Icon */}
                              <div className={`p-2 rounded-lg ${
                                isSelected
                                  ? 'bg-blue-100 dark:bg-blue-900/40'
                                  : 'bg-gray-100 dark:bg-gray-700'
                              }`}>
                                <Icon className={`w-4 h-4 ${
                                  isSelected
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-600 dark:text-gray-400'
                                }`} />
                              </div>

                              {/* Text */}
                              <div className="flex-1 text-left">
                                <p className={`text-sm font-medium ${
                                  isSelected
                                    ? 'text-blue-900 dark:text-blue-100'
                                    : 'text-gray-900 dark:text-white'
                                }`}>
                                  {cmd.title}
                                </p>
                                <p className={`text-xs ${
                                  isSelected
                                    ? 'text-blue-600 dark:text-blue-300'
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {cmd.subtitle}
                                </p>
                              </div>

                              {/* Arrow indicator */}
                              {isSelected && (
                                <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-16 text-center">
                    <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No se encontraron resultados para "{search}"
                    </p>
                  </div>
                )}
              </div>

              {/* Footer con hints */}
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-white/10">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-xs">↑↓</kbd>
                      Navegar
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-xs">Enter</kbd>
                      Ejecutar
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Command className="w-3 h-3" />
                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-xs">K</kbd>
                    para abrir
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CommandPalette;
