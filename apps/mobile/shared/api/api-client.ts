import { useAuthStore } from '@/features/auth/store';
import { ApiError, NETWORK_ERROR_CODE, type ApiResponseEnvelope } from './api-error';
import { authEvents } from './auth-events';
import { secureTokenStorage } from './secure-token-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api';
const API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? 'dev-api-key-change-in-production';

/** Endpoints that must NOT trigger the refresh interceptor (refresh itself, logout, etc). */
const REFRESH_SKIP_ENDPOINTS = new Set([
  '/auth/refresh',
  '/auth/login',
  '/auth/register',
  '/auth/google',
  '/auth/forgot-password',
  '/auth/reset-password',
]);

interface RefreshSuccess {
  accessToken: string;
  refreshToken: string;
}

/**
 * Single-flight refresh guard. Concurrent 401s will share the same in-flight refresh promise so
 * we only hit `/auth/refresh` once. Null when idle.
 */
let refreshInFlight: Promise<RefreshSuccess | null> | null = null;

/** Perform the refresh network call directly to avoid a circular dependency with this module. */
async function callRefreshEndpoint(refreshToken: string): Promise<RefreshSuccess | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const envelope = (await res.json()) as ApiResponseEnvelope<{
      accessToken: string;
      refreshToken: string;
    }>;
    if (!envelope.success || !envelope.data) return null;
    return {
      accessToken: envelope.data.accessToken,
      refreshToken: envelope.data.refreshToken,
    };
  } catch (err) {
    console.warn('[api-client] refresh endpoint call failed', err);
    return null;
  }
}

/** Ensure only one refresh call runs at a time. Returns new tokens or null if refresh failed. */
async function refreshTokens(): Promise<RefreshSuccess | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = await secureTokenStorage.getRefreshToken();
    if (!refreshToken) return null;

    const result = await callRefreshEndpoint(refreshToken);
    if (!result) {
      // Refresh token is dead → clear local state and notify listeners.
      await secureTokenStorage.clear();
      useAuthStore.getState().clearSession();
      authEvents.emit('auth:logout');
      return null;
    }

    await secureTokenStorage.setTokens(result.accessToken, result.refreshToken);
    // Merge the new access token into the existing session if we have one.
    const existing = useAuthStore.getState().session;
    if (existing) {
      useAuthStore.getState().setSession({ ...existing, accessToken: result.accessToken });
    }
    return result;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

interface RequestOptions extends RequestInit {
  /** Internal flag to prevent recursive refresh retries. */
  _retried?: boolean;
}

/**
 * Typed fetch wrapper. Injects API key + Bearer token, unwraps the `ApiResponse` envelope, and
 * transparently refreshes expired access tokens on the first 401. Call sites receive the `data`
 * payload directly, or an `ApiError` with a semantic code on failure.
 */
export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { headers: customHeaders, _retried, ...rest } = options;

  const accessToken = useAuthStore.getState().session?.accessToken;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    ...(customHeaders as Record<string, string> | undefined),
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, { ...rest, headers });
  } catch (err) {
    throw new ApiError(NETWORK_ERROR_CODE, (err as Error).message ?? 'Network request failed', 0);
  }

  // 401 refresh dance — only on authenticated endpoints and only once per call.
  if (
    response.status === 401 &&
    !_retried &&
    !REFRESH_SKIP_ENDPOINTS.has(endpoint) &&
    accessToken
  ) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      return apiClient<T>(endpoint, { ...options, _retried: true });
    }
  }

  let envelope: ApiResponseEnvelope<T> | null = null;
  try {
    envelope = (await response.json()) as ApiResponseEnvelope<T>;
  } catch {
    // Response body was not JSON — fall through to a generic error below.
  }

  if (!response.ok || !envelope || envelope.success === false) {
    const code = envelope?.error?.code ?? `HTTP_${response.status}`;
    const message = envelope?.error?.message ?? `Request failed with status ${response.status}`;
    throw new ApiError(code, message, response.status);
  }

  return envelope.data as T;
}
