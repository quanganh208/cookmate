/**
 * Auth-feature public types. Kept framework-agnostic so backend DTOs, store state,
 * and mutation hooks can share them without circular imports.
 */

export type AuthProvider = 'LOCAL' | 'GOOGLE';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  authProvider: AuthProvider;
  emailVerified: boolean;
}

/**
 * In-memory session. Refresh token is deliberately NOT stored here — it lives in
 * SecureStore only, read lazily when a refresh is needed.
 */
export interface Session {
  user: AuthUser;
  accessToken: string;
}

/** Backend auth response envelope (data payload of ApiResponse<AuthResponse>). */
export interface AuthResponsePayload {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  displayName: string;
}

export interface GoogleCredentials {
  idToken: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}
