/**
 * Animations Library - Reusable Framer Motion animations
 *
 * This file contains pre-defined animation variants, transitions,
 * and utility functions for consistent animations across the app.
 */

// ========================================
// FADE ANIMATIONS
// ========================================

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const fadeInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const fadeInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

// ========================================
// SCALE ANIMATIONS
// ========================================

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

export const scaleOut = {
  initial: { opacity: 1, scale: 1 },
  animate: { opacity: 0, scale: 0.9 },
  exit: { opacity: 0, scale: 0.9 },
};

export const scaleInCenter = {
  initial: { opacity: 0, scale: 0 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0 },
};

// ========================================
// SLIDE ANIMATIONS
// ========================================

export const slideInLeft = {
  initial: { x: '-100%' },
  animate: { x: 0 },
  exit: { x: '-100%' },
};

export const slideInRight = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
};

export const slideInUp = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
};

export const slideInDown = {
  initial: { y: '-100%' },
  animate: { y: 0 },
  exit: { y: '-100%' },
};

// ========================================
// ROTATE ANIMATIONS
// ========================================

export const rotateIn = {
  initial: { opacity: 0, rotate: -10 },
  animate: { opacity: 1, rotate: 0 },
  exit: { opacity: 0, rotate: -10 },
};

export const flipIn = {
  initial: { opacity: 0, rotateY: -90 },
  animate: { opacity: 1, rotateY: 0 },
  exit: { opacity: 0, rotateY: -90 },
};

// ========================================
// STAGGER ANIMATIONS
// ========================================

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

// ========================================
// PAGE TRANSITIONS
// ========================================

export const pageTransition = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export const pageFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const pageSlideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

// ========================================
// SPECIAL EFFECTS
// ========================================

export const bounce = {
  initial: { scale: 0 },
  animate: { scale: 1 },
  transition: { type: 'spring', stiffness: 500, damping: 15 },
};

export const shake = {
  animate: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.5 },
  },
};

export const pulse = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const float = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ========================================
// TRANSITIONS
// ========================================

export const transitions = {
  default: { duration: 0.3, ease: 'easeInOut' },
  fast: { duration: 0.15, ease: 'easeOut' },
  slow: { duration: 0.5, ease: 'easeInOut' },
  spring: { type: 'spring', stiffness: 300, damping: 25 },
  bouncy: { type: 'spring', stiffness: 500, damping: 15 },
};

// ========================================
// HOVER ANIMATIONS
// ========================================

export const hoverScale = {
  scale: 1.05,
  transition: transitions.fast,
};

export const hoverLift = {
  y: -5,
  transition: transitions.fast,
};

export const hoverGlow = {
  boxShadow: '0 10px 30px rgba(168, 85, 247, 0.3)',
  transition: transitions.fast,
};

// ========================================
// TAP ANIMATIONS
// ========================================

export const tapScale = {
  scale: 0.95,
  transition: { duration: 0.1 },
};

export const tapShrink = {
  scale: 0.9,
  transition: { duration: 0.1 },
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Create stagger children animation
 * @param {number} staggerDelay - Delay between each child animation
 * @param {string} animationType - Type of animation (fadeInUp, scaleIn, etc)
 */
export const createStaggerAnimation = (staggerDelay = 0.1, animationType = 'fadeInUp') => {
  const animations = {
    fadeInUp,
    scaleIn,
    slideInLeft,
    slideInRight,
  };

  return {
    container: {
      initial: {},
      animate: {
        transition: {
          staggerChildren: staggerDelay,
        },
      },
    },
    item: animations[animationType] || fadeInUp,
  };
};

/**
 * Create custom transition
 * @param {number} duration - Animation duration in seconds
 * @param {string} ease - Easing function
 */
export const createTransition = (duration = 0.3, ease = 'easeInOut') => ({
  duration,
  ease,
});

/**
 * Combine multiple animations
 * @param  {...object} animations - Animation objects to combine
 */
export const combineAnimations = (...animations) => {
  return animations.reduce((combined, anim) => ({
    initial: { ...combined.initial, ...anim.initial },
    animate: { ...combined.animate, ...anim.animate },
    exit: { ...combined.exit, ...anim.exit },
  }), { initial: {}, animate: {}, exit: {} });
};

// ========================================
// LOADING ANIMATIONS
// ========================================

export const spinnerRotate = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

export const dotsBounce = (index) => ({
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      delay: index * 0.1,
    },
  },
});

export const pulseGrow = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [1, 0.7, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ========================================
// PRESET COMBINATIONS
// ========================================

export const presets = {
  // Modal animations
  modal: {
    ...scaleIn,
    transition: transitions.spring,
  },

  // Dropdown animations
  dropdown: {
    ...fadeInUp,
    transition: transitions.fast,
  },

  // Toast/Alert animations
  toast: {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 100 },
    transition: transitions.spring,
  },

  // Card hover effect
  cardHover: {
    hover: {
      y: -8,
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
      transition: transitions.fast,
    },
    tap: tapScale,
  },

  // Button animations
  button: {
    hover: hoverScale,
    tap: tapScale,
  },

  // List item
  listItem: {
    ...fadeInLeft,
    transition: transitions.default,
  },
};

export default {
  fadeIn,
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  scaleOut,
  slideInLeft,
  slideInRight,
  slideInUp,
  slideInDown,
  rotateIn,
  flipIn,
  staggerContainer,
  staggerItem,
  pageTransition,
  pageFade,
  pageSlideUp,
  bounce,
  shake,
  pulse,
  float,
  transitions,
  hoverScale,
  hoverLift,
  hoverGlow,
  tapScale,
  tapShrink,
  spinnerRotate,
  dotsBounce,
  pulseGrow,
  createStaggerAnimation,
  createTransition,
  combineAnimations,
  presets,
};
