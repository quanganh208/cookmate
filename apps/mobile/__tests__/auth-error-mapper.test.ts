import { ApiError, NETWORK_ERROR_CODE } from '@/shared/api/api-error';
import { mapAuthError } from '@/features/auth/utils/error-mapper';

describe('mapAuthError', () => {
  it.each([
    ['BAD_CREDENTIALS', 'Incorrect email or password'],
    ['EMAIL_TAKEN', 'This email is already registered'],
    ['INVALID_TOKEN', 'Your session has expired. Please sign in again.'],
    ['OAUTH_ONLY', 'This account was registered with Google. Please sign in with Google.'],
    [
      'EMAIL_EXISTS_WITH_PASSWORD',
      'This email is already registered with a password. Please sign in with email and password.',
    ],
    ['RESET_TOKEN_INVALID', 'This password reset link is invalid.'],
    ['RESET_TOKEN_EXPIRED', 'This password reset link has expired. Please request a new one.'],
    ['RESET_RATE_LIMITED', 'Too many reset requests. Please try again in an hour.'],
    ['GOOGLE_NO_TOKEN', 'Could not retrieve a token from Google. Please try again.'],
  ])('maps %s to the expected message', (code, expected) => {
    const err = new ApiError(code, 'server-message', 400);
    expect(mapAuthError(err)).toBe(expected);
  });

  it('maps NETWORK_ERROR to a connectivity message', () => {
    const err = new ApiError(NETWORK_ERROR_CODE, 'Network request failed', 0);
    expect(mapAuthError(err)).toBe(
      'Could not reach the server. Check your connection and try again.',
    );
  });

  it('falls back to ApiError.message when code is unknown', () => {
    const err = new ApiError('NEW_CODE_FROM_BACKEND', 'raw server message', 500);
    expect(mapAuthError(err)).toBe('raw server message');
  });

  it('falls back to generic message for unknown errors', () => {
    expect(mapAuthError(new Error(''))).toBe('Something went wrong. Please try again.');
    expect(mapAuthError('string error')).toBe('Something went wrong. Please try again.');
    expect(mapAuthError(null)).toBe('Something went wrong. Please try again.');
  });
});
