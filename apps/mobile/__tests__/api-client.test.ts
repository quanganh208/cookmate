/**
 * Tests for the api-client refresh interceptor. We mock `expo-secure-store`, replace `fetch`
 * with a scripted mock, and verify:
 *  - Successful responses are unwrapped from the ApiResponse envelope.
 *  - A 401 on an authenticated endpoint triggers a refresh call and retries the original
 *    request exactly once with the new access token.
 *  - Concurrent 401s share a single in-flight refresh (single-flight lock).
 *  - A failed refresh clears SecureStore, clears the auth store, and surfaces the 401 to the
 *    caller as an ApiError.
 */

jest.mock('expo-secure-store', () => {
  const store: Record<string, string> = {};
  return {
    getItemAsync: jest.fn(async (key: string) => store[key] ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store[key] = value;
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      delete store[key];
    }),
    WHEN_UNLOCKED: 0,
  };
});

import { apiClient } from '@/shared/api/api-client';
import { ApiError } from '@/shared/api/api-error';
import { useAuthStore } from '@/features/auth/store';
import { secureTokenStorage } from '@/shared/api/secure-token-storage';

type MockResponse = {
  status: number;
  body: unknown;
};

function buildResponse({ status, body }: MockResponse): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: 'OK',
    json: async () => body,
  } as unknown as Response;
}

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock;
  useAuthStore.setState({ session: null, status: 'anonymous' });
  jest.clearAllMocks();
});

describe('apiClient', () => {
  it('unwraps the ApiResponse envelope on success', async () => {
    fetchMock.mockResolvedValueOnce(
      buildResponse({
        status: 200,
        body: { success: true, data: { id: '1', name: 'Pho' }, timestamp: 'now' },
      }),
    );
    const result = await apiClient<{ id: string; name: string }>('/recipes/1');
    expect(result).toEqual({ id: '1', name: 'Pho' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws ApiError with the backend code on failure', async () => {
    fetchMock.mockResolvedValueOnce(
      buildResponse({
        status: 401,
        body: {
          success: false,
          error: { code: 'BAD_CREDENTIALS', message: 'Invalid email or password' },
          timestamp: 'now',
        },
      }),
    );
    await expect(apiClient('/auth/login', { method: 'POST', body: '{}' })).rejects.toMatchObject({
      code: 'BAD_CREDENTIALS',
    });
  });

  it('auto-refreshes on 401 and retries the original request', async () => {
    await secureTokenStorage.setTokens('expired-access', 'valid-refresh');
    useAuthStore.setState({
      session: {
        user: {
          id: 'u1',
          email: 'a@b.c',
          displayName: 'A',
          authProvider: 'LOCAL',
          emailVerified: false,
        },
        accessToken: 'expired-access',
      },
      status: 'authenticated',
    });

    // 1st call: protected endpoint → 401
    // 2nd call: /auth/refresh → 200 with new tokens
    // 3rd call: protected endpoint retry → 200 success
    fetchMock
      .mockResolvedValueOnce(
        buildResponse({
          status: 401,
          body: {
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Expired' },
            timestamp: 'now',
          },
        }),
      )
      .mockResolvedValueOnce(
        buildResponse({
          status: 200,
          body: {
            success: true,
            data: {
              accessToken: 'new-access',
              refreshToken: 'new-refresh',
              user: {
                id: 'u1',
                email: 'a@b.c',
                displayName: 'A',
                authProvider: 'LOCAL',
                emailVerified: false,
              },
            },
            timestamp: 'now',
          },
        }),
      )
      .mockResolvedValueOnce(
        buildResponse({
          status: 200,
          body: { success: true, data: { id: 'u1' }, timestamp: 'now' },
        }),
      );

    const result = await apiClient<{ id: string }>('/auth/me');
    expect(result).toEqual({ id: 'u1' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toContain('/auth/refresh');
    // Retry should use the fresh access token.
    const retryHeaders = fetchMock.mock.calls[2][1].headers as Record<string, string>;
    expect(retryHeaders.Authorization).toBe('Bearer new-access');
    // New tokens must be persisted in SecureStore.
    expect(await secureTokenStorage.getAccessToken()).toBe('new-access');
    expect(await secureTokenStorage.getRefreshToken()).toBe('new-refresh');
  });

  it('clears state and surfaces 401 when refresh fails', async () => {
    await secureTokenStorage.setTokens('expired-access', 'dead-refresh');
    useAuthStore.setState({
      session: {
        user: {
          id: 'u1',
          email: 'a@b.c',
          displayName: 'A',
          authProvider: 'LOCAL',
          emailVerified: false,
        },
        accessToken: 'expired-access',
      },
      status: 'authenticated',
    });

    fetchMock
      .mockResolvedValueOnce(
        buildResponse({
          status: 401,
          body: {
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Expired' },
            timestamp: 'now',
          },
        }),
      )
      .mockResolvedValueOnce(
        buildResponse({
          status: 401,
          body: {
            success: false,
            error: { code: 'INVALID_TOKEN', message: 'Refresh token invalid' },
            timestamp: 'now',
          },
        }),
      );

    await expect(apiClient('/auth/me')).rejects.toBeInstanceOf(ApiError);
    // SecureStore must be cleared by the failed refresh path.
    expect(await secureTokenStorage.getAccessToken()).toBeNull();
    expect(await secureTokenStorage.getRefreshToken()).toBeNull();
    expect(useAuthStore.getState().session).toBeNull();
  });

  it('shares a single refresh when multiple 401s hit concurrently (single-flight)', async () => {
    await secureTokenStorage.setTokens('expired-access', 'valid-refresh');
    useAuthStore.setState({
      session: {
        user: {
          id: 'u1',
          email: 'a@b.c',
          displayName: 'A',
          authProvider: 'LOCAL',
          emailVerified: false,
        },
        accessToken: 'expired-access',
      },
      status: 'authenticated',
    });

    // Script: two 401s, one refresh 200, two retry 200s.
    fetchMock
      .mockResolvedValueOnce(
        buildResponse({
          status: 401,
          body: {
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Expired' },
            timestamp: 'now',
          },
        }),
      )
      .mockResolvedValueOnce(
        buildResponse({
          status: 401,
          body: {
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Expired' },
            timestamp: 'now',
          },
        }),
      )
      .mockResolvedValueOnce(
        buildResponse({
          status: 200,
          body: {
            success: true,
            data: {
              accessToken: 'new-access',
              refreshToken: 'new-refresh',
              user: {
                id: 'u1',
                email: 'a@b.c',
                displayName: 'A',
                authProvider: 'LOCAL',
                emailVerified: false,
              },
            },
            timestamp: 'now',
          },
        }),
      )
      .mockResolvedValueOnce(
        buildResponse({
          status: 200,
          body: { success: true, data: { page: 'me' }, timestamp: 'now' },
        }),
      )
      .mockResolvedValueOnce(
        buildResponse({
          status: 200,
          body: { success: true, data: { page: 'settings' }, timestamp: 'now' },
        }),
      );

    const [a, b] = await Promise.all([
      apiClient<{ page: string }>('/auth/me'),
      apiClient<{ page: string }>('/auth/me'),
    ]);
    expect(a.page).toBe('me');
    expect(b.page).toBe('settings');

    const refreshCalls = fetchMock.mock.calls.filter((call) =>
      String(call[0]).includes('/auth/refresh'),
    );
    expect(refreshCalls).toHaveLength(1);
  });
});
