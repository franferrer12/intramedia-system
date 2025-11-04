import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Tooltip Component - Modern tooltip with animations
 *
 * Features:
 * - Multiple positions (top, bottom, left, right)
 * - Animated appearance
 * - Dark/light variants
 * - Arrow indicator
 * - Delay support
 * - Keyboard accessible
 */

const Tooltip = ({
  children,
  content,
  position = 'top',
  variant = 'dark',
  delay = 200,
  disabled = false,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

  const handleMouseEnter = () => {
    if (disabled) return;

    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent',
  };

  const variantClasses = {
    dark: 'bg-slate-900 dark:bg-slate-950 text-white border-slate-900 dark:border-slate-950',
    light: 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 shadow-lg',
    primary: 'bg-primary-600 text-white border-primary-600',
  };

  const animations = {
    top: { initial: { opacity: 0, y: 5 }, animate: { opacity: 1, y: 0 } },
    bottom: { initial: { opacity: 0, y: -5 }, animate: { opacity: 1, y: 0 } },
    left: { initial: { opacity: 0, x: 5 }, animate: { opacity: 1, x: 0 } },
    right: { initial: { opacity: 0, x: -5 }, animate: { opacity: 1, x: 0 } },
  };

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {/* Trigger element */}
      {children}

      {/* Tooltip */}
      <AnimatePresence>
        {isVisible && content && (
          <motion.div
            initial={animations[position].initial}
            animate={animations[position].animate}
            exit={animations[position].initial}
            transition={{ duration: 0.15 }}
            className={`
              absolute z-50 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap pointer-events-none
              ${positionClasses[position]}
              ${variantClasses[variant]}
            `}
          >
            {content}

            {/* Arrow */}
            <div
              className={`
                absolute w-0 h-0 border-4
                ${arrowClasses[position]}
                ${variantClasses[variant].split(' ')[0]}
              `}
              style={{
                borderColor: variant === 'dark'
                  ? 'rgb(15 23 42) transparent transparent transparent'
                  : variant === 'light'
                  ? 'rgb(241 245 249) transparent transparent transparent'
                  : 'rgb(168 85 247) transparent transparent transparent'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * TooltipButton - Helper component combining button with tooltip
 */
export const TooltipButton = ({
  children,
  tooltip,
  position = 'top',
  variant = 'dark',
  onClick,
  className = '',
  ...props
}) => (
  <Tooltip content={tooltip} position={position} variant={variant}>
    <button
      onClick={onClick}
      className={`p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  </Tooltip>
);

/**
 * TooltipIcon - Helper component for icon with tooltip
 */
export const TooltipIcon = ({
  icon: Icon,
  tooltip,
  position = 'top',
  variant = 'dark',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <Tooltip content={tooltip} position={position} variant={variant}>
      <div className={`inline-flex ${className}`}>
        <Icon className={sizeClasses[size]} />
      </div>
    </Tooltip>
  );
};

export default Tooltip;
