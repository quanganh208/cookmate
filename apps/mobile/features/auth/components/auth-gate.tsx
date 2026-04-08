import { type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Colors } from '@/shared/constants/colors';
import { useAuthStore } from '../store';
import { LoginPromptCard } from './login-prompt-card';

interface AuthGateProps {
  children: ReactNode;
  /** User-facing reason shown in the default login prompt. Ignored when `fallback` is provided. */
  reason?: string;
  /** Custom fallback component to render when the user is not authenticated. */
  fallback?: ReactNode;
}

/**
 * Declarative auth gate. Renders children only for authenticated users. While the auth store
 * is still bootstrapping we render a centred spinner to avoid a brief "please login" flicker.
 */
export function AuthGate({ children, reason, fallback }: AuthGateProps) {
  const session = useAuthStore((state) => state.session);
  const status = useAuthStore((state) => state.status);

  if (status === 'bootstrapping') {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (session) return <>{children}</>;

  return <>{fallback ?? <LoginPromptCard reason={reason ?? 'Sign in to continue.'} />}</>;
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
