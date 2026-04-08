import * as SecureStore from 'expo-secure-store';

/**
 * Thin wrapper around `expo-secure-store` for access/refresh tokens. Keys are namespaced under
 * `cookmate.auth.*`. Reads fail-open: any underlying error is logged as a warning and the wrapper
 * returns `null` so the caller treats it as "no session" rather than crashing at startup.
 *
 * Stored values use `WHEN_UNLOCKED` accessibility so they can be read when the device is unlocked
 * (the default). Hardware-backed keystore is used automatically when available.
 */

const ACCESS_TOKEN_KEY = 'cookmate.auth.accessToken';
const REFRESH_TOKEN_KEY = 'cookmate.auth.refreshToken';

const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED,
};

async function safeGet(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key, SECURE_OPTIONS);
  } catch (err) {
    console.warn(`[secure-token-storage] getItemAsync(${key}) failed`, err);
    return null;
  }
}

async function safeSet(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value, SECURE_OPTIONS);
  } catch (err) {
    console.warn(`[secure-token-storage] setItemAsync(${key}) failed`, err);
  }
}

async function safeDelete(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key, SECURE_OPTIONS);
  } catch (err) {
    console.warn(`[secure-token-storage] deleteItemAsync(${key}) failed`, err);
  }
}

export const secureTokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return safeGet(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return safeGet(REFRESH_TOKEN_KEY);
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      safeSet(ACCESS_TOKEN_KEY, accessToken),
      safeSet(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  },

  async clear(): Promise<void> {
    await Promise.all([safeDelete(ACCESS_TOKEN_KEY), safeDelete(REFRESH_TOKEN_KEY)]);
  },
};
