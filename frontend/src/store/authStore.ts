import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Usuario, LoginRequest } from '../types';
import { authApi } from '../api/auth.api';

interface AuthState {
  user: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tokenExpiresAt: number | null; // Timestamp de expiración
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  loadUserFromStorage: () => Promise<void>;
  checkTokenExpiry: () => boolean; // Verifica si el token expiró
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      tokenExpiresAt: null,

      checkTokenExpiry: () => {
        const { tokenExpiresAt } = get();
        if (!tokenExpiresAt) return true; // Token inválido si no hay fecha de expiración

        const now = Date.now();
        const isExpired = now >= tokenExpiresAt;

        if (isExpired) {
          // Token expirado, limpiar estado
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            tokenExpiresAt: null,
          });
        }

        return isExpired;
      },

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(credentials);

          // Calcular timestamp de expiración (24 horas desde ahora)
          const expiresAt = Date.now() + (24 * 60 * 60 * 1000);

          // ⚠️ IMPORTANTE: Guardar token en localStorage ANTES de obtener usuario
          // El interceptor de axios necesita el token en localStorage para la próxima request
          localStorage.setItem('token', response.token);

          // Obtener usuario completo
          const user = await authApi.getCurrentUser();

          set({
            user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            tokenExpiresAt: expiresAt,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Error al iniciar sesión';
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
          tokenExpiresAt: null,
        });
      },

      loadUserFromStorage: async () => {
        // ⚠️ IMPORTANTE: No cargar usuario en rutas públicas o POS standalone
        const currentPath = window.location.pathname;
        const isPOSRoute = currentPath.startsWith('/pos-terminal');
        const isPublicRoute = currentPath.startsWith('/login') || currentPath === '/';

        if (isPOSRoute || isPublicRoute) {
          set({ isAuthenticated: false, isLoading: false });
          return;
        }

        const { token, tokenExpiresAt, checkTokenExpiry } = get();

        // Verificar si el token expiró antes de hacer la llamada API
        if (checkTokenExpiry()) {
          set({ isAuthenticated: false, isLoading: false });
          return;
        }

        if (!token) {
          set({ isAuthenticated: false, isLoading: false });
          return;
        }

        set({ isLoading: true });
        try {
          // Intentar obtener el usuario actual para validar el token
          const user = await authApi.getCurrentUser();
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          // Si el error es 401 (no autorizado), el token es inválido
          if (error.response?.status === 401) {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              tokenExpiresAt: null,
            });
          } else {
            // Para otros errores (red, servidor caído, etc.),
            // mantener el token y reintentarla próxima vez
            set({
              isAuthenticated: token && tokenExpiresAt ? true : false,
              isLoading: false,
            });
          }
        }
      },
    }),
    {
      name: 'club-management-auth', // Nombre único para el almacenamiento
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Solo persistir estos campos
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        tokenExpiresAt: state.tokenExpiresAt,
      }),
    }
  )
);
