import { motion } from 'framer-motion';

/**
 * Fondo minimalista con gradientes sutiles
 * Enfoque: Menos es más
 */
const MinimalBackground = () => {
  return (
    <>
      {/* Fondo modo oscuro */}
      <div className="fixed inset-0 -z-10 overflow-hidden dark:block hidden bg-[#0a0a0a]">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #0f0f0f 0%, #0a0a0a 50%, #121212 100%)'
          }}
        />
      </div>

      {/* Fondo modo claro */}
      <div className="fixed inset-0 -z-10 overflow-hidden dark:hidden block bg-gray-50">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 50%, #f3f4f6 100%)'
          }}
        />
      </div>
    </>
  );
};

export default MinimalBackground;
