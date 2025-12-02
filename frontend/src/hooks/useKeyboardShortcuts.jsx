import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { announceToScreenReader } from '../utils/accessibility';

/**
 * Global Keyboard Shortcuts Hook
 * Provides app-wide keyboard navigation (WCAG 2.1 compliance)
 *
 * Default shortcuts:
 * - Ctrl/Cmd + K: Open command palette
 * - Ctrl/Cmd + /: Show keyboard shortcuts help
 * - Ctrl/Cmd + S: Save (if in form)
 * - Ctrl/Cmd + Shift + D: Toggle dark mode
 * - Escape: Close modals/dialogs
 * - Alt + H: Go to home/dashboard
 * - Alt + E: Go to eventos
 * - Alt + D: Go to DJs
 * - Alt + C: Go to clientes
 * - Alt + L: Go to leads
 * - Alt + F: Go to financial dashboard
 */
export const useKeyboardShortcuts = (customShortcuts = {}) => {
  const navigate = useNavigate();
  const shortcutsRef = useRef(customShortcuts);

  useEffect(() => {
    shortcutsRef.current = customShortcuts;
  }, [customShortcuts]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const { key, ctrlKey, metaKey, altKey, shiftKey, target } = event;

      // Don't trigger shortcuts when typing in inputs (unless explicitly allowed)
      const isInputField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      const isContentEditable = target.isContentEditable;

      if ((isInputField || isContentEditable) && !altKey && !ctrlKey && !metaKey) {
        return;
      }

      const modifier = ctrlKey || metaKey;

      // Global navigation shortcuts (Alt + Key)
      if (altKey && !modifier) {
        switch (key.toLowerCase()) {
          case 'h':
            event.preventDefault();
            navigate('/');
            announceToScreenReader('Navegando a Dashboard', 'polite');
            break;
          case 'e':
            event.preventDefault();
            navigate('/eventos');
            announceToScreenReader('Navegando a Eventos', 'polite');
            break;
          case 'd':
            event.preventDefault();
            navigate('/djs');
            announceToScreenReader('Navegando a DJs', 'polite');
            break;
          case 'c':
            event.preventDefault();
            navigate('/clientes');
            announceToScreenReader('Navegando a Clientes', 'polite');
            break;
          case 'l':
            event.preventDefault();
            navigate('/leads');
            announceToScreenReader('Navegando a Leads', 'polite');
            break;
          case 'f':
            event.preventDefault();
            navigate('/financial');
            announceToScreenReader('Navegando a Dashboard Financiero', 'polite');
            break;
          case 'k':
            event.preventDefault();
            navigate('/calendario');
            announceToScreenReader('Navegando a Calendario', 'polite');
            break;
          case 's':
            event.preventDefault();
            navigate('/settings');
            announceToScreenReader('Navegando a Configuración', 'polite');
            break;
          default:
            break;
        }
      }

      // Command palette (Ctrl/Cmd + K)
      if (modifier && key.toLowerCase() === 'k') {
        event.preventDefault();
        // Dispatch custom event for command palette
        window.dispatchEvent(new CustomEvent('open-command-palette'));
        announceToScreenReader('Abriendo paleta de comandos', 'polite');
      }

      // Show keyboard shortcuts help (Ctrl/Cmd + /)
      if (modifier && key === '/') {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('show-keyboard-shortcuts'));
        announceToScreenReader('Mostrando atajos de teclado', 'polite');
      }

      // Toggle dark mode (Ctrl/Cmd + Shift + D)
      if (modifier && shiftKey && key.toLowerCase() === 'd') {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('toggle-dark-mode'));
        announceToScreenReader('Cambiando tema', 'polite');
      }

      // Save shortcut (Ctrl/Cmd + S)
      if (modifier && key.toLowerCase() === 's') {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('save-form'));
      }

      // Escape key handling
      if (key === 'Escape') {
        window.dispatchEvent(new CustomEvent('escape-pressed'));
      }

      // Check custom shortcuts
      Object.entries(shortcutsRef.current).forEach(([combo, handler]) => {
        if (matchesShortcut(event, combo)) {
          event.preventDefault();
          handler(event);
        }
      });
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);
};

/**
 * Match keyboard event with shortcut combo
 */
