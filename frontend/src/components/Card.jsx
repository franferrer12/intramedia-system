import { motion } from 'framer-motion';

/**
 * Card Component - Modern glass-morphism card
 *
 * Variants:
 * - default: Standard card
 * - gradient: Card with subtle gradient
 * - elevated: Card with more shadow
 * - outlined: Card with border emphasis
 */
const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  className = '',
  ...props
}) => {
  const baseClasses = 'bg-white dark:bg-slate-800 rounded-2xl transition-all duration-200';

  const variantClasses = {
    default: 'border border-slate-200 dark:border-slate-700 shadow-sm',
    gradient: 'bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 shadow-soft',
    elevated: 'border border-slate-200 dark:border-slate-700 shadow-md',
    outlined: 'border-2 border-primary-200 dark:border-primary-800 shadow-sm',
    glass: 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 shadow-soft',
  };

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  const hoverClasses = hover ? 'hover:shadow-lg hover:-translate-y-1 hover:border-primary-300 dark:hover:border-primary-700' : '';

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClasses} ${className}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={combinedClasses}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * CardHeader - Header section for cards
 */
export const CardHeader = ({ children, icon: Icon, action, className = '' }) => {
  return (
    <div className={`flex items-center justify-between mb-6 ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-md">
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          {children}
        </h3>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

/**
 * CardTitle - Simple title for cards
 */
export const CardTitle = ({ children, className = '' }) => {
  return (
    <h3 className={`text-lg font-semibold text-slate-900 dark:text-white mb-2 ${className}`}>
      {children}
    </h3>
  );
};

/**
 * CardDescription - Description text for cards
 */
export const CardDescription = ({ children, className = '' }) => {
  return (
    <p className={`text-sm text-slate-600 dark:text-slate-400 ${className}`}>
      {children}
    </p>
  );
};

/**
 * CardContent - Content section for cards
 */
export const CardContent = ({ children, className = '' }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

/**
 * CardFooter - Footer section for cards
 */
export const CardFooter = ({ children, className = '' }) => {
  return (
    <div className={`mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
