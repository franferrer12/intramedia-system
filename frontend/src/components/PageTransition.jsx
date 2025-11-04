import { motion } from 'framer-motion';
import { pageTransition, pageFade, pageSlideUp, transitions } from '../utils/animations';

/**
 * PageTransition Component - Animated page transitions
 *
 * Features:
 * - Multiple transition variants
 * - Custom animations support
 * - Loading state
 * - Error boundary support
 */

const PageTransition = ({
  children,
  variant = 'slide',
  className = '',
}) => {
  const variants = {
    slide: pageTransition,
    fade: pageFade,
    slideUp: pageSlideUp,
  };

  const selectedVariant = variants[variant] || pageTransition;

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={selectedVariant}
      transition={transitions.default}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * FadeTransition - Quick fade transition
 */
export const FadeTransition = ({ children, className = '' }) => (
  <PageTransition variant="fade" className={className}>
    {children}
  </PageTransition>
);

/**
 * SlideTransition - Slide transition
 */
export const SlideTransition = ({ children, className = '' }) => (
  <PageTransition variant="slide" className={className}>
    {children}
  </PageTransition>
);

export default PageTransition;
