import { useMutation } from '@tanstack/react-query';
import { authRepository } from '../api/auth-repository';
import { secureTokenStorage } from '@/shared/api/secure-token-storage';
import { useAuthStore } from '../store';
import type { AuthResponsePayload, RegisterCredentials } from '../types';

/**
 * Register mutation. Backend auto-logs in on success so the payload shape is identical to
 * login — we persist tokens + populate the store the same way.
 */
export function useRegisterMutation() {
  return useMutation<AuthResponsePayload, Error, RegisterCredentials>({
    mutationFn: (credentials) => authRepository.register(credentials),
    onSuccess: async (response) => {
      await secureTokenStorage.setTokens(response.accessToken, response.refreshToken);
      useAuthStore.getState().setSession({
        user: response.user,
        accessToken: response.accessToken,
      });
    },
  });
}
