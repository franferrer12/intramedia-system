import { useState, useCallback } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

/**
 * Hook para manejar múltiples estados de carga
 * Permite tener diferentes estados de carga para diferentes operaciones
 */
export const useLoading = (initialState: LoadingState = {}) => {
  const [loadingStates, setLoadingStates] = useState<LoadingState>(initialState);

  /**
   * Establece el estado de carga para una operación específica
   */
  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setLoadingStates((prev) => ({
      ...prev,
      [key]: isLoading,
    }));
  }, []);

  /**
   * Verifica si una operación específica está cargando
   */
  const isLoading = useCallback((key: string): boolean => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  /**
   * Verifica si alguna operación está cargando
   */
  const isAnyLoading = useCallback((): boolean => {
    return Object.values(loadingStates).some((loading) => loading);
  }, [loadingStates]);

  /**
   * Ejecuta una función asíncrona con manejo automático del estado de carga
   */
  const withLoading = useCallback(
    async <T,>(key: string, fn: () => Promise<T>): Promise<T> => {
      setLoading(key, true);
      try {
        return await fn();
      } finally {
        setLoading(key, false);
      }
    },
    [setLoading]
  );

  /**
   * Resetea todos los estados de carga
   */
  const resetLoading = useCallback(() => {
    setLoadingStates({});
  }, []);

  return {
    loadingStates,
    setLoading,
    isLoading,
    isAnyLoading,
    withLoading,
    resetLoading,
  };
};

/**
 * Hook simple para un único estado de carga
 */
export const useSimpleLoading = (initialValue: boolean = false) => {
  const [isLoading, setIsLoading] = useState(initialValue);

  /**
   * Ejecuta una función asíncrona con manejo automático del estado de carga
   */
  const withLoading = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      setIsLoading(true);
      try {
        return await fn();
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isLoading,
    setIsLoading,
    withLoading,
  };
};
