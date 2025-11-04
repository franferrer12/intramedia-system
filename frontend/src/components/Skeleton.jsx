import { motion } from 'framer-motion';

/**
 * Skeleton Component - Loading placeholders
 *
 * Features:
 * - Multiple variants (text, circle, rectangle, card)
 * - Animated shimmer effect
 * - Different sizes
 * - Custom dimensions
 * - Repeatable patterns
 */

const Skeleton = ({
  variant = 'text',
  width,
  height,
  count = 1,
  circle = false,
  className = '',
  animate = true,
}) => {
  const baseClasses = 'bg-slate-200 dark:bg-slate-700';

  const variantClasses = {
    text: 'h-4 rounded',
    heading: 'h-8 rounded',
    button: 'h-10 rounded-xl',
    card: 'h-48 rounded-2xl',
    avatar: 'h-12 w-12 rounded-full',
  };

  const getClasses = () => {
    if (circle) return `${baseClasses} rounded-full`;
    return `${baseClasses} ${variantClasses[variant] || variantClasses.text}`;
  };

  const style = {
    width: width || (variant === 'avatar' ? undefined : '100%'),
    height: height || undefined,
  };

  const skeletonElement = (
    <div
      className={`${getClasses()} ${className}`}
      style={style}
    >
      {animate && (
        <motion.div
          className="h-full w-full bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: 'linear',
          }}
        />
      )}
    </div>
  );

  if (count === 1) return skeletonElement;

  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div key={i}>{skeletonElement}</div>
      ))}
    </div>
  );
};

/**
 * SkeletonCard - Pre-built card skeleton
 */
export const SkeletonCard = ({ showImage = true, lines = 3 }) => (
  <div className="p-6 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-4">
    {showImage && <Skeleton variant="card" height="200px" />}
    <Skeleton variant="heading" width="70%" />
    <Skeleton variant="text" count={lines} />
    <div className="flex gap-2">
      <Skeleton variant="button" width="100px" />
      <Skeleton variant="button" width="100px" />
    </div>
  </div>
);

/**
 * SkeletonTable - Pre-built table skeleton
 */
export const SkeletonTable = ({ rows = 5, columns = 4 }) => (
  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
    {/* Header */}
    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-200 dark:border-slate-700">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {[...Array(columns)].map((_, i) => (
          <Skeleton key={i} variant="text" width="80%" />
        ))}
      </div>
    </div>

    {/* Rows */}
    {[...Array(rows)].map((_, rowIndex) => (
      <div
        key={rowIndex}
        className="p-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0"
      >
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {[...Array(columns)].map((_, colIndex) => (
            <Skeleton key={colIndex} variant="text" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

/**
 * SkeletonList - Pre-built list skeleton
 */
export const SkeletonList = ({ items = 5, showAvatar = true }) => (
  <div className="space-y-4">
    {[...Array(items)].map((_, i) => (
      <div key={i} className="flex items-center gap-4">
        {showAvatar && <Skeleton variant="avatar" />}
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * SkeletonForm - Pre-built form skeleton
 */
export const SkeletonForm = ({ fields = 4 }) => (
  <div className="space-y-6">
    {[...Array(fields)].map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton variant="text" width="120px" height="16px" />
        <Skeleton variant="button" height="44px" />
      </div>
    ))}
    <div className="flex gap-3 pt-4">
      <Skeleton variant="button" width="120px" />
      <Skeleton variant="button" width="120px" />
    </div>
  </div>
);

/**
 * SkeletonGrid - Pre-built grid skeleton
 */
export const SkeletonGrid = ({ items = 6, columns = 3 }) => (
  <div
    className="grid gap-6"
    style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
  >
    {[...Array(items)].map((_, i) => (
      <SkeletonCard key={i} lines={2} />
    ))}
  </div>
);

export default Skeleton;
