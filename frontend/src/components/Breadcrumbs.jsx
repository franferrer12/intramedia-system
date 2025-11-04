import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Breadcrumbs Component - Navigation breadcrumbs
 *
 * Features:
 * - Link integration with React Router
 * - Home icon option
 * - Custom separators
 * - Responsive collapse on mobile
 * - Current page highlighting
 * - Animated appearance
 */

const Breadcrumbs = ({
  items = [],
  showHome = true,
  separator = <ChevronRight className="w-4 h-4" />,
  maxItems,
  className = '',
}) => {
  // Handle max items with ellipsis
  const getDisplayItems = () => {
    if (!maxItems || items.length <= maxItems) {
      return items;
    }

    const firstItem = items[0];
    const lastItems = items.slice(-(maxItems - 1));

    return [
      firstItem,
      { label: '...', path: null, isEllipsis: true },
      ...lastItems,
    ];
  };

  const displayItems = getDisplayItems();

  return (
    <nav
      aria-label="Breadcrumbs"
      className={`flex items-center ${className}`}
    >
      <ol className="flex flex-wrap items-center gap-2">
        {/* Home link */}
        {showHome && (
          <>
            <motion.li
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Link
                to="/"
                className="flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span className="text-sm font-medium">Inicio</span>
              </Link>
            </motion.li>

            {displayItems.length > 0 && (
              <li className="flex items-center text-slate-400 dark:text-slate-600">
                {separator}
              </li>
            )}
          </>
        )}

        {/* Breadcrumb items */}
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isEllipsis = item.isEllipsis;

          return (
            <motion.div
              key={item.path || index}
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <li>
                {isEllipsis ? (
                  <span className="text-sm text-slate-400 dark:text-slate-600">
                    {item.label}
                  </span>
                ) : isLast ? (
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {item.label}
                  </span>
                ) : item.path ? (
                  <Link
                    to={item.path}
                    className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {item.label}
                  </span>
                )}
              </li>

              {!isLast && (
                <li className="flex items-center text-slate-400 dark:text-slate-600">
                  {separator}
                </li>
              )}
            </motion.div>
          );
        })}
      </ol>
    </nav>
  );
};

/**
 * BreadcrumbItem - Helper component for manual breadcrumb construction
 */
export const BreadcrumbItem = ({ children, href, active = false, className = '' }) => (
  <li className={className}>
    {active ? (
      <span className="text-sm font-medium text-slate-900 dark:text-white">
        {children}
      </span>
    ) : href ? (
      <Link
        to={href}
        className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        {children}
      </Link>
    ) : (
      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
        {children}
      </span>
    )}
  </li>
);

/**
 * BreadcrumbSeparator - Helper component for custom separators
 */
export const BreadcrumbSeparator = ({ children, className = '' }) => (
  <li className={`flex items-center text-slate-400 dark:text-slate-600 ${className}`}>
    {children || <ChevronRight className="w-4 h-4" />}
  </li>
);

export default Breadcrumbs;
