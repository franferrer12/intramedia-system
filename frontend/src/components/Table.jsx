import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';

/**
 * Table Component - Modern responsive table
 *
 * Features:
 * - Sortable columns
 * - Responsive design (cards on mobile)
 * - Striped rows
 * - Hover effects
 * - Loading state
 * - Empty state
 * - Custom cell rendering
 */

const Table = ({
  data = [],
  columns = [],
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  striped = true,
  hoverable = true,
  compact = false,
  onRowClick,
  sortable = true,
  className = '',
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Sorting logic
  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue === bValue) return 0;

    const direction = sortConfig.direction === 'asc' ? 1 : -1;

    if (typeof aValue === 'string') {
      return aValue.localeCompare(bValue) * direction;
    }

    return (aValue > bValue ? 1 : -1) * direction;
  });

  const handleSort = (key) => {
    if (!sortable) return;

    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortIcon = (key) => {
    if (!sortable) return null;
    if (sortConfig.key !== key) return <ChevronsUpDown className="w-4 h-4 text-slate-400" />;
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="w-4 h-4 text-primary-600" />
      : <ChevronDown className="w-4 h-4 text-primary-600" />;
  };

  if (loading) {
    return (
      <div className="w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="animate-pulse">
          <div className="h-12 bg-slate-200 dark:bg-slate-700" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full p-12 text-center border border-slate-200 dark:border-slate-700 rounded-xl">
        <p className="text-slate-500 dark:text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  const rowPadding = compact ? 'px-4 py-2' : 'px-6 py-4';

  return (
    <div className={`w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 ${className}`}>
      <table className="w-full">
        {/* Header */}
        <thead className="bg-slate-50 dark:bg-slate-800/50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                onClick={() => column.sortable !== false && handleSort(column.key)}
                className={`
                  ${rowPadding}
                  text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider
                  ${column.sortable !== false && sortable ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 select-none' : ''}
                  ${column.align === 'center' ? 'text-center' : ''}
                  ${column.align === 'right' ? 'text-right' : ''}
                `}
                style={{ width: column.width }}
              >
                <div className="flex items-center gap-2">
                  {column.label}
                  {column.sortable !== false && getSortIcon(column.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
          {sortedData.map((row, rowIndex) => (
            <motion.tr
              key={row.id || rowIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: rowIndex * 0.05 }}
              onClick={() => onRowClick?.(row)}
              className={`
                ${striped && rowIndex % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-700/20' : ''}
                ${hoverable ? 'hover:bg-slate-100 dark:hover:bg-slate-700/30 transition-colors' : ''}
                ${onRowClick ? 'cursor-pointer' : ''}
              `}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`
                    ${rowPadding}
                    text-sm text-slate-900 dark:text-white
                    ${column.align === 'center' ? 'text-center' : ''}
                    ${column.align === 'right' ? 'text-right' : ''}
                  `}
                >
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * TableCell - Helper component for custom cell rendering
 */
export const TableCell = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

export default Table;
