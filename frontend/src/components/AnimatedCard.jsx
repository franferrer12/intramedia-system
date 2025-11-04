/**
 * Componente de Card con Animaciones Avanzadas
 * Usa Tailwind + CSS animations para efectos suaves
 */

const AnimatedCard = ({
  children,
  className = '',
  animation = 'fadeInUp', // fadeInUp, slideInLeft, scaleIn, bounce
  delay = 0,
  hover = true
}) => {
  const animations = {
    fadeInUp: 'animate-fadeInUp',
    slideInLeft: 'animate-slideInLeft',
    scaleIn: 'animate-scaleIn',
    bounce: 'animate-bounceIn'
  };

  const hoverClass = hover
    ? 'hover:scale-105 hover:shadow-xl hover:-translate-y-1'
    : '';

  return (
    <div
      className={`
        card
        ${animations[animation] || ''}
        ${hoverClass}
        transition-all duration-300 ease-out
        ${className}
      `}
      style={{
        animationDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  );
};

export default AnimatedCard;
