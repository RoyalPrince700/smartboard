import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthSession, AuthUser } from '../types/auth';
import { fetchCurrentUser, signInWithGoogle } from '../services/api/authApi';
import { setAuthToken } from '../services/api/axiosClient';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

function applySession(session: AuthSession | null) {
  if (session) {
    setAuthToken(session.token);
  } else {
    setAuthToken(null);
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      loading: false,
      initialized: false,
      error: null,

      initialize: async () => {
        const { token } = get();
        if (token) {
          setAuthToken(token);
        }

        if (!token) {
          set({ initialized: true });
          return;
        }

        set({ loading: true, error: null });
        try {
          const user = await fetchCurrentUser();
          set({ user, loading: false, initialized: true, error: null });
        } catch {
          setAuthToken(null);
          set({
            token: null,
            user: null,
            loading: false,
            initialized: true,
            error: null,
          });
        }
      },

      loginWithGoogle: async (credential: string) => {
        set({ loading: true, error: null });
        try {
          const session = await signInWithGoogle(credential);
          applySession(session);
          set({
            token: session.token,
            user: session.user,
            loading: false,
            error: null,
          });
        } catch (err) {
          set({
            loading: false,
            error: err instanceof Error ? err.message : 'Google sign-in failed',
          });
          throw err;
        }
      },

      logout: () => {
        applySession(null);
        set({ token: null, user: null, error: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'smart-board-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          setAuthToken(state.token);
        }
      },
    }
  )
);
