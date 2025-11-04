import { useState, useEffect } from 'react';

/**
 * Hook personalizado para gestionar favoritos
 * Guarda favoritos en localStorage por tipo (djs, clientes, eventos)
 */
export const useFavorites = (type) => {
  const STORAGE_KEY = `intra-media-favorites-${type}`;

  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // Guardar en localStorage cuando cambian los favoritos
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites, STORAGE_KEY]);

  // Agregar a favoritos
  const addFavorite = (itemId) => {
    setFavorites(prev => {
      if (!prev.includes(itemId)) {
        return [...prev, itemId];
      }
      return prev;
    });
  };

  // Remover de favoritos
  const removeFavorite = (itemId) => {
    setFavorites(prev => prev.filter(id => id !== itemId));
  };

  // Toggle favorito
  const toggleFavorite = (itemId) => {
    if (favorites.includes(itemId)) {
      removeFavorite(itemId);
    } else {
      addFavorite(itemId);
    }
  };

  // Verificar si es favorito
  const isFavorite = (itemId) => {
    return favorites.includes(itemId);
  };

  // Obtener todos los favoritos
  const getFavorites = () => {
    return favorites;
  };

  // Limpiar todos los favoritos
  const clearFavorites = () => {
    setFavorites([]);
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    getFavorites,
    clearFavorites
  };
};

export default useFavorites;
