import { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Tabs Component - Modern tab navigation
 *
 * Features:
 * - Multiple variants (line, pills, boxed)
 * - Animated indicator
 * - Icon support
 * - Badge/count support
 * - Disabled tabs
 * - Responsive design
 */

const Tabs = ({
  tabs = [],
  defaultTab = 0,
  onChange,
  variant = 'line',
  size = 'md',
  fullWidth = false,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabClick = (index, tab) => {
    if (tab.disabled) return;
    setActiveTab(index);
    onChange?.(index, tab);
  };

  const sizeClasses = {
    sm: 'text-sm px-3 py-2',
    md: 'text-base px-4 py-2.5',
    lg: 'text-lg px-5 py-3',
  };

  const variantStyles = {
    line: {
      container: 'border-b border-slate-200 dark:border-slate-700',
      tab: 'relative border-b-2 border-transparent',
      activeTab: 'text-primary-600 dark:text-primary-400 border-primary-600 dark:border-primary-400',
      inactiveTab: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
    },
    pills: {
      container: 'bg-slate-100 dark:bg-slate-800 rounded-xl p-1',
      tab: 'relative rounded-lg',
      activeTab: 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm',
      inactiveTab: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
    },
    boxed: {
      container: 'border-b border-slate-200 dark:border-slate-700',
      tab: 'relative rounded-t-lg border-x border-t border-transparent',
      activeTab: 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 border-slate-200 dark:border-slate-700 border-b-white dark:border-b-slate-800',
      inactiveTab: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={className}>
      {/* Tab List */}
      <div className={`flex ${fullWidth ? 'w-full' : ''} ${styles.container}`}>
        {tabs.map((tab, index) => {
          const isActive = activeTab === index;
          const Icon = tab.icon;

          return (
            <button
              key={index}
              onClick={() => handleTabClick(index, tab)}
              disabled={tab.disabled}
              className={`
                ${sizeClasses[size]}
                ${styles.tab}
                ${isActive ? styles.activeTab : styles.inactiveTab}
                ${fullWidth ? 'flex-1' : ''}
                ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                font-medium transition-all duration-200
                flex items-center justify-center gap-2
              `}
            >
              {/* Icon */}
              {Icon && <Icon className="w-5 h-5" />}

              {/* Label */}
              <span>{tab.label}</span>

              {/* Badge/Count */}
              {tab.badge && (
                <span className={`
                  inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full
                  ${isActive
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }
                `}>
                  {tab.badge}
                </span>
              )}

              {/* Active Indicator for pills variant */}
              {variant === 'pills' && isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg -z-10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * TabPanel - Container for tab content
 */
export const TabPanel = ({ children, active, className = '' }) => {
  if (!active) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * TabPanels - Container for multiple TabPanel components
 */
export const TabPanels = ({ children, activeTab, className = '' }) => {
  return (
    <div className={`mt-4 ${className}`}>
      {Array.isArray(children)
        ? children.map((child, index) =>
            child && child.type === TabPanel
              ? { ...child, props: { ...child.props, active: activeTab === index } }
              : child
          )
        : children}
    </div>
  );
};

export default Tabs;
