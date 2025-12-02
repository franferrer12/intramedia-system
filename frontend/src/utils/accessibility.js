/**
 * Accessibility Utilities (WCAG 2.1 Compliance)
 * Keyboard navigation, focus management, and ARIA helpers
 */

/**
 * Trap focus within a modal/dialog
 * @param {HTMLElement} element - Container element
 * @returns {Function} Cleanup function
 */
export const trapFocus = (element) => {
  const focusableElements = element.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };

  element.addEventListener('keydown', handleTabKey);
  firstElement?.focus();

  return () => element.removeEventListener('keydown', handleTabKey);
};

/**
 * Handle keyboard shortcuts
 * @param {Object} shortcuts - Map of key combinations to handlers
 * @returns {Function} Cleanup function
 */
export const useKeyboardShortcuts = (shortcuts) => {
  const handleKeyDown = (e) => {
    const key = e.key.toLowerCase();
    const modifier = e.ctrlKey || e.metaKey;
    const shiftKey = e.shiftKey;

    Object.entries(shortcuts).forEach(([combo, handler]) => {
      const [comboKey, ...modifiers] = combo.split('+').reverse();
      const needsCtrl = modifiers.includes('ctrl') || modifiers.includes('cmd');
      const needsShift = modifiers.includes('shift');

      if (
        key === comboKey.toLowerCase() &&
        (needsCtrl ? modifier : !modifier) &&
        (needsShift ? shiftKey : !shiftKey)
      ) {
        e.preventDefault();
        handler(e);
      }
    });
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
};

/**
 * Announce to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Get ARIA label for status badge
 */
export const getStatusAriaLabel = (status) => {
  const labels = {
    pending: 'Estado: Pendiente',
    confirmed: 'Estado: Confirmado',
    completed: 'Estado: Completado',
    cancelled: 'Estado: Cancelado',
    active: 'Estado: Activo',
    inactive: 'Estado: Inactivo',
    paid: 'Estado: Pagado',
    unpaid: 'Estado: No pagado',
    processing: 'Estado: Procesando',
    success: 'Estado: Exitoso',
    error: 'Estado: Error',
  };
  return labels[status] || `Estado: ${status}`;
};

/**
 * Format date for screen readers
 */
export const formatDateForScreenReader = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format currency for screen readers
 */
export const formatCurrencyForScreenReader = (amount, currency = 'EUR') => {
  if (amount === null || amount === undefined) return '';
  return `${amount.toFixed(2)} euros`;
};

/**
 * Check if reduced motion is preferred
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Focus first error in form
 */
export const focusFirstError = (formRef) => {
  if (!formRef.current) return;

  const errorElement = formRef.current.querySelector('[aria-invalid="true"]');
  if (errorElement) {
    errorElement.focus();
    errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

/**
 * Generate unique ID for accessibility
 */
let idCounter = 0;
export const generateId = (prefix = 'a11y') => {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
};

/**
 * ARIA live region types
 */
export const ARIA_LIVE = {
  POLITE: 'polite',
  ASSERTIVE: 'assertive',
  OFF: 'off',
};

/**
 * Common keyboard keys
 */
export const KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  TAB: 'Tab',
  HOME: 'Home',
  END: 'End',
};

/**
 * Handle roving tabindex for lists/grids
 */
export class RovingTabIndex {
  constructor(containerRef, itemSelector = '[role="option"]') {
    this.container = containerRef.current;
    this.itemSelector = itemSelector;
    this.currentIndex = 0;
  }

  getItems() {
    return Array.from(this.container.querySelectorAll(this.itemSelector));
  }

  setFocus(index) {
    const items = this.getItems();
    if (index < 0) index = items.length - 1;
    if (index >= items.length) index = 0;

    items.forEach((item, i) => {
      item.setAttribute('tabindex', i === index ? '0' : '-1');
    });

    items[index]?.focus();
    this.currentIndex = index;
  }

  handleKeyDown(e) {
    const { key } = e;

    switch (key) {
      case KEYS.ARROW_DOWN:
      case KEYS.ARROW_RIGHT:
        e.preventDefault();
        this.setFocus(this.currentIndex + 1);
        break;
      case KEYS.ARROW_UP:
      case KEYS.ARROW_LEFT:
        e.preventDefault();
        this.setFocus(this.currentIndex - 1);
        break;
      case KEYS.HOME:
        e.preventDefault();
        this.setFocus(0);
        break;
      case KEYS.END:
        e.preventDefault();
        this.setFocus(this.getItems().length - 1);
        break;
      default:
        break;
    }
  }
}

/**
 * CSS class for screen reader only content
 */
export const SR_ONLY_CLASS = 'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0';
