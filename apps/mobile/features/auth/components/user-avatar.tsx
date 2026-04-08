import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Colors } from '@/shared/constants/colors';
import { Fonts } from '@/shared/constants/fonts';
import type { AuthUser } from '../types';

interface UserAvatarProps {
  /** Authenticated user, or null/undefined for guest mode. */
  user: AuthUser | null | undefined;
  /** Diameter of the circular avatar in pixels. Defaults to 36 (header size). */
  size?: number;
}

/** Extract up to two letters from the user's display name for the initials fallback. */
function getInitials(name: string | undefined): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Auth-aware avatar with three render states:
 *   1. Logged in + has `avatarUrl` → remote image with brand-colored ring.
 *   2. Logged in but no avatar → initials on a primary-colored circle.
 *   3. Guest (user is null/undefined) → user icon on a muted circle.
 *
 * Pure presentational component — caller is responsible for wrapping in `Pressable`,
 * subscribing to the auth store, etc. This keeps the component reusable across the
 * Home header (small) and the Profile screen (large) without coupling to feature logic.
 */
export function UserAvatar({ user, size = 36 }: UserAvatarProps) {
  const baseStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (user?.avatarUrl) {
    return (
      <Image source={user.avatarUrl} style={[baseStyle, styles.imageBorder]} transition={300} />
    );
  }

  if (user) {
    return (
      <View style={[baseStyle, styles.initialsContainer]}>
        <Text style={[styles.initialsText, { fontSize: Math.round(size * 0.36) }]}>
          {getInitials(user.displayName)}
        </Text>
      </View>
    );
  }

  return (
    <View style={[baseStyle, styles.guestContainer]}>
      <FontAwesome6 name="user" size={Math.round(size * 0.44)} color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  imageBorder: {
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  initialsContainer: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontFamily: Fonts.bodySemiBold,
    color: Colors.surface,
  },
  guestContainer: {
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
