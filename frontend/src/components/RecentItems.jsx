import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ClockIcon,
  CalendarIcon,
  MusicalNoteIcon,
  UserIcon,
  UserGroupIcon,
  XMarkIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import {
  getRecentItems,
  removeRecentItem,
  clearRecentItems,
  formatRecentItem,
  getRecentItemPath,
  addRecentItem,
} from '../utils/recentItems';
import toast from '../utils/toast';

/**
 * Recent Items Sidebar Component
 * Shows recently viewed items for quick access
 */
const RecentItems = ({ className = '' }) => {
  const [recentItems, setRecentItems] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('recentItemsCollapsed');
    return saved === 'true';
  });

  useEffect(() => {
    // Load initial recent items
    setRecentItems(getRecentItems());

    // Listen for updates
    const handleUpdate = () => {
      setRecentItems(getRecentItems());
    };

    window.addEventListener('recent-items-updated', handleUpdate);
    return () => window.removeEventListener('recent-items-updated', handleUpdate);
  }, []);

  const handleToggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('recentItemsCollapsed', newState.toString());
  };

  const handleRemove = (type, id, e) => {
    e.preventDefault();
    e.stopPropagation();
    removeRecentItem(type, id);
    toast.success('Eliminado de recientes');
  };

  const handleClearAll = () => {
    if (window.confirm('¿Eliminar todos los elementos recientes?')) {
      clearRecentItems();
      toast.success('Recientes eliminados');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'evento':
        return <CalendarIcon className="h-5 w-5 text-blue-500" />;
      case 'dj':
        return <MusicalNoteIcon className="h-5 w-5 text-purple-500" />;
      case 'cliente':
        return <UserIcon className="h-5 w-5 text-green-500" />;
      case 'lead':
        return <UserGroupIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  if (recentItems.length === 0) {
    return null; // Don't show if no recent items
  }

  return (
    <aside
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm ${className}`}
      aria-label="Elementos recientes"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <ClockIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Recientes
          </h3>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            {recentItems.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {!isCollapsed && recentItems.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 px-2 py-1 rounded transition-colors"
              aria-label="Limpiar todos"
            >
              Limpiar
            </button>
          )}
          <button
            onClick={handleToggleCollapse}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded transition-colors"
            aria-label={isCollapsed ? 'Expandir' : 'Colapsar'}
          >
            <ChevronRightIcon
              className={`h-4 w-4 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
            />
          </button>
        </div>
      </div>

      {/* Items List */}
      {!isCollapsed && (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {recentItems.map((item) => {
            const formatted = formatRecentItem(item);
            const path = getRecentItemPath(item);

            return (
              <Link
                key={`${item.type}-${item.id}`}
                to={path}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
              >
                {/* Icon */}
                <div className="flex-shrink-0">
                  {getIcon(item.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {formatted.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {formatted.subtitle}
                  </p>
                </div>

                {/* Badge & Remove */}
                <div className="flex items-center gap-2">
                  {formatted.badge && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 truncate max-w-[80px]">
                      {formatted.badge}
                    </span>
                  )}
                  <button
                    onClick={(e) => handleRemove(item.type, item.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-all"
                    aria-label="Eliminar de recientes"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Empty State (when collapsed) */}
      {isCollapsed && (
        <div className="px-4 py-2 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Haz clic para ver {recentItems.length} elemento{recentItems.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </aside>
  );
};

/**
 * Recent Items List (alternative horizontal layout)
 */
export const RecentItemsList = ({ maxItems = 5, className = '' }) => {
  const [recentItems, setRecentItems] = useState([]);

  useEffect(() => {
    setRecentItems(getRecentItems().slice(0, maxItems));

    const handleUpdate = () => {
      setRecentItems(getRecentItems().slice(0, maxItems));
    };

    window.addEventListener('recent-items-updated', handleUpdate);
    return () => window.removeEventListener('recent-items-updated', handleUpdate);
  }, [maxItems]);

  if (recentItems.length === 0) {
    return null;
  }

  const getIcon = (type) => {
    const icons = {
      evento: CalendarIcon,
      dj: MusicalNoteIcon,
      cliente: UserIcon,
      lead: UserGroupIcon,
    };
    const Icon = icons[type] || ClockIcon;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className={`flex items-center gap-2 overflow-x-auto ${className}`}>
      <ClockIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
        Recientes:
      </span>
      {recentItems.map((item) => {
        const formatted = formatRecentItem(item);
        const path = getRecentItemPath(item);

        return (
          <Link
            key={`${item.type}-${item.id}`}
            to={path}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors whitespace-nowrap"
          >
            {getIcon(item.type)}
            <span className="truncate max-w-[120px]">{formatted.title}</span>
          </Link>
        );
      })}
    </div>
  );
};

/**
 * Hook to track item view
 */
export const useTrackRecentItem = (type, item, dependencies = []) => {
  useEffect(() => {
    if (item && item.id) {
      addRecentItem(type, item);
    }
  }, dependencies);
};

export default RecentItems;
