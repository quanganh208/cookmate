import { Pressable, StyleSheet, Text, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Colors } from '@/shared/constants/colors';
import { Fonts } from '@/shared/constants/fonts';
import { useAuthStore } from '@/features/auth/store';
import { useLogout } from '@/features/auth/hooks/use-logout';
import { LoginPromptCard } from '@/features/auth/components/login-prompt-card';
import { UserAvatar } from '@/features/auth/components/user-avatar';
import type { AuthUser } from '@/features/auth/types';

function AuthenticatedProfile({ user }: { user: AuthUser }) {
  const logout = useLogout();

  return (
    <View style={styles.container}>
      <View style={styles.avatarWrapper}>
        <UserAvatar user={user} size={96} />
      </View>
      <Text style={styles.displayName}>{user.displayName || 'Cookmate user'}</Text>
      <Text style={styles.email}>{user.email}</Text>

      <View style={styles.separator} />

      <Pressable
        onPress={logout}
        style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
      >
        <FontAwesome6 name="right-from-bracket" size={16} color={Colors.error} />
        <Text style={styles.logoutLabel}>Sign out</Text>
      </Pressable>
    </View>
  );
}

export function ProfileScreen() {
  const session = useAuthStore((state) => state.session);
  if (!session) {
    return <LoginPromptCard reason="Sign in to view your profile." icon="user" />;
  }
  return <AuthenticatedProfile user={session.user} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 64,
    paddingHorizontal: 24,
    backgroundColor: Colors.background,
  },
  avatarWrapper: {
    marginBottom: 16,
  },
  displayName: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  email: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 28,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.surface,
  },
  logoutButtonPressed: {
    backgroundColor: '#FDE8E8',
  },
  logoutLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.error,
  },
});
