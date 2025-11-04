import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

/**
 * Accordion Component - Collapsible content panels
 *
 * Features:
 * - Single or multiple panels open
 * - Smooth animations
 * - Icon support
 * - Custom styling
 * - Keyboard accessible
 */

const Accordion = ({
  items = [],
  allowMultiple = false,
  defaultOpenItems = [],
  variant = 'default',
  className = '',
}) => {
  const [openItems, setOpenItems] = useState(defaultOpenItems);

  const toggleItem = (index) => {
    if (allowMultiple) {
      setOpenItems((current) =>
        current.includes(index)
          ? current.filter((i) => i !== index)
          : [...current, index]
      );
    } else {
      setOpenItems((current) =>
        current.includes(index) ? [] : [index]
      );
    }
  };

  const isOpen = (index) => openItems.includes(index);

  const variantClasses = {
    default: {
      container: 'border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden',
      item: 'border-b border-slate-200 dark:border-slate-700 last:border-b-0',
      header: 'px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50',
      content: 'px-6 py-4 bg-slate-50 dark:bg-slate-800/50',
    },
    bordered: {
      container: 'space-y-3',
      item: 'border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden',
      header: 'px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50',
      content: 'px-6 py-4 border-t border-slate-200 dark:border-slate-700',
    },
    separated: {
      container: 'space-y-3',
      item: 'bg-white dark:bg-slate-800 rounded-xl shadow-sm',
      header: 'px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50',
      content: 'px-6 py-4 border-t border-slate-200 dark:border-slate-700',
    },
  };

  const classes = variantClasses[variant];

  return (
    <div className={`${classes.container} ${className}`}>
      {items.map((item, index) => {
        const open = isOpen(index);
        const Icon = item.icon;

        return (
          <div key={index} className={classes.item}>
            {/* Header */}
            <button
              onClick={() => toggleItem(index)}
              className={`
                w-full flex items-center justify-between gap-4
                ${classes.header}
                transition-colors cursor-pointer
              `}
              aria-expanded={open}
            >
              <div className="flex items-center gap-3 flex-1 text-left">
                {Icon && (
                  <div className="flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                )}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {item.title}
                </span>
              </div>

              <motion.div
                animate={{ rotate: open ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0"
              >
                <ChevronDown className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </motion.div>
            </button>

            {/* Content */}
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className={classes.content}>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {item.content}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

/**
 * AccordionItem - Individual accordion item for manual construction
 */
export const AccordionItem = ({
  title,
  children,
  icon: Icon,
  defaultOpen = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3 flex-1 text-left">
          {Icon && (
            <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
          )}
          <span className="font-semibold text-slate-900 dark:text-white">
            {title}
          </span>
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {children}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Accordion;
