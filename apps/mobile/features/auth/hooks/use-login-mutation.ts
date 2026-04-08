import { useMutation } from '@tanstack/react-query';
import { authRepository } from '../api/auth-repository';
import { secureTokenStorage } from '@/shared/api/secure-token-storage';
import { useAuthStore } from '../store';
import type { AuthResponsePayload, LoginCredentials } from '../types';

/**
 * Email + password login mutation. On success persists tokens to SecureStore and hydrates the
 * Zustand auth store so the rest of the app sees the logged-in session immediately.
 */
export function useLoginMutation() {
  return useMutation<AuthResponsePayload, Error, LoginCredentials>({
    mutationFn: (credentials) => authRepository.login(credentials),
    onSuccess: async (response) => {
      await secureTokenStorage.setTokens(response.accessToken, response.refreshToken);
      useAuthStore.getState().setSession({
        user: response.user,
        accessToken: response.accessToken,
      });
    },
  });
}
