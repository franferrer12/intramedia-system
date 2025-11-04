import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Dropdown Component - Modern dropdown menu
 *
 * Features:
 * - Keyboard navigation
 * - Click outside to close
 * - Multiple positions
 * - Icons support
 * - Dividers
 * - Disabled items
 * - Multi-select option
 */

const Dropdown = ({
  trigger,
  items = [],
  position = 'bottom-left',
  fullWidth = false,
  closeOnSelect = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  const handleItemClick = (item) => {
    if (item.disabled) return;

    item.onClick?.();

    if (closeOnSelect && !item.keepOpen) {
      setIsOpen(false);
    }
  };

  const positionClasses = {
    'top-left': 'bottom-full left-0 mb-2',
    'top-right': 'bottom-full right-0 mb-2',
    'bottom-left': 'top-full left-0 mt-2',
    'bottom-right': 'top-full right-0 mt-2',
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* Trigger */}
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger || (
          <button className="btn btn-secondary flex items-center gap-2">
            Menu
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: position.startsWith('top') ? 10 : -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: position.startsWith('top') ? 10 : -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`
              absolute z-50 min-w-[200px]
              ${fullWidth ? 'w-full' : 'w-max'}
              ${positionClasses[position]}
              bg-white dark:bg-slate-800
              border border-slate-200 dark:border-slate-700
              rounded-xl shadow-xl
              py-2
            `}
          >
            {items.map((item, index) => {
              // Divider
              if (item.divider) {
                return (
                  <div
                    key={`divider-${index}`}
                    className="my-2 border-t border-slate-200 dark:border-slate-700"
                  />
                );
              }

              const Icon = item.icon;
              const isSelected = item.selected;

              return (
                <button
                  key={index}
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm
                    ${item.disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer'
                    }
                    ${item.danger
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-slate-700 dark:text-slate-300'
                    }
                    transition-colors
                  `}
                >
                  {/* Icon */}
                  {Icon && (
                    <Icon className={`w-4 h-4 flex-shrink-0 ${item.danger ? '' : 'text-slate-600 dark:text-slate-400'}`} />
                  )}

                  {/* Label */}
                  <span className="flex-1">{item.label}</span>

                  {/* Selected indicator */}
                  {isSelected && (
                    <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  )}

                  {/* Shortcut */}
                  {item.shortcut && (
                    <kbd className="px-2 py-0.5 text-xs bg-slate-200 dark:bg-slate-700 rounded">
                      {item.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * DropdownItem - Helper component for manual dropdown construction
 */
export const DropdownItem = ({
  children,
  icon: Icon,
  onClick,
  disabled = false,
  danger = false,
  selected = false,
  shortcut,
  className = '',
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm
      ${disabled
        ? 'opacity-50 cursor-not-allowed'
        : 'hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer'
      }
      ${danger
        ? 'text-red-600 dark:text-red-400'
        : 'text-slate-700 dark:text-slate-300'
      }
      transition-colors
      ${className}
    `}
  >
    {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
    <span className="flex-1">{children}</span>
    {selected && <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />}
    {shortcut && (
      <kbd className="px-2 py-0.5 text-xs bg-slate-200 dark:bg-slate-700 rounded">
        {shortcut}
      </kbd>
    )}
  </button>
);

/**
 * DropdownDivider - Divider for dropdown sections
 */
export const DropdownDivider = () => (
  <div className="my-2 border-t border-slate-200 dark:border-slate-700" />
);

export default Dropdown;
