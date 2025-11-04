// Intra Media - Paleta de Colores y Tema 3D
// Extraído del branding oficial

export const intraMediaColors = {
  // Colores principales del branding
  primary: {
    black: '#1a1a1a',      // Negro principal del logo
    orange: '#FF5722',     // Naranja del vinilo
    red: '#FF0000',        // Rojo vibrante (acento)
    white: '#FFFFFF',      // Blanco
  },

  // Gradientes para efectos 3D
  gradients: {
    vinyl: 'linear-gradient(135deg, #FF5722 0%, #FF0000 100%)',
    dark: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
    glow: 'linear-gradient(135deg, rgba(255,87,34,0.2) 0%, rgba(255,0,0,0.2) 100%)',
    aurora: 'linear-gradient(120deg, #FF5722 0%, #FF0000 50%, #FF5722 100%)',
  },

  // Sombras 3D
  shadows: {
    card: '0 10px 30px rgba(0, 0, 0, 0.3), 0 1px 8px rgba(0, 0, 0, 0.2)',
    cardHover: '0 20px 60px rgba(255, 87, 34, 0.4), 0 8px 16px rgba(0, 0, 0, 0.3)',
    glow: '0 0 20px rgba(255, 87, 34, 0.5), 0 0 40px rgba(255, 0, 0, 0.3)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
    depth: '0 15px 35px rgba(0, 0, 0, 0.2), 0 5px 15px rgba(0, 0, 0, 0.1)',
  },

  // Glassmorphism
  glass: {
    background: 'rgba(26, 26, 26, 0.7)',
    border: 'rgba(255, 255, 255, 0.1)',
    blur: '10px',
  },

  // Estados y variaciones
  states: {
    hover: '#FF6E40',
    active: '#E64A19',
    disabled: '#9E9E9E',
  },
};

// Configuración de animaciones
export const animations = {
  tilt: {
    max: 15,           // Grados máximos de inclinación
    perspective: 1000, // Perspectiva 3D
    scale: 1.05,       // Escala en hover
    speed: 400,        // Velocidad de transición (ms)
    easing: 'cubic-bezier(0.03, 0.98, 0.52, 0.99)',
    glare: true,       // Efecto de brillo
    maxGlare: 0.3,     // Intensidad del brillo
  },

  spring: {
    type: 'spring',
    stiffness: 300,
    damping: 20,
  },

  fade: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
};

// Configuración de carrusel 3D
export const carousel3D = {
  effect: 'coverflow',
  grabCursor: true,
  centeredSlides: true,
  slidesPerView: 'auto',
  coverflowEffect: {
    rotate: 50,
    stretch: 0,
    depth: 100,
    modifier: 1,
    slideShadows: true,
  },
  pagination: {
    clickable: true,
    dynamicBullets: true,
  },
};

// Tailwind CSS custom classes
export const customClasses = {
  card3D: 'bg-gradient-to-br from-gray-900 to-gray-800 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl transition-all duration-300 hover:shadow-orange-500/20',
  glassCard: 'bg-black/70 backdrop-blur-md rounded-2xl border border-white/10',
  glowButton: 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-orange-500/50 transition-all duration-300',
  textGlow: 'text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500',
};

export default {
  colors: intraMediaColors,
  animations,
  carousel3D,
  customClasses,
};
