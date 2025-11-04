import { forwardRef } from 'react';
import { motion } from 'framer-motion';

/**
 * Input Component - Modern text input with variants
 *
 * Features:
 * - Label and helper text support
 * - Icon support (left/right)
 * - Error state with message
 * - Different sizes
 * - Focus ring with animation
 */
const Input = forwardRef(({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  helperText,
  icon: Icon,
  iconPosition = 'left',
  size = 'md',
  fullWidth = false,
  disabled = false,
  required = false,
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'w-full rounded-xl border transition-all duration-200 focus:outline-none';

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg',
  };

  const stateClasses = error
    ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10 text-red-900 dark:text-red-100 focus:border-red-500 focus:ring-4 focus:ring-red-500/20'
    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20';

  const disabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900'
    : '';

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const paddingWithIcon = Icon ? (iconPosition === 'left' ? 'pl-11' : 'pr-11') : '';

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Icon Left */}
        {Icon && iconPosition === 'left' && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon className={`${iconSizeClasses[size]} ${error ? 'text-red-500' : 'text-slate-400'}`} />
          </div>
        )}

        {/* Input */}
        <motion.input
          ref={ref}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          disabled={disabled}
          whileFocus={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className={`
            ${baseClasses}
            ${sizeClasses[size]}
            ${stateClasses}
            ${disabledClasses}
            ${paddingWithIcon}
          `}
          {...props}
        />

        {/* Icon Right */}
        {Icon && iconPosition === 'right' && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon className={`${iconSizeClasses[size]} ${error ? 'text-red-500' : 'text-slate-400'}`} />
          </div>
        )}
      </div>

      {/* Helper Text or Error Message */}
      {(helperText || error) && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-2 text-sm ${
            error
              ? 'text-red-600 dark:text-red-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {error || helperText}
        </motion.p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
