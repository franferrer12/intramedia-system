import { useState } from 'react';
import { TrashIcon, ArrowDownTrayIcon, CheckIcon } from '@heroicons/react/24/outline';
import { quickExport } from '../utils/export';
import toast from '../utils/toast';

/**
 * Bulk Actions Component
 * Provides bulk select and actions (delete, export) for tables
 */
const BulkActions = ({
  data = [],
  selectedIds = [],
  onSelectionChange,
  onDelete,
  entityType,
  className = '',
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const selectedCount = selectedIds.length;
  const allSelected = data.length > 0 && selectedIds.length === data.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map(item => item.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCount === 0) return;

    const confirmed = window.confirm(
      `¿Estás seguro de eliminar ${selectedCount} elemento${selectedCount !== 1 ? 's' : ''}?`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(selectedIds);
        toast.success(`${selectedCount} elemento${selectedCount !== 1 ? 's' : ''} eliminado${selectedCount !== 1 ? 's' : ''}`);
        onSelectionChange([]);
      }
    } catch (error) {
      console.error('Bulk delete failed:', error);
      toast.error('Error al eliminar elementos');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkExport = async () => {
    if (selectedCount === 0) return;

    setIsExporting(true);
    try {
      const selectedData = data.filter(item => selectedIds.includes(item.id));
      await quickExport(selectedData, entityType, 'excel');
    } catch (error) {
      console.error('Bulk export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (data.length === 0) return null;

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Select All Checkbox */}
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={allSelected}
          ref={input => {
            if (input) input.indeterminate = someSelected;
          }}
          onChange={handleSelectAll}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
          aria-label="Seleccionar todos"
        />
        <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
          {selectedCount > 0 ? `${selectedCount} seleccionado${selectedCount !== 1 ? 's' : ''}` : 'Seleccionar todo'}
        </label>
      </div>

      {/* Bulk Actions - Only show when items are selected */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2">
          {/* Export Button */}
          <button
            type="button"
            onClick={handleBulkExport}
            disabled={isExporting}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            aria-label="Exportar seleccionados"
          >
            <ArrowDownTrayIcon
              className={`h-4 w-4 mr-1.5 ${isExporting ? 'animate-bounce' : ''}`}
              aria-hidden="true"
            />
            {isExporting ? 'Exportando...' : 'Exportar'}
          </button>

          {/* Delete Button */}
          {onDelete && (
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="inline-flex items-center px-3 py-1.5 border border-red-300 dark:border-red-600 shadow-sm text-xs font-medium rounded text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              aria-label="Eliminar seleccionados"
            >
              <TrashIcon
                className={`h-4 w-4 mr-1.5 ${isDeleting ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          )}

          {/* Clear Selection */}
          <button
            type="button"
            onClick={() => onSelectionChange([])}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline focus:outline-none"
          >
            Limpiar selección
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Checkbox Cell Component (for use in table rows)
 */
export const BulkSelectCheckbox = ({ id, checked, onChange, className = '' }) => {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(id, e.target.checked)}
      onClick={(e) => e.stopPropagation()}
      className={`h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 ${className}`}
      aria-label="Seleccionar elemento"
    />
  );
};

/**
 * Hook for managing bulk selection state
 */
export const useBulkSelection = (initialIds = []) => {
  const [selectedIds, setSelectedIds] = useState(initialIds);

  const toggleSelection = (id) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  const toggleAll = (ids) => {
    setSelectedIds(prev =>
      prev.length === ids.length ? [] : ids
    );
  };

  const clearSelection = () => setSelectedIds([]);

  const isSelected = (id) => selectedIds.includes(id);

  return {
    selectedIds,
    setSelectedIds,
    toggleSelection,
    toggleAll,
    clearSelection,
    isSelected,
  };
};

export default BulkActions;
