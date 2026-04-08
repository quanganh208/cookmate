import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/features/auth/store';

/**
 * Imperative auth gate for action handlers (e.g., the Save button on a recipe card).
 *
 * Returns a function that checks the current session; if the user is logged in it returns
 * `true` and the caller can proceed. Otherwise it pushes the login modal with a `next` param
 * so the login screen can bounce back to the triggering route on success, and returns `false`.
 *
 * ```ts
 * const requireAuth = useRequireAuth();
 * const handleSave = () => {
 *   if (!requireAuth('/recipe/abc')) return;
 *   saveMutation.mutate();
 * };
 * ```
 */
export function useRequireAuth() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);

  return useCallback(
    (next?: string): boolean => {
      if (session) return true;
      router.push({
        pathname: '/(auth)/login',
        params: next ? { next } : undefined,
      });
      return false;
    },
    [session, router],
  );
}
