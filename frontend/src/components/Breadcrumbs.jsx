import { Link, useLocation } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/solid';

/**
 * Breadcrumbs Component
 * Displays navigation breadcrumb trail based on current route
 */

const routeNames = {
  '': 'Dashboard',
  'eventos': 'Eventos',
  'calendario': 'Calendario',
  'calendario-avanzado': 'Calendario Avanzado',
  'djs': 'DJs',
  'djs-financial': 'DJs - Financial',
  'dj-payments-pending': 'Pagos Pendientes',
  'dj-metrics': 'Métricas',
  'dj-growth': 'Análisis de Crecimiento',
  'clientes': 'Clientes',
  'clientes-financial': 'Clientes - Financial',
  'clientes-payments-pending': 'Pagos Pendientes',
  'clientes-loyalty': 'Programa de Lealtad',
  'leads': 'Leads',
  'solicitudes': 'Solicitudes',
  'financial': 'Dashboard Financiero',
  'nominas': 'Nóminas',
  'socios': 'Socios',
  'data-cleanup': 'Limpieza de Datos',
  'dj-comparison': 'Comparación de DJs',
  'agency-djs': 'Gestión de DJs',
  'profit-distribution': 'Distribución de Beneficios',
  'monthly-expenses': 'Gastos Mensuales',
  'budget-comparison': 'Comparación de Presupuesto',
  'financial-alerts': 'Alertas Financieras',
  'executive-dashboard': 'Dashboard Ejecutivo',
  'jobs-demo': 'Demo Jobs',
  'settings': 'Configuración',
  'documents': 'Documentos',
  'reservations': 'Reservas',
  'payments': 'Pagos',
  'calendar-settings': 'Configuración de Calendario',
};

const Breadcrumbs = ({ className = '' }) => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  if (pathnames.length === 0) {
    return null; // Don't show breadcrumbs on home page
  }

  return (
    <nav
      className={`flex items-center space-x-2 text-sm ${className}`}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-2">
        {/* Home */}
        <li>
          <Link
            to="/"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="Ir a Dashboard"
          >
            <HomeIcon className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Dashboard</span>
          </Link>
        </li>

        {/* Path segments */}
        {pathnames.map((segment, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const name = routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

          return (
            <li key={to} className="flex items-center">
              <ChevronRightIcon
                className="h-4 w-4 text-gray-400 dark:text-gray-600"
                aria-hidden="true"
              />
              {isLast ? (
                <span
                  className="ml-2 text-gray-900 dark:text-white font-medium"
                  aria-current="page"
                >
                  {name}
                </span>
              ) : (
                <Link
                  to={to}
                  className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  {name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

/**
 * Custom Breadcrumbs Component
 * For pages that need custom breadcrumb items
 */
export const CustomBreadcrumbs = ({ items = [], className = '' }) => {
  return (
    <nav
      className={`flex items-center space-x-2 text-sm ${className}`}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-2">
        {/* Home */}
        <li>
          <Link
            to="/"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="Ir a Dashboard"
          >
            <HomeIcon className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Dashboard</span>
          </Link>
        </li>

        {/* Custom items */}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.path || index} className="flex items-center">
              <ChevronRightIcon
                className="h-4 w-4 text-gray-400 dark:text-gray-600"
                aria-hidden="true"
              />
              {isLast || !item.path ? (
                <span
                  className="ml-2 text-gray-900 dark:text-white font-medium"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.path}
                  className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

/**
 * Breadcrumbs with Actions
 * Breadcrumbs with action buttons on the right
 */
export const BreadcrumbsWithActions = ({ actions, className = '' }) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <Breadcrumbs />
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};

export default Breadcrumbs;
