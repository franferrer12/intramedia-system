import { motion } from 'framer-motion';

/**
 * Logo animado de Intra Media con efectos 3D
 */
const AnimatedLogo = ({
  variant = 'full',
  size = 'md',
  animated = true,
  className = ''
}) => {
  const sizes = {
    xs: { width: 80, height: 32 },
    sm: { width: 120, height: 48 },
    md: { width: 160, height: 64 },
    lg: { width: 200, height: 80 },
    xl: { width: 280, height: 112 },
  };

  const logoVariants = {
    hidden: { opacity: 0, scale: 0.8, rotate: -10 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.8,
        ease: [0.43, 0.13, 0.23, 0.96],
      },
    },
    hover: {
      scale: 1.05,
      rotate: 5,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  };

  const glowVariants = {
    initial: { opacity: 0.5 },
    animate: {
      opacity: [0.5, 1, 0.5],
      scale: [1, 1.1, 1],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const vinylVariants = {
    initial: { rotate: 0 },
    animate: {
      rotate: 360,
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  };

  // Logo completo
  if (variant === 'full') {
    return (
      <motion.div
        className={`relative ${className}`}
        variants={animated ? logoVariants : {}}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        style={{
          width: sizes[size].width,
          height: sizes[size].height,
        }}
      >
        {/* Glow effect */}
        {animated && (
          <motion.div
            className="absolute inset-0 blur-xl opacity-50"
            variants={glowVariants}
            initial="initial"
            animate="animate"
          >
            <img
              src="/branding/logos/logo-white-no-bg.png"
              alt="Intra Media Glow"
              className="w-full h-full object-contain"
            />
          </motion.div>
        )}

        {/* Logo principal PNG sin fondo */}
        <img
          src="/branding/logos/logo-white-no-bg.png"
          alt="Intra Media"
          className="relative w-full h-full object-contain drop-shadow-2xl"
        />
      </motion.div>
    );
  }

  // Solo isotipo (vinilo)
  if (variant === 'isotipo') {
    return (
      <motion.div
        className={`relative ${className}`}
        variants={animated ? logoVariants : {}}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        style={{
          width: sizes[size].width,
          height: sizes[size].width, // Cuadrado
        }}
      >
        {/* Glow rotatorio */}
        {animated && (
          <motion.div
            className="absolute inset-0"
            variants={glowVariants}
            initial="initial"
            animate="animate"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/30 to-red-500/30 rounded-full blur-2xl" />
          </motion.div>
        )}

        {/* Isotipo con rotación */}
        <motion.img
          src="/branding/logos/isotipo.png"
          alt="Intra Media Isotipo"
          className="relative w-full h-full object-contain drop-shadow-2xl"
          variants={animated ? vinylVariants : {}}
          initial="initial"
          animate="animate"
        />
      </motion.div>
    );
  }

  // Logo con marca de agua
  if (variant === 'watermark') {
    return (
      <motion.div
        className={`relative opacity-10 ${className}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        style={{
          width: sizes[size].width,
          height: sizes[size].height,
        }}
      >
        <img
          src="/branding/logos/logo-white-no-bg.png"
          alt="Intra Media"
          className="w-full h-full object-contain"
        />
      </motion.div>
    );
  }

  return null;
};

/**
 * Header con logo animado
 */
export const LogoHeader = ({ showTagline = true }) => {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <AnimatedLogo variant="full" size="xl" animated />

      {showTagline && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <p className="text-lg font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            CONNECTING DJs WITH PEOPLE
          </p>
        </motion.div>
      )}
    </div>
  );
};

/**
 * Logo para Sidebar
 */
export const SidebarLogo = ({ collapsed = false }) => {
  return (
    <motion.div
      className="p-4"
      initial={false}
      animate={{ padding: collapsed ? '1rem' : '1.5rem' }}
    >
      {collapsed ? (
        <AnimatedLogo variant="isotipo" size="sm" animated={false} />
      ) : (
        <AnimatedLogo variant="full" size="md" animated={false} />
      )}
    </motion.div>
  );
};

/**
 * Logo animado para Loading
 */
export const LoadingLogo = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <AnimatedLogo variant="isotipo" size="lg" animated={false} />
      </motion.div>

      <motion.div
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="flex gap-2"
      >
        <span className="w-2 h-2 bg-orange-500 rounded-full" />
        <span className="w-2 h-2 bg-red-500 rounded-full" />
        <span className="w-2 h-2 bg-orange-500 rounded-full" />
      </motion.div>
    </div>
  );
};

export default AnimatedLogo;
