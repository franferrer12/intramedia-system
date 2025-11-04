import { motion } from 'framer-motion';

/**
 * Badge Component - Status and category indicators
 *
 * Variants:
 * - primary: Purple/violet theme
 * - secondary: Magenta/pink theme
 * - accent: Cyan theme
 * - success: Green
 * - warning: Yellow/amber
 * - danger: Red
 * - info: Blue
 * - neutral: Gray
 */
const Badge = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  pulse = false,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center gap-1.5 font-semibold rounded-full transition-all duration-200';

  const variantClasses = {
    primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800',
    secondary: 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-300 border border-secondary-200 dark:border-secondary-800',
    accent: 'bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 border border-accent-200 dark:border-accent-800',
    success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    danger: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
    neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const pulseAnimation = pulse ? 'animate-pulse-slow' : '';

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${pulseAnimation} ${className}`;

  return (
    <motion.span
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={combinedClasses}
      {...props}
    >
      {Icon && <Icon className={iconSizeClasses[size]} />}
      {children}
    </motion.span>
  );
};

/**
 * StatusBadge - Specialized badge for status indicators with dot
 */
export const StatusBadge = ({
  children,
  variant = 'primary',
  size = 'md',
  animated = false,
  className = '',
}) => {
  const dotSizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  const dotColorClasses = {
    primary: 'bg-primary-600 dark:bg-primary-400',
    secondary: 'bg-secondary-600 dark:bg-secondary-400',
    accent: 'bg-accent-600 dark:bg-accent-400',
    success: 'bg-green-600 dark:bg-green-400',
    warning: 'bg-amber-600 dark:bg-amber-400',
    danger: 'bg-red-600 dark:bg-red-400',
    info: 'bg-blue-600 dark:bg-blue-400',
    neutral: 'bg-slate-600 dark:bg-slate-400',
  };

  return (
    <Badge variant={variant} size={size} className={className}>
      <span className="relative flex">
        <span className={`${dotSizeClasses[size]} ${dotColorClasses[variant]} rounded-full`} />
        {animated && (
          <span className={`absolute inline-flex h-full w-full rounded-full ${dotColorClasses[variant]} opacity-75 animate-ping`} />
        )}
      </span>
      {children}
    </Badge>
  );
};

/**
 * CountBadge - Badge for displaying counts/numbers
 */
export const CountBadge = ({
  count,
  variant = 'primary',
  max = 99,
  showZero = false,
  className = '',
}) => {
  if (!showZero && count === 0) return null;

  const displayCount = count > max ? `${max}+` : count;

  return (
    <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full ${
      variant === 'primary' ? 'bg-primary-500 text-white' :
      variant === 'secondary' ? 'bg-secondary-500 text-white' :
      variant === 'accent' ? 'bg-accent-500 text-white' :
      variant === 'danger' ? 'bg-red-500 text-white' :
      'bg-slate-500 text-white'
    } ${className}`}>
      {displayCount}
    </span>
  );
};

export default Badge;
