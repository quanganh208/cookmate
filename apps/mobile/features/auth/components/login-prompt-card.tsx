import { StyleSheet, Text, View } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/shared/constants/colors';
import { Fonts } from '@/shared/constants/fonts';
import { AuthSubmitButton } from './auth-submit-button';
import { AuthFooterLink } from './auth-footer-link';

interface LoginPromptCardProps {
  reason: string;
  icon?: keyof typeof FontAwesome6.glyphMap;
}

/**
 * Full-screen CTA shown in gated tabs (Saved / Create / Profile) when the user is a guest.
 * Nudges the user into the login modal with a concrete reason so the gate never feels
 * arbitrary.
 */
export function LoginPromptCard({ reason, icon = 'lock' }: LoginPromptCardProps) {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <FontAwesome6 name={icon} size={32} color={Colors.primary} />
      </View>
      <Text style={styles.title}>Sign in required</Text>
      <Text style={styles.reason}>{reason}</Text>
      <View style={styles.ctaWrapper}>
        <AuthSubmitButton label="Sign in" onPress={() => router.push('/(auth)/login')} />
      </View>
      <AuthFooterLink
        prompt="Don't have an account?"
        ctaLabel="Sign up"
        onPress={() => router.push('/(auth)/register')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: Colors.background,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 20,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  reason: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  ctaWrapper: {
    width: '100%',
    maxWidth: 280,
  },
});
