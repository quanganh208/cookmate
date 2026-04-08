import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Lora_600SemiBold, Lora_700Bold } from '@expo-google-fonts/lora';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Colors } from '@/shared/constants/colors';
import { AppQueryClientProvider } from '@/shared/api/query-client-provider';
import { authEvents } from '@/shared/api/auth-events';
import { secureTokenStorage } from '@/shared/api/secure-token-storage';
import { ApiError } from '@/shared/api/api-error';
import { authRepository } from '@/features/auth/api/auth-repository';
import { useAuthStore } from '@/features/auth/store';

// Configure Google Sign-In once at module load. We skip configuration when the web client ID
// env var is missing — the Google button will then fail with a clear error at tap time instead
// of crashing the app at startup.
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
if (GOOGLE_WEB_CLIENT_ID) {
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    offlineAccess: false,
    scopes: ['profile', 'email'],
  });
}

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

/** HTTP status codes that indicate the stored tokens are definitively invalid (hard logout). */
const AUTH_FAILURE_STATUSES = new Set([401, 403]);

/** Semantic error codes that also mean the stored tokens are invalid. */
const AUTH_FAILURE_CODES = new Set(['INVALID_TOKEN', 'UNAUTHORIZED', 'BAD_CREDENTIALS']);

/**
 * Hydrate the in-memory auth state from SecureStore on app cold start. If a refresh token is
 * present we call `/auth/me` to verify the access token is still valid.
 *
 * Error handling is deliberately split into two paths:
 *   - **Auth failure** (401/403 after refresh also failed, or a semantic INVALID_TOKEN code)
 *     → clear SecureStore + session so the user sees the login prompt.
 *   - **Transient failure** (offline, 5xx, network error) → keep SecureStore intact and simply
 *     flip status to `anonymous`. The api-client interceptor will retry the refresh flow on
 *     the next authenticated request when connectivity is restored, so a flaky network does
 *     not force-log-out the user.
 */
function useBootstrapAuth() {
  const setSession = useAuthStore((state) => state.setSession);
  const setStatus = useAuthStore((state) => state.setStatus);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [accessToken, refreshToken] = await Promise.all([
        secureTokenStorage.getAccessToken(),
        secureTokenStorage.getRefreshToken(),
      ]);

      if (!accessToken || !refreshToken) {
        if (!cancelled) setStatus('anonymous');
        return;
      }

      // Prime the store so apiClient can inject the Bearer header.
      useAuthStore.setState({
        session: {
          user: {
            id: '',
            email: '',
            displayName: '',
            authProvider: 'LOCAL',
            emailVerified: false,
          },
          accessToken,
        },
      });

      try {
        const user = await authRepository.me();
        if (!cancelled) setSession({ user, accessToken });
      } catch (err) {
        if (cancelled) return;

        const isHardAuthFailure =
          err instanceof ApiError &&
          (AUTH_FAILURE_STATUSES.has(err.status) || AUTH_FAILURE_CODES.has(err.code));

        if (isHardAuthFailure) {
          // Refresh already ran + failed inside the interceptor, or tokens are definitively
          // invalid. Wipe local state so the user sees the login UI on the next action.
          await secureTokenStorage.clear();
          useAuthStore.getState().clearSession();
          return;
        }

        // Transient failure (offline, 5xx, parse error). Keep tokens, just flip to anonymous
        // so the splash dismisses; the next authenticated request will retry the refresh.
        console.warn('[bootstrap] /auth/me failed transiently, keeping tokens', err);
        useAuthStore.setState({ session: null });
        setStatus('anonymous');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setSession, setStatus]);
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Lora_600SemiBold,
    Lora_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });
  const router = useRouter();
  const authStatus = useAuthStore((state) => state.status);

  useBootstrapAuth();

  useEffect(() => {
    if (fontsLoaded && authStatus !== 'bootstrapping') {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, authStatus]);

  // Navigate back to the tabs when the api-client forces a logout. `replace` avoids stacking.
  useEffect(() => {
    const off = authEvents.on('auth:logout', () => {
      router.replace('/(tabs)');
    });
    return off;
  }, [router]);

  if (!fontsLoaded || authStatus === 'bootstrapping') return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppQueryClientProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" options={{ presentation: 'modal' }} />
          <Stack.Screen
            name="recipe/[id]"
            options={{
              headerShown: true,
              title: 'Recipe',
              headerStyle: { backgroundColor: Colors.background },
              headerTintColor: Colors.textPrimary,
            }}
          />
        </Stack>
        <StatusBar style="dark" />
      </AppQueryClientProvider>
    </GestureHandlerRootView>
  );
}
