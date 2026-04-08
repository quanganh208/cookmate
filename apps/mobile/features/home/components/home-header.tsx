import { Pressable, StyleSheet, Text, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useRouter } from 'expo-router';
import { Colors } from '@/shared/constants/colors';
import { Typography } from '@/shared/constants/fonts';
import { useAuthStore } from '@/features/auth/store';
import { UserAvatar } from '@/features/auth/components/user-avatar';

/**
 * Top header with the app logo, a notification bell, and an auth-aware avatar.
 *
 * The avatar always navigates to the Profile tab on tap. The Profile tab itself handles
 * the guest gating (renders LoginPromptCard when not authenticated), so this component
 * stays UI-only and delegates the auth UX to the existing gate.
 */
export function HomeHeader() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const user = session?.user;

  const handleAvatarPress = () => {
    router.push('/(tabs)/profile');
  };

  return (
    <View style={styles.container}>
      <Text style={[Typography.appTitle, { color: Colors.primary }]}>Cookmate</Text>
      <View style={styles.actions}>
        <FontAwesome6 name="bell" size={22} color={Colors.textPrimary} />
        <Pressable
          onPress={handleAvatarPress}
          accessibilityRole="button"
          accessibilityLabel={user ? 'Open profile' : 'Sign in'}
          hitSlop={6}
        >
          <UserAvatar user={user} size={36} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
});
