import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  global?: boolean; // Si es true, funciona en toda la app
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

/**
 * Hook para gestionar atajos de teclado en la aplicación
 *
 * @example
 * useKeyboardShortcuts({
 *   shortcuts: [
 *     { key: 'n', ctrl: true, description: 'Nuevo', action: handleNew },
 *     { key: 's', ctrl: true, description: 'Guardar', action: handleSave }
 *   ]
 * });
 */
export const useKeyboardShortcuts = ({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignorar si el usuario está escribiendo en un input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Permitir Ctrl+S y Ctrl+K incluso en inputs
        if (!(event.ctrlKey || event.metaKey) || (event.key !== 's' && event.key !== 'k')) {
          return;
        }
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && altMatch && shiftMatch && keyMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

/**
 * Hook con atajos de navegación globales (G + tecla)
 * Implementa el patrón de Gmail: presiona 'g' luego una letra para navegar
 */
export const useGlobalNavigationShortcuts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  let gPressed = false;
  let gTimeout: ReturnType<typeof setTimeout> | null = null;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignorar si está escribiendo
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Si presiona 'g'
      if (event.key === 'g' && !gPressed) {
        gPressed = true;
        // Reset después de 2 segundos
        gTimeout = setTimeout(() => {
          gPressed = false;
        }, 2000);
        return;
      }

      // Si ya presionó 'g', espera la segunda tecla
      if (gPressed) {
        if (gTimeout) clearTimeout(gTimeout);
        gPressed = false;

        const navigationMap: Record<string, string> = {
          'd': '/dashboard',
          'h': '/dashboard', // h = home
          'e': '/eventos',
          'i': '/inventario',
          'f': '/finanzas/dashboard',
          'p': '/personal',
          't': '/turnos',
          'v': '/pos-terminal', // v = ventas
          's': '/sesiones',
          'a': '/analytics',
        };

        const destination = navigationMap[event.key];
        if (destination && location.pathname !== destination) {
          navigate(destination);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (gTimeout) clearTimeout(gTimeout);
    };
  }, [navigate, location]);
};

/**
 * Hook para atajos de función (F1-F12)
 */
export const useFunctionKeyShortcuts = (shortcuts: Record<string, () => void>) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignorar si está en un input
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const action = shortcuts[event.key];
      if (action) {
        event.preventDefault();
        action();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

/**
 * Atajos globales comunes de la aplicación
 */
export const useGlobalShortcuts = () => {
  const navigate = useNavigate();

  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'n',
        ctrl: true,
        description: 'Nuevo (según contexto)',
        action: () => {
          // Esta acción será sobreescrita por el contexto específico de la página
          console.log('Ctrl+N presionado - implementar según contexto');
        },
      },
      {
        key: 's',
        ctrl: true,
        description: 'Guardar',
        action: () => {
          // Trigger save en formulario activo
          const saveButton = document.querySelector('[data-shortcut="save"]') as HTMLButtonElement;
          if (saveButton) saveButton.click();
        },
      },
      {
        key: 'F2',
        description: 'Abrir Terminal POS',
        action: () => navigate('/pos-terminal'),
        global: true,
      },
    ],
  });

  // Navegación con G + tecla
  useGlobalNavigationShortcuts();
};
