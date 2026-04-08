import { useMutation } from '@tanstack/react-query';
import { authRepository } from '../api/auth-repository';
import type { ForgotPasswordPayload } from '../types';

/**
 * Request a password reset email. Backend always returns 200 with a generic message (to avoid
 * leaking whether an account exists), so no session side effects are needed.
 */
export function useForgotPasswordMutation() {
  return useMutation<{ message: string }, Error, ForgotPasswordPayload>({
    mutationFn: (payload) => authRepository.forgotPassword(payload),
  });
}
