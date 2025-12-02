import { useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { quickExport } from '../utils/export';

/**
 * Export Button Component
 * Provides Excel/CSV export functionality with dropdown menu
 */
const ExportButton = ({
  data,
  entityType,
  filename,
  disabled = false,
  className = '',
  showLabel = true,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleExport = async (format) => {
    setIsExporting(true);
    setShowMenu(false);

    try {
      await quickExport(data, entityType, format);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (disabled || !data || data.length === 0) {
    return (
      <button
        type="button"
        disabled
        className={`inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 cursor-not-allowed ${className}`}
        aria-label="No hay datos para exportar"
      >
        <ArrowDownTrayIcon className="h-5 w-5 mr-2" aria-hidden="true" />
        {showLabel && 'Exportar'}
      </button>
    );
  }

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
        className={`inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 ${className}`}
        aria-label="Exportar datos"
        aria-haspopup="true"
        aria-expanded={showMenu}
      >
        <ArrowDownTrayIcon
          className={`h-5 w-5 ${showLabel ? 'mr-2' : ''} ${isExporting ? 'animate-bounce' : ''}`}
          aria-hidden="true"
        />
        {showLabel && (isExporting ? 'Exportando...' : 'Exportar')}
        <svg
          className="-mr-1 ml-2 h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
            aria-hidden="true"
          />

          {/* Dropdown menu */}
          <div
            className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-20"
            role="menu"
            aria-orientation="vertical"
          >
            <div className="py-1">
              <button
                type="button"
                onClick={() => handleExport('excel')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
                role="menuitem"
              >
                <div className="flex items-center">
                  <span className="mr-3 text-green-600 dark:text-green-400">📊</span>
                  <div>
                    <div className="font-medium">Excel (.xlsx)</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Formato recomendado
                    </div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleExport('csv')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
                role="menuitem"
              >
                <div className="flex items-center">
                  <span className="mr-3 text-blue-600 dark:text-blue-400">📄</span>
                  <div>
                    <div className="font-medium">CSV (.csv)</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Texto separado por comas
                    </div>
                  </div>
                </div>
              </button>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 py-1">
              <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                Exportando {data.length} registro{data.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Simple export button (no dropdown, just Excel)
 */
export const SimpleExportButton = ({
  data,
  entityType,
  format = 'excel',
  disabled = false,
  className = '',
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await quickExport(data, entityType, format);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={disabled || isExporting || !data || data.length === 0}
      className={`inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      aria-label={`Exportar a ${format.toUpperCase()}`}
    >
      <ArrowDownTrayIcon
        className={`h-4 w-4 mr-1.5 ${isExporting ? 'animate-bounce' : ''}`}
        aria-hidden="true"
      />
      {isExporting ? 'Exportando...' : format.toUpperCase()}
    </button>
  );
};

export default ExportButton;
