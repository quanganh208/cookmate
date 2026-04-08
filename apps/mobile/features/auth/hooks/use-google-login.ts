import { useMutation } from '@tanstack/react-query';
import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
} from '@react-native-google-signin/google-signin';
import { authRepository } from '../api/auth-repository';
import { secureTokenStorage } from '@/shared/api/secure-token-storage';
import { useAuthStore } from '../store';
import { ApiError } from '@/shared/api/api-error';
import type { AuthResponsePayload } from '../types';

/** Surface this as an ApiError so the screen's error banner maps it via error-mapper. */
export class GoogleSignInCancelledError extends ApiError {
  constructor() {
    super('GOOGLE_CANCELLED', 'Google sign-in cancelled', 0);
  }
}

/**
 * Native Google Sign-In flow. Obtains an ID token from Google and exchanges it for an
 * AuthResponse via the backend `/api/auth/google` endpoint.
 *
 * Callers should swallow `GoogleSignInCancelledError` silently (user tapped cancel) and only
 * display errors for the other codes.
 */
export function useGoogleLogin() {
  return useMutation<AuthResponsePayload, Error, void>({
    mutationFn: async () => {
      try {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const result = await GoogleSignin.signIn();
        const idToken = result.data?.idToken;
        if (!idToken) {
          throw new ApiError('GOOGLE_NO_TOKEN', 'Không lấy được token từ Google', 0);
        }
        return authRepository.googleAuth({ idToken });
      } catch (err) {
        if (isErrorWithCode(err)) {
          switch (err.code) {
            case statusCodes.SIGN_IN_CANCELLED:
            case statusCodes.IN_PROGRESS:
              throw new GoogleSignInCancelledError();
            case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
              throw new ApiError(
                'GOOGLE_PLAY_SERVICES_UNAVAILABLE',
                'Google Play Services không khả dụng trên thiết bị này',
                0,
              );
            default:
              throw new ApiError('GOOGLE_UNKNOWN', err.message ?? 'Đăng nhập Google thất bại', 0);
          }
        }
        throw err;
      }
    },
    onSuccess: async (response) => {
      await secureTokenStorage.setTokens(response.accessToken, response.refreshToken);
      useAuthStore.getState().setSession({
        user: response.user,
        accessToken: response.accessToken,
      });
    },
  });
}
