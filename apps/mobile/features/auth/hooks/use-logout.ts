import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authRepository } from '../api/auth-repository';
import { secureTokenStorage } from '@/shared/api/secure-token-storage';
import { useAuthStore } from '../store';

/**
 * Logout side-effect bundle. Order matters:
 *   1. Call the backend to revoke the refresh token (best-effort — ignore network errors).
 *   2. Clear SecureStore.
 *   3. Clear the Zustand store so UI flips back to guest immediately.
 *   4. Wipe the TanStack Query cache so the next logged-in user does not see stale data.
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    const refreshToken = await secureTokenStorage.getRefreshToken();
    if (refreshToken) {
      try {
        await authRepository.logout(refreshToken);
      } catch (err) {
        console.warn('[use-logout] backend logout failed, clearing local state anyway', err);
      }
    }
    await secureTokenStorage.clear();
    useAuthStore.getState().clearSession();
    queryClient.clear();
  }, [queryClient]);
}
