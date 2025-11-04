import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Store para gestionar el tema (claro/oscuro)
 */
const useThemeStore = create(
  persist(
    (set, get) => ({
      // Estado inicial: modo oscuro
      isDarkMode: true,

      // Toggle entre modo claro y oscuro
      toggleTheme: () => {
        const newMode = !get().isDarkMode;
        set({ isDarkMode: newMode });

        // Aplicar la clase al documento
        if (newMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      // Establecer modo específico
      setDarkMode: (isDark) => {
        set({ isDarkMode: isDark });
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      // Inicializar el tema
      initTheme: () => {
        const isDark = get().isDarkMode;
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    }),
    {
      name: 'intra-media-theme',
    }
  )
);

export default useThemeStore;
