import { ApiError, NETWORK_ERROR_CODE } from '@/shared/api/api-error';

/**
 * Map backend `ApiResponse.error.code` values to user-facing messages. Codes are kept in sync
 * with `backend/.../auth/exception/AuthException.java` factories. Unknown codes fall through
 * to a generic message.
 */
const ERROR_MESSAGES: Record<string, string> = {
  BAD_CREDENTIALS: 'Incorrect email or password',
  EMAIL_TAKEN: 'This email is already registered',
  INVALID_TOKEN: 'Your session has expired. Please sign in again.',
  OAUTH_ONLY: 'This account was registered with Google. Please sign in with Google.',
  EMAIL_EXISTS_WITH_PASSWORD:
    'This email is already registered with a password. Please sign in with email and password.',
  RESET_TOKEN_INVALID: 'This password reset link is invalid.',
  RESET_TOKEN_EXPIRED: 'This password reset link has expired. Please request a new one.',
  RESET_RATE_LIMITED: 'Too many reset requests. Please try again in an hour.',
  BAD_REQUEST: 'The submitted data is invalid.',
  UNAUTHORIZED: 'You need to sign in to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  GOOGLE_NO_TOKEN: 'Could not retrieve a token from Google. Please try again.',
  GOOGLE_PLAY_SERVICES_UNAVAILABLE: 'Google Play Services is not available on this device.',
  GOOGLE_UNKNOWN: 'Google sign-in failed. Please try again.',
  [NETWORK_ERROR_CODE]: 'Could not reach the server. Check your connection and try again.',
};

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';

/**
 * Convert any thrown error from the auth repository into a user-facing message. Accepts both
 * `ApiError` (with a backend code) and unknown errors (fallback generic message).
 */
export function mapAuthError(error: unknown): string {
  if (error instanceof ApiError) {
    return ERROR_MESSAGES[error.code] ?? error.message ?? FALLBACK_MESSAGE;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return FALLBACK_MESSAGE;
}
