import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { SunIcon as SunIconSolid, MoonIcon as MoonIconSolid } from '@heroicons/react/24/solid';

/**
 * Dark Mode Toggle Component
 * Toggle button for switching between light and dark themes
 */
const DarkModeToggle = ({ variant = 'default', className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  if (variant === 'switch') {
    return (
      <button
        onClick={toggleTheme}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          isDark ? 'bg-blue-600' : 'bg-gray-200'
        } ${className}`}
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isDark ? 'translate-x-6' : 'translate-x-1'
          }`}
        >
          {isDark ? (
            <MoonIconSolid className="h-4 w-4 text-blue-600" />
          ) : (
            <SunIconSolid className="h-4 w-4 text-yellow-500" />
          )}
        </span>
      </button>
    );
  }

  if (variant === 'icon-button') {
    return (
      <button
        onClick={toggleTheme}
        className={`p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        title={isDark ? 'Modo claro' : 'Modo oscuro'}
      >
        {isDark ? (
          <SunIcon className="h-5 w-5" aria-hidden="true" />
        ) : (
          <MoonIcon className="h-5 w-5" aria-hidden="true" />
        )}
      </button>
    );
  }

  if (variant === 'button-with-label') {
    return (
      <button
        onClick={toggleTheme}
        className={`inline-flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        {isDark ? (
          <>
            <SunIcon className="h-5 w-5" aria-hidden="true" />
            <span>Modo Claro</span>
          </>
        ) : (
          <>
            <MoonIcon className="h-5 w-5" aria-hidden="true" />
            <span>Modo Oscuro</span>
          </>
        )}
      </button>
    );
  }

  // Default variant: animated icon toggle
  return (
    <button
      onClick={toggleTheme}
      className={`relative p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      <div className="relative w-5 h-5">
        {/* Sun Icon (visible in dark mode) */}
        <SunIcon
          className={`absolute inset-0 h-5 w-5 text-yellow-500 transition-all duration-300 ${
            isDark ? 'rotate-0 opacity-100 scale-100' : 'rotate-90 opacity-0 scale-0'
          }`}
          aria-hidden="true"
        />

        {/* Moon Icon (visible in light mode) */}
        <MoonIcon
          className={`absolute inset-0 h-5 w-5 text-gray-700 transition-all duration-300 ${
            isDark ? '-rotate-90 opacity-0 scale-0' : 'rotate-0 opacity-100 scale-100'
          }`}
          aria-hidden="true"
        />
      </div>
    </button>
  );
};

/**
 * Dark Mode Toggle with Label
 * Shows current theme mode with toggle
 */
export const DarkModeToggleWithStatus = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="text-sm text-gray-600 dark:text-gray-400">
        Tema: <span className="font-medium text-gray-900 dark:text-white">
          {isDark ? 'Oscuro' : 'Claro'}
        </span>
      </span>
      <DarkModeToggle variant="switch" />
    </div>
  );
};

/**
 * Dark Mode Section for Settings
 * Complete section with description
 */
export const DarkModeSection = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            {isDark ? (
              <MoonIconSolid className="h-5 w-5 text-blue-500" aria-hidden="true" />
            ) : (
              <SunIconSolid className="h-5 w-5 text-yellow-500" aria-hidden="true" />
            )}
            Modo {isDark ? 'Oscuro' : 'Claro'}
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {isDark
              ? 'El modo oscuro reduce la fatiga visual en entornos con poca luz y ahorra batería en pantallas OLED.'
              : 'El modo claro proporciona mejor visibilidad en entornos iluminados y es ideal para lectura prolongada.'}
          </p>
          <div className="mt-4 space-y-2 text-xs text-gray-500 dark:text-gray-400">
            <p>• Cambio instantáneo sin recarga de página</p>
            <p>• Preferencia guardada automáticamente</p>
            <p>• Atajo de teclado: <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">Ctrl+Shift+D</kbd></p>
          </div>
        </div>
        <div className="ml-4">
          <DarkModeToggle variant="switch" />
        </div>
      </div>

      {/* Preview Cards */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div
          className={`p-4 rounded-lg border-2 transition-all ${
            !isDark
              ? 'border-blue-500 bg-white'
              : 'border-gray-300 bg-gray-50 opacity-50'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <SunIconSolid className="h-4 w-4 text-yellow-500" />
            <span className="text-xs font-medium text-gray-900">Modo Claro</span>
          </div>
          <div className="space-y-1">
            <div className="h-2 bg-gray-200 rounded w-full" />
            <div className="h-2 bg-gray-200 rounded w-3/4" />
          </div>
        </div>

        <div
          className={`p-4 rounded-lg border-2 transition-all ${
            isDark
              ? 'border-blue-500 bg-gray-800'
              : 'border-gray-300 bg-gray-800 opacity-50'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <MoonIconSolid className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-medium text-white">Modo Oscuro</span>
          </div>
          <div className="space-y-1">
            <div className="h-2 bg-gray-600 rounded w-full" />
            <div className="h-2 bg-gray-600 rounded w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook to toggle dark mode programmatically
 */
export const useDarkModeToggle = () => {
  const { isDark, toggleTheme } = useTheme();
  return { isDark, toggleTheme };
};

export default DarkModeToggle;
