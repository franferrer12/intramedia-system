import { prefersReducedMotion } from '../utils/accessibility';

/**
 * Base Skeleton Component
 * Accessible loading placeholder with reduced motion support
 */
const Skeleton = ({ className = '', width, height, circle = false, ...props }) => {
  const shouldAnimate = !prefersReducedMotion();

  return (
    <div
      role="status"
      aria-label="Cargando contenido"
      className={`bg-gray-200 dark:bg-gray-700 ${
        shouldAnimate ? 'animate-pulse' : ''
      } ${circle ? 'rounded-full' : 'rounded'} ${className}`}
      style={{
        width: width || '100%',
        height: height || '1rem',
      }}
      {...props}
    >
      <span className="sr-only">Cargando...</span>
    </div>
  );
};

/**
 * Table Skeleton Loader
 */
export const TableSkeleton = ({ rows = 5, columns = 5 }) => {
  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
      <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-3 py-3.5">
                <Skeleton height="1rem" width="80%" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-3 py-4">
                  <Skeleton height="0.875rem" width={colIndex === 0 ? '90%' : '70%'} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Card Skeleton Loader
 */
export const CardSkeleton = ({ hasImage = false, lines = 3 }) => {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      {hasImage && <Skeleton height="12rem" className="mb-4" />}
      <Skeleton height="1.5rem" width="60%" className="mb-3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="1rem"
          width={i === lines - 1 ? '40%' : '100%'}
          className="mb-2"
        />
      ))}
    </div>
  );
};

/**
 * List Item Skeleton
 */
export const ListItemSkeleton = ({ avatar = false, lines = 2 }) => {
  return (
    <div className="flex items-start space-x-4 p-4">
      {avatar && <Skeleton circle width="3rem" height="3rem" />}
      <div className="flex-1 space-y-2">
        <Skeleton height="1.25rem" width="70%" />
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            height="0.875rem"
            width={i === lines - 1 ? '50%' : '100%'}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Dashboard Card Skeleton
 */
export const DashboardCardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Skeleton circle width="3rem" height="3rem" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <Skeleton height="0.875rem" width="40%" className="mb-2" />
            <Skeleton height="2rem" width="60%" />
          </div>
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
        <Skeleton height="0.875rem" width="50%" />
      </div>
    </div>
  );
};

/**
 * Form Skeleton Loader
 */
export const FormSkeleton = ({ fields = 4 }) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <Skeleton height="1rem" width="30%" className="mb-2" />
          <Skeleton height="2.5rem" />
        </div>
      ))}
      <div className="flex justify-end space-x-3">
        <Skeleton height="2.5rem" width="6rem" />
        <Skeleton height="2.5rem" width="8rem" />
      </div>
    </div>
  );
};

/**
 * Calendar Skeleton
 */
export const CalendarSkeleton = () => {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <Skeleton height="1.5rem" width="8rem" />
        <div className="flex space-x-2">
          <Skeleton height="2rem" width="2rem" />
          <Skeleton height="2rem" width="2rem" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 mb-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} height="1.5rem" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} height="3rem" />
        ))}
      </div>
    </div>
  );
};

/**
 * Chart Skeleton
 */
export const ChartSkeleton = ({ height = '20rem' }) => {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <Skeleton height="1.5rem" width="40%" className="mb-6" />
      <Skeleton height={height} />
    </div>
  );
};

/**
 * Avatar Skeleton
 */
export const AvatarSkeleton = ({ size = 'md' }) => {
  const sizes = {
    sm: '2rem',
    md: '3rem',
    lg: '4rem',
    xl: '6rem',
  };

  return <Skeleton circle width={sizes[size]} height={sizes[size]} />;
};

/**
 * Text Skeleton (for inline text)
 */
export const TextSkeleton = ({ width = '100%', className = '' }) => {
  return <Skeleton height="1rem" width={width} className={className} />;
};

/**
 * Page Header Skeleton
 */
export const PageHeaderSkeleton = () => {
  return (
    <div className="mb-8">
      <Skeleton height="2.5rem" width="40%" className="mb-3" />
      <Skeleton height="1.25rem" width="60%" />
    </div>
  );
};

/**
 * Stats Grid Skeleton
 */
export const StatsGridSkeleton = ({ cards = 4 }) => {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: cards }).map((_, i) => (
        <DashboardCardSkeleton key={i} />
      ))}
    </div>
  );
};

export default Skeleton;