const matchesShortcut = (event, combo) => {
  const parts = combo.toLowerCase().split('+');
  const key = parts[parts.length - 1];
  const needsCtrl = parts.includes('ctrl') || parts.includes('cmd');
  const needsAlt = parts.includes('alt');
  const needsShift = parts.includes('shift');

  const hasCtrl = event.ctrlKey || event.metaKey;
  const hasAlt = event.altKey;
  const hasShift = event.shiftKey;

  return (
    event.key.toLowerCase() === key &&
    (!needsCtrl || hasCtrl) &&
    (!needsAlt || hasAlt) &&
    (!needsShift || hasShift)
  );
};

/**
 * Hook for form keyboard shortcuts (save, cancel, etc.)
 */
export const useFormShortcuts = (callbacks = {}) => {
  useEffect(() => {
    const handleSave = () => {
      if (callbacks.onSave) {
        callbacks.onSave();
        announceToScreenReader('Guardando cambios', 'polite');
      }
    };

    const handleCancel = () => {
      if (callbacks.onCancel) {
        callbacks.onCancel();
        announceToScreenReader('Cancelando cambios', 'polite');
      }
    };

    window.addEventListener('save-form', handleSave);
    window.addEventListener('escape-pressed', handleCancel);

    return () => {
      window.removeEventListener('save-form', handleSave);
      window.removeEventListener('escape-pressed', handleCancel);
    };
  }, [callbacks]);
};

/**
 * Hook for modal keyboard shortcuts
 */
export const useModalShortcuts = (isOpen, onClose) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = () => {
      if (onClose) {
        onClose();
        announceToScreenReader('Modal cerrado', 'polite');
      }
    };

    window.addEventListener('escape-pressed', handleEscape);

    return () => {
      window.removeEventListener('escape-pressed', handleEscape);
    };
  }, [isOpen, onClose]);
};

/**
 * Keyboard shortcuts reference
 */
export const KEYBOARD_SHORTCUTS = {
  navigation: [
    { keys: 'Alt + H', description: 'Ir a Dashboard' },
    { keys: 'Alt + E', description: 'Ir a Eventos' },
    { keys: 'Alt + D', description: 'Ir a DJs' },
    { keys: 'Alt + C', description: 'Ir a Clientes' },
    { keys: 'Alt + L', description: 'Ir a Leads' },
    { keys: 'Alt + F', description: 'Ir a Dashboard Financiero' },
    { keys: 'Alt + K', description: 'Ir a Calendario' },
    { keys: 'Alt + S', description: 'Ir a Configuración' },
  ],
  actions: [
    { keys: 'Ctrl/Cmd + K', description: 'Abrir paleta de comandos' },
    { keys: 'Ctrl/Cmd + S', description: 'Guardar formulario' },
    { keys: 'Ctrl/Cmd + /', description: 'Mostrar atajos de teclado' },
    { keys: 'Escape', description: 'Cerrar modal o cancelar' },
  ],
  tables: [
    { keys: '↑ ↓', description: 'Navegar entre filas' },
    { keys: 'Enter', description: 'Seleccionar/Abrir elemento' },
    { keys: 'Space', description: 'Marcar/Desmarcar checkbox' },
  ],
};

/**
 * Component to display keyboard shortcuts help
 */
export const KeyboardShortcutsHelp = ({ isOpen, onClose }) => {
  useModalShortcuts(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
          <h2 id="shortcuts-title" className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Atajos de Teclado
          </h2>

          <div className="space-y-6">
            {/* Navigation */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Navegación
              </h3>
              <div className="space-y-2">
                {KEYBOARD_SHORTCUTS.navigation.map((shortcut) => (
                  <div key={shortcut.keys} className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">{shortcut.description}</span>
                    <kbd className="px-2 py-1 text-sm font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Acciones
              </h3>
              <div className="space-y-2">
                {KEYBOARD_SHORTCUTS.actions.map((shortcut) => (
                  <div key={shortcut.keys} className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">{shortcut.description}</span>
                    <kbd className="px-2 py-1 text-sm font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>

            {/* Tables */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Tablas
              </h3>
              <div className="space-y-2">
                {KEYBOARD_SHORTCUTS.tables.map((shortcut) => (
                  <div key={shortcut.keys} className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">{shortcut.description}</span>
                    <kbd className="px-2 py-1 text-sm font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full inline-flex justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default useKeyboardShortcuts;
