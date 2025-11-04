import { forwardRef } from 'react';
import { motion } from 'framer-motion';

/**
 * Textarea Component - Modern multiline text input
 *
 * Features:
 * - Label and helper text support
 * - Error state with message
 * - Different sizes
 * - Character count
 * - Auto-resize option
 */
const Textarea = forwardRef(({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  helperText,
  rows = 4,
  maxLength,
  showCharCount = false,
  size = 'md',
  fullWidth = false,
  disabled = false,
  required = false,
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'w-full rounded-xl border transition-all duration-200 focus:outline-none resize-y';

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

  const charCount = value?.length || 0;
  const isNearLimit = maxLength && charCount > maxLength * 0.9;

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {/* Label */}
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {showCharCount && maxLength && (
            <span
              className={`text-xs font-medium ${
                isNearLimit
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      )}

      {/* Textarea */}
      <motion.textarea
        ref={ref}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        whileFocus={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
        className={`
          ${baseClasses}
          ${sizeClasses[size]}
          ${stateClasses}
          ${disabledClasses}
        `}
        {...props}
      />

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

Textarea.displayName = 'Textarea';

export default Textarea;
