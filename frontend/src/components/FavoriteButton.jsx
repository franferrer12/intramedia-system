import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

/**
 * Botón de favorito animado
 * Cambia de color y animación cuando se marca/desmarca
 */
const FavoriteButton = ({ isFavorite, onClick, size = 'md' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={(e) => {
        e.stopPropagation(); // Evitar propagación
        onClick();
      }}
      className={`p-2 rounded-lg transition-colors ${
        isFavorite
          ? 'bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
          : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
      }`}
    >
      <motion.div
        animate={{
          rotate: isFavorite ? [0, -10, 10, -10, 0] : 0,
          scale: isFavorite ? [1, 1.2, 1] : 1
        }}
        transition={{ duration: 0.5 }}
      >
        <Star
          className={`${sizes[size]} transition-colors ${
            isFavorite
              ? 'fill-yellow-500 text-yellow-500'
              : 'text-gray-400 dark:text-gray-500'
          }`}
        />
      </motion.div>
    </motion.button>
  );
};

export default FavoriteButton;
