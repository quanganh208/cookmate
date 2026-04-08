import { create } from 'zustand';
import type { Session } from './types';

export type AuthStatus = 'bootstrapping' | 'authenticated' | 'anonymous';

interface AuthState {
  session: Session | null;
  status: AuthStatus;
  /** Imperative setter used by bootstrap + mutations. */
  setSession: (session: Session | null) => void;
  setStatus: (status: AuthStatus) => void;
  /** Clears local auth state. Callers are responsible for calling the API logout + clearing
   *  the query cache BEFORE invoking this — see `hooks/use-logout` for the full side-effect
   *  bundle that orchestrates the correct order. */
  clearSession: () => void;
}

/**
 * Auth state store. Intentionally tiny — no persistence plugin: tokens live in SecureStore,
 * session user is rehydrated from `/auth/me` on cold start.
 */
export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  status: 'bootstrapping',
  setSession: (session) => set({ session, status: session ? 'authenticated' : 'anonymous' }),
  setStatus: (status) => set({ status }),
  clearSession: () => set({ session: null, status: 'anonymous' }),
}));
