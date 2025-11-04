import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

/**
 * Alert Component - Modern alert/notification system
 *
 * Features:
 * - Multiple variants (success, error, warning, info)
 * - Dismissible option
 * - Auto-dismiss with timer
 * - Icon support
 * - Actions/buttons
 * - Animations
 */

const Alert = ({
  variant = 'info',
  title,
  children,
  dismissible = false,
  autoDismiss = false,
  dismissAfter = 5000,
  onDismiss,
  icon: CustomIcon,
  actions,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // Auto dismiss logic
  useState(() => {
    if (autoDismiss && dismissAfter) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, dismissAfter);

      return () => clearTimeout(timer);
    }
  }, [autoDismiss, dismissAfter]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const variants = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-700',
      text: 'text-green-900 dark:text-green-100',
      icon: CheckCircle,
      iconColor: 'text-green-600 dark:text-green-400',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-700',
      text: 'text-red-900 dark:text-red-100',
      icon: AlertCircle,
      iconColor: 'text-red-600 dark:text-red-400',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-700',
      text: 'text-amber-900 dark:text-amber-100',
      icon: AlertTriangle,
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-700',
      text: 'text-blue-900 dark:text-blue-100',
      icon: Info,
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
  };

  const config = variants[variant];
  const Icon = CustomIcon || config.icon;

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={`
          relative rounded-xl border p-4
          ${config.bg}
          ${config.border}
          ${config.text}
          ${className}
        `}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          {Icon && (
            <div className="flex-shrink-0 mt-0.5">
              <Icon className={`w-5 h-5 ${config.iconColor}`} />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-sm font-semibold mb-1">
                {title}
              </h3>
            )}
            {children && (
              <div className="text-sm">
                {children}
              </div>
            )}

            {/* Actions */}
            {actions && (
              <div className="mt-3 flex gap-2">
                {actions}
              </div>
            )}
          </div>

          {/* Dismiss button */}
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Auto-dismiss progress bar */}
        {autoDismiss && (
          <motion.div
            className={`absolute bottom-0 left-0 h-1 ${config.iconColor.replace('text-', 'bg-')} rounded-b-xl`}
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: dismissAfter / 1000, ease: 'linear' }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * AlertTitle - Helper component for alert title
 */
export const AlertTitle = ({ children, className = '' }) => (
  <h3 className={`text-sm font-semibold mb-1 ${className}`}>
    {children}
  </h3>
);

/**
 * AlertDescription - Helper component for alert description
 */
export const AlertDescription = ({ children, className = '' }) => (
  <div className={`text-sm ${className}`}>
    {children}
  </div>
);

/**
 * AlertActions - Helper component for alert actions
 */
export const AlertActions = ({ children, className = '' }) => (
  <div className={`mt-3 flex gap-2 ${className}`}>
    {children}
  </div>
);

export default Alert;
