import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

let inactivityTimer = null;

const resetInactivityTimer = (logout) => {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    logout();
  }, SESSION_TIMEOUT_MS);
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: (user, accessToken, refreshToken) => {
        set({ user, accessToken, isAuthenticated: true, isLoading: false });
        // Store refresh token in sessionStorage
        sessionStorage.setItem('evm_refresh_token', refreshToken);
        resetInactivityTimer(get().logout);
        // Bind activity listeners
        ['mousedown', 'keydown', 'touchstart', 'scroll'].forEach((evt) => {
          window.addEventListener(evt, () => resetInactivityTimer(get().logout), { passive: true });
        });
      },

      logout: () => {
        clearTimeout(inactivityTimer);
        sessionStorage.removeItem('evm_refresh_token');
        set({ user: null, accessToken: null, isAuthenticated: false });
        window.location.href = '/login';
      },

      setAccessToken: (token) => set({ accessToken: token }),

      setLoading: (isLoading) => set({ isLoading }),

      getRefreshToken: () => sessionStorage.getItem('evm_refresh_token'),
    }),
    {
      name: 'evm-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
