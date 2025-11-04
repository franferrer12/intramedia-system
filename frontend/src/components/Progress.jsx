import { motion } from 'framer-motion';

/**
 * Progress Component - Modern progress indicators
 *
 * Features:
 * - Linear progress bar
 * - Circular progress
 * - Multiple variants (default, gradient, striped)
 * - Animated progress
 * - Label support
 * - Size variants
 */

const Progress = ({
  value = 0,
  max = 100,
  variant = 'default',
  size = 'md',
  showLabel = false,
  label,
  color = 'primary',
  striped = false,
  animated = true,
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const colorClasses = {
    primary: 'bg-primary-600 dark:bg-primary-500',
    secondary: 'bg-secondary-600 dark:bg-secondary-500',
    success: 'bg-green-600 dark:bg-green-500',
    warning: 'bg-amber-600 dark:bg-amber-500',
    danger: 'bg-red-600 dark:bg-red-500',
    info: 'bg-blue-600 dark:bg-blue-500',
  };

  const gradientClasses = {
    primary: 'bg-gradient-to-r from-primary-600 to-secondary-600',
    secondary: 'bg-gradient-to-r from-secondary-600 to-primary-600',
    success: 'bg-gradient-to-r from-green-600 to-emerald-600',
    warning: 'bg-gradient-to-r from-amber-600 to-orange-600',
    danger: 'bg-gradient-to-r from-red-600 to-rose-600',
    info: 'bg-gradient-to-r from-blue-600 to-cyan-600',
  };

  const barClasses = variant === 'gradient'
    ? gradientClasses[color]
    : colorClasses[color];

  return (
    <div className={`w-full ${className}`}>
      {/* Label */}
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {label || 'Progreso'}
          </span>
          {showLabel && (
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      {/* Progress bar container */}
      <div
        className={`
          relative w-full rounded-full overflow-hidden
          bg-slate-200 dark:bg-slate-700
          ${sizeClasses[size]}
        `}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        {/* Progress bar fill */}
        <motion.div
          className={`
            h-full rounded-full
            ${barClasses}
            ${striped ? 'bg-stripes' : ''}
          `}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={animated ? { duration: 0.5, ease: 'easeOut' } : { duration: 0 }}
        >
          {/* Striped animation */}
          {striped && animated && (
            <div className="absolute inset-0 bg-stripes-animated" />
          )}
        </motion.div>
      </div>
    </div>
  );
};

/**
 * CircularProgress - Circular progress indicator
 */
export const CircularProgress = ({
  value = 0,
  max = 100,
  size = 120,
  strokeWidth = 8,
  color = 'primary',
  showLabel = true,
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const colorClasses = {
    primary: 'stroke-primary-600 dark:stroke-primary-500',
    secondary: 'stroke-secondary-600 dark:stroke-secondary-500',
    success: 'stroke-green-600 dark:stroke-green-500',
    warning: 'stroke-amber-600 dark:stroke-amber-500',
    danger: 'stroke-red-600 dark:stroke-red-500',
    info: 'stroke-blue-600 dark:stroke-blue-500',
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="stroke-slate-200 dark:stroke-slate-700"
          fill="none"
        />

        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className={`${colorClasses[color]} fill-none`}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </svg>

      {/* Center label */}
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * ProgressSteps - Multi-step progress indicator
 */
export const ProgressSteps = ({
  steps = [],
  currentStep = 0,
  variant = 'default',
  className = '',
}) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <div key={index} className="flex-1 flex items-center">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: isCurrent ? 1.1 : 1 }}
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold text-sm
                    ${isCompleted
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : isCurrent
                      ? 'bg-white dark:bg-slate-800 border-primary-600 text-primary-600'
                      : 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-400'
                    }
                  `}
                >
                  {isCompleted ? '✓' : index + 1}
                </motion.div>

                {/* Step label */}
                {step.label && (
                  <span
                    className={`
                      mt-2 text-xs font-medium text-center
                      ${isCurrent
                        ? 'text-primary-600 dark:text-primary-400'
                        : isCompleted
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'text-slate-400 dark:text-slate-500'
                      }
                    `}
                  >
                    {step.label}
                  </span>
                )}
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 bg-slate-200 dark:bg-slate-700">
                  <motion.div
                    className="h-full bg-primary-600"
                    initial={{ width: 0 }}
                    animate={{ width: isCompleted ? '100%' : '0%' }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Progress;
