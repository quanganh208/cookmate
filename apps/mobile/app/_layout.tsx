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

/**
 * Hydrate the in-memory auth state from SecureStore on app cold start. If a refresh token is
 * present we call `/auth/me` to verify the access token is still valid; any failure falls back
 * to anonymous mode (the interceptor will try refresh on the next authenticated request).
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
        // Any ApiError here means the refresh flow already ran and failed; the interceptor
        // will have cleared SecureStore + emitted auth:logout. Just flip status anonymous.
        if (!(err instanceof ApiError)) {
          console.warn('[bootstrap] /auth/me failed with non-ApiError', err);
        }
        await secureTokenStorage.clear();
        useAuthStore.getState().clearSession();
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
