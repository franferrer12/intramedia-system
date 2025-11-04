import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

/**
 * Select Component - Modern dropdown select
 *
 * Features:
 * - Label and helper text support
 * - Icon support
 * - Error state with message
 * - Different sizes
 * - Custom styling
 */
const Select = forwardRef(({
  label,
  value,
  onChange,
  onBlur,
  options = [],
  placeholder = 'Seleccionar...',
  error,
  helperText,
  icon: Icon,
  size = 'md',
  fullWidth = false,
  disabled = false,
  required = false,
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'w-full rounded-xl border transition-all duration-200 focus:outline-none appearance-none cursor-pointer';

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm pr-10',
    md: 'px-4 py-3 text-base pr-11',
    lg: 'px-5 py-4 text-lg pr-12',
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

  const paddingWithIcon = Icon ? 'pl-11' : '';

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Select Container */}
      <div className="relative">
        {/* Icon Left */}
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
            <Icon className={`${iconSizeClasses[size]} ${error ? 'text-red-500' : 'text-slate-400'}`} />
          </div>
        )}

        {/* Select */}
        <motion.select
          ref={ref}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
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
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </motion.select>

        {/* Chevron Icon */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <ChevronDown className={`${iconSizeClasses[size]} ${error ? 'text-red-500' : 'text-slate-400'}`} />
        </div>
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

Select.displayName = 'Select';

export default Select;
