import { useMutation } from '@tanstack/react-query';
import { authRepository } from '../api/auth-repository';
import type { ResetPasswordPayload } from '../types';

/**
 * Apply a new password using a token from a reset email. Backend revokes all existing refresh
 * tokens on success, so the user must log in with the new password — no client-side session
 * side effects here.
 */
export function useResetPasswordMutation() {
  return useMutation<{ message: string }, Error, ResetPasswordPayload>({
    mutationFn: (payload) => authRepository.resetPassword(payload),
  });
}
