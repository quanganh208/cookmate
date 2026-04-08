import { apiClient } from '@/shared/api/api-client';
import type {
  AuthResponsePayload,
  AuthUser,
  ForgotPasswordPayload,
  GoogleCredentials,
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordPayload,
} from '../types';

interface MessagePayload {
  message: string;
}

/**
 * HTTP client for the backend `/api/auth/*` endpoints. Each method unwraps the envelope via
 * `apiClient` and returns the data payload directly. Error responses are surfaced as `ApiError`
 * with a semantic code that the screen-level error mapper turns into a localised message.
 */
export const authRepository = {
  /** Current authenticated user. Requires a valid access token header. */
  me(): Promise<AuthUser> {
    return apiClient<AuthUser>('/auth/me');
  },

  /** Exchange a refresh token for a fresh access token. Called by the api-client interceptor. */
  refresh(refreshToken: string): Promise<AuthResponsePayload> {
    return apiClient<AuthResponsePayload>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  /** Revoke a refresh token server-side (logout). */
  logout(refreshToken: string): Promise<void> {
    return apiClient<void>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  /** Email + password login. */
  login(credentials: LoginCredentials): Promise<AuthResponsePayload> {
    return apiClient<AuthResponsePayload>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  /** Create a new LOCAL user and auto-login. */
  register(credentials: RegisterCredentials): Promise<AuthResponsePayload> {
    return apiClient<AuthResponsePayload>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  /** Exchange a Google ID token for a Cookmate session. */
  googleAuth(credentials: GoogleCredentials): Promise<AuthResponsePayload> {
    return apiClient<AuthResponsePayload>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  /** Request a password reset email. Backend always returns a generic success message. */
  forgotPassword(payload: ForgotPasswordPayload): Promise<MessagePayload> {
    return apiClient<MessagePayload>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /** Apply a new password using a token delivered by email. */
  resetPassword(payload: ResetPasswordPayload): Promise<MessagePayload> {
    return apiClient<MessagePayload>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
